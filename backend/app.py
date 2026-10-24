from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import bcrypt
import os
from dotenv import load_dotenv
import base64
import cv2
import numpy as np
from ultralytics import YOLO
import traceback
from werkzeug.utils import secure_filename
from bson import ObjectId

# ==============================
# إعداد التطبيق والاتصال
# ==============================
load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)


MAX_IMAGE_SIZE_MB = 5  # الحد الأقصى لحجم الصورة بالميغابايت
# MongoDB connection

# إعداد مجلد التحميلات
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

client = MongoClient(
    "mongodb+srv://7834038a_db_user:aalia2001@cluster0.yp7dugj.mongodb.net/teethDB?retryWrites=true&w=majority",
    tls=True,
    tlsAllowInvalidCertificates=True,  # ← أضف هذا
    serverSelectionTimeoutMS=30000
)

db = client["med"]
print("✅ Connected to MongoDB Atlas successfully!")

# ==============================
# تحميل نموذج YOLO
# ==============================

# تحميل النموذج
model = YOLO("models/best.pt")
single_tooth_model = YOLO("models/teeth_5.pt")


# ==============================
# 🔐 حسابات المستخدمين
# ==============================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all([name, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user = {
        "name": name,
        "email": email,
        "password": hashed.decode("utf-8"),
        "created_at": datetime.utcnow() ,
        "status": "active"   # ✅ الحساب مفعل افتراضيًا
    }
    db.users.insert_one(user)

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "user": {"name": name, "email": email}}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    # ✅ تحقق من حالة الحساب
    if user.get("status") == "suspended":
        return jsonify({"error": "Account suspended. The result of user Violations."}), 403

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({
        "token": token,
        "user": {"name": user["name"], "email": user["email"],"status": user.get("status", "active")}
    }), 200

@app.route("/api/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    try:
        data = request.json
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        # التحقق من صحة البيانات
        if not current_password or not new_password:
            return jsonify({"error": "Both current and new password are required"}), 400

        # الحصول على هوية المستخدم من التوكن
        user_id = get_jwt_identity()
        user = db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return jsonify({"error": "User not found"}), 404

        # التحقق من كلمة المرور الحالية
        if not bcrypt.checkpw(current_password.encode("utf-8"), user["password"].encode("utf-8")):
            return jsonify({"error": "Current password is incorrect"}), 401

        # تشفير الكلمة الجديدة
        hashed_new_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())

        # تحديث كلمة المرور في قاعدة البيانات
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_new_password.decode("utf-8")}}
        )

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/users", methods=["GET"])
def get_users():
    users = list(db.users.find({}, {"_id": 0, "password": 0}))
    return jsonify(users)

@app.route("/api/user/status", methods=["PUT"])
def update_user_status():
    data = request.json
    email = data.get("email")
    status = data.get("status")

    result = db.users.update_one({"email": email}, {"$set": {"status": status}})
    if result.modified_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": f"User {email} status updated to {status}"}), 200

@app.route("/api/images", methods=["GET"])
def get_images():
    images = []
    for img in db.images.find():
        images.append({
            "_id": str(img["_id"]),  # ✅ تحويل ObjectId إلى نص
            "data": img.get("data"),
            "uploaded_by": img.get("uploaded_by", "Unknown")
        })
    return jsonify(images)

# ==============================
# 👨‍⚕️ إدارة المرضى
# ==============================


@app.route('/api/patients', methods=['POST'])
@jwt_required()
def add_patient():
    try:
        current_user = get_jwt_identity()

        if not request.json:
            return jsonify({"error": "No JSON data provided"}), 400

        patient_data = request.json
        print("📥 Incoming patient_data:", patient_data)

        # التأكد من وجود اسم المريض والعمر والجنس
        patient_info = patient_data.get('patientInfo', {})
        if not patient_info.get('name'):
            return jsonify({"error": "Patient name is required"}), 400
        
        # التحقق من وجود العمر والجنس (مطلوبين الآن)
        if not patient_info.get('age'):
            return jsonify({"error": "Patient age is required"}), 400
        
        if not patient_info.get('gender'):
            return jsonify({"error": "Patient gender is required"}), 400

        # تحديد فئة المريض تلقائياً بناءً على العمر
        age = int(patient_info.get('age', 0))
        if age < 1:
            patient_category = 'infant'
        elif age < 18:
            patient_category = 'child'
        else:
            patient_category = 'adult'
        
        # تحديث patientInfo بإضافة فئة المريض
        patient_info['patientCategory'] = patient_category

        # معالجة الصورة كـ Base64 وتخزينها مباشرة في MongoDB
        images_array = []

        if patient_data.get('xrayImageBase64'):
            try:
                image_base64 = patient_data["xrayImageBase64"]

                # إزالة header مثل data:image/jpeg;base64,
                if "," in image_base64:
                    image_base64 = image_base64.split(",")[1]

                # إضافة الصورة للمصفوفة كـ Base64
                images_array.append({
                    "base64": image_base64,
                    "uploadDate": datetime.utcnow(),
                    "analysisType": "xray",
                    "contentType": "image/jpeg"  # إضافة نوع المحتوى
                })

                # إزالة الصورة من البيانات قبل الإدخال
                del patient_data["xrayImageBase64"]

            except Exception as e:
                return jsonify({"error": f"Invalid base64 image: {str(e)}"}), 400

        # التحقق من وجود القياسات الحيوية الأساسية
        biometrics = patient_data.get("biometrics", {})
        
        # بناء بيانات المريض
        patient_record = {
            "patientInfo": patient_info,  # استخدام patient_info المحدث
            "biometrics": {
                "systolicBP": biometrics.get("systolicBP", ""),
                "diastolicBP": biometrics.get("diastolicBP", ""),
                "temperature": biometrics.get("temperature", ""),
                "heartRate": biometrics.get("heartRate", ""),
                "respiratoryRate": biometrics.get("respiratoryRate", ""),
                "oxygenSaturation": biometrics.get("oxygenSaturation", ""),
                "bloodSugar": biometrics.get("bloodSugar", "")
            },
            "clinicalStudy": patient_data.get("clinicalStudy", ""),
            "dentalAnalysis": patient_data.get("dentalAnalysis", {
                "diagnosis": {},
                "treatmentPlan": "",
                "analysisDate": datetime.utcnow()
            }),
            "vitalSignsEvaluation": patient_data.get("vitalSignsEvaluation", []),
            "images": images_array,
            "priority": patient_data.get("priority", "medium"),
            "registrationInfo": {
                "registeredBy": current_user,
                "registrationDate": datetime.utcnow(),
                "lastUpdated": datetime.utcnow(),
                "status": "active"
            },
            "createdBy": current_user,
            "createdAt": datetime.utcnow()
        }

        # إدخال البيانات في MongoDB
        result = db.patients.insert_one(patient_record)

        return jsonify({
            "msg": "Patient added successfully with new biometric measurements",
            "patientId": str(result.inserted_id),
            "patientCategory": patient_category
        }), 201

    except Exception as e:
        print(f"Error in add_patient: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/patients', methods=['GET'])
@jwt_required()
def get_patients():
    try:
        current_user = get_jwt_identity()
        patients = list(db.patients.find({"createdBy": current_user}))
        
        processed_patients = []
        for patient in patients:
            try:
                # تحويل ObjectId إلى string
                patient['_id'] = str(patient['_id'])
                
                # معالجة الصور - دعم كل من base64 و filename
                if 'images' in patient and patient['images']:
                    for image in patient['images']:
                        if 'base64' in image:
                            # إذا كانت الصورة مخزنة كـ base64
                            image['url'] = f"data:image/jpeg;base64,{image['base64']}"
                        elif 'filename' in image:
                            # إذا كانت الصورة مخزنة كـ ملف
                            image['url'] = f"http://localhost:5000/uploads/{image['filename']}"
                
                # التأكد من وجود جميع الحقول المطلوبة مع القيم الافتراضية
                if 'patientInfo' not in patient:
                    patient['patientInfo'] = {}
                
                # التأكد من وجود فئة المريض
                if 'patientCategory' not in patient['patientInfo']:
                    # حساب فئة المريض من العمر إذا لم تكن موجودة
                    age = int(patient['patientInfo'].get('age', 0))
                    if age < 1:
                        patient['patientInfo']['patientCategory'] = 'infant'
                    elif age < 18:
                        patient['patientInfo']['patientCategory'] = 'child'
                    else:
                        patient['patientInfo']['patientCategory'] = 'adult'
                
                if 'dentalAnalysis' not in patient:
                    patient['dentalAnalysis'] = {
                        "diagnosis": {},
                        "treatmentPlan": "",
                        "analysisDate": patient.get('createdAt', datetime.utcnow())
                    }
                
                if 'biometrics' not in patient:
                    patient['biometrics'] = {}
                
                # تحديث هيكل القياسات الحيوية إذا كان قديماً
                if patient['biometrics'] and 'bloodPressure' in patient['biometrics']:
                    # تحويل من الهيكل القديم إلى الجديد
                    old_bp = patient['biometrics'].get('bloodPressure', '')
                    if old_bp and '/' in old_bp:
                        systolic, diastolic = old_bp.split('/')
                        patient['biometrics'] = {
                            "systolicBP": systolic.strip(),
                            "diastolicBP": diastolic.strip(),
                            "temperature": patient['biometrics'].get('temperature', ''),
                            "heartRate": patient['biometrics'].get('heartRate', ''),
                            "respiratoryRate": patient['biometrics'].get('respiratoryRate', ''),
                            "oxygenSaturation": patient['biometrics'].get('oxygenSaturation', ''),
                            "bloodSugar": patient['biometrics'].get('bloodSugar', '')
                        }
                
                # التأكد من وجود vitalSignsEvaluation
                if 'vitalSignsEvaluation' not in patient:
                    patient['vitalSignsEvaluation'] = []
                
                processed_patients.append(patient)
                
            except Exception as e:
                print(f"Error processing patient {patient.get('_id', 'unknown')}: {e}")
                continue  # تخطي المريض الذي به خطأ
        
        return jsonify(processed_patients)
    
    except Exception as e:
        print(f"Error in get_patients: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# إضافة route جديد للحصول على إحصائيات المرضى
@app.route('/api/patients/stats', methods=['GET'])
@jwt_required()
def get_patients_stats():
    try:
        current_user = get_jwt_identity()
        
        # إحصائيات حسب فئة المريض
        pipeline = [
            {"$match": {"createdBy": current_user}},
            {"$group": {
                "_id": "$patientInfo.patientCategory",
                "count": {"$sum": 1},
                "recent": {
                    "$max": "$createdAt"
                }
            }}
        ]
        
        category_stats = list(db.patients.aggregate(pipeline))
        
        # إحصائيات عامة
        total_patients = db.patients.count_documents({"createdBy": current_user})
        patients_with_images = db.patients.count_documents({
            "createdBy": current_user,
            "images": {"$exists": True, "$ne": []}
        })
        patients_with_diagnosis = db.patients.count_documents({
            "createdBy": current_user,
            "dentalAnalysis.diagnosis": {"$exists": True, "$ne": {}}
        })
        
        return jsonify({
            "totalPatients": total_patients,
            "patientsWithImages": patients_with_images,
            "patientsWithDiagnosis": patients_with_diagnosis,
            "categoryStats": category_stats
        })
        
    except Exception as e:
        print(f"Error in get_patients_stats: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ==============================
# 📏 القياسات الحيوية
# ==============================

@app.route("/api/biometrics", methods=["POST"])
@jwt_required()
def save_biometrics():
    data = request.json
    biometrics = {
        "patientId": data.get("patientId"),
        "measurements": data.get("measurements"),
        "clinicalNotes": data.get("clinicalNotes", ""),
        "createdAt": datetime.utcnow()
    }
    db.biometrics.insert_one(biometrics)
    return jsonify({"status": "success"}), 201


# ==============================
# 🧠 تحليل الصور (YOLO)
# ==============================



def get_detection_color(class_id):
    """الحصول على لون مختلف لكل نوع اكتشاف"""
    colors = {
        0: (255, 0, 0),    # أزرق - قاطع مركزي
        1: (0, 255, 0),    # أخضر - قاطع جانبي
        2: (0, 0, 255),    # أحمر - ناب
        3: (255, 255, 0),  # سماوي - ضاحك أول
        4: (255, 0, 255),  # وردي - ضاحك ثاني
        5: (0, 255, 255),  # أصفر - ضرس أول
        6: (128, 0, 128),  # بنفسجي - ضرس ثاني
        7: (255, 165, 0),  # برتقالي - ضرس العقل
        8: (255, 0, 0),    # أحمر - تسوس
        9: (0, 128, 0),    # أخضر غامق - حشوة
        10: (128, 128, 0), # زيتوني - جسر
        11: (0, 0, 128)    # أزرق غامق - زرعة
    }
    return colors.get(class_id, (255, 255, 255))


def get_arabic_tooth_type(class_id):
    """الحصول على اسم السن بالعربية"""
    tooth_types = {
        0: 'القاطع المركزي',
        1: 'القاطع الجانبي', 
        2: 'الناب',
        3: 'الضاحك الأول',
        4: 'الضاحك الثاني',
        5: 'الضرس الأول',
        6: 'الضرس الثاني',
        7: 'ضرس العقل',
        8: 'تسوس الأسنان',
        9: 'حشوة سنية',
        10: 'جسر سني',
        11: 'زرعة سنية'
    }
    return tooth_types.get(class_id, f'نوع {class_id}')

def create_combined_image(image, detections):
    """إنشاء صورة واحدة مع جميع الاكتشافات (للخيار الإضافي)"""
    combined_image = image.copy()
    
    for i, detection in enumerate(detections):
        x1, y1, x2, y2 = detection['bbox']
        confidence = detection['confidence']
        class_id = detection['class_id']
        
        color = get_detection_color(class_id)
        
        # رسم المربع
        cv2.rectangle(combined_image, 
                     (int(x1), int(y1)), 
                     (int(x2), int(y2)), 
                     color, 1)
        
        # إضافة التسمية
        label = f" {confidence:.2f}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness = 1
        
        (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        cv2.rectangle(combined_image,
                     (int(x1), int(y1) - text_height - 10),
                     (int(x1) + text_width, int(y1)),
                     color, -1)
        
        cv2.putText(combined_image, label,
                   (int(x1), int(y1) - 5),
                   font, font_scale, (255, 255, 255), thickness)
    
    # تحويل الصورة إلى base64
    _, buffer = cv2.imencode('.jpg', combined_image)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

@app.route('/analyze-single-tooth', methods=['POST'])
def analyze_single_tooth():
    try:
        # استقبال الصورة من frontend
        data = request.json
        image_data = data['image'].split(',')[1]
        
        # تحويل base64 إلى صورة
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # تحليل الصورة باستخدام YOLO
        results = single_tooth_model.predict(source=image, conf = 0.05)
        
        # معالجة النتائج - إصلاح الخطأ
        detections = []
        boxes = results[0].boxes
        
        if boxes is not None:
            for i, box in enumerate(boxes):
                # التحقق من وجود البيانات قبل الوصول إليها
                if len(box.xyxy) > 0 and len(box.conf) > 0 and len(box.cls) > 0:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = single_tooth_model.names[class_id]
                    
                    detections.append({
                        'class_name': class_name,
                        'arabic_name': get_arabic_tooth_type(class_id),
                        'english_name': class_name,
                        'confidence': confidence,
                        'bbox': [float(x1), float(y1), float(x2), float(y2)],
                        'class_id': class_id,
                        'detection_id': i + 1,
                        'diagnosis': get_diagnosis_from_class(class_id, confidence)
                    })
        
        # إنشاء صور منفردة لكل اكتشاف
        individual_detections = create_individual_detections(image, detections)
        
        # إنشاء صورة مجمعة مع التشخيص
        combined_image = create_combined_image_with_diagnosis(image, detections)
        
        # إحصائيات الاكتشافات
        detection_stats = {}
        diagnosis_stats = {}
        for detection in detections:
            class_name = detection['class_name']
            diagnosis = detection['diagnosis']['type']
            
            if class_name in detection_stats:
                detection_stats[class_name] += 1
            else:
                detection_stats[class_name] = 1
                
            if diagnosis in diagnosis_stats:
                diagnosis_stats[diagnosis] += 1
            else:
                diagnosis_stats[diagnosis] = 1
        

        try:
            uploaded_by = data.get('uploaded_by', 'unknown')

            # ازالة الجزء "data:image/jpeg;base64,"
            base64_raw = data['image'].split(',')[1]

            db.images.insert_one({
                "data": base64_raw,
                "uploaded_by": uploaded_by,
                "type": "periapical",       # مثل "Periapical lesion"
                "timestamp": datetime.utcnow()
        })
        except Exception as save_error:
            print("Error saving image:", save_error)

        return jsonify({
            'success': True,
            'detections': detections,
            'individual_detections': individual_detections,
            'combined_image': combined_image,
            'total_detections': len(detections),
            'detection_stats': detection_stats,
            'diagnosis_stats': diagnosis_stats,
            'original_image': data['image']
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

def create_single_tooth_annotation(image, detections, primary_detection):
    """إنشاء صورة مشروحة للسن المفرد مع جميع الاكتشافات"""
    annotated_image = image.copy()
    
    for detection in detections:
        x1, y1, x2, y2 = detection['bbox']
        diagnosis = detection.get('diagnosis', {})
        color = diagnosis.get('color', (0, 255, 0))  # لون التشخيص
        
        # إذا كان الاكتشاف هو الرئيسي، نرسم مربعًا أكثر سمكًا
        thickness = 4 if detection == primary_detection else 2
        
        # رسم المربع
        cv2.rectangle(annotated_image, 
                     (int(x1), int(y1)), 
                     (int(x2), int(y2)), 
                     color, thickness)
        
        # إضافة التسمية
        label = f"{detection['english_name']} {detection['confidence']:.2f}"
        if diagnosis.get('type') != 'Healthy Tooth':
            label += f" - {diagnosis['type']}"
            
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness_text = 2
        
        (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, thickness_text)
        
        # رسم خلفية للنص
        cv2.rectangle(annotated_image,
                     (int(x1), int(y1) - text_height - 10),
                     (int(x1) + text_width, int(y1)),
                     color, -1)
        
        # إضافة النص
        cv2.putText(annotated_image, label,
                   (int(x1), int(y1) - 5),
                   font, font_scale, (255, 255, 255), thickness_text)
    
    # تحويل الصورة إلى base64
    _, buffer = cv2.imencode('.jpg', annotated_image)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def create_primary_detection_image(image, primary_detection, health_assessment):
    """إنشاء صورة مكبرة للكشف الرئيسي مع التشخيص المفصل"""
    primary_image = image.copy()
    
    x1, y1, x2, y2 = primary_detection['bbox']
    diagnosis = primary_detection.get('diagnosis', {})
    color = diagnosis.get('color', (0, 255, 0))
    
    # توسيع منطقة الاهتمام قليلاً
    padding = 20
    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(image.shape[1], x2 + padding)
    y2 = min(image.shape[0], y2 + padding)
    
    # رسم مربع سميك حول الاكتشاف الرئيسي
    cv2.rectangle(primary_image, 
                 (int(x1), int(y1)), 
                 (int(x2), int(y2)), 
                 color, 4)
    
    # إضافة عنوان رئيسي
    main_label = f"Primary Detection: {primary_detection['english_name']}"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale_main = 0.8
    thickness_main = 2
    
    (main_width, main_height), _ = cv2.getTextSize(main_label, font, font_scale_main, thickness_main)
    
    # خلفية للعنوان الرئيسي
    cv2.rectangle(primary_image,
                 (int(x1), int(y1) - main_height - 50),
                 (int(x1) + main_width, int(y1)),
                 color, -1)
    
    cv2.putText(primary_image, main_label,
               (int(x1), int(y1) - 30),
               font, font_scale_main, (255, 255, 255), thickness_main)
    
    # إضافة التفاصيل
    details = [
        f"Confidence: {primary_detection['confidence']:.2f}",
        f"Diagnosis: {diagnosis.get('type', 'Healthy Tooth')}",
        f"Severity: {diagnosis.get('severity', 'none')}",
        f"Health: {health_assessment}"
    ]
    
    font_scale_detail = 0.5
    thickness_detail = 1
    
    for i, detail in enumerate(details):
        y_position = int(y1) - main_height - 30 - (i * 25)
        (detail_width, detail_height), _ = cv2.getTextSize(detail, font, font_scale_detail, thickness_detail)
        
        # خلفية للتفاصيل
        cv2.rectangle(primary_image,
                     (int(x1), y_position - detail_height - 5),
                     (int(x1) + detail_width, y_position + 5),
                     (50, 50, 50), -1)
        
        cv2.putText(primary_image, detail,
                   (int(x1), y_position),
                   font, font_scale_detail, (255, 255, 255), thickness_detail)
    
    # تحويل الصورة إلى base64
    _, buffer = cv2.imencode('.jpg', primary_image)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def calculate_iou(box1, box2):
    """حساب نسبة التداخل بين صندوقين (Intersection over Union)"""
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    # حساب منطقة التداخل
    xi1 = max(x1_1, x1_2)
    yi1 = max(y1_1, y1_2)
    xi2 = min(x2_1, x2_2)
    yi2 = min(y2_1, y2_2)
    
    inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
    
    # حساب منطقة الاتحاد
    box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
    box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
    union_area = box1_area + box2_area - inter_area
    
    return inter_area / union_area if union_area > 0 else 0

def generate_recommendations(health_status):
    """توليد توصيات بناءً على حالة الصحة"""
    recommendations = {
        'healthy': [
            'Continue regular dental hygiene',
            'Schedule routine check-up in 6 months'
        ],
        'caries_detected': [
            'Consult dentist for treatment planning',
            'Consider dental filling or restoration',
            'Improve oral hygiene practices'
        ],
        'filled_tooth': [
            'Monitor filling for wear',
            'Regular check-up to ensure integrity',
            'Maintain good oral hygiene'
        ],
        'dental_work': [
            'Regular monitoring of dental work',
            'Follow dentist recommendations for maintenance',
            'Schedule periodic evaluations'
        ],
        'no_detection': [
            'Upload clearer tooth image',
            'Ensure good lighting and focus',
            'Try different angle if possible'
        ]
    }
    return recommendations.get(health_status, ['Consult dental professional'])



@app.route('/analyze-panoramic', methods=['POST'])
def analyze_panoramic():
    try:
        # استقبال الصورة من frontend
        data = request.json
        image_data = data['image'].split(',')[1]
        
        # تحويل base64 إلى صورة
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # تحليل الصورة باستخدام YOLO
        results = model.predict(source=image, conf=0.3)
        
        # معالجة النتائج - إصلاح الخطأ
        detections = []
        boxes = results[0].boxes
        
        if boxes is not None:
            for i, box in enumerate(boxes):
                # التحقق من وجود البيانات قبل الوصول إليها
                if len(box.xyxy) > 0 and len(box.conf) > 0 and len(box.cls) > 0:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    
                    detections.append({
                        'class_name': class_name,
                        'arabic_name': get_arabic_tooth_type(class_id),
                        'english_name': class_name,
                        'confidence': confidence,
                        'bbox': [float(x1), float(y1), float(x2), float(y2)],
                        'class_id': class_id,
                        'detection_id': i + 1,
                        'diagnosis': get_diagnosis_from_class(class_id, confidence)
                    })
        
        # إنشاء صور منفردة لكل اكتشاف
        individual_detections = create_individual_detections(image, detections)
        
        # إنشاء صورة مجمعة مع التشخيص
        combined_image = create_combined_image_with_diagnosis(image, detections)
        
        # إحصائيات الاكتشافات
        detection_stats = {}
        diagnosis_stats = {}
        for detection in detections:
            class_name = detection['class_name']
            diagnosis = detection['diagnosis']['type']
            
            if class_name in detection_stats:
                detection_stats[class_name] += 1
            else:
                detection_stats[class_name] = 1
                
            if diagnosis in diagnosis_stats:
                diagnosis_stats[diagnosis] += 1
            else:
                diagnosis_stats[diagnosis] = 1
        

        try:
            uploaded_by = data.get('uploaded_by', 'unknown')

            # ازالة الجزء "data:image/jpeg;base64,"
            base64_raw = data['image'].split(',')[1]

            db.images.insert_one({
                "data": base64_raw,
                "uploaded_by": uploaded_by,
                "type": "panorama",       # مثل "Periapical lesion"
                "timestamp": datetime.utcnow()
        })
        except Exception as save_error:
            print("Error saving image:", save_error)


        return jsonify({
            'success': True,
            'detections': detections,
            'individual_detections': individual_detections,
            'combined_image': combined_image,
            'total_detections': len(detections),
            'detection_stats': detection_stats,
            'diagnosis_stats': diagnosis_stats,
            'original_image': data['image']
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# دالة جديدة للحصول على التشخيص
def get_diagnosis_from_class(class_id, confidence):
    """الحصول على التشخيص بناءً على class_id"""
    if class_id == 8:  # تسوس
        return {
            'type': 'Dental Caries',
            'severity': 'high' if confidence > 0.7 else 'medium',
            'code': 'K02',
            'recommendation': 'Dental filling or restoration required',
            'color': (0, 0, 255)  # أحمر
        }
    elif class_id == 9:  # حشوة
        return {
            'type': 'Dental Filling',
            'severity': 'low',
            'code': 'K03',
            'recommendation': 'Routine monitoring of existing filling',
            'color': (0, 255, 255)  # أصفر
        }
    elif class_id == 10:  # جسر
        return {
            'type': 'Dental Bridge',
            'severity': 'low', 
            'code': 'K05',
            'recommendation': 'Monitor bridge integrity',
            'color': (255, 255, 0)  # سماوي
        }
    elif class_id == 11:  # زرعة
        return {
            'type': 'Dental Implant',
            'severity': 'low',
            'code': 'K06', 
            'recommendation': 'Regular implant maintenance',
            'color': (255, 0, 255)  # وردي
        }
    else:  # أسنان طبيعية
        return {
            'type': 'Healthy Tooth',
            'severity': 'none',
            'code': 'NONE',
            'recommendation': 'No treatment needed',
            'color': (0, 255, 0)  # أخضر
        }

# دالة جديدة للحصول على الاسم بالإنجليزية
def get_english_tooth_type(class_id):
    """الحصول على اسم السن بالإنجليزية"""
    tooth_types = {
        0: 'Central Incisor',
        1: 'Lateral Incisor', 
        2: 'Canine',
        3: 'First Premolar',
        4: 'Second Premolar',
        5: 'First Molar',
        6: 'Second Molar',
        7: 'Wisdom Tooth',
        8: 'Dental Caries',
        9: 'Dental Filling',
        10: 'Dental Bridge',
        11: 'Dental Implant'
    }
    return tooth_types.get(class_id, f'Type {class_id}')

# دالة معدلة لإنشاء الصورة المجمعة مع التشخيص
def create_combined_image_with_diagnosis(image, detections):
    """إنشاء صورة واحدة مع جميع الاكتشافات والتشخيص"""
    combined_image = image.copy()
    
    for detection in detections:
        x1, y1, x2, y2 = detection['bbox']
        confidence = detection['confidence']
        diagnosis = detection['diagnosis']
        
        # استخدام لون التشخيص
        color = diagnosis['color']
        thickness = 3 if diagnosis['type'] != 'Healthy Tooth' else 1
        
        # رسم المربع
        cv2.rectangle(combined_image, 
                     (int(x1), int(y1)), 
                     (int(x2), int(y2)), 
                     color, thickness)
        
        # إضافة التسمية مع التشخيص
        label = f"{detection['english_name']} {confidence:.2f}"
        if diagnosis['type'] != 'Healthy Tooth':
            label += f" - {diagnosis['type']}"
            
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        thickness = 1
        
        (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        # رسم خلفية للنص
        cv2.rectangle(combined_image,
                     (int(x1), int(y1) - text_height - 10),
                     (int(x1) + text_width, int(y1)),
                     color, -1)
        
        # إضافة النص
        cv2.putText(combined_image, label,
                   (int(x1), int(y1) - 5),
                   font, font_scale, (255, 255, 255), thickness)
    
    # تحويل الصورة إلى base64
    _, buffer = cv2.imencode('.jpg', combined_image)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

# دالة معدلة لإنشاء الصور المنفردة مع التشخيص
def create_individual_detections(image, detections):
    """إنشاء صورة منفصلة لكل اكتشاف مع التشخيص"""
    individual_images = []
    
    for i, detection in enumerate(detections):
        # إنشاء نسخة من الصورة الأصلية
        individual_image = image.copy()
        
        x1, y1, x2, y2 = detection['bbox']
        confidence = detection['confidence']
        diagnosis = detection['diagnosis']
        
        # استخدام لون التشخيص
        color = diagnosis['color']
        thickness = 1
        
        # رسم المربع حول الاكتشاف
        cv2.rectangle(individual_image, 
                     (int(x1), int(y1)), 
                     (int(x2), int(y2)), 
                     color, thickness)
        
        # إضافة التسمية مع التشخيص
        label = f"{detection['english_name']} - {diagnosis['type']}"
        sub_label = f"Confidence: {confidence:.2f} | Severity: {diagnosis['severity']}"
        
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness = 2
        
        
        
        # تحويل الصورة إلى base64
        _, buffer = cv2.imencode('.jpg', individual_image)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        individual_images.append({
            'detection_id': i + 1,
            'class_name': detection['class_name'],
            'english_name': detection['english_name'],
            'arabic_name': detection['arabic_name'],
            'confidence': confidence,
            'bbox': detection['bbox'],
            'image': f"data:image/jpeg;base64,{image_base64}",
            'diagnosis': diagnosis,
            'color': color
        })
    
    return individual_images
    
# في Flask
@app.route('/send-contact-email', methods=['POST'])
def send_contact_email():
    data = request.json

# ==============================
# 🚀 تشغيل الخادم
# ==============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

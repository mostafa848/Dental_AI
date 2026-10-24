import React from 'react';

const PatientDashboard = ({ diagnosis, biometricData }) => {
  // استخراج البيانات بشكل آمن مع قيم افتراضية
  const patientInfo = biometricData?.patientInfo || {};
  const biometrics = biometricData?.biometrics || {};

  // بيانات افتراضية آمنة
  const defaultPatientInfo = {
    name: 'لم يتم إدخال البيانات',
    age: '',
    gender: '',
    date: new Date().toLocaleDateString('ar-EG'),
    patientCategory: 'adult'
  };

  // استخدام البيانات مع القيم الافتراضية
  const displayPatientInfo = {
    name: patientInfo.name || defaultPatientInfo.name,
    age: patientInfo.age || defaultPatientInfo.age,
    gender: patientInfo.gender || defaultPatientInfo.gender,
    date: patientInfo.date || defaultPatientInfo.date,
    patientCategory: patientInfo.patientCategory || defaultPatientInfo.patientCategory
  };

  const getTreatmentRecommendation = (diagnosis) => {
    if (!diagnosis) return null;

    const recommendations = {
      'تسوس الأسنان': 'حشو السن أو تاج حسب عمق التسوس',
      'التهاب اللثة': 'تنظيف احترافي وتحسين نظافة الفم',
      'تكسر السن': 'تاج أو فينير حسب حجم الكسر',
      'خراج سني': 'علاج عصب ومضادات حيوية',
      'تصبغات': 'تبييض أو تنظيف احترافي',
      'Dental Caries': 'حشو السن أو تاج حسب عمق التسوس',
      'Periodontitis': 'تنظيف عميق ومضادات حيوية',
      'Gingivitis': 'تنظيف احترافي وتحسين النظافة'
    };

    return recommendations[diagnosis.name] || 'استشارة طبية عاجلة';
  };

  // دالة للحصول على تسمية القياسات الحيوية الجديدة
  const getBiometricLabel = (key) => {
    const labels = {
      systolicBP: 'الضغط الانقباضي',
      diastolicBP: 'الضغط الانبساطي',
      temperature: 'درجة الحرارة',
      heartRate: 'معدل ضربات القلب',
      respiratoryRate: 'معدل التنفس',
      oxygenSaturation: 'تشبع الأكسجين',
      bloodSugar: 'سكر الدم'
    };
    return labels[key] || key;
  };

  // دالة للحصول على الوحدة المناسبة للقياسات الجديدة
  const getBiometricUnit = (key) => {
    const units = {
      systolicBP: 'مم زئبق',
      diastolicBP: 'مم زئبق',
      temperature: '°م',
      heartRate: 'نبضة/د',
      respiratoryRate: 'نفس/د',
      oxygenSaturation: '%',
      bloodSugar: 'ملغم/دل'
    };
    return units[key] || '';
  };

  // دالة لتقييم القياسات الجديدة
  const getMeasurementStatus = (key, value, patientCategory = 'adult') => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'normal';

    // نطاقات القياس حسب فئة المريض
    const ranges = {
      systolicBP: {
        adult: { normal: [90, 120], warning: [120, 140], danger: [140, 200] },
        child: { normal: [70, 110], warning: [110, 120], danger: [120, 150] },
        infant: { normal: [60, 90], warning: [90, 100], danger: [100, 120] }
      },
      diastolicBP: {
        adult: { normal: [60, 80], warning: [80, 90], danger: [90, 120] },
        child: { normal: [40, 70], warning: [70, 80], danger: [80, 90] },
        infant: { normal: [30, 60], warning: [60, 70], danger: [70, 80] }
      },
      temperature: {
        adult: { normal: [36, 37.5], warning: [37.5, 38.5], danger: [38.5, 42] },
        child: { normal: [36, 37.5], warning: [37.5, 38.5], danger: [38.5, 42] },
        infant: { normal: [36, 37.5], warning: [37.5, 38.5], danger: [38.5, 42] }
      },
      heartRate: {
        adult: { normal: [60, 100], warning: [100, 120], danger: [120, 180] },
        child: { normal: [70, 110], warning: [110, 130], danger: [130, 180] },
        infant: { normal: [100, 150], warning: [150, 160], danger: [160, 200] }
      },
      respiratoryRate: {
        adult: { normal: [12, 20], warning: [20, 24], danger: [24, 30] },
        child: { normal: [18, 25], warning: [25, 30], danger: [30, 40] },
        infant: { normal: [30, 45], warning: [45, 50], danger: [50, 60] }
      },
      oxygenSaturation: {
        adult: { normal: [95, 100], warning: [90, 95], danger: [70, 90] },
        child: { normal: [95, 100], warning: [90, 95], danger: [70, 90] },
        infant: { normal: [95, 100], warning: [90, 95], danger: [70, 90] }
      },
      bloodSugar: {
        adult: { normal: [70, 140], warning: [140, 200], danger: [200, 400] },
        child: { normal: [70, 120], warning: [120, 180], danger: [180, 300] },
        infant: { normal: [70, 100], warning: [100, 150], danger: [150, 200] }
      }
    };

    if (!ranges[key] || !ranges[key][patientCategory]) return 'normal';

    const range = ranges[key][patientCategory];
    
    if (numValue >= range.danger[0] && numValue <= range.danger[1]) return 'danger';
    if (numValue >= range.warning[0] && numValue <= range.warning[1]) return 'warning';
    if (numValue >= range.normal[0] && numValue <= range.normal[1]) return 'normal';
    
    return 'danger';
  };

  const getStatusColor = (status) => {
    const colors = {
      normal: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.normal;
  };

  // الحصول على اسم فئة المريض بالعربية
  const getPatientCategoryName = (category) => {
    const categories = {
      adult: 'بالغ',
      child: 'طفل',
      infant: 'رضيع'
    };
    return categories[category] || category;
  };

  // تقييم العلامات الحيوية الشاملة
  const evaluateOverallVitalStatus = () => {
    const vitalSigns = Object.entries(biometrics).filter(([key, value]) => 
      value && value !== '' && !isNaN(parseFloat(value))
    );

    if (vitalSigns.length === 0) return null;

    let criticalCount = 0;
    let warningCount = 0;
    let normalCount = 0;

    vitalSigns.forEach(([key, value]) => {
      const status = getMeasurementStatus(key, value, displayPatientInfo.patientCategory);
      if (status === 'danger') criticalCount++;
      else if (status === 'warning') warningCount++;
      else normalCount++;
    });

    if (criticalCount > 0) return { status: 'danger', text: '🚨 حالة حرجة - يحتاج عناية فورية' };
    if (warningCount > 0) return { status: 'warning', text: '⚠️ حالة متوسطة - يحتاج مراقبة' };
    return { status: 'normal', text: '✅ حالة مستقرة - القياسات طبيعية' };
  };

  // التحقق من وجود بيانات القياسات الحيوية
  const hasBiometrics = biometrics && Object.keys(biometrics).some(key => 
    biometrics[key] && biometrics[key] !== '' && !isNaN(parseFloat(biometrics[key]))
  );

  // الحصول على القياسات التي تحتوي على قيم صالحة
  const validBiometrics = Object.entries(biometrics).filter(([key, value]) => 
    value && value !== '' && !isNaN(parseFloat(value))
  );

  const overallStatus = evaluateOverallVitalStatus();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📊 لوحة معلومات المريض
      </h2>

      {/* معلومات المريض */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-800 mb-3">معلومات المريض</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">الاسم:</span>
            <span className="font-medium">{displayPatientInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">العمر:</span>
            <span className="font-medium">
              {displayPatientInfo.age ? `${displayPatientInfo.age} سنة` : 'لم يتم الإدخال'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">الجنس:</span>
            <span className="font-medium">
              {displayPatientInfo.gender === 'male' ? 'ذكر' : 
               displayPatientInfo.gender === 'female' ? 'أنثى' : 'لم يتم الإدخال'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">الفئة:</span>
            <span className="font-medium text-blue-600">
              {getPatientCategoryName(displayPatientInfo.patientCategory)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">تاريخ الفحص:</span>
            <span className="font-medium">{displayPatientInfo.date}</span>
          </div>
        </div>
      </div>

      {/* تقييم عام للعلامات الحيوية */}
      {overallStatus && (
        <div className={`mb-4 p-4 rounded-lg border-2 ${getStatusColor(overallStatus.status)}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-lg">{overallStatus.text}</span>
            <div className="text-sm">
              {validBiometrics.length} قياسات تم تقييمها
            </div>
          </div>
        </div>
      )}

      {/* القياسات الحيوية */}
      {hasBiometrics && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">العلامات الحيوية</h3>
          <div className="space-y-3">
            {validBiometrics.map(([key, value]) => {
              const status = getMeasurementStatus(key, value, displayPatientInfo.patientCategory);
              const statusColor = getStatusColor(status);
              
              return (
                <div key={key} className={`p-3 rounded-lg border-2 ${statusColor}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      {getBiometricLabel(key)}
                    </span>
                    <span className="text-lg font-bold">
                      {value} {getBiometricUnit(key)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs">
                      {status === 'normal' ? '✅ طبيعي' : 
                       status === 'warning' ? '⚠️ يحتاج مراقبة' : '🚨 يحتاج عناية'}
                    </span>
                    <div className="text-xs text-gray-500">
                      النطاق الطبيعي: {
                        (() => {
                          const ranges = {
                            systolicBP: { adult: '90-120', child: '70-110', infant: '60-90' },
                            diastolicBP: { adult: '60-80', child: '40-70', infant: '30-60' },
                            temperature: '36-37.5°م',
                            heartRate: { adult: '60-100', child: '70-110', infant: '100-150' },
                            respiratoryRate: { adult: '12-20', child: '18-25', infant: '30-45' },
                            oxygenSaturation: '95-100%',
                            bloodSugar: { adult: '70-140', child: '70-120', infant: '70-100' }
                          };
                          
                          if (typeof ranges[key] === 'object') {
                            return ranges[key][displayPatientInfo.patientCategory] + ' ' + getBiometricUnit(key);
                          }
                          return ranges[key] || 'غير محدد';
                        })()
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* التوصيات العلاجية */}
      {diagnosis && (
        <div className={`p-4 rounded-lg border-2 ${
          diagnosis.severity === 'critical' ? 'bg-red-50 border-red-200' :
          diagnosis.severity === 'high' ? 'bg-red-50 border-red-200' :
          diagnosis.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }`}>
          <h3 className="text-lg font-medium text-gray-800 mb-2">التوصيات العلاجية</h3>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>التشخيص:</strong> {diagnosis.name}
            </p>
            <p className="text-gray-700">
              <strong>العلاج المقترح:</strong> {getTreatmentRecommendation(diagnosis)}
            </p>
            <p className={`text-sm font-medium ${
              diagnosis.severity === 'critical' ? 'text-red-600' :
              diagnosis.severity === 'high' ? 'text-red-600' :
              diagnosis.severity === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              مستوى العناية: {
                diagnosis.severity === 'critical' ? 'حرج' :
                diagnosis.severity === 'high' ? 'عالي' :
                diagnosis.severity === 'medium' ? 'متوسط' : 'عادي'
              }
            </p>
          </div>
        </div>
      )}

      {/* رسالة عندما لا توجد بيانات */}
      {!hasBiometrics && !diagnosis && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>لم يتم إدخال أي بيانات للمريض بعد</p>
          <p className="text-sm mt-1">استخدم نموذج القياسات الحيوية لإدخال البيانات</p>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
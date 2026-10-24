import React, { useState, useEffect } from 'react';

// تعريف نطاقات القياسات الجديدة حسب فئة المريض
const measurementRanges = {
  // ضغط الدم (انقباضي/انبساطي)
  systolicBP: { 
    adult: { min: 90, max: 200, step: 1, unit: 'mmHg' },
    child: { min: 70, max: 150, step: 1, unit: 'mmHg' },
    infant: { min: 60, max: 120, step: 1, unit: 'mmHg' }
  },
  diastolicBP: { 
    adult: { min: 60, max: 120, step: 1, unit: 'mmHg' },
    child: { min: 40, max: 90, step: 1, unit: 'mmHg' },
    infant: { min: 30, max: 80, step: 1, unit: 'mmHg' }
  },
  
  // درجة الحرارة
  temperature: { 
    adult: { min: 35, max: 42, step: 0.1, unit: '°C' },
    child: { min: 35, max: 42, step: 0.1, unit: '°C' },
    infant: { min: 35, max: 42, step: 0.1, unit: '°C' }
  },
  
  // النبض (يتغير حسب الفئة والعمر والجنس)
  heartRate: { 
    adult_male: { min: 60, max: 100, step: 1, unit: 'bpm' },
    adult_female: { min: 60, max: 100, step: 1, unit: 'bpm' },
    child: { min: 70, max: 120, step: 1, unit: 'bpm' },
    infant: { min: 100, max: 160, step: 1, unit: 'bpm' }
  },
  
  // معدل التنفس
  respiratoryRate: { 
    adult: { min: 12, max: 20, step: 1, unit: 'breaths/min' },
    child: { min: 18, max: 30, step: 1, unit: 'breaths/min' },
    infant: { min: 30, max: 60, step: 1, unit: 'breaths/min' }
  },
  
  // معدل الأكسجين
  oxygenSaturation: { 
    adult: { min: 90, max: 100, step: 1, unit: '%' },
    child: { min: 90, max: 100, step: 1, unit: '%' },
    infant: { min: 90, max: 100, step: 1, unit: '%' }
  },
  
  // نسبة السكر في الدم
  bloodSugar: { 
    adult: { min: 50, max: 400, step: 1, unit: 'mg/dL' },
    child: { min: 50, max: 300, step: 1, unit: 'mg/dL' },
    infant: { min: 50, max: 200, step: 1, unit: 'mg/dL' }
  }
};

const PatientBiometricInput = ({ 
  onDataChange, 
  clinicalStudy, 
  diagnosis, 
  currentImage,
  treatmentPlan 
}) => {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    date: '',
    patientCategory: 'adult' // adult, child, infant
  });

  const [measurements, setMeasurements] = useState({
    systolicBP: '',
    diastolicBP: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    bloodSugar: ''
  });

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [vitalSignsEvaluation, setVitalSignsEvaluation] = useState([]);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US');
    setPatientInfo(prev => ({ ...prev, date: today }));
  }, []);

  useEffect(() => {
    if (clinicalStudy) {
      setClinicalNotes(clinicalStudy);
    }
  }, [clinicalStudy]);

  // تحديث فئة المريض عندما يتغير العمر
  useEffect(() => {
    if (patientInfo.age) {
      const age = parseInt(patientInfo.age);
      let category = 'adult';
      
      if (age < 1) {
        category = 'infant';
      } else if (age < 18) {
        category = 'child';
      }
      
      setPatientInfo(prev => ({ ...prev, patientCategory: category }));
    }
  }, [patientInfo.age]);

  // تقييم العلامات الحيوية عند تغيير القياسات
  useEffect(() => {
    evaluateVitalSigns();
  }, [measurements, patientInfo]);

  const handlePatientInfoChange = (field, value) => {
    const newPatientInfo = {
      ...patientInfo,
      [field]: value
    };
    setPatientInfo(newPatientInfo);
    onDataChange({
      patientInfo: newPatientInfo,
      biometrics: measurements,
      clinicalStudy: clinicalNotes
    });
    setIsSaved(false);
    setSaveError('');
  };

  const handleMeasurementChange = (field, value) => {
    const newMeasurements = {
      ...measurements,
      [field]: value
    };
    setMeasurements(newMeasurements);
    onDataChange({
      patientInfo: patientInfo,
      biometrics: newMeasurements,
      clinicalStudy: clinicalNotes
    });
    setIsSaved(false);
    setSaveError('');
  };

  const handleClinicalNotesChange = (value) => {
    setClinicalNotes(value);
    onDataChange({
      patientInfo: patientInfo,
      biometrics: measurements,
      clinicalStudy: value
    });
    setIsSaved(false);
    setSaveError('');
  };

  const validateForm = () => {
    if (!patientInfo.name || patientInfo.name.trim() === '') {
      setSaveError('⚠️ Please enter patient name first');
      return false;
    }

    if (!patientInfo.age || patientInfo.age.toString().trim() === '') {
      setSaveError('⚠️ Please enter patient age');
      return false;
    }

    if (!patientInfo.gender || patientInfo.gender.trim() === '') {
      setSaveError('⚠️ Please select patient gender');
      return false;
    }

    const age = parseInt(patientInfo.age);
    if (isNaN(age) || age < 0 || age > 120) {
      setSaveError('⚠️ Please enter a valid age (0-120 years)');
      return false;
    }

    if (!currentImage) {
      setSaveError('⚠️ Please upload a dental X-ray image first');
      return false;
    }

    

    setSaveError('');
    return true;
  };

  const handleSavePatient = async () => {
    if (!validateForm()) {
      return;
    }
    console.log("LOCAL STORAGE CONTENT:", localStorage);


    const patientData = {
      patientInfo,
      biometrics: measurements,
      clinicalStudy: clinicalNotes,
      dentalAnalysis: {
        diagnosis: diagnosis || 'No detection',
        treatmentPlan: treatmentPlan || 'No treatment plan provided',
        analysisDate: new Date().toISOString()
      },
      priority: diagnosis?.severity === 'critical' ? 'high' : 'medium',
      vitalSignsEvaluation: vitalSignsEvaluation
    };

    try {
      const token = localStorage.getItem("dentalAIToken");

      // تحويل الصورة إلى base64 إذا كانت File object
      let imageBase64 = null;
      if (currentImage instanceof File) {
        imageBase64 = await fileToBase64(currentImage);
        patientData.xrayImageBase64 = imageBase64;
      } else if (typeof currentImage === 'string') {
        patientData.xrayImageBase64 = currentImage;
      }

      const response = await fetch("http://localhost:5000/api/patients", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientData)
      });

      const result = await response.json();

      if (response.ok) {
        setIsSaved(true);
        setSaveError('');
        
        // إعادة تعيين النموذج بعد الحفظ
        setPatientInfo({
          name: "",
          age: "",
          gender: "",
          date: new Date().toLocaleDateString("en-US"),
          patientCategory: "adult"
        });
        setMeasurements({
          systolicBP: "",
          diastolicBP: "",
          temperature: "",
          heartRate: "",
          respiratoryRate: "",
          oxygenSaturation: "",
          bloodSugar: ""
        });
        setClinicalNotes("");
        setVitalSignsEvaluation([]);

        onDataChange({
          patientInfo: {},
          biometrics: {},
          clinicalStudy: "",
        });

        alert("✅ Patient data saved successfully with X-ray image!");
      } else {
        throw new Error(result.error || 'Failed to save patient');
      }
    } catch (error) {
      console.error("Error saving patient:", error);
      setSaveError(`❌ ${error.message}`);
    }
  };

  // دالة مساعدة لتحويل File إلى base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // الحصول على النطاق المناسب للقياس حسب فئة المريض والجنس
  const getMeasurementRange = (measurementKey) => {
    const category = patientInfo.patientCategory || 'adult';
    const gender = patientInfo.gender || 'male';
    
    if (measurementKey === 'heartRate') {
      const heartRateKey = category === 'adult' ? `adult_${gender}` : category;
      return measurementRanges[measurementKey][heartRateKey] || measurementRanges[measurementKey].adult_male;
    }
    
    return measurementRanges[measurementKey][category] || measurementRanges[measurementKey].adult;
  };

  // تقييم القياسات الحيوية
  const evaluateVitalSigns = () => {
    const evaluations = [];
    const category = patientInfo.patientCategory;
    const age = parseInt(patientInfo.age) || 0;

    // تقييم ضغط الدم
    if (measurements.systolicBP && measurements.diastolicBP) {
      const systolic = parseInt(measurements.systolicBP);
      const diastolic = parseInt(measurements.diastolicBP);
      
      let bpStatus = 'normal';
      let bpColor = 'text-green-600';
      let bpIcon = '✅';
      
      if (category === 'adult') {
        if (systolic >= 140 || diastolic >= 90) {
          bpStatus = 'high';
          bpColor = 'text-red-600';
          bpIcon = '⚠️';
        } else if (systolic <= 90 || diastolic <= 60) {
          bpStatus = 'low';
          bpColor = 'text-yellow-600';
          bpIcon = '📉';
        }
      } else if (category === 'child') {
        if (systolic >= 120 || diastolic >= 80) {
          bpStatus = 'high';
          bpColor = 'text-red-600';
          bpIcon = '⚠️';
        } else if (systolic <= 70 || diastolic <= 40) {
          bpStatus = 'low';
          bpColor = 'text-yellow-600';
          bpIcon = '📉';
        }
      } else if (category === 'infant') {
        if (systolic >= 110 || diastolic >= 70) {
          bpStatus = 'high';
          bpColor = 'text-red-600';
          bpIcon = '⚠️';
        } else if (systolic <= 60 || diastolic <= 30) {
          bpStatus = 'low';
          bpColor = 'text-yellow-600';
          bpIcon = '📉';
        }
      }
      
      evaluations.push({
        name: 'Blood Pressure',
        value: `${systolic}/${diastolic} mmHg`,
        status: bpStatus,
        color: bpColor,
        icon: bpIcon
      });
    }

    // تقييم درجة الحرارة
    if (measurements.temperature) {
      const temp = parseFloat(measurements.temperature);
      let tempStatus = 'normal';
      let tempColor = 'text-green-600';
      let tempIcon = '✅';
      
      if (temp > 37.5) {
        tempStatus = 'fever';
        tempColor = 'text-red-600';
        tempIcon = '🌡️';
      } else if (temp < 36.0) {
        tempStatus = 'low';
        tempColor = 'text-blue-600';
        tempIcon = '❄️';
      }
      
      evaluations.push({
        name: 'Temperature',
        value: `${temp} °C`,
        status: tempStatus,
        color: tempColor,
        icon: tempIcon
      });
    }

    // تقييم النبض
    if (measurements.heartRate) {
      const hr = parseInt(measurements.heartRate);
      let hrStatus = 'normal';
      let hrColor = 'text-green-600';
      let hrIcon = '✅';
      
      const range = getMeasurementRange('heartRate');
      if (hr > range.max) {
        hrStatus = 'high';
        hrColor = 'text-red-600';
        hrIcon = '💓';
      } else if (hr < range.min) {
        hrStatus = 'low';
        hrColor = 'text-yellow-600';
        hrIcon = '💙';
      }
      
      evaluations.push({
        name: 'Heart Rate',
        value: `${hr} bpm`,
        status: hrStatus,
        color: hrColor,
        icon: hrIcon
      });
    }

    // تقييم معدل التنفس
    if (measurements.respiratoryRate) {
      const rr = parseInt(measurements.respiratoryRate);
      let rrStatus = 'normal';
      let rrColor = 'text-green-600';
      let rrIcon = '✅';
      
      const range = getMeasurementRange('respiratoryRate');
      if (rr > range.max) {
        rrStatus = 'high';
        rrColor = 'text-red-600';
        rrIcon = '💨';
      } else if (rr < range.min) {
        rrStatus = 'low';
        rrColor = 'text-yellow-600';
        rrIcon = '🌬️';
      }
      
      evaluations.push({
        name: 'Respiratory Rate',
        value: `${rr} breaths/min`,
        status: rrStatus,
        color: rrColor,
        icon: rrIcon
      });
    }

    // تقييم الأكسجين
    if (measurements.oxygenSaturation) {
      const oxygen = parseInt(measurements.oxygenSaturation);
      let oxygenStatus = 'normal';
      let oxygenColor = 'text-green-600';
      let oxygenIcon = '✅';
      
      if (oxygen < 95) {
        oxygenStatus = 'low';
        oxygenColor = 'text-yellow-600';
        oxygenIcon = '⚠️';
      }
      if (oxygen < 90) {
        oxygenStatus = 'critical';
        oxygenColor = 'text-red-600';
        oxygenIcon = '🚨';
      }
      
      evaluations.push({
        name: 'Oxygen Saturation',
        value: `${oxygen}%`,
        status: oxygenStatus,
        color: oxygenColor,
        icon: oxygenIcon
      });
    }

    // تقييم السكر في الدم
    if (measurements.bloodSugar) {
      const sugar = parseInt(measurements.bloodSugar);
      let sugarStatus = 'normal';
      let sugarColor = 'text-green-600';
      let sugarIcon = '✅';
      
      if (sugar > 140) {
        sugarStatus = 'high';
        sugarColor = 'text-red-600';
        sugarIcon = '📈';
      } else if (sugar < 70) {
        sugarStatus = 'low';
        sugarColor = 'text-yellow-600';
        sugarIcon = '📉';
      }
      
      evaluations.push({
        name: 'Blood Sugar',
        value: `${sugar} mg/dL`,
        status: sugarStatus,
        color: sugarColor,
        icon: sugarIcon
      });
    }

    setVitalSignsEvaluation(evaluations);
  };

  // الحصول على لون الخلفية بناءً على حالة القياس
  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-green-50 border-green-200';
      case 'high': return 'bg-red-50 border-red-200';
      case 'low': return 'bg-yellow-50 border-yellow-200';
      case 'fever': return 'bg-orange-50 border-orange-200';
      case 'critical': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📋 Patient Information & Vital Signs
      </h2>

      {/* Validation Status */}
      <div className="mb-4 space-y-2">
        <div className={`flex items-center text-sm ${patientInfo.name ? 'text-green-600' : 'text-gray-500'}`}>
          {patientInfo.name ? '✅' : '⭕'} Patient Name: {patientInfo.name || 'Not provided'}
        </div>
        <div className={`flex items-center text-sm ${currentImage ? 'text-green-600' : 'text-gray-500'}`}>
          {currentImage ? '✅' : '⭕'} X-ray Image: {currentImage ? 'Uploaded' : 'Not uploaded'}
        </div>
        
        {patientInfo.patientCategory && (
          <div className="flex items-center text-sm text-blue-600">
            🏷️ Patient Category: {patientInfo.patientCategory.toUpperCase()} 
            {patientInfo.age && ` (${patientInfo.age} years)`}
          </div>
        )}
      </div>

      {/* Patient Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-3">Personal Information *</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={patientInfo.name}
              onChange={(e) => handlePatientInfoChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter patient name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age [0 - 120](years) * 
            </label>
           <input
  type="number"
  min="0"
  max="120"
  value={patientInfo.age}
  onChange={(e) => {
  const value = e.target.value;

  // السماح بالحذف
  if (value === "") {
    handlePatientInfoChange("age", "");
    return;
  }

  // منع غير الأرقام
  if (!/^\d+$/.test(value)) return;

  handlePatientInfoChange("age", value);
}}

  onBlur={(e) => {
    const value = parseInt(e.target.value, 10);

    if (!/^\d+$/.test(value)) e.target.focus();

    // إذا خرج من الحقل وكانت القيمة غير صحيحة
    if (isNaN(value) || value < 0 || value > 120) {
      handlePatientInfoChange("age", "");
    }
    else 
    {
      handlePatientInfoChange("age",value);
    }
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="Age in years"
  required
/>

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <select
              value={patientInfo.gender}
              onChange={(e) => handlePatientInfoChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Examination Date
            </label>
            <input
              type="text"
              value={patientInfo.date}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Clinical Study Notes */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-medium text-purple-800 mb-3">Clinical Study Notes</h3>
        <textarea
          placeholder="Enter clinical observations, symptoms, medical history, and treatment notes..."
          value={clinicalNotes}
          onChange={(e) => handleClinicalNotesChange(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows="4"
        />
      </div>

      {/* Vital Signs Measurements */}
      <div className="space-y-6">
        <h3 className="font-medium text-gray-700 mb-3">Vital Signs Measurements</h3>
        
        {Object.entries({
          systolicBP: 'Systolic Blood Pressure',
          diastolicBP: 'Diastolic Blood Pressure', 
          temperature: 'Temperature',
          heartRate: 'Heart Rate',
          respiratoryRate: 'Respiratory Rate',
          oxygenSaturation: 'Oxygen Saturation',
          bloodSugar: 'Blood Sugar'
        }).map(([key, label]) => {
          const range = getMeasurementRange(key);
          const currentValue = measurements[key] || '';
          
          return (
            <div key={key} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700">
                {label} ({range.unit})
                <span className="text-xs text-gray-500 ml-2">
                  Range: {range.min}-{range.max} {range.unit}
                </span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={currentValue || range.min}
                  onChange={(e) => handleMeasurementChange(key, e.target.value)}
                  className="flex-1 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={currentValue}
                  onChange={(e) => handleMeasurementChange(key, e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                  placeholder={range.min.toString()}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{range.min}</span>
                <span className="font-medium">
                  {currentValue || '--'} {range.unit}
                </span>
                <span>{range.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Measurements Summary */}
      <div className="mt-6 space-y-4">
        {/* Vital Signs Evaluation */}
        {vitalSignsEvaluation.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">Vital Signs Evaluation</h3>
            <div className="grid grid-cols-1  gap-3">
              {vitalSignsEvaluation.map((evaluation, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusBackgroundColor(evaluation.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{evaluation.icon}</span>
                      <span className="font-medium text-gray-700">{evaluation.name}</span>
                    </div>
                    <span className={`font-semibold ${evaluation.color}`}>
                      {evaluation.value}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${evaluation.color}`}>
                    Status: {evaluation.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnosis & Treatment Summary */}
        {(diagnosis || treatmentPlan) && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium text-orange-800 mb-3">Dental Analysis Summary</h3>
            
            {diagnosis && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-700 mb-1">Diagnosis</h4>
                <div className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{diagnosis.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      diagnosis.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      diagnosis.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      diagnosis.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {diagnosis.severity}
                    </span>
                  </div>
                  {diagnosis.code && (
                    <div className="text-sm text-gray-600 mt-1">
                      Code: {diagnosis.code}
                    </div>
                  )}
                </div>
              </div>
            )}

            {treatmentPlan && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Treatment Plan</h4>
                <div className="bg-white p-3 rounded border text-sm text-gray-600">
                  {treatmentPlan}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Measurements Summary */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Patient Info in Summary */}
          {(patientInfo.name || patientInfo.age || patientInfo.gender) && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {patientInfo.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{patientInfo.name}</span>
                  </div>
                )}
                {patientInfo.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{patientInfo.age} years</span>
                  </div>
                )}
                {patientInfo.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">
                      {patientInfo.gender === 'male' ? 'Male' : 'Female'}
                    </span>
                  </div>
                )}
                {patientInfo.patientCategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-blue-600">{patientInfo.patientCategory.toUpperCase()}</span>
                  </div>
                )}
                {patientInfo.date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{patientInfo.date}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <h3 className="font-medium text-gray-800 mb-3 mt-4 pt-3 border-t border-gray-200">
            Vital Signs Summary
          </h3>
          
          <div className="grid grid-cols-1  gap-3 text-sm">
            {Object.entries(measurements).map(([key, value]) => (
              value && (
                <div key={key} className="flex justify-between items-center bg-white p-2 rounded border">
                  <span className="text-gray-600">{getMeasurementLabel(key)}:</span>
                  <span className="font-medium text-blue-600">
                    {value} {getMeasurementRange(key).unit}
                  </span>
                </div>
              )
            ))}
          </div>

          {/* Clinical Notes Summary */}
          {clinicalNotes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Clinical Notes</h4>
              <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                {clinicalNotes}
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex flex-col justify-between items-center gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Save Patient Data</h4>
              <p className="text-sm text-blue-600">
                {isSaved ? '✅ Saved successfully' : 'Save complete patient record with X-ray image'}
              </p>
              {saveError && (
                <p className="text-sm text-red-600 mt-1">
                  {saveError}
                </p>
              )}
            </div>
            <button
              onClick={handleSavePatient}
              disabled={!patientInfo.name || !currentImage}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              💾 Save Complete Record
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            * Required: Patient Name, Age, Gender and X-ray Image
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get measurement label
const getMeasurementLabel = (key) => {
  const labels = {
    systolicBP: 'Systolic BP',
    diastolicBP: 'Diastolic BP',
    temperature: 'Temperature',
    heartRate: 'Heart Rate',
    respiratoryRate: 'Respiratory Rate',
    oxygenSaturation: 'Oxygen Saturation',
    bloodSugar: 'Blood Sugar'
  };
  return labels[key] || key;
};

export default PatientBiometricInput;
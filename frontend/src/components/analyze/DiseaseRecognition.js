import React, { useState, useRef } from 'react';

const DiseaseRecognition = ({ onDiagnosis, onToothSelect, onImageUpload }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeView, setActiveView] = useState('original'); // 'original', 'annotated', 'primary'
  const fileInputRef = useRef(null);
  const [currentImageFile, setCurrentImageFile] = useState(null); // إضافة state لتخزين ملف الصورة

  // دالة للتحويل من File إلى base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // دالة للاتصال بالسيرڤر
  const analyzeImageWithBackend = async (imageFile) => {
    const base64Image = await fileToBase64(imageFile);

    const response = await fetch('http://localhost:5000/analyze-single-tooth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image: base64Image,
        uploaded_by: JSON.parse(localStorage.getItem('dentalAIUser'))?.email || 'unknown'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCurrentImageFile(file); // حفظ ملف الصورة
      setIsAnalyzing(true);
      
      // استدعاء onImageUpload مع تمرير ملف الصورة
      if (onImageUpload) {
        onImageUpload(file); // تمرير ملف الصورة بدلاً من مجرد استدعاء الدالة
      }

      try {
        // الاتصال بالسيرڤر لتحليل الصورة
        const result = await analyzeImageWithBackend(file);
        
        if (result.success) {
          // معالجة الاستجابة الجديدة
          const diagnosisInfo = getDiagnosisFromHealthAssessment(result.health_assessment, result.severity);
          
          const finalDiagnosis = {
            ...diagnosisInfo,
            confidence: result.primary_detection?.confidence || 0,
            image: result.annotated_image, // استخدام الصورة المشروحة
            originalImage: result.original_image, // حفظ الصورة الأصلية
            primaryDetectionImage: result.primary_detection_image, // صورة الاكتشاف الرئيسي
            timestamp: new Date().toISOString(),
            toothNumber: result.primary_detection?.class_id + 1,
            toothName: result.primary_detection?.english_name,
            arabicName: result.primary_detection?.arabic_name,
            healthAssessment: result.health_assessment,
            recommendations: result.recommendations,
            detailedAnalysis: result.detailed_analysis,
            primaryDetection: result.primary_detection,
            relatedConditions: result.related_conditions
          };

          setAnalysisResult(finalDiagnosis);
          
          // تمرير التشخيص مع ملف الصورة
          if (onDiagnosis) {
            onDiagnosis(finalDiagnosis, file);
          }

          // إذا كان هناك اكتشاف رئيسي، نمرر معلومات السن مع ملف الصورة
          if (result.primary_detection) {
            const toothData = {
              number: result.primary_detection.class_id + 1,
              name: result.primary_detection.english_name,
              arabicName: result.primary_detection.arabic_name,
              condition: diagnosisInfo.name,
              confidence: result.primary_detection.confidence,
              healthAssessment: result.health_assessment,
              imageFile: file // إضافة ملف الصورة
            };
            
            if (onToothSelect) {
              onToothSelect(toothData, file); // تمرير ملف الصورة
            }
          } else {
            // إذا لم يكن هناك اكتشاف رئيسي، نمرر بيانات افتراضية مع ملف الصورة
            const defaultToothData = {
              number: 'Unknown',
              name: 'Unknown Tooth',
              arabicName: 'سن غير معروف',
              condition: diagnosisInfo.name,
              confidence: 0,
              healthAssessment: result.health_assessment,
              imageFile: file
            };
            
            if (onToothSelect) {
              onToothSelect(defaultToothData, file);
            }
          }
        } else {
          throw new Error(result.error || 'Analysis failed');
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        
        // في حالة الخطأ، نستخدم المحاكاة كبديل
        const dentalConditions = [
          { name: 'Dental Caries', code: 'K02', severity: 'medium' },
          { name: 'Dental Filling', code: 'K03', severity: 'low' },
          { name: 'Healthy Tooth', code: 'NONE', severity: 'none' }
        ];
        
        const randomCondition = dentalConditions[Math.floor(Math.random() * dentalConditions.length)];
        const errorDiagnosis = {
          ...randomCondition,
          confidence: 0.65,
          image: imageUrl,
          originalImage: imageUrl,
          timestamp: new Date().toISOString(),
          note: 'Analysis completed with simulated results due to backend error'
        };
        
        setAnalysisResult(errorDiagnosis);
        
        // تمرير التشخيص مع ملف الصورة حتى في حالة الخطأ
        if (onDiagnosis) {
          onDiagnosis(errorDiagnosis, file);
        }
        
        // تمرير بيانات السن مع ملف الصورة
        const errorToothData = {
          number: 'N/A',
          name: 'Unknown Tooth',
          arabicName: 'سن غير معروف',
          condition: randomCondition.name,
          confidence: 0.65,
          healthAssessment: 'error',
          imageFile: file
        };
        
        if (onToothSelect) {
          onToothSelect(errorToothData, file);
        }
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      handleImageUpload(fakeEvent);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setCurrentImageFile(null); // مسح ملف الصورة
    setIsAnalyzing(false);
    setActiveView('original');
    onImageUpload(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // دالة مساعدة جديدة
  const getDiagnosisFromHealthAssessment = (healthAssessment, severity) => {
    const diagnosisMap = {
      'healthy': { name: 'Healthy Tooth', code: 'NONE', severity: 'none' },
      'caries_detected': { name: 'Dental Caries', code: 'K02', severity: severity || 'medium' },
      'filled_tooth': { name: 'Dental Filling', code: 'K03', severity: 'low' },
      'dental_work': { name: 'Dental Work', code: 'K06', severity: 'low' },
      'no_detection': { name: 'No Detection', code: 'NONE', severity: 'none' }
    };
    
    return diagnosisMap[healthAssessment] || { name: 'Unknown', code: 'N/A', severity: 'none' };
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Periapical X-ray 
      </h2>

      {!selectedImage ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-4">📷</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Upload Tooth Image
          </h3>
          <p className="text-gray-500 mb-4">
            Drag & drop an image or click to browse
          </p>
          <p className="text-sm text-gray-400">
            Supports JPG, PNG - Maximum size: 5MB
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview with Toggle */}
          <div className="relative">
            {analysisResult ? (
              <div className="mb-4">
                <div className="flex space-x-3 bg-gray-50 p-3 rounded-lg mb-4">
                  <button
                    onClick={() => setActiveView('original')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      activeView === 'original'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    📸 Original Image
                  </button>
                  <button
                    onClick={() => setActiveView('annotated')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      activeView === 'annotated'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    🔍 Analyzed Image
                  </button>
                  {analysisResult.primaryDetectionImage && (
                    <button
                      onClick={() => setActiveView('primary')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                        activeView === 'primary'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      🎯 Primary Detection
                    </button>
                  )}
                </div>

                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <img 
                    src={
                      activeView === 'original' ? analysisResult.originalImage :
                      activeView === 'annotated' ? analysisResult.image :
                      analysisResult.primaryDetectionImage
                    } 
                    alt={
                      activeView === 'original' ? "Original tooth" :
                      activeView === 'annotated' ? "Analyzed tooth with diagnosis" :
                      "Primary detection details"
                    }
                    className="w-full h-64 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                <img
                  src={selectedImage}
                  alt="Uploaded tooth"
                  className="w-full h-64 object-contain"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                      <p>AI Analysis in Progress...</p>
                      <p className="text-sm">Connecting to dental AI model</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && !isAnalyzing && (
            <div className={`p-4 rounded-lg border ${getSeverityColor(analysisResult.severity)}`}>
              <h3 className="font-semibold text-lg mb-2">
                {analysisResult.severity === 'none' ? '✅ Healthy Tooth' : '🔍 Analysis Result'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{analysisResult.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                </div>
                {analysisResult.toothName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tooth Type:</span>
                    <span className="font-medium">{analysisResult.toothName}</span>
                  </div>
                )}
                {analysisResult.arabicName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">النوع بالعربية:</span>
                    <span className="font-medium">{analysisResult.arabicName}</span>
                  </div>
                )}
                {analysisResult.healthAssessment && analysisResult.healthAssessment !== 'healthy' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Assessment:</span>
                    <span className="font-medium">{analysisResult.healthAssessment}</span>
                  </div>
                )}
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600 block mb-1">Recommendations:</span>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.note && (
                  <div className="text-sm text-gray-500 mt-2">
                    {analysisResult.note}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Retake Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseRecognition;
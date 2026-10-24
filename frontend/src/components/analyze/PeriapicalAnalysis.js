import React, { useState, useRef } from 'react';
import folder from '../images/folders.png'

const PeriapicalAnalysis = ({ onAnalysisComplete, onImageUpload, onDiagnosis }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [individualDetections, setIndividualDetections] = useState([]);
  const [combinedImage, setCombinedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('individual');
  const [selectedDetection, setSelectedDetection] = useState(null);
  const fileInputRef = useRef(null);
  const [currentImageFile, setCurrentImageFile] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCurrentImageFile(file);
      setIndividualDetections([]);
      setCombinedImage(null);
      setError(null);
      setSelectedDetection(null);
      if (onImageUpload) {
        onImageUpload(file);
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

  const analyzeImage = async () => {
    if (!selectedImage || !currentImageFile) {
      setError('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔄 Starting analysis...');
      const base64Image = await fileToBase64(currentImageFile);

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

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success) {
        console.log('✅ Analysis successful');
        
        // دائمًا تعيين البيانات حتى لو كانت فارغة
        const detections = data.individual_detections || [];
        const combinedImg = data.combined_image || selectedImage;
        
        setIndividualDetections(detections);
        setCombinedImage(combinedImg);
        
        // عرض رسالة إذا لم توجد اكتشافات
        if (detections.length === 0) {
          console.log('⚠️ No teeth detected in the image');
        }
        
        if (onAnalysisComplete) {
          onAnalysisComplete({
            detections: data.detections || [],
            totalDetections: data.total_detections || 0,
            detectionStats: data.detection_stats || {},
            diagnosisStats: data.diagnosis_stats || {},
            individualDetections: detections,
            combinedImage: combinedImg,
            hasDetections: detections.length > 0,
            message: detections.length === 0 ? 'No teeth detected in the image' : 'Analysis successful'
          }, currentImageFile);
        }
      } else {
        console.error('❌ API Error:', data.error);
        setError(data.error || 'Analysis failed');
        
        if (onAnalysisComplete) {
          onAnalysisComplete({
            detections: [],
            totalDetections: 0,
            detectionStats: {},
            diagnosisStats: {},
            individualDetections: [],
            combinedImage: selectedImage,
            hasDetections: false,
            message: 'Analysis failed: ' + (data.error || 'Unknown error')
          }, currentImageFile);
        }
      }
    } catch (err) {
      console.error('💥 Connection Error:', err);
      setError('Connection error: ' + err.message);
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          detections: [],
          totalDetections: 0,
          detectionStats: {},
          diagnosisStats: {},
          individualDetections: [],
          combinedImage: selectedImage,
          hasDetections: false,
          message: 'Connection error: ' + err.message
        }, currentImageFile);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'low': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setCurrentImageFile(null);
    setIndividualDetections([]);
    setCombinedImage(null);
    setError(null);
    setSelectedDetection(null);
    if (onImageUpload) {
      onImageUpload(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDetectionClick = (detection) => {
    setSelectedDetection(detection);
  };

  function getDentalAdvice(conditionName) {
  if (!conditionName) return "No clinical recommendation available.";

  const advice = {
    "Caries":
      "Management includes the removal of carious tooth structure followed by appropriate restoration. In deep lesions approaching the pulp, indirect or direct pulp capping may be considered, otherwise endodontic therapy may be required. Reinforce oral hygiene and dietary modifications.",
    
    "Deep_Caries":
      "A deep carious lesion warrants careful removal of infected dentin while preserving pulp vitality when possible. Indirect pulp capping or partial caries removal is recommended if the pulp remains vital. If symptoms of irreversible pulpitis are present, immediate endodontic therapy is indicated.",
    
    "External Absorption":
      "External root resorption requires identification of the etiology. Orthodontically induced resorption may be monitored, while inflammatory resorption requires endodontic therapy. Advanced cases with significant structural loss may require extraction. Radiographic follow-up is essential.",
    
    "Internal Absorption":
      "Internal resorption indicates pulpal inflammation. Root canal treatment is the recommended therapy to arrest the resorptive process. If perforation has occurred, surgical repair or extraction may be necessary depending on the extent.",
    
    "Furcation Lesion":
      "A furcation involvement suggests moderate to advanced periodontal disease. Management includes scaling and root planing, periodontal surgery (such as flap surgery), and possibly regenerative therapy. Prognosis depends on the severity and patient oral hygiene adherence.",
    
    "Good Treatment":
      "Current treatment appears adequate and clinically acceptable. Continue periodic clinical and radiographic follow-up to ensure stability and long-term success. Reinforce oral hygiene instructions.",
    
    "Healthy Tooth":
      "No pathological findings associated with this tooth. Recommend routine dental checkups, preventive care, and maintenance of proper oral hygiene.",
    
    "Periapical Lesion":
      "A periapical radiolucency is typically associated with pulpal necrosis or chronic apical periodontitis. Root canal therapy or retreatment is indicated. Persistent pathology may require surgical intervention (apicoectomy). Follow-up imaging is necessary to confirm healing.",
    
    "Poor Endodontic Treatment":
      "Root canal treatment appears inadequate, with potential signs of failure (voids, missed canals, underfilling, or persistent pathology). Non-surgical endodontic retreatment is recommended. If retreatment is not feasible, surgical endodontics or extraction should be considered.",
    
    "Poor Restorative Treatment":
      "The restoration shows defects such as marginal leakage, recurrent decay, or improper contours. Replacement of the restoration is indicated. Caries control and improved oral hygiene practices are necessary to prevent recurrence.",
    
    "Recurrent Caries":
      "This indicates caries developing adjacent to an existing restoration. Removal of the restoration, elimination of recurrent decay, and placement of a new, well-adapted restoration are recommended. Evaluate risk factors and reinforce preventive measures.",
    
    "fraction":
      "The tooth exhibits a fracture. Management depends on fracture depth and involvement. Enamel-only fractures can be restored conservatively, while fractures extending subgingivally or into the root may require full-coverage restorations or extraction. A CBCT scan may be indicated for vertical root fractures."
  };

  return advice[conditionName] || "No clinical recommendation available for this condition.";
}


  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Periapical Analysis
            </h2>
            <p className="text-gray-600">Upload and analyze periapical X-ray images</p>
          </div>
        </div>
      </div>

      {!selectedImage ? (
        /* Upload Area */
        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl"><img
                        src={folder}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Upload Periapical Image
          </h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto leading-relaxed">
            Drag & drop your periapical X-ray image or click to browse files
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
            <span>Choose File</span>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Supports JPG, PNG • Maximum size: 5MB
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
        /* Analysis Interface */
        <div className="space-y-6">
          {/* Image Preview with Overlay */}
          <div className="relative bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Image Preview</h3>
              <span className="text-sm text-gray-500">Ready for analysis</span>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200">
              <img
                src={selectedImage}
                alt="Uploaded periapical"
                className="w-full h-80 object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg font-medium mb-1">AI Analysis in Progress</p>
                    <p className="text-blue-200 text-sm">Analyzing dental structures and conditions</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleRetake}
              className="py-3 px-6 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              Retake Photo
            </button>
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Analyze Image
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {(isAnalyzing || individualDetections.length > 0 || combinedImage) && (
            <div className="space-y-6">
              {/* View Toggle */}
              <div className="bg-gray-50 rounded-2xl p-2 border border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveView('individual')}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      activeView === 'individual'
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Individual Detections
                  </button>
                  <button
                    onClick={() => setActiveView('combined')}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      activeView === 'combined'
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Combined View
                  </button>
                </div>
              </div>

              {activeView === 'individual' ? (
                /* Individual Detections Grid */
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Detected Teeth & Conditions
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      individualDetections.length > 0 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {individualDetections.length} items
                    </span>
                  </div>
                  
                  {individualDetections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {individualDetections.map((detection) => (
                        <div
                          key={detection.detection_id}
                          className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                            getSeverityColor(detection.diagnosis?.severity || 'low')
                          }`}
                          onClick={() => handleDetectionClick(detection)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">
                                {detection.english_name || 'Unknown Tooth'}
                              </h4>
                              <p className="text-sm text-gray-500">ID: #{detection.detection_id}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(detection.confidence)}`}>
                              {Math.round(detection.confidence * 100)}%
                            </span>
                          </div>
                          
                          <div className="bg-gray-100 rounded-lg p-2 mb-3 border border-gray-200">
                            <img 
                              src={detection.image} 
                              alt={`Detection ${detection.detection_id}`}
                              className="w-full h-32 object-contain rounded"
                            />
                          </div>
                          
                          {detection.diagnosis && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600">Diagnosis</div>
                              <div className="font-medium text-sm capitalize">
                                {detection.diagnosis.severity || 'No issues detected'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🦷</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Teeth Detected</h4>
                      <p className="text-gray-600">The AI analysis did not detect any teeth in the image.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Combined View */
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Combined Analysis View
                  </h3>
                  {combinedImage ? (
                    <>
                      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                        <img 
                          src={combinedImage} 
                          alt="Combined detections with diagnosis" 
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </div>
                      <p className="text-gray-600 text-sm mt-3 text-center">
                        {individualDetections.length === 0 
                          ? 'Original X-ray image - No annotations available' 
                          : 'Comprehensive view of all detected conditions and annotations'}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🖼️</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Combined Image Available</h4>
                      <p className="text-gray-600">Complete image analysis to see results</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Detection Modal */}
          {selectedDetection && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">
                      Detection #{selectedDetection.detection_id} - {selectedDetection.english_name}
                    </h3>
                    <button
                      onClick={() => setSelectedDetection(null)}
                      className="text-white hover:text-blue-200 text-2xl transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200">
                    <img 
                      src={selectedDetection.image} 
                      alt={`Detection ${selectedDetection.detection_id} enlarged`}
                      className="w-full h-[30vh] object-contain rounded-lg"
                    />
                  </div>
                  
                  <div className="">
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border-2 ${getSeverityColor(selectedDetection.diagnosis?.severity || 'low')}`}>
                        <h4 className="font-semibold text-gray-800 mb-3 ">Detection Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Confidence Level:</span>
                            <span className="font-semibold ">{(selectedDetection.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-semibold">{selectedDetection.english_name}</span>
                          </div>
                          <div className="grid grid-cols-1">
                            <span className="text-gray-600">Treatment or Advice:</span>
                            <span className="font-mono font-semibold">{getDentalAdvice(selectedDetection.english_name)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Analysis Error</h3>
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriapicalAnalysis;
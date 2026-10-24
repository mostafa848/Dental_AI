import React, { useState, useRef } from 'react';
import folder from '../images/folders.png'

const PanoramicAnalysis = ({ onAnalysisComplete,onImageUpload,onDiagnosis}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [individualDetections, setIndividualDetections] = useState([]);
  const [combinedImage, setCombinedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('individual');
  const [selectedDetection, setSelectedDetection] = useState(null);
  const fileInputRef = useRef(null);
  const [currentImageFile, setCurrentImageFile] = useState(null); // إضافة state لتخزين ملف الصورة

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCurrentImageFile(file); // حفظ ملف الصورة
      setIndividualDetections([]);
      setCombinedImage(null);
      setError(null);
      setSelectedDetection(null);
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
    if (!selectedImage || !currentImageFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // تحويل الصورة إلى base64
      const base64Image = await fileToBase64(currentImageFile);

      const response = await fetch('http://localhost:5000/analyze-panoramic', {
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

      if (data.success) {
        setIndividualDetections(data.individual_detections || []);
        setCombinedImage(data.combined_image);
        
        if (onAnalysisComplete) {
          onAnalysisComplete({
            detections: data.detections,
            totalDetections: data.total_detections,
            detectionStats: data.detection_stats,
            diagnosisStats: data.diagnosis_stats,
            individualDetections: data.individual_detections,
            combinedImage: data.combined_image
          }, currentImageFile); // تمرير ملف الصورة مع النتائج
        }
      } else {
        setError(data.error || 'Analysis failed: ' + (data.traceback || 'Unknown error'));
        
        // في حالة الخطأ، نمرر بيانات محاكاة مع ملف الصورة
        if (onAnalysisComplete) {
          const mockResults = {
            detections: [],
            totalDetections: 0,
            detectionStats: {},
            diagnosisStats: {},
            individualDetections: [],
            combinedImage: selectedImage,
            note: 'Analysis completed with simulated results due to backend error'
          };
          onAnalysisComplete(mockResults, currentImageFile);
        }
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
      
      // في حالة الخطأ في الاتصال، نمرر بيانات محاكاة مع ملف الصورة
      if (onAnalysisComplete) {
        const mockResults = {
          detections: [],
          totalDetections: 0,
          detectionStats: {},
          diagnosisStats: {},
          individualDetections: [],
          combinedImage: selectedImage,
          note: 'Analysis completed with simulated results due to connection error'
        };
        onAnalysisComplete(mockResults, currentImageFile);
      }
    } finally {
      setIsAnalyzing(false);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setCurrentImageFile(null); // مسح ملف الصورة
    setIndividualDetections([]);
    setCombinedImage(null);
    setError(null);
    setSelectedDetection(null);
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // دالة لمعالجة النقر على اكتشاف معين
  const handleDetectionClick = (detection) => {
    setSelectedDetection(detection);
    
    // يمكنك إضافة منطق إضافي هنا إذا أردت تمرير معلومات السن
    // على سبيل المثال، إذا كان هناك onToothSelect prop
  };

 function getDentalAdvice(conditionName) {
  if (!conditionName) return "No clinical recommendation available.";

  const advice = {
    "Caries": 
      "Management of dental caries includes removal of the infected tooth structure followed by definitive restoration. In cases where the lesion approximates or involves the pulp, endodontic therapy is indicated. Fluoride therapy and strict oral hygiene reinforcement are recommended to prevent recurrence.",
    
    "Crown": 
      "Clinical and radiographic evaluation of the crown margins is advised. Evidence of marginal leakage, secondary caries, or persistent discomfort may necessitate crown replacement. Periodic follow-up and adequate oral hygiene are essential.",
    
    "Filling": 
      "Existing restorations should be assessed for structural integrity, marginal adaptation, and recurrent caries. Defective restorations require replacement. Preventive measures such as improved oral hygiene and routine dental checkups are advised.",
    
    "Implant": 
      "The patient should maintain meticulous peri-implant hygiene to prevent peri-implant mucositis or peri-implantitis. Regular clinical evaluation and professional cleaning are recommended. Any signs of inflammation, mobility, or discomfort warrant immediate assessment.",
    
    "Malaligned teeth":
      "Orthodontic consultation is recommended. Treatment options include fixed appliances or clear aligners depending on severity. Proper oral hygiene must be maintained to avoid decalcification during orthodontic therapy.",
    
    "Mandibular Canal":
      "This represents a normal anatomical structure. No treatment is required. However, surgical procedures in proximity (extractions, implant placement) should be performed with caution to avoid injury to the inferior alveolar nerve.",
    
    "Missing teeth":
      "Replacement options include dental implants, fixed prostheses (bridges), or removable prostheses. Treatment choice should be based on bone condition, functional requirements, and patient preference. Occlusal evaluation is recommended.",
    
    "Periapical lesion":
      "A periapical radiolucency typically indicates pulpal necrosis or chronic infection. Endodontic therapy or retreatment is advised. In non-responsive cases, surgical endodontic intervention (apicoectomy) or extraction may be required.",
    
    "Retained root":
      "Surgical removal of the retained root fragment is indicated to prevent infection, cyst formation, or chronic inflammation. Postoperative follow-up is recommended.",
    
    "Root Canal Treatment":
      "Teeth previously treated endodontically should be monitored radiographically. Persistent symptoms or unresolved periapical pathology may require endodontic retreatment or periapical surgery.",
    
    "Root piece":
      "Residual root fragments should be surgically extracted to prevent infection or cystic changes. Healing assessment during follow-up is recommended.",
    
    "impacted tooth":
      "Surgical extraction is recommended, especially if associated with pain, infection, cystic changes, or resorption of adjacent teeth. Asymptomatic impactions may be monitored periodically.",
    
    "maxillary sinus":
      "If the sinus appears normal, no intervention is required. Evidence of sinus pathology warrants referral to an otolaryngologist for further evaluation.",
    
    "Bone loss":
      "Findings suggest periodontal disease. Recommended management includes scaling and root planing, periodontal maintenance, and in advanced cases, regenerative procedures such as bone grafting.",
    
    "Fractured tooth":
      "Treatment depends on the extent of the fracture. Minor enamel fractures may be restored conservatively. Deep fractures may require full-coverage restorations or extraction if the tooth is non-restorable.",
    
    "Permanent teeth":
      "This is a normal finding. Intervention is required only if pathology, caries, or trauma is present.",
    
    "Supra eruption":
      "Management may include occlusal adjustment, orthodontic intrusion, or full-coverage prosthetic rehabilitation depending on severity and functional impact.",
    
    "TAD":
      "Temporary Anchorage Devices should be monitored for stability and peri-implant tissue health. Signs of inflammation or loosening may require repositioning or replacement.",
    
    "abutment":
      "Evaluate the abutment for stability, tissue health, and proper fit. Any signs of inflammation, mobility, or prosthetic misalignment require intervention.",
    
    "attrition":
      "Attrition indicates parafunctional habits such as bruxism. Management includes fabrication of a night guard, occlusal evaluation, and restorative treatment for compromised tooth structure.",
    
    "bone defect":
      "Depending on severity, guided bone regeneration or grafting may be indicated. Periodontal and restorative planning should be coordinated.",
    
    "gingival former":
      "This is part of implant soft-tissue shaping. Ensure proper hygiene around the healing abutment. Mild discomfort is expected; persistent inflammation requires evaluation.",
    
    "metal band":
      "Related to orthodontic treatment. Adequate hygiene is necessary to prevent caries beneath the band. Regular orthodontic follow-up is recommended.",
    
    "orthodontic brackets":
      "Maintain high oral hygiene to prevent enamel decalcification. Routine orthodontic appointments are required for monitoring and adjustment.",
    
    "permanent retainer":
      "A bonded retainer must be kept clean to prevent plaque accumulation and calculus formation. Replacement is indicated if the retainer becomes loose, broken, or associated with gingival inflammation.",
    
    "post-core":
      "The post and core should be evaluated for stability and adaptation before definitive crown placement. Imaging may be required if symptoms persist.",
    
    "plating":
      "Usually associated with fracture management. Clinical and radiographic follow-up is necessary until complete bone healing is achieved.",
    
    "wire":
      "Stabilization wires (trauma or orthodontic) must be monitored for stability and soft-tissue irritation. Adjustment or removal may be necessary depending on healing.",
    
    "Cyst":
      "Surgical enucleation followed by histopathological examination is recommended. Radiographic follow-up is essential to ensure complete healing and rule out recurrence.",
    
    "Root resorption":
      "Treatment depends on etiology and severity. Mild cases may be monitored. Moderate to severe cases may require endodontic therapy or extraction if the tooth is non-restorable.",
    
    "Primary teeth":
      "A normal finding in pediatric patients. Extraction or restoration is indicated only if the tooth is carious, infected, or causing complications with eruption of the permanent successor."
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
              Panoramic Analysis
            </h2>
            <p className="text-gray-600">Upload and analyze panoramic X-ray images</p>
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

export default PanoramicAnalysis;
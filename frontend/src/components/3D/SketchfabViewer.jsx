import React, { useState } from 'react';

const SketchfabViewer = () => {
  const [selectedModel, setSelectedModel] = useState('types');
  const [isLoaded, setIsLoaded] = useState(false);

  // Available models list
  const models = {
    types: {
      id: 'types',
      title: 'Human Tooth Types',
      embedUrl: 'https://sketchfab.com/models/69040283853044c093d1f09b9ac07619/embed',
      description: 'A model showing different types of teeth (incisors, canines, molars)',
      author: 'arloopa',
      features: ['All tooth types', 'Clear classification', 'Comparison between types'],
      icon: '🦷'
    },
    decay: {
      id: 'decay',
      title: 'Tooth Decay Progression',
      embedUrl: 'https://sketchfab.com/models/4aeb54b6f5ca4615b36cbdcdf398b27b/embed',
      description: 'Shows stages of tooth decay from early to advanced phases',
      author: 'Ebers',
      features: ['Decay stages', 'Affected layers', 'Timeline progression'],
      icon: '🦠'
    },
    anatomy: {
      id: 'anatomy',
      title: 'Tooth Anatomy & Supporting Structures',
      embedUrl: 'https://sketchfab.com/models/9a998d13548846bd93e093039e11eeb6/embed',
      description: 'A detailed model showing internal tooth structure and surrounding tissues',
      author: 'Snorkle',
      features: ['Internal structure', 'Pulp & nerve', 'Supporting tissues'],
      icon: '🔬'
    },
    fullset: {
      id: 'fullset',
      title: 'Complete Adult Dentition',
      embedUrl: 'https://sketchfab.com/models/aad7e23466284f81b459c82ff9742e15/embed',
      description: 'A full set of 32 adult permanent teeth',
      author: 'SDEO',
      features: ['32 teeth', 'Medical realism', 'Complete structure'],
      icon: '🦴'
    }
  };

  const getSketchfabUrl = (modelId) => {
    const model = models[modelId];
    const params = new URLSearchParams({
      ui_theme: 'dark',
      ui_controls: 1,
      ui_infos: 1,
      ui_stop: 0,
      ui_inspector: 0,
      ui_help: 0,
      ui_hint: 0,
      ui_settings: 0,
      ui_watermark_link: 0,
      ui_watermark: 0,
      ui_fullscreen: 1,
      autostart: 0,
      preload: 1
    });

    return `${model.embedUrl}?${params.toString()}`;
  };

  const handleModelChange = (modelId) => {
    setIsLoaded(false);
    setSelectedModel(modelId);
  };

  const handleIframeLoad = () => {
    setIsLoaded(true);
    console.log(`✅ Model ${models[selectedModel].title} loaded successfully`);
  };

  const currentModel = models[selectedModel];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              3D Dental Models
            </h2>
            <p className="text-gray-600">Interactive 3D visualization for dental education</p>
          </div>
          
        </div>
      </div>

      {/* Model Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select 3D Model:
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(models).map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedModel === model.id
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              
              <div className="font-semibold text-sm mb-1 leading-tight">{model.title}</div>
              <div className="text-xs text-gray-500">By {model.author}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Information */}
      <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              
              <div>
                <h3 className="font-semibold text-purple-800 text-lg">{currentModel.title}</h3>
                <p className="text-purple-600 text-sm">{currentModel.description}</p>
              </div>
            </div>
            
            {/* Model Features */}
            <div className="flex flex-wrap gap-2 mt-3">
              {currentModel.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white text-purple-700 border border-purple-200 shadow-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white text-purple-700 border border-purple-200 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Author: {currentModel.author}
            </span>
          </div>
        </div>
      </div>

      {/* Model Viewer */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 shadow-sm mb-6">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-700 font-medium">Loading {currentModel.title}</p>
              <p className="text-gray-500 text-sm mt-1">3D model is initializing...</p>
            </div>
          </div>
        )}
        
        <iframe 
          title={currentModel.title}
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; xr-spatial-tracking"
          src={getSketchfabUrl(selectedModel)}
          className="w-full h-96 transition-opacity duration-300"
          onLoad={handleIframeLoad}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      </div>

      {/* Instructions & Tips */}
      <div className="grid grid-cols-1  gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            
            <h4 className="font-semibold text-blue-800 text-lg">Usage Tips</h4>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-blue-700">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">1</span>
              </span>
              <span>Use <strong>Decay</strong> model for pathology cases and caries analysis</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-700">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">2</span>
              </span>
              <span>Use <strong>Anatomy</strong> model to explore internal structure and tissues</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-700">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">3</span>
              </span>
              <span>Use <strong>Types</strong> model for tooth classification and comparisons</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-700">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">4</span>
              </span>
              <span>Use <strong>Full Set</strong> for overall dentition view and positioning</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          
          <span><b>Note:</b> Models are loaded from Sketchfab - Internet connection required</span>
        </div>
      </div>
    </div>
  );
};

// Helper function for biometric labels
const getMeasurementLabel = (key) => {
  const labels = {
    crownHeight: 'Crown Height',
    rootLength: 'Root Length',
    width: 'Width',
    thickness: 'Thickness',
    pocketDepth: 'Pocket Depth',
    mobility: 'Tooth Mobility',
    plaqueIndex: 'Plaque Index'
  };
  return labels[key] || key;
};

export default SketchfabViewer;
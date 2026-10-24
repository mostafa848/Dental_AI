import React, { useState, useEffect } from 'react';
import DiseaseRecognition from './components/analyze/PeriapicalAnalysis';
import SketchfabViewer from './components/3D/SketchfabViewer';
import PatientBiometricInput from './components/Biometrics/PatientBiometricInput';
import PanoramicAnalysis from './components/analyze/PanoramicAnalysis';
import PatientsDashboard from './components/Biometrics/PatientsDashboard';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import { sendContactEmail } from './components/services/emailService';
import ApiService from './components/services/api';
import AdminDashboard from "./components/admin/AdminDashboard";
import './App.css';
import folder from './components/images/dental-report.png'
import pano from './components/images/dental.png'
import peri from './components/images/tooth_2.png'
import contact from './components/images/support.png'
import pass from './components/images/padlock.png'
import logout from './components/images/logout.png'
import admin from './components/images/user-gear.png'


function App() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');

  const [currentTooth, setCurrentTooth] = useState(null);
  const [biometricData, setBiometricData] = useState({
    patientInfo: {},
    biometrics: {
      systolicBP: '',
      diastolicBP: '',
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      bloodSugar: ''
    },
    clinicalStudy: ''
  });
  const [diagnosis, setDiagnosis] = useState(null);
  const [panoramicResults, setPanoramicResults] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [isChanging, setIsChanging] = useState(false);
  const [changeStatus, setChangeStatus] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState(null);

  const handleAdminmood = () => {
    setShowAdminDashboard(true);
  };

  const closeModal = () => {
    setShowAdminDashboard(false);
  };

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('dentalAIUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const result = await ApiService.login(email, password);
      
      if (result.token) {
        ApiService.setToken(result.token);
        setCurrentUser(result.user);
        setIsLoggedIn(true);
        localStorage.setItem('dentalAIUser', JSON.stringify(result.user));
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'فشل تسجيل الدخول');
    }
    return false;
  };

  const handleSignup = async (email, password, name) => {
    try {
      const result = await ApiService.register(name, email, password);
      
      if (result.token) {
        ApiService.setToken(result.token);
        setCurrentUser(result.user);
        setIsLoggedIn(true);
        localStorage.setItem('dentalAIUser', JSON.stringify(result.user));
        return true;
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message || 'فشل إنشاء الحساب');
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setHasUploadedImage(false);
    localStorage.removeItem('dentalAIUser');
  };

  const handlePanoramicAnalysis = (results, imageFile) => {
    console.log('Panoramic analysis complete:', results, 'Image:', imageFile);
    setPanoramicResults(results);
    setCurrentImage(imageFile);
    setHasUploadedImage(true);
    
    if (results.detections && results.detections.length > 0) {
      const cariesDetections = results.detections.filter(d => d.class_name === 'caries');
      if (cariesDetections.length > 0) {
        const newDiagnosis = {
          name: 'Dental Caries',
          code: 'K02',
          severity: 'medium'
        };
        setDiagnosis(newDiagnosis);
        generateTreatmentPlan(newDiagnosis, biometricData.biometrics);
      }
    }
  };

  const handleImageUpload = (imageFile) => {
    console.log('Image upload detected - showing biometrics panel');
    setCurrentImage(imageFile);
    setHasUploadedImage(true);
  };

  const handleToothSelect = (tooth) => {
    console.log('Tooth selected:', tooth);
    setCurrentTooth(tooth);
    setHasUploadedImage(true);
  };

  const handleBiometricData = (data) => {
    console.log('Data received:', data);
    setBiometricData({
      patientInfo: data.patientInfo || {},
      biometrics: {
        systolicBP: data.biometrics?.systolicBP || '',
        diastolicBP: data.biometrics?.diastolicBP || '',
        temperature: data.biometrics?.temperature || '',
        heartRate: data.biometrics?.heartRate || '',
        respiratoryRate: data.biometrics?.respiratoryRate || '',
        oxygenSaturation: data.biometrics?.oxygenSaturation || '',
        bloodSugar: data.biometrics?.bloodSugar || ''
      },
      clinicalStudy: data.clinicalStudy || ''
    });
  };

  const handleToothSelectFromPatients = (toothData) => {
    setCurrentTooth(toothData);
    setActiveTab('single');
    setHasUploadedImage(true);
  };

  const generateTreatmentPlan = (diagnosis, biometrics = {}) => {
    let plan = '';
    
    switch(diagnosis.name) {
      case 'Dental Caries':
        plan = `Treatment Plan for Dental Caries (${diagnosis.severity} severity):
1. Dental examination and X-ray review
2. Caries removal and tooth restoration
3. ${diagnosis.severity === 'medium' ? 'Composite filling' : 'Dental crown may be required'}
4. Oral hygiene instructions
5. Follow-up in 6 months`;
        break;
        
      case 'Periodontitis':
        plan = `Treatment Plan for Periodontitis:
1. Scaling and root planing
2. Antibiotic therapy if indicated
3. Periodontal maintenance
4. Surgical intervention if severe
5. Regular follow-up every 3-6 months`;
        break;
        
      case 'Gingivitis':
        plan = `Treatment Plan for Gingivitis:
1. Professional dental cleaning
2. Improved oral hygiene regimen
3. Antimicrobial mouthwash
4. Regular dental check-ups`;
        break;
        
      default:
        plan = `Treatment Plan for ${diagnosis.name}:
1. Comprehensive dental evaluation
2. Customized treatment based on severity
3. Preventive care recommendations
4. Regular monitoring and follow-up`;
    }

    const vitalNotes = [];
    
    if (biometrics.temperature && parseFloat(biometrics.temperature) > 37.5) {
      vitalNotes.push(`- Patient has fever (${biometrics.temperature}°C), consider postponing non-emergency procedures`);
    }
    
    if (biometrics.bloodSugar && parseInt(biometrics.bloodSugar) > 140) {
      vitalNotes.push(`- Elevated blood sugar (${biometrics.bloodSugar} mg/dL), monitor during procedure`);
    }
    
    if (biometrics.systolicBP && parseInt(biometrics.systolicBP) > 140) {
      vitalNotes.push(`- Elevated blood pressure (${biometrics.systolicBP}/${biometrics.diastolicBP} mmHg), assess cardiovascular risk`);
    }
    
    if (vitalNotes.length > 0) {
      plan += `\n\nVital Signs Considerations:\n${vitalNotes.join('\n')}`;
    }
    
    return plan;
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleContact = () => {
    setShowContactForm(true);
  };

  const handleContactClose = () => {
    setShowContactForm(false);
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setSendStatus('');
  };

  const handleContactChange = (field, value) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus('sending');

    try {
      const response = await sendContactEmail(contactForm);
      
      if (response.success) {
        setSendStatus('success');
        setTimeout(() => {
          handleContactClose();
        }, 2000);
      } else {
        setSendStatus('error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPass !== passwordForm.confirm) {
      alert('Password confirmation does not match');
      return;
    }

    try {
      setIsChanging(true);
      setChangeStatus('');

      const result = await ApiService.changePassword(
        passwordForm.current,
        passwordForm.newPass
      );

      if (result.message === 'Password updated successfully') {
        setChangeStatus('success');
        setTimeout(() => setShowChangePassword(false), 1500);
      } else {
        setChangeStatus('error');
        console.error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setChangeStatus('error');
    } finally {
      setIsChanging(false);
    }
  };

  const savePatientData = async (patientInfo, measurements, clinicalNotes) => {
    try {
      const patient = await ApiService.createPatient({
        name: patientInfo.name,
        age: parseInt(patientInfo.age),
        gender: patientInfo.gender,
        contactInfo: {
          phone: patientInfo.phone || '',
          email: patientInfo.email || ''
        }
      });

      await ApiService.saveBiometrics({
        patientId: patient._id,
        measurements,
        clinicalNotes
      });

      return patient._id;
    } catch (error) {
      console.error('Error saving patient data:', error);
      throw error;
    }
  };

  const saveDentalAnalysis = async (analysisData) => {
    try {
      await ApiService.saveAnalysis(analysisData);
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('hasUploadedImage changed:', hasUploadedImage);
  }, [hasUploadedImage]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto">
          {showLogin ? (
            <LoginForm 
              onLogin={handleLogin}
              onSwitchToSignup={() => setShowLogin(false)}
            />
          ) : (
            <SignupForm 
              onSignup={handleSignup}
              onSwitchToLogin={() => setShowLogin(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* === Sidebar === */}
      <aside className="w-64 bg-white shadow-xl border-r border-blue-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">
              Dental.AI
            </h1>
            <span className="text-xs text-blue-100 bg-white/20 px-2 py-1 rounded-full">
              {currentUser?.name}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          <button
            onClick={() => {
              setActiveTab('single');
              setHasUploadedImage(false);
            }}
            className={`w-full text-left py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center ${
              activeTab === 'single'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="mr-3"><img
                        src={peri}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
            Periapical X-ray
          </button>
          <button
            onClick={() => {
              setActiveTab('panoramic');
              setHasUploadedImage(false);
            }}
            className={`w-full text-left py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center ${
              activeTab === 'panoramic'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="mr-3"><img
                        src={pano}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
            Panoramic X-ray
          </button>
          <button
            onClick={() => {
              setActiveTab('patients');
              setHasUploadedImage(false);
            }}
            className={`w-full text-left py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center ${
              activeTab === 'patients'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="mr-3">
              <img
                        src={folder}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
            Patients Dashboard
          </button>
        </nav>

        {/* Account Section */}
        <div className="p-4 border-t border-gray-200 space-y-2 bg-gray-50/50">
          {currentUser?.email === "admin@gmail.com" && (
            <button
              onClick={handleAdminmood}
              className="w-full text-left py-2 px-4 text-gray-700 hover:bg-white rounded-lg transition-colors duration-200 flex items-center"
            >
              <span className="mr-3"><img
                        src={admin}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
              Admin Panel
            </button>
          )}
          <button
            onClick={handleContact}
            className="w-full text-left py-2 px-4 text-gray-700 hover:bg-white rounded-lg transition-colors duration-200 flex items-center"
          >
            <span className="mr-3"><img
                        src={contact}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
            Contact Support
          </button>
          <button
            onClick={handleChangePassword}
            className="w-full text-left py-2 px-4 text-gray-700 hover:bg-white rounded-lg transition-colors duration-200 flex items-center"
          >
            <span className="mr-3"><img
                        src={pass}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center"
          >
            <span className="mr-3"><img
                        src={logout}
                        alt={"icon"}
                        className="w-full h-full object-contain"
                      /></span>
            Logout
          </button>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="text-center text-gray-400 text-xs">
              © 2025 Smart Dental AI
            </p>
          </div>
        </div>
      </aside>

      {/* === Main Content === */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 ">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between ">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 ">
                  {activeTab === 'single'
                    ? 'Periapical Analysis'
                    : activeTab === 'panoramic'
                    ? 'Panoramic Analysis'
                    : 'Patients Dashboard'}
                </h2>
                {activeTab !== 'patients' && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${hasUploadedImage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    Biometrics Panel: {hasUploadedImage ? 'Active - Upload detected' : 'Waiting for image upload'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="p-8 ">
            {activeTab === 'patients' ? (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-7xl mx-auto ">
              {/* Main Content - Left Column */}
              <div className="lg:col-span-2 space-y-8">
                
                  <div className="">
                    <PatientsDashboard onToothSelect={handleToothSelectFromPatients} />
                  </div>
                  </div>
                  </div>
                ) : activeTab === 'single' ? (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto ">
              {/* Main Content - Left Column */}
              <div className="lg:col-span-2 space-y-8">
                    <div className="">
                      <DiseaseRecognition
                        onDiagnosis={(diagnosis, imageFile) => {
                          setDiagnosis(diagnosis);
                          if (imageFile) {
                            setCurrentImage(imageFile);
                            setHasUploadedImage(true);
                          }
                          if (diagnosis) {
                            generateTreatmentPlan(diagnosis, biometricData.biometrics);
                          }
                        }}
                        onToothSelect={(tooth, imageFile) => handleToothSelect(tooth, imageFile)}
                        onImageUpload={(imageFile) => handleImageUpload(imageFile)}
                      />
                    </div>
                    <div className="">
                      <SketchfabViewer
                        tooth={currentTooth}
                        biometricData={biometricData.biometrics}
                        diagnosis={diagnosis}
                      />
                    </div>
                    
                    </div>
                    {/* Biometrics Panel - Right Column */}
              <div className="space-y-8">
                {activeTab !== 'patients' && hasUploadedImage && (
                  <>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                      <div className="flex items-center">
                        <div>
                          <h3 className="font-semibold text-lg">Biometrics Panel Active</h3>
                          <p className="text-green-100 text-sm opacity-90">Ready for patient data input</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="">
                      <PatientBiometricInput 
                        onDataChange={handleBiometricData}
                        clinicalStudy={biometricData.clinicalStudy}
                        diagnosis={diagnosis}
                        currentImage={currentImage}
                        treatmentPlan={treatmentPlan}
                      />
                    </div>
                  </>
                )}

                {activeTab !== 'patients' && !hasUploadedImage && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📷</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Biometrics Panel</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Upload an X-ray image in the analysis section to unlock patient biometric measurements and clinical data input.
                    </p>
                  </div>
                )}
              </div>
                    </div>
                  </>
                ) : (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto ">
              {/* Main Content - Left Column */}
              <div className="lg:col-span-2 space-y-8">
                    <div className="">
                      <PanoramicAnalysis 
                        onAnalysisComplete={(results, imageFile) => { 
                          handlePanoramicAnalysis(results, imageFile);
                          if (imageFile) {
                            setCurrentImage(imageFile);
                            setHasUploadedImage(true);
                          }
                          if (diagnosis) {
                            generateTreatmentPlan(diagnosis);
                          setDiagnosis(diagnosis);

                          }
                        }}
                        onToothSelect={(tooth, imageFile) => handleToothSelect(tooth, imageFile)}
                        onImageUpload={(imageFile) => handleImageUpload(imageFile)}
                      />
                    </div>
                    <div className="">
                      <SketchfabViewer
                        tooth={currentTooth}
                        biometricData={biometricData.biometrics}
                        diagnosis={diagnosis}
                      />
                    </div>
                    </div>
                    {/* Biometrics Panel - Right Column */}
              <div className="space-y-8">
                {activeTab !== 'patients' && hasUploadedImage && (
                  <>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                      <div className="flex items-center">
                        <div>
                          <h3 className="font-semibold text-lg">Biometrics Panel Active</h3>
                          <p className="text-green-100 text-sm opacity-90">Ready for patient data input</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="">
                      <PatientBiometricInput 
                        onDataChange={handleBiometricData}
                        clinicalStudy={biometricData.clinicalStudy}
                        diagnosis={diagnosis}
                        currentImage={currentImage}
                        treatmentPlan={treatmentPlan}
                      />
                    </div>
                  </>
                )}

                {activeTab !== 'patients' && !hasUploadedImage && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📷</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Biometrics Panel</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Upload an X-ray image in the analysis section to unlock patient biometric measurements and clinical data input.
                    </p>
                  </div>
                )}
              </div>
                    </div>
                  </>
                )}
              </div>

              
            </div>
          
      </main>

      {/* === Modals === */}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Contact Support</h3>
                <button
                  onClick={handleContactClose}
                  className="text-white hover:text-blue-100 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              {sendStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                  <span className="text-green-500 text-xl mr-3">✓</span>
                  <span className="text-green-700">Message sent successfully!</span>
                </div>
              )}

              {sendStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                  <span className="text-red-500 text-xl mr-3">⚠</span>
                  <span className="text-red-700">Failed to send message. Please try again.</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => handleContactChange('subject', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Problem or Suggestion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  value={contactForm.message}
                  onChange={(e) => handleContactChange('message', e.target.value)}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your message..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleContactClose}
                  className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200 font-medium"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl ">
            <div className="mb-6 ">
              <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
            </div>

            {changeStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-4 flex items-center">
                <span className="mr-2">✅</span>
                Password changed successfully
              </div>
            )}
            {changeStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4 flex items-center">
                <span className="mr-2">⚠</span>
                Failed to change password
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChanging}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  {isChanging ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Changing...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full h-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden relative">
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-colors duration-200"
            >
              ✕
            </button>
            <div className="p-6 h-full overflow-auto">
              <AdminDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
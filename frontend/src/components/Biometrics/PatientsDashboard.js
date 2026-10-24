import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const PatientsDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('dentalAIToken');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/patients`, {
        
        headers: { Authorization: `Bearer ${token}`, },
      });
      console.log("Patients:", response.data);
      if (Array.isArray(response.data)) {
        setPatients(response.data);
      } else if (Array.isArray(response.data.patients)) {
        setPatients(response.data.patients);
      } else {
        console.warn("⚠ Returned data is not an array:", response.data);
        setPatients([]);
      }
    } catch (error) {
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const name = p.patientInfo?.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !filterGender || p.patientInfo?.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  const getBiometricLabel = (key) => {
    const labels = {
      height: 'Height',
      weight: 'Weight',
      bloodPressure: 'Blood Pressure',
      heartRate: 'Heart Rate',
      temperature: 'Temperature',
      bloodSugar: 'Blood Sugar',
      oxygenSaturation: 'Oxygen Saturation'
    };
    return labels[key] || key;
  };

  const getBiometricUnit = (key) => {
    const units = {
      height: 'cm',
      weight: 'kg',
      bloodPressure: 'mmHg',
      heartRate: 'bpm',
      temperature: '°C',
      bloodSugar: 'mg/dL',
      oxygenSaturation: '%'
    };
    return units[key] || '';
  };

  const getPatientStats = (patients) => {
    return {
      total: patients.length,
      males: patients.filter(p => p.patientInfo?.gender === 'male').length,
      females: patients.filter(p => p.patientInfo?.gender === 'female').length,
    };
  };

  const stats = getPatientStats(patients);

  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 p-6 bg-white rounded-lg shadow-md p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Patients Dashboard</h1>              
            </div>
          </div>

          {/* Stats and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-gray-600">Total Patients</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.males}</div>
                  <div className="text-gray-600">Male Patients</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👨</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.females}</div>
                  <div className="text-gray-600">Female Patients</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👩</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="relative">
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">▼</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-lg font-semibold text-white">
                  Patients List <span className="text-blue-200">({filteredPatients.length})</span>
                </h2>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-600">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-sm">Loading patients...</p>
                  </div>
                ) : (
                  <>
                    {filteredPatients.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">📋</span>
                        </div>
                        <p className="text-gray-600">No patient data available</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
                      </div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient._id}
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                            selectedPatient?._id === patient._id
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <div className="flex items-center gap-4">
                            {patient.images && patient.images[0] && (
                              <img
                                src={`data:image/jpeg;base64,${patient.images[0].base64}`}
                                alt="X-ray"
                                className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {patient.patientInfo?.name || 'Unnamed Patient'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600">
                                  {patient.patientInfo?.age || 'N/A'} years
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-600 capitalize">
                                  {patient.patientInfo?.gender || 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(patient.createdAt).toLocaleDateString("en-US")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">
                      Patient : {selectedPatient.patientInfo?.name}
                    </h2>
                    <span className="text-blue-200 text-sm">
                      {new Date(selectedPatient.createdAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* X-ray Image */}
                  {selectedPatient.images && selectedPatient.images[0] && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🦷</span>
                        X-ray Image
                      </h3>
                      <img
                        src={`data:image/jpeg;base64,${selectedPatient.images[0].base64}`}
                        alt="Dental X-ray"
                        className="w-full max-w-2xl h-64 object-contain rounded-lg bg-white shadow-sm mx-auto"
                      />
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Full Name</div>
                        <div className="font-semibold text-gray-800">{selectedPatient.patientInfo?.name}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Age</div>
                        <div className="font-semibold text-gray-800">{selectedPatient.patientInfo?.age} years</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Gender</div>
                        <div className="font-semibold text-gray-800 capitalize">
                          {selectedPatient.patientInfo?.gender === 'male' ? 'Male' : 
                           selectedPatient.patientInfo?.gender === 'female' ? 'Female' : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Registration Date</div>
                        <div className="font-semibold text-gray-800">{selectedPatient.patientInfo?.date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Biometrics */}
                  {selectedPatient.biometrics &&
                    Object.keys(selectedPatient.biometrics).some(key => selectedPatient.biometrics[key]) && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">📊</span>
                          Biometric Measurements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedPatient.biometrics).map(([key, value]) => (
                            value && (
                              <div
                                key={key}
                                className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-700">
                                    {getBiometricLabel(key)}
                                  </span>
                                  <span className="font-bold text-blue-600 text-lg">
                                    {value} <span className="text-sm text-gray-500">{getBiometricUnit(key)}</span>
                                  </span>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Clinical Study */}
                  {selectedPatient.clinicalStudy && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🩺</span>
                  Clinical Study
                      </h3>
                      <div className="bg-white p-4 rounded-lg border border-yellow-200">
                        <div className="font-semibold text-gray-800 text-lg mb-2">
                          {selectedPatient.clinicalStudy}
                        </div>
                        
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Select a Patient
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Choose a patient from the list to view detailed information, 
                  biometric data, and diagnosis records.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsDashboard;
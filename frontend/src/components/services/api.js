const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('dentalAIToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('dentalAIToken', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token منتهي أو غير صالح
        localStorage.removeItem('dentalAIUser');
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطأ في الشبكة');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // تسجيل الدخول
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // التسجيل
  async register(name, email, password) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  //تغيير كلمة المرور
async changePassword(currentPassword, newPassword) {
  return this.request('/change-password', {
    method: 'PUT',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}




  // المرضى
  async getPatients() {
    return this.request('/patients');
  }

  async createPatient(patientData) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  // القياسات الحيوية
  static async saveBiometrics(data) {
    const response = await fetch('/api/biometrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({
        patientId: data.patientId,
        measurements: {
          systolicBP: data.measurements.systolicBP,
          diastolicBP: data.measurements.diastolicBP,
          temperature: data.measurements.temperature,
          heartRate: data.measurements.heartRate,
          respiratoryRate: data.measurements.respiratoryRate,
          oxygenSaturation: data.measurements.oxygenSaturation,
          bloodSugar: data.measurements.bloodSugar
        },
        clinicalNotes: data.clinicalNotes
      })
    });
    
    return await response.json();
  }


  async getPatientBiometrics(patientId) {
    return this.request(`/biometrics/patient/${patientId}`);
  }

  // تحليلات الأسنان
  async saveAnalysis(analysisData) {
    return this.request('/analysis', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  async getPatientAnalyses(patientId) {
    return this.request(`/analysis/patient/${patientId}`);
  }

  // رفع الصور
  async uploadImage(file, patientId) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  // الملف الشخصي
  async getProfile() {
    return this.request('/profile');
  }
}

export default new ApiService();
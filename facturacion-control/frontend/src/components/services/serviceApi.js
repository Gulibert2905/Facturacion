// src/services/api.js

const API_URL = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
});

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Manejar sesión expirada
    window.location.href = '/login';
    return null;
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la petición');
  }
  
  return response.json();
};

const api = {
  dashboard: {
    getStats: async () => {
      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    },

    getRecentServices: async () => {
      const response = await fetch(`${API_URL}/dashboard/recent-services`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    }
  },

  services: {
    getPatientServices: async (patientId) => {
      const response = await fetch(`${API_URL}/patients/patient/${patientId}/services`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    },

    searchPatient: async (documentNumber) => {
      const response = await fetch(`${API_URL}/patients/${documentNumber}`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    }
  },

  companies: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/companies`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    },

    getContracts: async (companyId) => {
      const response = await fetch(`${API_URL}/companies/${companyId}/contracts`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    }
  },

  preBills: {
    create: async (preBillData) => {
      const response = await fetch(`${API_URL}/prebills`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(preBillData)
      });
      return handleResponse(response);
    },

    export: async (data) => {
      const response = await fetch(`${API_URL}/prebills/export`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response;
    }
  }
};

export default api;
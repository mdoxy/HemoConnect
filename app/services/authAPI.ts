import { apiUrl } from './api';

export const authAPI = {
  // Signup
  signup: async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'donor' | 'requestor' | 'hospital';
    bloodType?: string;
    phone?: string;
    location?: string;
    hospitalName?: string;
    contactNumber?: string;
  }) => {
    try {
      const response = await fetch(apiUrl('/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const data = await response.json();
          errorMessage = data.message || data.errors?.[0]?.msg || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to server. Please check your connection.');
    }
  },

  // Login
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const data = await response.json();
          errorMessage = data.message || data.errors?.[0]?.msg || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to server. Please check your connection.');
    }
  },

  // Get User Profile
  getProfile: async (userId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(apiUrl(`/auth/profile/${userId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }
    return data;
  },

  // Update User Profile
  updateProfile: async (userId: string, userData: {
    name?: string;
    phone?: string;
    location?: string;
    bloodType?: string;
  }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(apiUrl(`/auth/profile/${userId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // Get Hospital Profile
  getHospitalProfile: async (hospitalId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(apiUrl(`/auth/hospital/${hospitalId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hospital profile');
    }
    return data;
  },

  // Update Hospital Profile
  updateHospitalProfile: async (hospitalId: string, hospitalData: {
    hospitalName?: string;
    contactNumber?: string;
    location?: string;
  }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(apiUrl(`/auth/hospital/${hospitalId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(hospitalData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update hospital profile');
    }
    return data;
  },

  // Delete Hospital Profile
  deleteHospitalProfile: async (hospitalId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(apiUrl(`/auth/hospital/${hospitalId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete hospital profile');
    }
    return data;
  },
};

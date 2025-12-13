import { auth } from '../firebase';

const API_BASE = '/api/admin';

// Get auth token for API requests
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return await user.getIdToken();
}

// Users API
export const usersAPI = {
  async fetchUsers() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return await response.json();
  },

  async updateUserRole(userId, profilePath, role, action = 'grant') {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/users`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, profilePath, role, action })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user role');
    }

    return await response.json();
  }
};

// Schools API
export const schoolsAPI = {
  async fetchSchools() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/schools`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch schools');
    }

    return await response.json();
  },

  async createSchool(schoolData) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/schools`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schoolData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create school');
    }

    return await response.json();
  },

  async updateSchool(schoolId, schoolData) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/schools`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ schoolId, ...schoolData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update school');
    }

    return await response.json();
  },

  async deleteSchool(schoolId) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/schools?schoolId=${schoolId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete school');
    }

    return await response.json();
  }
};

// Register API (for admin account creation)
export const registerAPI = {
  async register(email, password, role = 'GAdmin') {
    // Note: Registration may not require auth token if it's public
    const token = auth.currentUser ? await getAuthToken() : null;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, role })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to register');
    }

    return await response.json();
  }
};


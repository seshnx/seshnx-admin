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

// Stats API
export const statsAPI = {
  async fetchStats() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return await response.json();
  }
};

// Invites API
export const invitesAPI = {
  async fetchInvites() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/invites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch invites');
    }

    return await response.json();
  },

  async generateInvite(role = 'GAdmin') {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate invite');
    }

    return await response.json();
  }
};

// Reports/Support API
export const reportsAPI = {
  async fetchReports() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reports');
    }

    return await response.json();
  },

  async updateReportStatus(reportId, status) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reportId, status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update report');
    }

    return await response.json();
  }
};

// User Actions API (ban, delete, etc.)
export const userActionsAPI = {
  async banUser(userId, profilePath) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/user-actions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, profilePath, action: 'ban' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to ban user');
    }

    return await response.json();
  },

  async unbanUser(userId, profilePath) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/user-actions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, profilePath, action: 'unban' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unban user');
    }

    return await response.json();
  },

  async deleteUser(userId, profilePath) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/user-actions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, profilePath, action: 'delete' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    return await response.json();
  }
};

// Settings API
export const settingsAPI = {
  async fetchSettings() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch settings');
    }

    return await response.json();
  },

  async updateSettings(settings) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ settings })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update settings');
    }

    return await response.json();
  }
};

// Audit Logs API
export const auditLogsAPI = {
  async fetchLogs(type = 'all', limit = 100) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/audit-logs?type=${type}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch audit logs');
    }

    return await response.json();
  }
};

// User school linking (add to usersAPI)
usersAPI.linkUserToSchool = async (userId, profilePath, schoolId) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/users`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, profilePath, schoolId, action: 'link-school' })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to link user to school');
  }

  return await response.json();
};


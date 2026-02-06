import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const projectService = {
  async fetchProjects(token) {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize response shape
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.projects && Array.isArray(data.projects)) return data.projects;
    if (data.results && Array.isArray(data.results)) return data.results;

    const arrays = Object.values(data).filter(item => Array.isArray(item));
    return arrays.length > 0 ? arrays[0] : [];
  },

  async deleteProject(projectId, token) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.statusText}`);
    }

    return response.json();
  },

  async updateProject(projectId, data, token) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Failed to update project: ${errorJson.message || response.statusText}`);
      } catch (e) {
        if (e.message.startsWith('Failed to update')) throw e;
        throw new Error(`Failed to update project: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  },

  async createProject(data, token) {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'Failed to add project');
      } catch (e) {
        if (e.message.includes('Failed')) throw e;
        throw new Error(`Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  async fetchDropdownOptions(token) {
    const response = await fetch(`${API_BASE_URL}/api/dropdown-options`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  },

  async fetchExpertAnalysis(projectId, token) {
    const response = await fetch(`${API_BASE_URL}/api/expert-analysis?projectId=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expert analysis: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.data) return data.data;
    return data;
  },

  async saveExpertAnalysis(analysisData, token) {
    const response = await fetch(`${API_BASE_URL}/api/expert-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(analysisData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save expert analysis: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data && data.success && data.data) return data.data;
    return data;
  },

  async fetchTransmissionInterconnection(projectNameOrId, useProjectId, token) {
    const queryParam = useProjectId
      ? `projectId=${encodeURIComponent(projectNameOrId)}`
      : `project=${encodeURIComponent(projectNameOrId)}`;

    const response = await fetch(`${API_BASE_URL}/api/transmission-interconnection?${queryParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return [];

    const result = await response.json();

    let transmissionArray = [];
    if (result.success && Array.isArray(result.data)) {
      transmissionArray = result.data;
    } else if (Array.isArray(result)) {
      transmissionArray = result;
    } else if (result.data && Array.isArray(result.data)) {
      transmissionArray = result.data;
    }

    return transmissionArray.map(item => ({
      site: item.site || '',
      poiVoltage: item.poiVoltage || item.poi_voltage || '',
      excessInjectionCapacity: item.excessInjectionCapacity || item.excess_injection_capacity || 0,
      excessWithdrawalCapacity: item.excessWithdrawalCapacity || item.excess_withdrawal_capacity || 0,
      constraints: item.constraints || '-',
      excessIXCapacity: item.excessIXCapacity || item.excess_ix_capacity || true,
      project_id: item.projectId || item.project_id || null
    }));
  },

  async saveTransmissionInterconnection(projectId, transmissionData, token) {
    const response = await fetch(`${API_BASE_URL}/api/transmission-interconnection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ projectId, transmissionData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save transmission data: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async checkAndAddRedevLead(leadName, token) {
    if (!leadName || leadName.trim() === '') return;

    const checkResponse = await fetch(`${API_BASE_URL}/api/redev-leads/check?name=${encodeURIComponent(leadName)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      if (!checkData.exists) {
        await fetch(`${API_BASE_URL}/api/redev-leads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lead_name: leadName.trim() })
        });
      }
    }
  },

  async checkAndAddRedevSupport(name, token) {
    if (!name || name.trim() === '') return;

    const checkResponse = await fetch(`${API_BASE_URL}/api/redev-supports/check?name=${encodeURIComponent(name)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      if (!checkData.exists) {
        await fetch(`${API_BASE_URL}/api/redev-supports`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ support_name: name.trim() })
        });
      }
    }
  }
};

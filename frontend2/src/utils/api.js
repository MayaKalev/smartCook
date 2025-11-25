// API configuration
const API_BASE_URL = 'http://localhost:5000';

// Default fetch options with credentials
const defaultOptions = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Helper function for making API calls
export const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
};

// API endpoints
export const api = {
    // Inventory
    getInventory: (userId) => apiCall(`/api/inventory/user/${userId}`),
    addInventoryItem: (userId, item) => apiCall(`/api/inventory/user/${userId}`, {
        method: 'POST',
        body: JSON.stringify(item)
    }),
    updateInventoryItem: (userId, itemId, updates) => apiCall(`/api/inventory/item/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    }),
    deleteInventoryItem: (userId, itemId) => apiCall(`/api/inventory/item/${itemId}`, {
        method: 'DELETE'
    }),

    // Profile
    getProfile: (userId) => apiCall(`/api/users/${userId}`),
    updateProfile: (userId, data) => apiCall(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    // Assistant
    sendMessage: (data) => apiCall('/api/assistant', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}; 
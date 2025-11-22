// js/api.js
const API_BASE_URL = 'http://localhost:4000'; 

/**
 * Executes a GET request to a protected endpoint.
 * Retrieves token from localStorage and adds it to the Authorization header.
 * @param {string} endpoint - The API path (e.g., '/auth/me').
 * @returns {object | null} - The parsed JSON data or null on failure/redirect.
 */
export const fetchAuthenticated = async (endpoint) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // If no token, the user isn't logged in. Redirect them.
        location.href = 'login.html'; 
        return null;
    }

    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Attach the JWT to the request
                'Authorization': `Bearer ${token}` 
            }
        });

        if (res.ok) {
            return await res.json();
        } 
        
        // If status is 401 (Unauthorized) or similar, token might be expired
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('authToken'); // Clear invalid token
            location.href = 'login.html'; // Force re-login
            return null;
        }

        // Handle other non-success status codes (e.g., 404, 500)
        const error = await res.json();
        console.error(`API Error on ${endpoint}:`, error.message);
        return null;

    } catch (error) {
        console.error("Network or Fetch Error:", error);
        alert("A network error occurred.");
        return null;
    }
};
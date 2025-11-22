// auth.js - UPDATED VERSION
const API_BASE_URL = 'http://localhost:4000'; 

// Enhanced function to handle authentication
const handleAuth = async (url, body, successRedirect, failureMessage) => {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const data = await res.json(); 

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user || {}));
            }
            
            // Redirect to dashboard only after successful authentication
            window.location.href = successRedirect;

        } else {
            const error = await res.json();
            alert(`${failureMessage}: ${error.message || res.statusText}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("A network error occurred. Please ensure your backend server is running on the correct port.");
    }
};

// Check authentication status on page load
const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    const currentPage = window.location.pathname;
    
    // If user is logged in and tries to access login/signup pages, redirect to dashboard
    if (token && (currentPage.includes('login.html') || currentPage.includes('signup.html'))) {
        window.location.href = 'dashboard.html';
        return true;
    }
    
    // If user is not logged in and tries to access protected pages, redirect to login
    if (!token && currentPage.includes('dashboard.html')) {
        window.location.href = 'login.html';
        return false;
    }
    
    return !!token;
};

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', checkAuth);

// --- LOGIN LOGIC ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        await handleAuth(
            `${API_BASE_URL}/auth/login`,
            { email, password },
            "dashboard.html",
            "Login failed"
        );
    });
}

// --- SIGNUP LOGIC ---
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        await handleAuth(
            `${API_BASE_URL}/auth/signup`,
            { name, email, password },
            "login.html",
            "Signup failed"
        );
    });
}

// Export for use in other files if needed
window.auth = { checkAuth };
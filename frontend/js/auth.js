// IMPORTANT: Update this base URL to match the port your backend is running on (e.g., 3000, 4000, 5000)
const API_BASE_URL = 'http://localhost:4000'; 

// Function to handle the API fetch, response parsing, and token storage
const handleAuth = async (url, body, successRedirect, failureMessage) => {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        // 1. Check if the response was successful (HTTP 200-299)
        if (res.ok) {
            const data = await res.json(); 

            // 2. CRITICAL STEP: Store the authentication token if the server provided one
            if (data.token) {
                // Store the token in Local Storage for future authenticated requests
                localStorage.setItem('authToken', data.token);
            }
            
            // 3. Redirect on success
            location.href = successRedirect;

        } else {
            // 4. Handle failed status codes (400, 401, 500)
            const error = await res.json();
            alert(`${failureMessage}: ${error.message || res.statusText}`);
        }
    } catch (error) {
        // 5. Handle network errors (e.g., server down, connection refused)
        console.error("Fetch error:", error);
        alert("A network error occurred. Please ensure your backend server is running on the correct port.");
    }
};

// --- LOGIN LOGIC ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get values from the form inputs
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        handleAuth(
            `${API_BASE_URL}/auth/login`,
            { email, password },
            "dashboard.html", // Redirect to dashboard on successful login
            "Login failed"
        );
    });
}

// --- SIGNUP LOGIC ---
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get values from the form inputs
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        handleAuth(
            `${API_BASE_URL}/auth/signup`,
            { name, email, password },
            "login.html", // Redirect to login page on successful signup
            "Signup failed"
        );
    });
}
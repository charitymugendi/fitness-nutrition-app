// Function to handle the API fetch and response parsing
const handleAuth = async (url, body, successRedirect, failureMessage) => {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        // Check if the response was successful (200-299 status code)
        if (res.ok) {
            // Attempt to parse the JSON response
            const data = await res.json(); 

            // Check if the server returned a token (CRITICAL STEP)
            if (data.token) {
                // Store the token in Local Storage for persistent login across browser sessions
                localStorage.setItem('authToken', data.token);
                console.log("Token stored successfully.");
                // Redirect the user to the next page
                location.href = successRedirect;
            } else {
                // Handle success without a token (e.g., successful signup)
                location.href = successRedirect;
            }
        } else {
            // Read the error message from the server if available
            const error = await res.json();
            alert(`${failureMessage}: ${error.message || res.statusText}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An error occurred. Please try again.");
    }
};

// --- LOGIN LOGIC ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get values directly from the form elements
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Note: The /auth/login endpoint MUST return a token upon success.
        handleAuth(
            "http://localhost:3000/auth/login",
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

        // Get values directly from the form elements
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Note: The /auth/signup endpoint typically returns a token too,
        // but if it just redirects to login, it will skip the token storage block above.
        handleAuth(
            "http://localhost:3000/auth/signup",
            { name, email, password },
            "login.html",
            "Signup failed"
        );
    });
}
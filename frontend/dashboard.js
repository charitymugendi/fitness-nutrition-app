// IMPORTANT: Update this base URL to match the port your backend is running on (e.g., 3000, 4000, 5000)
const API_BASE_URL = 'http://localhost:4000'; 

// --- NAVBAR DISPLAY LOGIC ---
const updateNavbarDisplay = () => {
    const token = localStorage.getItem('authToken');
    const welcomeMsg = document.getElementById('welcome-message');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');

    if (token) {
        // Logged In: Show welcome and logout, hide login
        welcomeMsg.classList.remove('hidden-initial'); 
        loginLink.classList.add('hidden-initial');     
        logoutLink.classList.remove('hidden-initial'); 
        
        // Add Logout functionality
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken'); // Clear the token
            location.href = 'index.html'; // Redirect to a logged-out page
        });
        
    } else {
        // Logged Out: Hide welcome and logout, show login
        welcomeMsg.classList.add('hidden-initial');   
        loginLink.classList.remove('hidden-initial'); 
        logoutLink.classList.add('hidden-initial');   
    }
};

// --- AUTHENTICATION CHECK & REDIRECT ---
const checkAuthentication = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Only show alert if the user is not explicitly on the login or index page
        if (!['login.html', 'index.html'].includes(location.pathname.split('/').pop())) {
             alert("Session expired or unauthorized. Please log in.");
        }
        location.href = 'login.html';
        return false;
    }
    return token;
};

// --- DATA FETCHING ---
const fetchProtectedData = async (endpoint, listElementId, renderFunction) => {
    const token = checkAuthentication();
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Send the token
            }
        });

        if (res.ok) {
            const data = await res.json();
            renderFunction(data, listElementId); 
        } else if (res.status === 401) {
            // Handle unauthorized (token rejected by server)
            console.error("Token rejected by server. Redirecting to login.");
            localStorage.removeItem('authToken'); 
            location.href = 'login.html';
        } else {
            console.error(`Failed to fetch ${endpoint}:`, res.statusText);
            document.getElementById(listElementId).innerHTML = `<p>Error loading ${endpoint}.</p>`;
        }
    } catch (error) {
        console.error(`Network error fetching ${endpoint}:`, error);
        document.getElementById(listElementId).innerHTML = `<p>Could not connect to the API. Check the port number!</p>`;
    }
};

// --- RENDER FUNCTIONS ---

// Renders the workout list
const renderWorkouts = (workouts, listElementId) => {
    const list = document.getElementById(listElementId);
    list.innerHTML = ''; 

    workouts.forEach(w => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${w.name}</h3>
            <p>Sets: ${w.sets} | Reps: ${w.reps}</p>
            <p>Duration: ${w.duration}</p>
        `;
        list.appendChild(card);
    });
};

// Renders the nutrition tips list
const renderNutritionTips = (tips, listElementId) => {
    const list = document.getElementById(listElementId);
    list.innerHTML = '';

    tips.forEach(t => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <p>💡 ${t.tip}</p>
        `;
        list.appendChild(card);
    });
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Update the navbar links immediately based on login status
    updateNavbarDisplay(); 

    // 2. Check if the user is authenticated (redirects if not)
    const token = checkAuthentication(); 
    if (!token) return;

    // 3. Fetch the protected data from the backend
    fetchProtectedData(
        'workouts', 
        'workoutList', 
        renderWorkouts
    );

    fetchProtectedData(
        'nutrition', 
        'nutritionList', 
        renderNutritionTips
    );
});
// IMPORTANT: Update this base URL to match the port your backend is running on (e.g., 3000, 4000, 5000)
const API_BASE_URL = 'http://localhost:4000'; 

// Function to fetch the user's detailed profile metrics
const fetchProfileData = async () => {
    const token = localStorage.getItem('authToken');
    const usernameElement = document.querySelector('.username');

    if (!token) {
        // If no token, redirect to login (dashboard.js handles this check too)
        return; 
    }

    // --- Dummy Data ---
    // In a real app, you would fetch this from a protected API endpoint like /api/profile
    const userData = {
        fullName: "Plamen Dobrev",
        email: "admin@admin.com",
        gender: "Male",
        activityLevel: "Active",
        currentWeight: "75.00 kg",
        goalWeight: "80.00 kg",
        height: "175.00 cm",
        neck: "46.00 cm",
        waist: "60.00 cm",
        hips: "90.00 cm",
        proteinGoal: "200.00 gr",
        username: "admin"
    };

    // Populate the UI with data
    usernameElement.textContent = userData.username;

    document.getElementById('full-name').textContent = userData.fullName;
    document.getElementById('email').textContent = userData.email;
    document.getElementById('gender').textContent = userData.gender;
    document.getElementById('activity-level').textContent = userData.activityLevel;
    document.getElementById('current-weight').textContent = userData.currentWeight;
    document.getElementById('goal-weight').textContent = userData.goalWeight;
    document.getElementById('height').textContent = userData.height;
    document.getElementById('neck').textContent = userData.neck;
    document.getElementById('waist').textContent = userData.waist;
    document.getElementById('hips').textContent = userData.hips;
    document.getElementById('protein-goal').textContent = userData.proteinGoal;

    // You would add a try/catch fetch logic here for the real API call
};


document.addEventListener('DOMContentLoaded', () => {
    // We assume dashboard.js has already run to update the navbar links

    // Start fetching and displaying profile data
    fetchProfileData();
});
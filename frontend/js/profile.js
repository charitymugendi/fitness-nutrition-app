// frontend/js/profile.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Loading profile data...');
    
    const profileContainer = document.getElementById('profile-container');
    const errorElement = document.getElementById('error-message');
    
    if (profileContainer) {
        profileContainer.classList.add('loading');
    }
    
    // Fetch from your backend API
    fetch('http://localhost:4000/api/user/profile')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(userData => {
            console.log('✅ Data received:', userData);
            updateProfileUI(userData);
            if (profileContainer) {
                profileContainer.classList.remove('loading');
            }
        })
        .catch(error => {
            console.error('❌ Fetch error:', error);
            showError(`Failed to load profile: ${error.message}`);
            if (profileContainer) {
                profileContainer.classList.remove('loading');
            }
        });
    
    function updateProfileUI(userData) {
        // Update all profile fields
        document.getElementById('username').textContent = userData.username || 'N/A';
        document.getElementById('about-me').textContent = userData.aboutMe || 'N/A';
        document.getElementById('why-in-shape').textContent = userData.whyGetInShape || 'N/A';
        document.getElementById('full-name').textContent = userData.fullName || 'N/A';
        document.getElementById('email').textContent = userData.email || 'N/A';
        document.getElementById('gender').textContent = userData.gender || 'N/A';
        document.getElementById('activity-level').textContent = userData.activityLevel || 'N/A';
        document.getElementById('current-weight').textContent = userData.currentWeight ? `${userData.currentWeight} kg` : 'N/A';
        document.getElementById('goal-weight').textContent = userData.goalWeight ? `${userData.goalWeight} kg` : 'N/A';
        document.getElementById('height').textContent = userData.height ? `${userData.height} cm` : 'N/A';
        document.getElementById('neck').textContent = userData.neck ? `${userData.neck} cm` : 'N/A';
        document.getElementById('waist').textContent = userData.waist ? `${userData.waist} cm` : 'N/A';
        document.getElementById('hips').textContent = userData.hips ? `${userData.hips} cm` : 'N/A';
        document.getElementById('protein-goal').textContent = userData.proteinGoal ? `${userData.proteinGoal} gr` : 'N/A';
    }
    
    function showError(message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
});
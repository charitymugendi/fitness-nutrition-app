// User data storage - now loaded from backend
let userData = {};

// API base URL
const API_BASE = 'http://localhost:3000/api';

// Initialize the application
async function initializeApp() {
    try {
        // Load user profile data
        await loadUserProfile();
        
        // Load dashboard data if on dashboard page
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            await loadDashboardData();
        }
        
        // Initialize progress ring animation
        initializeProgressRing();
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error loading data. Please refresh the page.', 'error');
    }
}

// Load user profile from backend
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/user/profile`);
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const userProfile = await response.json();
        userData = userProfile;
        
        // Update profile page if it's active
        if (document.getElementById('profile-page').classList.contains('active')) {
            updateProfileDisplay();
        }
        
        // Update sidebar user info
        updateSidebarUserInfo();
        
    } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to default data
        userData = getDefaultUserData();
        updateProfileDisplay();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/user/dashboard`);
        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        const dashboardData = await response.json();
        updateDashboardDisplay(dashboardData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // You can set default dashboard data here if needed
    }
}

// Update profile display with user data
function updateProfileDisplay() {
    if (!userData) return;
    
    document.getElementById('display-username').textContent = userData.fullName;
    document.getElementById('full-name').textContent = userData.fullName;
    document.getElementById('email').textContent = userData.email;
    document.getElementById('gender').textContent = userData.gender;
    document.getElementById('activity-level').textContent = userData.activityLevel;
    document.getElementById('current-weight').textContent = userData.currentWeight;
    document.getElementById('goal-weight').textContent = userData.goalWeight;
    document.getElementById('height').textContent = userData.height;
    document.getElementById('protein-goal').textContent = userData.proteinGoal;
    document.getElementById('about-me-text').innerHTML = userData.about;
    document.getElementById('fitness-goals-text').innerHTML = userData.goals;
    
    // Update profile picture if available
    if (userData.profilePicture) {
        document.getElementById('profile-image').src = userData.profilePicture;
    }
    
    // Update gender display
    updateGenderDisplay(userData.gender);
    
    // Initialize form values
    initializeFormValues();
}

// Update dashboard display
function updateDashboardDisplay(dashboardData) {
    // Update stats cards
    document.querySelector('.stats-card h3').textContent = dashboardData.workoutsCompleted || '24';
    document.querySelector('.streak-card h3').textContent = `${dashboardData.currentStreak || '7'} days`;
    document.querySelector('.calories-card h3').textContent = dashboardData.caloriesBurned ? dashboardData.caloriesBurned.toLocaleString() : '3,450';
    
    // Update weekly progress
    const progressPercentage = dashboardData.weeklyGoalProgress || 70;
    updateProgressRing(progressPercentage);
}

// Update progress ring
function updateProgressRing(percentage) {
    const circle = document.querySelector('.progress-ring-circle');
    if (!circle) return;
    
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    const offset = circumference - (percentage / 100) * circumference;
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 500);
    
    // Update percentage text
    const percentageElement = document.querySelector('.progress-ring + .absolute .text-2xl');
    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }
}

// Initialize form values for edit modal
function initializeFormValues() {
    if (!userData) return;
    
    document.getElementById('edit-username').value = userData.fullName;
    document.getElementById('edit-email').value = userData.email;
    document.getElementById('edit-about').value = userData.about.replace(/<br>/g, '\n');
    document.getElementById('edit-goals').value = userData.goals.replace(/<br>/g, '\n');
    
    // Extract numeric values
    const currentWeightNum = userData.currentWeight ? parseFloat(userData.currentWeight) : 75;
    const goalWeightNum = userData.goalWeight ? parseFloat(userData.goalWeight) : 80;
    const proteinGoalNum = userData.proteinGoal ? parseFloat(userData.proteinGoal) : 150;
    
    document.getElementById('edit-weight').value = currentWeightNum;
    document.getElementById('edit-goal-weight').value = goalWeightNum;
    document.getElementById('edit-protein').value = proteinGoalNum;
    
    // Set selected gender in modal
    const genderOptions = document.querySelectorAll('.gender-option');
    genderOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.getAttribute('data-gender') === (userData.gender || 'male').toLowerCase()) {
            option.classList.add('selected');
        }
    });
}

// Save profile to backend
async function saveProfileToBackend(profileData) {
    try {
        const response = await fetch(`${API_BASE}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save profile');
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Error saving profile:', error);
        throw error;
    }
}

// Save profile picture to backend
async function saveProfilePictureToBackend(pictureUrl) {
    try {
        const response = await fetch(`${API_BASE}/user/profile-picture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profilePicture: pictureUrl })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save profile picture');
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Error saving profile picture:', error);
        throw error;
    }
}

// Update the form submission handler
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get selected gender
    const selectedGender = document.querySelector('.gender-option.selected').getAttribute('data-gender');
    const genderDisplay = selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1);
    
    // Prepare profile data for backend
    const profileData = {
        fullName: document.getElementById('edit-username').value,
        email: document.getElementById('edit-email').value,
        gender: genderDisplay,
        activityLevel: userData.activityLevel || 'Active', // You might want to add this to the form
        currentWeight: document.getElementById('edit-weight').value,
        goalWeight: document.getElementById('edit-goal-weight').value,
        height: userData.height ? parseFloat(userData.height) : 180, // You might want to add this to the form
        proteinGoal: document.getElementById('edit-protein').value,
        about: document.getElementById('edit-about').value,
        goals: document.getElementById('edit-goals').value
    };
    
    try {
        // Save to backend
        await saveProfileToBackend(profileData);
        
        // Update local data and UI
        userData = { ...userData, ...profileData };
        userData.currentWeight = `${profileData.currentWeight} kg`;
        userData.goalWeight = `${profileData.goalWeight} kg`;
        userData.proteinGoal = `${profileData.proteinGoal} g`;
        userData.about = profileData.about.replace(/\n/g, '<br>');
        userData.goals = profileData.goals.replace(/\n/g, '<br>');
        
        updateProfileDisplay();
        editProfileModal.style.display = 'none';
        showNotification('Profile updated successfully!');
        
    } catch (error) {
        showNotification('Error updating profile. Please try again.', 'error');
    }
});

// Update profile picture save handler
savePictureBtn.addEventListener('click', async () => {
    const newPictureUrl = uploadPreview.src;
    
    try {
        await saveProfilePictureToBackend(newPictureUrl);
        
        profileImage.src = newPictureUrl;
        userData.profilePicture = newPictureUrl;
        uploadModal.style.display = 'none';
        showNotification('Profile picture updated successfully!');
        
    } catch (error) {
        showNotification('Error updating profile picture. Please try again.', 'error');
    }
});

// Update inline edit save handler
saveInlineEdit.addEventListener('click', async () => {
    if (!currentEditingField) return;
    
    const { field, element } = currentEditingField;
    let newValue;
    
    if (field === 'gender') {
        newValue = inlineEditSelect.value;
        updateGenderDisplay(newValue);
    } else if (field === 'activityLevel') {
        newValue = inlineEditActivity.value;
    } else {
        newValue = inlineEditInput.value;
        
        // Add units if needed
        if (field === 'currentWeight' || field === 'goalWeight') {
            newValue += ' kg';
        } else if (field === 'proteinGoal') {
            newValue += ' g';
        } else if (field === 'height') {
            newValue += ' cm';
        } else if (field === 'about' || field === 'goals') {
            newValue = newValue.replace(/\n/g, '<br>');
        }
    }
    
    try {
        // Prepare update data for backend
        const updateData = {};
        let backendFieldName = field;
        
        // Map frontend field names to backend field names
        const fieldMap = {
            'fullName': 'fullName',
            'email': 'email',
            'gender': 'gender',
            'activityLevel': 'activityLevel',
            'currentWeight': 'currentWeight',
            'goalWeight': 'goalWeight',
            'height': 'height',
            'proteinGoal': 'proteinGoal',
            'about': 'about',
            'goals': 'goals'
        };
        
        if (fieldMap[field]) {
            updateData[fieldMap[field]] = newValue;
            
            // For weight fields, send numeric values to backend
            if (field === 'currentWeight' || field === 'goalWeight' || field === 'proteinGoal') {
                updateData[fieldMap[field]] = parseFloat(inlineEditInput.value);
            } else if (field === 'about' || field === 'goals') {
                updateData[fieldMap[field]] = newValue.replace(/<br>/g, '\n');
            }
            
            await saveProfileToBackend(updateData);
        }
        
        // Update local data
        userData[field] = newValue;
        
        // Update display
        if (field === 'about' || field === 'goals') {
            element.innerHTML = newValue;
        } else {
            element.textContent = newValue;
        }
        
        // Special case for username
        if (field === 'fullName') {
            document.getElementById('display-username').textContent = newValue;
        }
        
        inlineEditModal.style.display = 'none';
        showNotification('Profile updated successfully!');
        
    } catch (error) {
        showNotification('Error updating profile. Please try again.', 'error');
    }
});

// Default user data fallback
function getDefaultUserData() {
    return {
        fullName: "Alex Johnson",
        email: "alex.j@example.com",
        gender: "Male",
        activityLevel: "Active",
        currentWeight: "75 kg",
        goalWeight: "80 kg",
        height: "180 cm",
        proteinGoal: "150 g",
        about: "Fitness enthusiast with a passion for weight training and healthy nutrition. Currently working towards improving my strength and building muscle mass. I believe consistency is the key to achieving fitness goals.",
        goals: "• Gain 5kg of lean muscle mass<br>• Reduce body fat to 12%<br>• Bench press 100kg<br>• Run a half marathon<br>• Improve flexibility and mobility"
    };
}

// Update sidebar user info
function updateSidebarUserInfo() {
    const sidebarUserName = document.querySelector('.sidebar .font-semibold');
    const sidebarUserImage = document.querySelector('.sidebar img');
    
    if (sidebarUserName && userData.fullName) {
        sidebarUserName.textContent = userData.fullName;
    }
    
    if (sidebarUserImage && userData.profilePicture) {
        sidebarUserImage.src = userData.profilePicture;
    }
}

// Enhanced notification function
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        notification.style.background = '#ef4444';
    } else {
        notification.style.background = '#4CAF50';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
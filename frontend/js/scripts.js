const API_BASE_URL = 'http://localhost:4000'; 
let allVideos = [];
let currentFilter = 'Abs';
let isAdminMode = false;

// --- VIDEO PLAYER MODAL LOGIC ---
const setupVideoPlayer = () => {
    const modal = document.getElementById('video-modal');
    const closeButton = modal.querySelector('.close-button');
    
    closeButton.onclick = () => closeModal();
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    window.closeModal = () => {
        const iframe = document.getElementById('video-iframe');
        iframe.src = ''; 
        modal.classList.add('hidden-initial');
    };
};

const openModal = (videoUrl) => {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    
    // Ensure we use the embed version and autoplay
    const embedUrl = videoUrl.includes('?') ? `${videoUrl}&autoplay=1` : `${videoUrl}?autoplay=1`;
    iframe.src = embedUrl;

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('hidden-initial');
    }, 10);
};

// --- ADMIN CONTROLS LOGIC ---
const toggleAdminControls = () => {
    const adminControls = document.getElementById('admin-controls');
    const showAdminBtn = document.getElementById('show-admin');
    const toggleAdminBtn = document.getElementById('toggle-admin');
    
    isAdminMode = !isAdminMode;
    
    if (isAdminMode) {
        adminControls.classList.remove('hidden-initial');
        showAdminBtn.style.display = 'none';
        toggleAdminBtn.textContent = '🚫 Exit Admin Mode';
    } else {
        adminControls.classList.add('hidden-initial');
        showAdminBtn.style.display = 'block';
        toggleAdminBtn.textContent = '👤 Admin Mode';
        document.getElementById('add-video-form').reset();
    }
    
    // Refresh display to show/hide delete buttons
    filterAndDisplayVideos();
};

const addNewVideo = async (videoData) => {
    const spinner = document.querySelector('#add-video-form .loading-spinner');
    const submitBtn = document.querySelector('#add-video-form button[type="submit"]');
    
    try {
        spinner.classList.remove('hidden');
        submitBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/api/workouts/videos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add video');
        }
        
        showSuccess('Video added successfully!');
        document.getElementById('add-video-form').reset();
        toggleAdminControls();
        
        // Reload the videos to show the new one
        await loadWorkoutVideos();
        
    } catch (error) {
        console.error('Error adding video:', error);
        showError(`Failed to add video: ${error.message}`);
    } finally {
        spinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
};

// --- CORE WORKOUT LOGIC ---
const getDifficultyStars = (difficulty) => {
    // Normalize to lowercase to ensure matching
    const level = difficulty.toLowerCase();
    if (level === 'beginner') return { count: 1, color: 'text-green-500' };
    if (level === 'intermediate') return { count: 2, color: 'text-yellow-500' };
    if (level === 'advanced') return { count: 3, color: 'text-red-500' };
    return { count: 0, color: 'text-gray-400' };
};

const createVideoCard = (video) => {
    const card = document.createElement('div');
    card.className = 'flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md cursor-pointer hover:bg-gray-100 transition duration-200';
    
    card.onclick = () => openModal(video.embed_url);

    const thumbnailUrl = video.thumbnail_url || `https://placehold.co/64x64/3b82f6/ffffff?text=${video.muscle_group}`;
    
    const { count: starCount, color: starColor } = getDifficultyStars(video.difficulty);
    const difficultyStars = '⭐'.repeat(starCount);
    
    const lastCompletedText = video.last_completed ? 
        `<p class="text-xs text-blue-600 font-semibold mt-1">Last time: ${video.last_completed}</p>` : '';

    // Template literals (backticks) allow HTML strings inside JS
    card.innerHTML = `
        <img src="${thumbnailUrl}" alt="${video.title} Thumbnail" class="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow">
        <div class="flex-grow">
            <h3 class="text-base font-semibold text-gray-800">${video.title}</h3>
            <div class="flex items-center text-sm text-gray-500 space-x-2">
                <span>${video.duration} mins</span>
                <span>•</span>
                <span>${video.exercises} Exercises</span>
            </div>
            ${lastCompletedText}
        </div>
        <div class="flex flex-col items-end text-sm font-medium">
            <div class="${starColor}">
                ${difficultyStars}
            </div>
            ${isAdminMode ? `<button class="delete-video mt-1 text-xs text-red-500 hover:text-red-700" data-id="${video.id}">🗑️ Delete</button>` : ''}
        </div>
    `;
    
    // Add delete functionality in admin mode
    if (isAdminMode) {
        const deleteBtn = card.querySelector('.delete-video');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteVideo(video.id);
        });
    }
    
    return card;
};

const deleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/workouts/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete video');
        }
        
        showSuccess('Video deleted successfully!');
        await loadWorkoutVideos();
        
    } catch (error) {
        console.error('Error deleting video:', error);
        showError('Failed to delete video');
    }
};

const filterAndDisplayVideos = () => {
    const grid = document.getElementById('workout-grid');
    grid.innerHTML = '';

    // 1. Filter all videos by the selected Muscle Group
    const currentMuscleVideos = allVideos.filter(video => video.muscle_group === currentFilter);

    if (currentMuscleVideos.length === 0) {
        grid.innerHTML = `
            <div class="text-center text-gray-500 mt-8 py-8">
                <p class="text-lg">No ${currentFilter} workout videos found.</p>
                ${isAdminMode ? '<p class="text-sm mt-2">Use the "Add Video" button to create one!</p>' : ''}
            </div>
        `;
        return;
    }

    // 2. Organize filtered videos into difficulty buckets
    const categorized = {
        beginner: currentMuscleVideos.filter(v => v.difficulty.toLowerCase() === 'beginner'),
        intermediate: currentMuscleVideos.filter(v => v.difficulty.toLowerCase() === 'intermediate'),
        advanced: currentMuscleVideos.filter(v => v.difficulty.toLowerCase() === 'advanced')
    };

    // 3. Create container for the sections
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';

    // 4. Helper to render a difficulty section
    const renderDifficultySection = (videos, title, badgeClass) => {
        if (videos.length === 0) return;

        const section = document.createElement('div');
        section.className = 'difficulty-section';
        section.innerHTML = `
            <div class="difficulty-header">
                ${title}
                <span class="difficulty-badge ${badgeClass}">${videos.length} workouts</span>
            </div>
        `;
        
        videos.forEach(video => {
            section.appendChild(createVideoCard(video));
        });
        
        categorySection.appendChild(section);
    };

    // 5. Render the three sections
    renderDifficultySection(categorized.beginner, 'Beginner Workouts', 'beginner-badge');
    renderDifficultySection(categorized.intermediate, 'Intermediate Workouts', 'intermediate-badge');
    renderDifficultySection(categorized.advanced, 'Advanced Workouts', 'advanced-badge');

    grid.appendChild(categorySection);

    // 6. Update tab styling
    document.querySelectorAll('.filter-tab').forEach(tab => {
        if (tab.getAttribute('data-muscle') === currentFilter) {
            tab.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-100');
            tab.classList.add('bg-blue-600', 'text-white');
        } else {
            tab.classList.remove('bg-blue-600', 'text-white');
            tab.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-100');
        }
    });
};

const loadWorkoutVideos = async () => {
    const grid = document.getElementById('workout-grid');
    grid.innerHTML = `
        <div class="text-center py-8">
            <div class="loading-spinner mx-auto"></div>
            <p class="text-gray-500 mt-2">Loading workout videos...</p>
        </div>
    `;

    try {
        console.log('🔄 Fetching workout videos from API...');
        const response = await fetch(`${API_BASE_URL}/api/workouts/videos`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const videos = await response.json();
        console.log(`✅ Loaded ${videos.length} videos from database`);
        
        // Store the flat list from DB
        allVideos = videos;
        
        // Process and display
        filterAndDisplayVideos();
        
    } catch (error) {
        console.error('❌ Error loading workout videos:', error);
        grid.innerHTML = `
            <div class="text-center text-red-500 mt-8 py-8">
                <p class="font-bold">Error loading videos</p>
                <p class="text-sm">${error.message}</p>
                <p class="text-sm mt-2">Make sure your server is running on port 4000</p>
            </div>
        `;
    }
};

// --- UTILITY FUNCTIONS ---
const showError = (message) => {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
};

const showSuccess = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
    successDiv.textContent = message;
    
    const header = document.querySelector('header');
    header.parentNode.insertBefore(successDiv, header.nextSibling);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup the modal structure
    setupVideoPlayer();

    // 2. Load the videos from API
    loadWorkoutVideos();
    
    // 3. Attach listeners to the filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const muscleGroup = e.currentTarget.getAttribute('data-muscle');
            if (currentFilter !== muscleGroup) {
                currentFilter = muscleGroup;
                filterAndDisplayVideos();
            }
        });
    });

    // 4. Admin controls setup
    document.getElementById('show-admin').addEventListener('click', toggleAdminControls);
    document.getElementById('toggle-admin').addEventListener('click', toggleAdminControls);
    document.getElementById('cancel-add').addEventListener('click', toggleAdminControls);
    
    document.getElementById('add-video-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const videoData = {
            title: formData.get('title'),
            muscle_group: formData.get('muscle_group'),
            duration: parseInt(formData.get('duration')),
            exercises: parseInt(formData.get('exercises')),
            difficulty: formData.get('difficulty'),
            embed_url: formData.get('embed_url'),
            thumbnail_url: formData.get('thumbnail_url') || ''
        };
        
        addNewVideo(videoData);
    });

    // 5. Close modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});
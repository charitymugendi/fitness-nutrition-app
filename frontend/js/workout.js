// frontend/js/workout.js

const API_BASE_URL = 'http://localhost:4000'; 
let allVideos = [];
let currentFilter = 'Abs';
let isAdminMode = false;

// --- VIDEO PLAYER MODAL LOGIC ---
const setupVideoPlayer = () => {
    // Only create modal if it doesn't exist
    if (!document.getElementById('video-modal')) {
        const modalHTML = `
            <div id="video-modal" class="video-modal-overlay hidden-initial">
                <div class="video-modal-content">
                    <span class="close-button">&times;</span>
                    <div class="iframe-container"> 
                        <iframe id="video-iframe" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div id="video-info" class="mt-4 text-white hidden">
                        <h3 id="video-title" class="text-lg font-bold"></h3>
                        <p id="video-description" class="text-sm mt-2"></p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const modal = document.getElementById('video-modal');
    const closeButton = modal.querySelector('.close-button');
    
    // Set up event listeners
    closeButton.onclick = () => closeModal();
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Add ESC key listener to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
};

const openModal = (video) => {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    const videoInfo = document.getElementById('video-info');
    const videoTitle = document.getElementById('video-title');
    const videoDescription = document.getElementById('video-description');
    
    if (!modal || !iframe) {
        console.error('Video modal elements not found');
        return;
    }
    
    // Add autoplay parameter to YouTube embed URL
    const embedUrl = video.embed_url.includes('?') 
        ? `${video.embed_url}&autoplay=1` 
        : `${video.embed_url}?autoplay=1`;
    
    iframe.src = embedUrl;

    // Update video info if available
    if (video.title || video.description) {
        videoTitle.textContent = video.title || '';
        videoDescription.textContent = video.description || '';
        videoInfo.classList.remove('hidden');
    } else {
        videoInfo.classList.add('hidden');
    }

    // Track video view
    trackVideoView(video.id);

    // Show modal with smooth transition
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('hidden-initial');
    }, 10);
};

const closeModal = () => {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    
    if (modal && iframe) {
        iframe.src = ''; // Stop video playback
        modal.classList.add('hidden-initial');
        // Hide completely after transition
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

const trackVideoView = async (videoId) => {
    try {
        await fetch(`${API_BASE_URL}/api/workouts/videos/${videoId}/view`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error tracking video view:', error);
    }
};

// --- CORE WORKOUT LOGIC ---
const getDifficultyStars = (difficulty) => {
    const difficulties = {
        'beginner': { count: 1, color: 'text-green-500', badge: 'beginner-badge' },
        'intermediate': { count: 2, color: 'text-yellow-500', badge: 'intermediate-badge' },
        'advanced': { count: 3, color: 'text-red-500', badge: 'advanced-badge' }
    };
    return difficulties[difficulty] || { count: 0, color: 'text-gray-400', badge: '' };
};

const getDifficultyText = (difficulty) => {
    const difficulties = {
        'beginner': 'Beginner',
        'intermediate': 'Intermediate', 
        'advanced': 'Advanced'
    };
    return difficulties[difficulty] || difficulty;
};

const createVideoCard = (video) => {
    const card = document.createElement('div');
    card.className = 'flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md cursor-pointer hover:bg-gray-50 transition duration-200 hover:shadow-lg border border-gray-100';
    card.setAttribute('data-video-id', video.id);
    
    card.onclick = (e) => {
        // Don't open modal if clicking on action buttons
        if (!e.target.closest('.video-action')) {
            openModal(video);
        }
    };

    const thumbnailUrl = video.thumbnail_url || `https://placehold.co/64x64/3b82f6/ffffff?text=${video.muscle_group}`;
    
    const { count: starCount, color: starColor, badge: difficultyBadge } = getDifficultyStars(video.difficulty);
    const difficultyStars = '⭐'.repeat(starCount);
    
    const lastCompletedText = video.last_completed ? 
        `<p class="text-xs text-blue-600 font-semibold mt-1">Last completed: ${formatDate(video.last_completed)}</p>` : '';

    const caloriesText = video.calories_burned ? 
        `<span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">🔥 ${video.calories_burned} cal</span>` : '';

    card.innerHTML = `
        <img src="${thumbnailUrl}" alt="${video.title} Thumbnail" class="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow">
        <div class="flex-grow">
            <h3 class="text-base font-semibold text-gray-800 line-clamp-2">${video.title}</h3>
            <div class="flex items-center flex-wrap gap-2 text-sm text-gray-500 mt-1">
                <span>${video.duration} mins</span>
                <span>•</span>
                <span>${video.exercises} exercises</span>
                <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">${video.muscle_group}</span>
                ${caloriesText}
            </div>
            ${lastCompletedText}
            ${video.description ? `<p class="text-xs text-gray-600 mt-1 line-clamp-1">${video.description}</p>` : ''}
        </div>
        <div class="flex flex-col items-end text-sm font-medium space-y-2">
            <div class="flex items-center space-x-1">
                <div class="${starColor}">
                    ${difficultyStars}
                </div>
                <span class="text-xs text-gray-500">${getDifficultyText(video.difficulty)}</span>
            </div>
            <div class="video-actions flex space-x-1 ${isAdminMode ? '' : 'hidden'}">
                <button class="video-action favorite-video text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" data-id="${video.id}" title="Add to favorites">
                    🤍
                </button>
                <button class="video-action delete-video text-xs text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded" data-id="${video.id}" title="Delete video">
                    🗑️
                </button>
            </div>
            ${video.view_count ? `<span class="text-xs text-gray-500">👁️ ${video.view_count}</span>` : ''}
        </div>
    `;
    
    return card;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateString;
    }
};

const filterAndDisplayVideos = () => {
    const grid = document.getElementById('workout-grid');
    
    if (!grid) {
        console.error('Workout grid element not found');
        return;
    }
    
    grid.innerHTML = '';

    const filteredVideos = allVideos.filter(video => 
        video.muscle_group === currentFilter || currentFilter === 'All'
    );
    
    if (filteredVideos.length === 0) {
        grid.innerHTML = `
            <div class="text-center text-gray-500 mt-8 py-8">
                <p class="text-lg">No ${currentFilter} workout videos found.</p>
                <p class="text-sm mt-2">Try selecting a different muscle group</p>
                ${isAdminMode ? '<p class="text-sm mt-2">Or use the "Add Video" button to create one!</p>' : ''}
            </div>
        `;
    } else {
        // Sort by difficulty (Beginner -> Intermediate -> Advanced) then by duration
        const sortedVideos = filteredVideos.sort((a, b) => {
            const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
            if (difficultyOrder[a.difficulty] !== difficultyOrder[b.difficulty]) {
                return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
            }
            return a.duration - b.duration;
        });
        
        // Group by difficulty for better organization
        const groupedVideos = {
            beginner: sortedVideos.filter(v => v.difficulty === 'beginner'),
            intermediate: sortedVideos.filter(v => v.difficulty === 'intermediate'),
            advanced: sortedVideos.filter(v => v.difficulty === 'advanced')
        };

        Object.keys(groupedVideos).forEach(difficulty => {
            if (groupedVideos[difficulty].length > 0) {
                const difficultySection = document.createElement('div');
                difficultySection.className = 'difficulty-section mb-6';
                
                const { badge: difficultyBadge } = getDifficultyStars(difficulty);
                const difficultyText = getDifficultyText(difficulty);
                
                difficultySection.innerHTML = `
                    <div class="difficulty-header flex items-center mb-3">
                        <h3 class="text-lg font-semibold text-gray-800">${difficultyText} Workouts</h3>
                        <span class="difficulty-badge ${difficultyBadge} ml-2">${groupedVideos[difficulty].length} workouts</span>
                    </div>
                    <div class="space-y-3">
                        ${groupedVideos[difficulty].map(video => `
                            <div class="video-card-wrapper">
                                ${createVideoCard(video).outerHTML}
                            </div>
                        `).join('')}
                    </div>
                `;
                
                grid.appendChild(difficultySection);
            }
        });
    }

    // Update tab styling
    updateTabStyles();
};

const updateTabStyles = () => {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        const muscleGroup = tab.getAttribute('data-muscle');
        if (muscleGroup === currentFilter) {
            tab.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-100');
            tab.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
        } else {
            tab.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
            tab.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-100');
        }
    });
};

const loadWorkoutVideos = async () => {
    const grid = document.getElementById('workout-grid');
    
    if (!grid) {
        console.error('Workout grid element not found');
        return;
    }
    
    // Show loading state
    grid.innerHTML = `
        <div class="text-center py-12">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-500 text-lg">Loading workout videos...</p>
            <p class="text-gray-400 text-sm mt-2">Getting the latest workouts for you</p>
        </div>
    `;

    try {
        console.log('🔄 Fetching workout videos from API...');
        const response = await fetch(`${API_BASE_URL}/api/workouts/videos`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const videos = await response.json();
        console.log(`✅ Loaded ${videos.length} videos from database`);
        
        allVideos = videos;
        filterAndDisplayVideos();
        
    } catch (error) {
        console.error('❌ Error loading workout videos:', error);
        grid.innerHTML = `
            <div class="text-center text-red-500 py-12">
                <div class="text-6xl mb-4">😕</div>
                <p class="text-lg font-semibold mb-2">Failed to load workout videos</p>
                <p class="text-sm mb-4">Error: ${error.message}</p>
                <p class="text-sm text-gray-600 mb-4">Make sure the backend server is running on port 4000</p>
                <button onclick="loadWorkoutVideos()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition duration-200 font-semibold">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
};

const showError = (message) => {
    // Create or get error message container
    let errorContainer = document.getElementById('error-message');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-message';
        errorContainer.className = 'error-message';
        document.body.insertBefore(errorContainer, document.body.firstChild);
    }
    
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
};

const showSuccess = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mx-4 shadow-lg';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <span class="text-green-500 mr-2">✅</span>
            <span>${message}</span>
        </div>
    `;
    
    const header = document.querySelector('header');
    if (header && header.parentNode) {
        header.parentNode.insertBefore(successDiv, header.nextSibling);
    } else {
        document.body.insertBefore(successDiv, document.body.firstChild);
    }
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
};

// --- ADMIN FUNCTIONALITY ---
const toggleAdminMode = () => {
    isAdminMode = !isAdminMode;
    const actionButtons = document.querySelectorAll('.video-actions');
    
    actionButtons.forEach(button => {
        button.classList.toggle('hidden');
    });

    // Update UI to show admin mode
    const adminIndicator = document.getElementById('admin-indicator');
    if (isAdminMode) {
        if (!adminIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'admin-indicator';
            indicator.className = 'fixed top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-50';
            indicator.textContent = 'ADMIN MODE';
            document.body.appendChild(indicator);
        }
        showSuccess('Admin mode activated');
    } else {
        if (adminIndicator) {
            adminIndicator.remove();
        }
        showSuccess('Admin mode deactivated');
    }

    // Refresh display to show/hide admin elements
    filterAndDisplayVideos();
};

const deleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this workout video? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/workouts/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete video');
        }
        
        showSuccess('Workout video deleted successfully!');
        // Reload videos to reflect changes
        await loadWorkoutVideos();
        
    } catch (error) {
        console.error('Error deleting video:', error);
        showError(`Failed to delete workout video: ${error.message}`);
    }
};

const toggleFavorite = async (videoId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/workouts/videos/${videoId}/favorite`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showSuccess('Added to favorites!');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showError('Failed to update favorites');
    }
};

// --- EVENT LISTENERS ---
const setupEventListeners = () => {
    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const muscleGroup = e.currentTarget.getAttribute('data-muscle');
            if (currentFilter !== muscleGroup) {
                currentFilter = muscleGroup;
                filterAndDisplayVideos();
                
                // Scroll to top of workout grid
                const grid = document.getElementById('workout-grid');
                if (grid) {
                    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Delegated event listener for action buttons
    document.addEventListener('click', (e) => {
        // Delete button
        if (e.target.classList.contains('delete-video') || e.target.closest('.delete-video')) {
            const deleteBtn = e.target.classList.contains('delete-video') ? e.target : e.target.closest('.delete-video');
            const videoId = deleteBtn.getAttribute('data-id');
            if (videoId) {
                deleteVideo(parseInt(videoId));
            }
        }
        
        // Favorite button
        if (e.target.classList.contains('favorite-video') || e.target.closest('.favorite-video')) {
            const favoriteBtn = e.target.classList.contains('favorite-video') ? e.target : e.target.closest('.favorite-video');
            const videoId = favoriteBtn.getAttribute('data-id');
            if (videoId) {
                toggleFavorite(parseInt(videoId));
            }
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            // Implement search filtering here if needed
        });
    }

    // Admin mode toggle
    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', toggleAdminMode);
    }
};

// --- INITIALIZATION ---
const initializeWorkoutPage = () => {
    console.log('🚀 Initializing workout page...');
    
    // 1. Setup the modal structure
    setupVideoPlayer();

    // 2. Setup event listeners
    setupEventListeners();

    // 3. Load the videos from API
    loadWorkoutVideos();
    
    // 4. Make functions globally available for HTML onclick handlers
    window.loadWorkoutVideos = loadWorkoutVideos;
    window.closeModal = closeModal;
    window.deleteVideo = deleteVideo;
    window.toggleAdminMode = toggleAdminMode;
};

// Start everything when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeWorkoutPage);

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupVideoPlayer,
        createVideoCard,
        filterAndDisplayVideos,
        loadWorkoutVideos,
        toggleAdminMode
    };
}
// IMPORTANT: Update this base URL to match the port your backend is running on (e.g., 3000, 4000, 5000)
const API_BASE_URL = 'http://localhost:4000'; 

// --- VIDEO PLAYER MODAL LOGIC ---
const setupVideoPlayer = () => {
    // 1. Create the modal elements (if they don't exist)
    if (!document.getElementById('video-modal')) {
        const modalHTML = `
            <div id="video-modal" class="video-modal-overlay hidden-initial">
                <div class="video-modal-content">
                    <span class="close-button">&times;</span>
                    <!-- The iframe is sized using CSS for a 16:9 aspect ratio -->
                    <div class="iframe-container"> 
                         <iframe id="video-iframe" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // 2. Attach close listeners
    const modal = document.getElementById('video-modal');
    const closeButton = modal.querySelector('.close-button');
    
    closeButton.onclick = () => closeModal();
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Stop video playback when closing
    window.closeModal = () => {
        const iframe = document.getElementById('video-iframe');
        iframe.src = ''; // Clear the source to stop playback
        modal.classList.add('hidden-initial');
    };
};

const openModal = (videoUrl) => {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    
    // Ensure the video URL uses the /embed/ format for proper embedding
    iframe.src = videoUrl;
    modal.classList.remove('hidden-initial');
};

// Function to render a single video card
const createVideoCard = (video) => {
    const card = document.createElement('div');
    card.className = 'card video-card';
    
    // Open the video in the modal upon click
    card.onclick = () => openModal(video.embed_url); 

    // Placeholder image URL
    const thumbnailUrl = video.thumbnail_url || 'https://placehold.co/600x400/007bff/white?text=Workout+Video';

    card.innerHTML = `
        <img src="${thumbnailUrl}" alt="${video.title} Thumbnail" class="video-thumbnail">
        <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.muscle_group}</p>
            <div class="video-meta">
                <span>🕒 ${video.duration} min</span>
                <span>⭐ ${video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}</span>
            </div>
        </div>
    `;
    return card;
};


// Function to fetch and display the workout videos
// Temporary test function (replace the old one)
const testApiData = async () => {
    try {
        // Temporarily remove the token header for easy testing
        const res = await fetch(`${API_BASE_URL}/api/workouts/videos`); 

        if (res.ok) {
            const data = await res.json();
            console.log("API Data Received:", data); 
        } else {
            console.error("API response status:", res.status);
        }
    } catch (error) {
        console.error("Test Fetch Error:", error);
    }
};

// In the DOMContentLoaded listener:

const loadWorkoutVideos = async () => {
    const grid = document.getElementById('workout-grid');
    const token = localStorage.getItem('authToken');

    if (!token) {
        grid.innerHTML = '<p>Please <a href="login.html">log in</a> to view the workout library.</p>';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/workouts/videos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const videoData = await res.json();
            grid.innerHTML = ''; // Clear loading message
            
            if (videoData.length === 0) {
                grid.innerHTML = '<p>No workout videos found.</p>';
            } else {
                videoData.forEach(video => {
                    grid.appendChild(createVideoCard(video));
                });
            }
        } else {
            grid.innerHTML = '<p>Error loading videos from the server.</p>';
        }

    } catch (error) {
        console.error('Fetch error:', error);
        grid.innerHTML = '<p>Network error. Could not connect to the API. Check the port number!</p>';
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup the modal structure in the DOM
    setupVideoPlayer(); 

    // 2. Load the videos 
    loadWorkoutVideos();
    
    // 3. Add filtering logic (placeholder - to be implemented fully later)
    const filters = document.querySelectorAll('#search-input, #difficulty-filter, #duration-filter');
    filters.forEach(filter => {
        filter.addEventListener('change', () => {
            console.log('Filter change detected. Rerunning API call or local filter.');
        });
    });
});
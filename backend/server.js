// server.js

// 1. IMPORT DEPENDENCIES
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 2. INITIALIZE APP AND PORT
// IMPORTANT: Use the port you confirmed is working (e.g., 4000 or 5000)
const app = express();
const PORT = 4000; // Using 4000 as the working example

// 3. APPLY MIDDLEWARE
app.use(cors());
app.use(bodyParser.json()); 

// 4. DEFINE APPLICATION ROUTES

// --- HEALTH CHECK/ROOT ROUTE ---
app.get('/', (req, res) => {
    res.status(200).send("Fitness & Nutrition API is running!");
});


// --- AUTHENTICATION ROUTES ---
app.post('/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (name && email && password) {
        res.status(201).json({ message: "User created successfully. Please log in." });
    } else {
        res.status(400).json({ message: "Missing required fields." });
    }
});

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        const fakeToken = "this-is-a-placeholder-jwt-for-" + email;
        res.status(200).json({ 
            token: fakeToken, 
            message: "Login successful!"
        });
    } else {
        res.status(401).json({ message: "Invalid email or password." });
    }
});


// --- NEW WORKOUT VIDEOS API ENDPOINT ---
app.get('/api/workouts/videos', (req, res) => {
    // This array simulates the data you would retrieve from a database 
    // based on the defined schema.
    const workoutVideos = [
        { 
            id: 1, 
            title: "10 Min Morning Stretch Routine", 
            muscle_group: "Flexibility", 
            duration: 10, 
            difficulty: "beginner",
            embed_url: "https://www.youtube.com/embed/gT4E7fS9p4Q", // Example YouTube Embed URL
            thumbnail_url: "https://placehold.co/600x400/007bff/white?text=Stretch"
        },
        { 
            id: 2, 
            title: "Advanced HIIT Full Body", 
            muscle_group: "Full Body", 
            duration: 35, 
            difficulty: "advanced",
            embed_url: "https://www.youtube.com/embed/Qjoq1D4n98M",
            thumbnail_url: "https://placehold.co/600x400/ff6b6b/white?text=HIIT+Advanced"
        },
        { 
            id: 3, 
            title: "Quick Shoulder & Triceps Pump", 
            muscle_group: "Upper Body", 
            duration: 20, 
            difficulty: "intermediate",
            embed_url: "https://www.youtube.com/embed/hJbSj331M58",
            thumbnail_url: "https://placehold.co/600x400/ffc107/333?text=Upper+Body"
        },
        { 
            id: 4, 
            title: "Yoga for Lower Back Pain", 
            muscle_group: "Core", 
            duration: 15, 
            difficulty: "beginner",
            embed_url: "https://www.youtube.com/embed/4O-S_K8xP4c",
            thumbnail_url: "https://placehold.co/600x400/28a745/white?text=Yoga+Core"
        }
    ];

    res.status(200).json(workoutVideos);
});


// 5. START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
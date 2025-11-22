// backend/routes/ProfileRoutes.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

// Database path - adjust if your database is in a different location
const dbPath = path.join(__dirname, '../database/fitness.db');
console.log('Database path:', dbPath);

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// MAIN PROFILE ENDPOINT - This is what your frontend calls
router.get('/user/profile', (req, res) => {
    console.log('📥 Fetching user profile from database...');
    
    // Using the user 'chacha' from your SQL file
    const query = `
        SELECT 
            u.id, u.username, u.email, u.full_name, u.gender, 
            u.activity_level, u.current_weight, u.goal_weight, 
            u.height, u.neck, u.waist, u.hips, u.protein_goal,
            p.about_me, p.why_get_in_shape
        FROM users u
        LEFT JOIN profile_details p ON u.id = p.user_id
        WHERE u.username = 'chacha' OR u.id = 1
        LIMIT 1
    `;
    
    db.get(query, [], (err, row) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        if (!row) {
            console.log('❌ No user found in database');
            return res.status(404).json({ 
                error: 'User not found in database' 
            });
        }
        
        console.log('✅ User found:', row.username);
        
        // Return the data in the format your frontend expects
        res.json({
            id: row.id,
            username: row.username,
            email: row.email,
            fullName: row.full_name,
            gender: row.gender,
            activityLevel: row.activity_level,
            currentWeight: row.current_weight,
            goalWeight: row.goal_weight,
            height: row.height,
            neck: row.neck,
            waist: row.waist,
            hips: row.hips,
            proteinGoal: row.protein_goal,
            aboutMe: row.about_me,
            whyGetInShape: row.why_get_in_shape
        });
    });
});

module.exports = router;
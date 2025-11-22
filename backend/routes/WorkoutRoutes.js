// backend/routes/WorkoutRoutes.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

// Initialize SQLite database
const dbPath = path.join(__dirname, '../database/fitness.db');
console.log('Workout Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening workout database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database for workout routes');
        createWorkoutTables();
    }
});

function createWorkoutTables() {
    const createWorkoutVideosTable = `
        CREATE TABLE IF NOT EXISTS workout_videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            muscle_group TEXT NOT NULL,
            duration INTEGER NOT NULL,
            exercises INTEGER NOT NULL,
            difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
            embed_url TEXT NOT NULL,
            thumbnail_url TEXT,
            last_completed TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createWorkoutVideosTable, (err) => {
        if (err) {
            console.error('❌ Error creating workout_videos table:', err);
        } else {
            console.log('✅ Workout videos table ready');
            insertSampleWorkoutData();
        }
    });
}

function insertSampleWorkoutData() {
    // Check if data already exists
    db.get("SELECT COUNT(*) as count FROM workout_videos", (err, row) => {
        if (err) {
            console.error('Error checking workout videos:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Inserting sample workout data...');
            
            const sampleVideos = [
                // ABS WORKOUTS
                { title: 'Abs Beginner', muscle_group: 'Abs', duration: 20, exercises: 16, difficulty: 'beginner', last_completed: 'Today', embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://placehold.co/64x64/1f2937/ffffff?text=Abs+B' },
                { title: 'Abs Intermediate', muscle_group: 'Abs', duration: 29, exercises: 21, difficulty: 'intermediate', last_completed: 'Oct 20, 2023', embed_url: 'https://www.youtube.com/embed/Yn7Dqf-lR10', thumbnail_url: 'https://placehold.co/64x64/374151/ffffff?text=Abs+I' },
                { title: 'Abs Advanced', muscle_group: 'Abs', duration: 36, exercises: 21, difficulty: 'advanced', last_completed: '', embed_url: 'https://www.youtube.com/embed/qg_w2-k0138', thumbnail_url: 'https://placehold.co/64x64/4b5563/ffffff?text=Abs+A' },
                // ARM WORKOUTS
                { title: 'Bicep Pump Quickie', muscle_group: 'Arm', duration: 15, exercises: 12, difficulty: 'intermediate', last_completed: 'Nov 1, 2023', embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://placehold.co/64x64/d97706/ffffff?text=Arm+B' },
                { title: 'Tricep Focus', muscle_group: 'Arm', duration: 25, exercises: 18, difficulty: 'advanced', last_completed: 'Nov 15, 2023', embed_url: 'https://www.youtube.com/embed/Yn7Dqf-lR10', thumbnail_url: 'https://placehold.co/64x64/b45309/ffffff?text=Arm+T' },
                // CHEST WORKOUTS
                { title: 'Push Day Domination', muscle_group: 'Chest', duration: 40, exercises: 25, difficulty: 'advanced', last_completed: '', embed_url: 'https://www.youtube.com/embed/qg_w2-k0138', thumbnail_url: 'https://placehold.co/64x64/166534/ffffff?text=Chest+P' },
                { title: 'Basic Chest Workout', muscle_group: 'Chest', duration: 20, exercises: 14, difficulty: 'beginner', last_completed: 'Yesterday', embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://placehold.co/64x64/047857/ffffff?text=Chest+B' },
                // LEG WORKOUTS
                { title: 'Quads & Hams Destroyer', muscle_group: 'Leg', duration: 60, exercises: 30, difficulty: 'advanced', last_completed: 'Nov 18, 2023', embed_url: 'https://www.youtube.com/embed/Yn7Dqf-lR10', thumbnail_url: 'https://placehold.co/64x64/dc2626/ffffff?text=Leg+Q' },
                // SHOULDER WORKOUTS
                { title: 'Shoulder Mobility Flow', muscle_group: 'Shoulder', duration: 10, exercises: 8, difficulty: 'beginner', last_completed: 'Today', embed_url: 'https://www.youtube.com/embed/qg_w2-k0138', thumbnail_url: 'https://placehold.co/64x64/5b21b6/ffffff?text=Shoulder+M' },
            ];

            const insertStmt = db.prepare(`
                INSERT INTO workout_videos 
                (title, muscle_group, duration, exercises, difficulty, embed_url, thumbnail_url, last_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            sampleVideos.forEach(video => {
                insertStmt.run([
                    video.title,
                    video.muscle_group,
                    video.duration,
                    video.exercises,
                    video.difficulty,
                    video.embed_url,
                    video.thumbnail_url,
                    video.last_completed
                ], (err) => {
                    if (err) {
                        console.error('Error inserting workout video:', err);
                    }
                });
            });

            insertStmt.finalize();
            console.log('✅ Sample workout data inserted');
        } else {
            console.log(`ℹ️ Workout videos already exist: ${row.count} videos found`);
        }
    });
}

// GET all workout videos
router.get('/workouts/videos', (req, res) => {
    console.log('📥 GET Workout Videos API called');
    
    const query = `
        SELECT 
            id, title, muscle_group, duration, exercises, 
            difficulty, embed_url, thumbnail_url, last_completed
        FROM workout_videos 
        ORDER BY muscle_group, difficulty
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
                error: 'Failed to fetch workout videos', 
                details: err.message 
            });
        }

        console.log(`✅ Found ${rows.length} workout videos`);
        res.json(rows);
    });
});

// GET workout videos by muscle group
router.get('/workouts/videos/:muscleGroup', (req, res) => {
    const muscleGroup = req.params.muscleGroup;
    console.log(`📥 GET Workout Videos for ${muscleGroup}`);
    
    const query = `
        SELECT 
            id, title, muscle_group, duration, exercises, 
            difficulty, embed_url, thumbnail_url, last_completed
        FROM workout_videos 
        WHERE muscle_group = ?
        ORDER BY difficulty
    `;

    db.all(query, [muscleGroup], (err, rows) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
                error: 'Failed to fetch workout videos', 
                details: err.message 
            });
        }

        console.log(`✅ Found ${rows.length} videos for ${muscleGroup}`);
        res.json(rows);
    });
});

// ADD new workout video
router.post('/workouts/videos', (req, res) => {
    console.log('📝 ADD Workout Video API called');
    
    const { title, muscle_group, duration, exercises, difficulty, embed_url, thumbnail_url } = req.body;

    if (!title || !muscle_group || !duration || !exercises || !difficulty || !embed_url) {
        return res.status(400).json({ 
            error: 'Missing required fields'
        });
    }

    const query = `
        INSERT INTO workout_videos 
        (title, muscle_group, duration, exercises, difficulty, embed_url, thumbnail_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [title, muscle_group, duration, exercises, difficulty, embed_url, thumbnail_url || ''], function(err) {
        if (err) {
            console.error('❌ Database insert error:', err);
            return res.status(500).json({ 
                error: 'Failed to add workout video'
            });
        }

        console.log('✅ Workout video added with ID:', this.lastID);
        res.json({
            message: 'Workout video added successfully',
            videoId: this.lastID
        });
    });
});

// UPDATE workout video (mark as completed, etc.)
router.put('/workouts/videos/:id', (req, res) => {
    const videoId = req.params.id;
    console.log(`📝 UPDATE Workout Video ${videoId}`);
    
    const { last_completed } = req.body;

    const query = `
        UPDATE workout_videos 
        SET last_completed = ?
        WHERE id = ?
    `;

    db.run(query, [last_completed, videoId], function(err) {
        if (err) {
            console.error('❌ Database update error:', err);
            return res.status(500).json({ 
                error: 'Failed to update workout video', 
                details: err.message 
            });
        }

        console.log('✅ Workout video updated, changes:', this.changes);
        res.json({
            message: 'Workout video updated successfully',
            changes: this.changes
        });
    });
});

// DELETE workout video
router.delete('/workouts/videos/:id', (req, res) => {
    const videoId = req.params.id;
    console.log(`🗑️ DELETE Workout Video ${videoId}`);
    
    const query = `DELETE FROM workout_videos WHERE id = ?`;

    db.run(query, [videoId], function(err) {
        if (err) {
            console.error('❌ Database delete error:', err);
            return res.status(500).json({ 
                error: 'Failed to delete workout video', 
                details: err.message 
            });
        }

        console.log('✅ Workout video deleted, changes:', this.changes);
        res.json({
            message: 'Workout video deleted successfully',
            changes: this.changes
        });
    });
});

module.exports = router;
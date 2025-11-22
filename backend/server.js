const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize SQLite Database
const db = new sqlite3.Database('./fitness.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Existing tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        full_name TEXT,
        gender TEXT,
        activity_level TEXT,
        current_weight REAL,
        goal_weight REAL,
        height REAL,
        protein_goal REAL,
        about_me TEXT,
        fitness_goals TEXT,
        profile_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table ready');
            insertDefaultUser();
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        workouts_completed INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        calories_burned INTEGER DEFAULT 0,
        total_workout_time INTEGER DEFAULT 0,
        weekly_goal_progress INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating user_stats table:', err);
        } else {
            console.log('User stats table ready');
        }
    });

    // NEW: Workout categories table
    db.run(`CREATE TABLE IF NOT EXISTS workout_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating workout_categories table:', err);
        } else {
            console.log('Workout categories table ready');
            insertDefaultCategories();
        }
    });

    // NEW: Workout videos table (Enhanced)
    db.run(`CREATE TABLE IF NOT EXISTS workout_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        category_id INTEGER,
        duration INTEGER NOT NULL,
        exercises INTEGER NOT NULL,
        difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
        embed_url TEXT NOT NULL,
        thumbnail_url TEXT,
        description TEXT,
        calories_burned INTEGER,
        equipment_required TEXT DEFAULT 'None',
        trainer_name TEXT,
        video_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        last_completed DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES workout_categories (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating workout_videos table:', err);
        } else {
            console.log('Workout videos table ready');
            insertDefaultWorkoutVideos();
        }
    });

    // NEW: User workout progress table
    db.run(`CREATE TABLE IF NOT EXISTS user_workout_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_completed INTEGER,
        calories_burned INTEGER,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (video_id) REFERENCES workout_videos (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating user_workout_progress table:', err);
        } else {
            console.log('User workout progress table ready');
        }
    });

    // NEW: User favorites table
    db.run(`CREATE TABLE IF NOT EXISTS user_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, video_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (video_id) REFERENCES workout_videos (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating user_favorites table:', err);
        } else {
            console.log('User favorites table ready');
        }
    });

    // NEW: Workout plans table
    db.run(`CREATE TABLE IF NOT EXISTS workout_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration_days INTEGER,
        difficulty_level TEXT,
        created_by INTEGER,
        is_public BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating workout_plans table:', err);
        } else {
            console.log('Workout plans table ready');
        }
    });

    // NEW: Workout plan videos junction table
    db.run(`CREATE TABLE IF NOT EXISTS workout_plan_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        video_order INTEGER DEFAULT 0,
        FOREIGN KEY (plan_id) REFERENCES workout_plans (id),
        FOREIGN KEY (video_id) REFERENCES workout_videos (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating workout_plan_videos table:', err);
        } else {
            console.log('Workout plan videos table ready');
        }
    });

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_workout_videos_muscle_group ON workout_videos(muscle_group)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_workout_videos_difficulty ON workout_videos(difficulty)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_workout_videos_category ON workout_videos(category_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_progress_user_video ON user_workout_progress(user_id, video_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_favorites_user_video ON user_favorites(user_id, video_id)`);
}

function insertDefaultUser() {
    const defaultUser = {
        username: 'alexjohnson',
        email: 'alex.j@example.com',
        full_name: 'Alex Johnson',
        gender: 'Male',
        activity_level: 'Active',
        current_weight: 75,
        goal_weight: 80,
        height: 180,
        protein_goal: 150,
        about_me: 'Fitness enthusiast with a passion for weight training and healthy nutrition. Currently working towards improving my strength and building muscle mass. I believe consistency is the key to achieving fitness goals.',
        fitness_goals: '• Gain 5kg of lean muscle mass\n• Reduce body fat to 12%\n• Bench press 100kg\n• Run a half marathon\n• Improve flexibility and mobility'
    };

    db.get('SELECT * FROM users WHERE username = ?', [defaultUser.username], (err, row) => {
        if (err) {
            console.error('Error checking default user:', err);
            return;
        }
        
        if (!row) {
            db.run(`INSERT INTO users (username, email, full_name, gender, activity_level, current_weight, goal_weight, height, protein_goal, about_me, fitness_goals) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [defaultUser.username, defaultUser.email, defaultUser.full_name, defaultUser.gender, 
                 defaultUser.activity_level, defaultUser.current_weight, defaultUser.goal_weight, 
                 defaultUser.height, defaultUser.protein_goal, defaultUser.about_me, defaultUser.fitness_goals],
                function(err) {
                    if (err) {
                        console.error('Error inserting default user:', err);
                    } else {
                        console.log('Default user created with ID:', this.lastID);
                        // Create stats entry for the user
                        db.run('INSERT INTO user_stats (user_id) VALUES (?)', [this.lastID]);
                    }
                });
        }
    });
}

function insertDefaultCategories() {
    const categories = [
        { name: 'Abs', display_order: 1 },
        { name: 'Arm', display_order: 2 },
        { name: 'Chest', display_order: 3 },
        { name: 'Leg', display_order: 4 },
        { name: 'Shoulder', display_order: 5 },
        { name: 'Back', display_order: 6 },
        { name: 'Full Body', display_order: 7 }
    ];

    categories.forEach(category => {
        db.run('INSERT OR IGNORE INTO workout_categories (name, display_order) VALUES (?, ?)',
            [category.name, category.display_order],
            (err) => {
                if (err) {
                    console.error('Error inserting category:', err);
                }
            });
    });
}

function insertDefaultWorkoutVideos() {
    const workoutVideos = [
        // ABS WORKOUTS - Beginner
        {
            title: 'Abs Beginner Workout 1 - Core Fundamentals',
            muscle_group: 'Abs',
            duration: 12,
            exercises: 6,
            difficulty: 'beginner',
            embed_url: 'https://www.youtube.com/embed/IO82cPvPSuY',
            thumbnail_url: 'https://placehold.co/300x200/3b82f6/ffffff?text=Abs+Beginner+1',
            description: 'Perfect for beginners focusing on core activation and basic exercises',
            calories_burned: 80,
            equipment_required: 'Mat',
            trainer_name: 'Coach Sarah'
        },
        {
            title: 'Abs Beginner Workout 2 - Basic Crunches',
            muscle_group: 'Abs',
            duration: 15,
            exercises: 8,
            difficulty: 'beginner',
            embed_url: 'https://www.youtube.com/embed/AnYl6Nk9GOA',
            thumbnail_url: 'https://placehold.co/300x200/3b82f6/ffffff?text=Abs+Beginner+2',
            description: 'Learn proper crunch form and build core strength',
            calories_burned: 95,
            equipment_required: 'Mat',
            trainer_name: 'Coach Sarah'
        },
        // ABS WORKOUTS - Intermediate
        {
            title: 'Abs Intermediate Workout 1 - Core Strength',
            muscle_group: 'Abs',
            duration: 25,
            exercises: 12,
            difficulty: 'intermediate',
            embed_url: 'https://www.youtube.com/embed/wkD8rjkodUI',
            thumbnail_url: 'https://placehold.co/300x200/8b5cf6/ffffff?text=Abs+Intermediate+1',
            description: 'Challenge your core with advanced exercises and longer duration',
            calories_burned: 150,
            equipment_required: 'Mat',
            trainer_name: 'Pro Trainer Mike'
        },
        // ARM WORKOUTS - Beginner
        {
            title: 'Arm Beginner Workout 1 - Basic Biceps',
            muscle_group: 'Arm',
            duration: 15,
            exercises: 8,
            difficulty: 'beginner',
            embed_url: 'https://www.youtube.com/embed/sAqUcy6aJek',
            thumbnail_url: 'https://placehold.co/300x200/3b82f6/ffffff?text=Arm+Beginner+1',
            description: 'Build arm strength with fundamental exercises',
            calories_burned: 90,
            equipment_required: 'Light Dumbbells',
            trainer_name: 'Coach Sarah'
        },
        // CHEST WORKOUTS - All levels
        {
            title: 'Chest Beginner Workout 1 - Push-up Basics',
            muscle_group: 'Chest',
            duration: 15,
            exercises: 8,
            difficulty: 'beginner',
            embed_url: 'https://www.youtube.com/embed/4-p_T-2aXao',
            thumbnail_url: 'https://placehold.co/300x200/3b82f6/ffffff?text=Chest+Beginner+1',
            description: 'Master push-up form and build chest foundation',
            calories_burned: 100,
            equipment_required: 'Mat',
            trainer_name: 'Coach Sarah'
        }
    ];

    // First, get category IDs
    db.all('SELECT id, name FROM workout_categories', (err, categories) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return;
        }

        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });

        // Insert workout videos
        workoutVideos.forEach(video => {
            const categoryId = categoryMap[video.muscle_group];
            
            db.run(`INSERT OR IGNORE INTO workout_videos 
                    (title, muscle_group, category_id, duration, exercises, difficulty, embed_url, thumbnail_url, description, calories_burned, equipment_required, trainer_name) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    video.title, video.muscle_group, categoryId, video.duration, video.exercises,
                    video.difficulty, video.embed_url, video.thumbnail_url, video.description,
                    video.calories_burned, video.equipment_required, video.trainer_name
                ],
                (err) => {
                    if (err) {
                        console.error('Error inserting workout video:', err);
                    }
                });
        });
    });
}

// EXISTING API ROUTES (unchanged)
app.get('/api/user/profile', (req, res) => {
    const userId = 1;

    db.get(`
        SELECT u.*, 
               us.workouts_completed, 
               us.current_streak, 
               us.calories_burned, 
               us.total_workout_time,
               us.weekly_goal_progress
        FROM users u 
        LEFT JOIN user_stats us ON u.id = us.user_id 
        WHERE u.id = ?`, [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            const userProfile = {
                id: row.id,
                fullName: row.full_name,
                username: row.username,
                email: row.email,
                gender: row.gender,
                activityLevel: row.activity_level,
                currentWeight: `${row.current_weight} kg`,
                goalWeight: `${row.goal_weight} kg`,
                height: `${row.height} cm`,
                proteinGoal: `${row.protein_goal} g`,
                about: row.about_me,
                goals: row.fitness_goals.replace(/\n/g, '<br>'),
                profilePicture: row.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
                stats: {
                    workoutsCompleted: row.workouts_completed || 24,
                    currentStreak: row.current_streak || 7,
                    caloriesBurned: row.calories_burned || 3450,
                    totalWorkoutTime: row.total_workout_time || 750,
                    weeklyGoalProgress: row.weekly_goal_progress || 70
                }
            };
            res.json(userProfile);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

app.put('/api/user/profile', (req, res) => {
    const userId = 1;
    const {
        fullName,
        email,
        gender,
        activityLevel,
        currentWeight,
        goalWeight,
        height,
        proteinGoal,
        about,
        goals
    } = req.body;

    console.log('Updating profile with data:', req.body);

    const currentWeightNum = typeof currentWeight === 'string' ? 
        parseFloat(currentWeight) : currentWeight;
    const goalWeightNum = typeof goalWeight === 'string' ? 
        parseFloat(goalWeight) : goalWeight;
    const heightNum = typeof height === 'string' ? 
        parseFloat(height) : height;
    const proteinGoalNum = typeof proteinGoal === 'string' ? 
        parseFloat(proteinGoal) : proteinGoal;

    db.run(`UPDATE users SET 
            full_name = ?, 
            email = ?, 
            gender = ?, 
            activity_level = ?, 
            current_weight = ?, 
            goal_weight = ?, 
            height = ?, 
            protein_goal = ?, 
            about_me = ?, 
            fitness_goals = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [fullName, email, gender, activityLevel || 'Active', currentWeightNum, goalWeightNum, 
         heightNum, proteinGoalNum, about, goals.replace(/<br>/g, '\n'), userId],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            console.log('Profile updated successfully, changes:', this.changes);
            res.json({ 
                message: 'Profile updated successfully',
                changes: this.changes
            });
        });
});

app.post('/api/user/profile-picture', (req, res) => {
    const userId = 1;
    const { profilePicture } = req.body;

    db.run('UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [profilePicture, userId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                message: 'Profile picture updated successfully',
                changes: this.changes
            });
        });
});

app.get('/api/user/dashboard', (req, res) => {
    const userId = 1;

    db.get(`
        SELECT us.workouts_completed, 
               us.current_streak, 
               us.calories_burned, 
               us.total_workout_time,
               us.weekly_goal_progress
        FROM user_stats us 
        WHERE us.user_id = ?`, [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            res.json({
                workoutsCompleted: row.workouts_completed || 24,
                currentStreak: row.current_streak || 7,
                caloriesBurned: row.calories_burned || 3450,
                totalWorkoutTime: row.total_workout_time || 750,
                weeklyGoalProgress: row.weekly_goal_progress || 70
            });
        } else {
            res.status(404).json({ error: 'User stats not found' });
        }
    });
});

app.put('/api/user/stats', (req, res) => {
    const userId = 1;
    const { workoutsCompleted, currentStreak, caloriesBurned, totalWorkoutTime, weeklyGoalProgress } = req.body;

    db.run(`UPDATE user_stats SET 
            workouts_completed = ?, 
            current_streak = ?, 
            calories_burned = ?, 
            total_workout_time = ?,
            weekly_goal_progress = ?
            WHERE user_id = ?`,
        [workoutsCompleted, currentStreak, caloriesBurned, totalWorkoutTime, weeklyGoalProgress, userId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                message: 'Stats updated successfully',
                changes: this.changes
            });
        });
});

// NEW WORKOUT API ROUTES

// Get all workout videos
app.get('/api/workouts/videos', (req, res) => {
    const query = `
        SELECT wv.*, wc.name as category_name
        FROM workout_videos wv
        LEFT JOIN workout_categories wc ON wv.category_id = wc.id
        ORDER BY wv.muscle_group, wv.difficulty, wv.duration
    `;

    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get workout videos by muscle group
app.get('/api/workouts/videos/:muscleGroup', (req, res) => {
    const muscleGroup = req.params.muscleGroup;

    const query = `
        SELECT wv.*, wc.name as category_name
        FROM workout_videos wv
        LEFT JOIN workout_categories wc ON wv.category_id = wc.id
        WHERE wv.muscle_group = ?
        ORDER BY wv.difficulty, wv.duration
    `;

    db.all(query, [muscleGroup], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new workout video
app.post('/api/workouts/videos', (req, res) => {
    const {
        title,
        muscle_group,
        duration,
        exercises,
        difficulty,
        embed_url,
        thumbnail_url,
        description,
        calories_burned,
        equipment_required,
        trainer_name
    } = req.body;

    // Get category ID for the muscle group
    db.get('SELECT id FROM workout_categories WHERE name = ?', [muscle_group], (err, category) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!category) {
            res.status(400).json({ error: 'Invalid muscle group' });
            return;
        }

        const query = `
            INSERT INTO workout_videos 
            (title, muscle_group, category_id, duration, exercises, difficulty, embed_url, thumbnail_url, description, calories_burned, equipment_required, trainer_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            title, muscle_group, category.id, duration, exercises, difficulty,
            embed_url, thumbnail_url || '', description || '', calories_burned || 0,
            equipment_required || 'None', trainer_name || ''
        ], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                message: 'Workout video added successfully',
                videoId: this.lastID
            });
        });
    });
});

// Update workout video view count
app.post('/api/workouts/videos/:id/view', (req, res) => {
    const videoId = req.params.id;

    db.run('UPDATE workout_videos SET view_count = view_count + 1 WHERE id = ?',
        [videoId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'View count updated' });
        });
});

// Delete workout video
app.delete('/api/workouts/videos/:id', (req, res) => {
    const videoId = req.params.id;

    db.run('DELETE FROM workout_videos WHERE id = ?', [videoId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        res.json({ message: 'Workout video deleted successfully' });
    });
});

// Add video to favorites
app.post('/api/workouts/videos/:id/favorite', (req, res) => {
    const videoId = req.params.id;
    const userId = 1; // Default user

    db.run('INSERT OR IGNORE INTO user_favorites (user_id, video_id) VALUES (?, ?)',
        [userId, videoId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Added to favorites' });
        });
});

// Get user's favorite videos
app.get('/api/workouts/favorites', (req, res) => {
    const userId = 1;

    const query = `
        SELECT wv.*, wc.name as category_name
        FROM workout_videos wv
        JOIN user_favorites uf ON wv.id = uf.video_id
        LEFT JOIN workout_categories wc ON wv.category_id = wc.id
        WHERE uf.user_id = ?
        ORDER BY uf.created_at DESC
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Track workout completion
app.post('/api/workouts/videos/:id/complete', (req, res) => {
    const videoId = req.params.id;
    const userId = 1;
    const { duration_completed, calories_burned, rating, notes } = req.body;

    db.run(`INSERT INTO user_workout_progress 
            (user_id, video_id, duration_completed, calories_burned, rating, notes)
            VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, videoId, duration_completed, calories_burned, rating, notes],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Update the video's last_completed timestamp
            db.run('UPDATE workout_videos SET last_completed = CURRENT_TIMESTAMP WHERE id = ?',
                [videoId]);

            // Update user stats
            db.run(`UPDATE user_stats SET 
                    workouts_completed = workouts_completed + 1,
                    calories_burned = calories_burned + ?,
                    total_workout_time = total_workout_time + ?
                    WHERE user_id = ?`,
                [calories_burned || 0, duration_completed || 0, userId]);

            res.json({
                message: 'Workout completion recorded',
                progressId: this.lastID
            });
        });
});

// Get workout categories
app.get('/api/workouts/categories', (req, res) => {
    db.all('SELECT * FROM workout_categories WHERE is_active = 1 ORDER BY display_order', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database file: fitness.db`);
    console.log(`Workout API available at /api/workouts/`);
});
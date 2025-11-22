// backend/routes/DashboardRoutes.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

// Temporary: Add auth middleware directly to debug
const jwt = require('jsonwebtoken');
const protect = (req, res, next) => {
    let token;
    console.log('Headers:', req.headers);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; 
        console.log('Token received:', token);
    }

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token provided' 
        });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
        const decoded = jwt.verify(token, secret);
        console.log('Decoded token:', decoded);
        req.userId = decoded.id || decoded.userId; // Try both common patterns
        console.log('User ID set to:', req.userId);
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({ 
            success: false,
            message: 'Not authorized, token failed: ' + error.message 
        });
    }
};

const dbPath = path.join(__dirname, '../database/fitness.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening dashboard database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database for dashboard routes');
    }
});

// Get dashboard overview stats
router.get('/overview', protect, (req, res) => {
    console.log('📊 Fetching dashboard overview for user:', req.userId);
    
    // Use the actual user ID from the token
    const userId = req.userId;
    
    if (!userId) {
        return res.status(400).json({ 
            success: false,
            message: 'User ID not found in token' 
        });
    }

    const queries = {
        userProfile: `SELECT username, full_name, activity_level FROM users WHERE id = ?`,
        workoutStats: `
            SELECT 
                COUNT(*) as total_workouts,
                SUM(duration) as total_minutes,
                COUNT(DISTINCT muscle_group) as muscle_groups_worked
            FROM workout_videos 
            WHERE user_id = ? AND last_completed IS NOT NULL AND last_completed != ''
        `,
        recentWorkouts: `
            SELECT title, muscle_group, duration, last_completed 
            FROM workout_videos 
            WHERE user_id = ? AND last_completed IS NOT NULL AND last_completed != ''
            ORDER BY last_completed DESC 
            LIMIT 5
        `,
        weeklyActivity: `
            SELECT 
                muscle_group,
                COUNT(*) as workout_count,
                SUM(duration) as total_minutes
            FROM workout_videos 
            WHERE user_id = ? AND last_completed IS NOT NULL AND last_completed != ''
            GROUP BY muscle_group
            ORDER BY total_minutes DESC
        `
    };

    // Execute all queries
    db.get(queries.userProfile, [userId], (err, user) => {
        if (err) {
            console.error('❌ Error fetching user profile:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Database error fetching user profile' 
            });
        }

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        db.get(queries.workoutStats, [userId], (err, stats) => {
            if (err) {
                console.error('❌ Error fetching workout stats:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Database error fetching workout stats' 
                });
            }

            db.all(queries.recentWorkouts, [userId], (err, recentWorkouts) => {
                if (err) {
                    console.error('❌ Error fetching recent workouts:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Database error fetching recent workouts' 
                    });
                }

                db.all(queries.weeklyActivity, [userId], (err, weeklyActivity) => {
                    if (err) {
                        console.error('❌ Error fetching weekly activity:', err);
                        return res.status(500).json({ 
                            success: false,
                            error: 'Database error fetching weekly activity' 
                        });
                    }

                    // Calculate calories burned
                    const totalCalories = Math.round((stats.total_minutes || 0) * 10);
                    
                    // Generate weekly data for chart
                    const weeklyData = generateWeeklyActivityData(recentWorkouts);

                    console.log('✅ Dashboard data fetched successfully for user:', userId);
                    
                    res.json({
                        success: true,
                        user: {
                            username: user.username,
                            fullName: user.full_name,
                            activityLevel: user.activity_level
                        },
                        stats: {
                            workoutsCompleted: stats.total_workouts || 0,
                            totalMinutes: stats.total_minutes || 0,
                            muscleGroupsWorked: stats.muscle_groups_worked || 0,
                            caloriesBurned: totalCalories,
                            weeklyProgress: calculateWeeklyProgress(stats.total_workouts || 0)
                        },
                        recentWorkouts: recentWorkouts.map(workout => ({
                            title: workout.title,
                            muscleGroup: workout.muscle_group,
                            duration: workout.duration,
                            completedAt: workout.last_completed,
                            calories: Math.round(workout.duration * 10)
                        })),
                        weeklyActivity: weeklyData,
                        muscleGroupDistribution: weeklyActivity
                    });
                });
            });
        });
    });
});

// ... rest of your existing functions (generateWeeklyActivityData, calculateWeeklyProgress, etc.)

module.exports = router;
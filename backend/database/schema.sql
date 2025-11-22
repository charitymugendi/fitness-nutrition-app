-- backend/database/schema.sql

-- Users table (Updated with authentication fields)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT,
    gender TEXT,
    activity_level TEXT,
    current_weight REAL,
    goal_weight REAL,
    height REAL,
    neck REAL,
    waist REAL,
    hips REAL,
    protein_goal REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_admin BOOLEAN DEFAULT 0 -- NEW: For admin privileges
);

-- Workout categories table
CREATE TABLE IF NOT EXISTS workout_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workout videos table (Enhanced)
CREATE TABLE IF NOT EXISTS workout_videos (
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
);

-- User workout progress table
CREATE TABLE IF NOT EXISTS user_workout_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_completed INTEGER, -- in minutes
    calories_burned INTEGER,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (video_id) REFERENCES workout_videos (id)
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (video_id) REFERENCES workout_videos (id)
);

-- Workout plans table
CREATE TABLE IF NOT EXISTS workout_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER,
    difficulty_level TEXT,
    created_by INTEGER, -- user_id who created the plan
    is_public BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Workout plan videos junction table
CREATE TABLE IF NOT EXISTS workout_plan_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    video_order INTEGER DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES workout_plans (id),
    FOREIGN KEY (video_id) REFERENCES workout_videos (id)
);

-- User workout schedules table
CREATE TABLE IF NOT EXISTS user_workout_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER,
    start_date DATE,
    end_date DATE,
    current_day INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (plan_id) REFERENCES workout_plans (id)
);

-- Insert default workout categories
INSERT OR IGNORE INTO workout_categories (name, display_order) VALUES
('Abs', 1),
('Arm', 2),
('Chest', 3),
('Leg', 4),
('Shoulder', 5),
('Back', 6),
('Full Body', 7);

-- Insert sample admin user
INSERT OR IGNORE INTO users (username, email, full_name, password_hash, is_admin)
VALUES ('admin', 'admin@workout.com', 'Workout Admin', 'hashed_password_here', 1);

-- Insert comprehensive workout videos data
INSERT OR IGNORE INTO workout_videos (
    title, muscle_group, category_id, duration, exercises, difficulty, 
    embed_url, thumbnail_url, description, calories_burned, equipment_required, trainer_name
) VALUES
-- ABS WORKOUTS - Beginner
('Abs Beginner Workout 1 - Core Fundamentals', 'Abs', 1, 12, 6, 'beginner', 
 'https://www.youtube.com/embed/abs-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Abs+Beginner+1',
 'Perfect for beginners focusing on core activation and basic exercises', 80, 'Mat', 'Coach Sarah'),

('Abs Beginner Workout 2 - Basic Crunches', 'Abs', 1, 15, 8, 'beginner', 
 'https://www.youtube.com/embed/abs-beginner-2', 'https://placehold.co/300x200/3b82f6/ffffff?text=Abs+Beginner+2',
 'Learn proper crunch form and build core strength', 95, 'Mat', 'Coach Sarah'),

-- ABS WORKOUTS - Intermediate
('Abs Intermediate Workout 1 - Core Strength', 'Abs', 1, 25, 12, 'intermediate', 
 'https://www.youtube.com/embed/abs-intermediate-1', 'https://placehold.co/300x200/8b5cf6/ffffff?text=Abs+Intermediate+1',
 'Challenge your core with advanced exercises and longer duration', 150, 'Mat', 'Pro Trainer Mike'),

-- ABS WORKOUTS - Advanced
('Abs Advanced Workout 1 - Six Pack Shred', 'Abs', 1, 40, 20, 'advanced', 
 'https://www.youtube.com/embed/abs-advanced-1', 'https://placehold.co/300x200/ef4444/ffffff?text=Abs+Advanced+1',
 'Intense core workout for advanced athletes', 280, 'Mat, Dumbbell', 'Elite Coach John'),

-- ARM WORKOUTS - Beginner
('Arm Beginner Workout 1 - Basic Biceps', 'Arm', 2, 15, 8, 'beginner', 
 'https://www.youtube.com/embed/arm-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Arm+Beginner+1',
 'Build arm strength with fundamental exercises', 90, 'Light Dumbbells', 'Coach Sarah'),

-- ARM WORKOUTS - Intermediate
('Arm Intermediate Workout 1 - Biceps Growth', 'Arm', 2, 25, 12, 'intermediate', 
 'https://www.youtube.com/embed/arm-intermediate-1', 'https://placehold.co/300x200/8b5cf6/ffffff?text=Arm+Intermediate+1',
 'Focus on bicep hypertrophy and strength', 160, 'Dumbbells', 'Pro Trainer Mike'),

-- CHEST WORKOUTS - All levels
('Chest Beginner Workout 1 - Push-up Basics', 'Chest', 3, 15, 8, 'beginner', 
 'https://www.youtube.com/embed/chest-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Chest+Beginner+1',
 'Master push-up form and build chest foundation', 100, 'Mat', 'Coach Sarah'),

('Chest Intermediate Workout 1 - Chest Strength', 'Chest', 3, 30, 15, 'intermediate', 
 'https://www.youtube.com/embed/chest-intermediate-1', 'https://placehold.co/300x200/8b5cf6/ffffff?text=Chest+Intermediate+1',
 'Build chest strength with varied exercises', 180, 'Dumbbells, Bench', 'Pro Trainer Mike'),

-- LEG WORKOUTS
('Leg Beginner Workout 1 - Squat Basics', 'Leg', 4, 20, 10, 'beginner', 
 'https://www.youtube.com/embed/leg-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Leg+Beginner+1',
 'Learn proper squat form and leg activation', 120, 'None', 'Coach Sarah'),

-- SHOULDER WORKOUTS
('Shoulder Beginner Workout 1 - Deltoid Basics', 'Shoulder', 5, 15, 8, 'beginner', 
 'https://www.youtube.com/embed/shoulder-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Shoulder+Beginner+1',
 'Build shoulder stability and mobility', 85, 'Light Dumbbells', 'Coach Sarah'),

-- BACK WORKOUTS
('Back Beginner Workout 1 - Lat Activation', 'Back', 6, 20, 10, 'beginner', 
 'https://www.youtube.com/embed/back-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Back+Beginner+1',
 'Activate back muscles and improve posture', 110, 'Resistance Bands', 'Coach Sarah'),

-- FULL BODY WORKOUTS
('Full Body Beginner Workout 1 - Total Body Basics', 'Full Body', 7, 25, 12, 'beginner', 
 'https://www.youtube.com/embed/fullbody-beginner-1', 'https://placehold.co/300x200/3b82f6/ffffff?text=Full+Body+Beginner+1',
 'Complete full body workout for overall fitness', 140, 'Mat, Dumbbells', 'Coach Sarah'),

('Full Body Advanced Workout 1 - Total Body Annihilation', 'Full Body', 7, 65, 32, 'advanced', 
 'https://www.youtube.com/embed/fullbody-advanced-1', 'https://placehold.co/300x200/ef4444/ffffff?text=Full+Body+Advanced+1',
 'Extreme full body challenge for advanced athletes', 400, 'Dumbbells, Bench, Mat', 'Elite Coach John');

-- Insert sample workout plan
INSERT OR IGNORE INTO workout_plans (name, description, duration_days, difficulty_level, created_by, is_public)
VALUES ('28-Day Full Body Challenge', 'Complete transformation program for all fitness levels', 28, 'intermediate', 1, 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_videos_muscle_group ON workout_videos(muscle_group);
CREATE INDEX IF NOT EXISTS idx_workout_videos_difficulty ON workout_videos(difficulty);
CREATE INDEX IF NOT EXISTS idx_workout_videos_category ON workout_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_video ON user_workout_progress(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_video ON user_favorites(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_public ON workout_plans(is_public);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_workout_videos_timestamp 
AFTER UPDATE ON workout_videos
FOR EACH ROW
BEGIN
    UPDATE workout_videos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
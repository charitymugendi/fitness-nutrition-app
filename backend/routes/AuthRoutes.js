// backend/routes/AuthRoutes.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const router = express.Router();

const dbPath = path.join(__dirname, '../database/fitness.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening auth database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database for auth routes');
        ensurePasswordColumnExists();
    }
});

// Ensure password_hash column exists (for existing databases)
function ensurePasswordColumnExists() {
    const checkColumnQuery = `
        PRAGMA table_info(users);
    `;
    
    db.all(checkColumnQuery, [], (err, columns) => {
        if (err) {
            console.error('❌ Error checking table structure:', err);
            return;
        }
        
        const hasPasswordColumn = columns.some(col => col.name === 'password_hash');
        
        if (!hasPasswordColumn) {
            console.log('🔄 Adding password_hash column to users table...');
            const alterQuery = `ALTER TABLE users ADD COLUMN password_hash TEXT`;
            
            db.run(alterQuery, (err) => {
                if (err) {
                    console.error('❌ Error adding password_hash column:', err);
                } else {
                    console.log('✅ Added password_hash column to users table');
                }
            });
        } else {
            console.log('✅ password_hash column already exists');
        }
    });
}

// User registration
router.post('/signup', async (req, res) => {
    console.log('📝 User registration request');
    
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({ 
            message: 'Missing required fields: name, email, password' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            message: 'Password must be at least 6 characters long' 
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            message: 'Please enter a valid email address' 
        });
    }

    try {
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('❌ Database error checking user:', err);
                return res.status(500).json({ 
                    message: 'Database error' 
                });
            }

            if (row) {
                return res.status(409).json({ 
                    message: 'User with this email already exists' 
                });
            }

            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Generate username from email (remove special characters)
            const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
            const username = baseUsername + Math.floor(Math.random() * 1000);

            // Insert new user
            const query = `
                INSERT INTO users (username, email, full_name, password_hash)
                VALUES (?, ?, ?, ?)
            `;

            db.run(query, [username, email, name, passwordHash], function(err) {
                if (err) {
                    console.error('❌ Database error creating user:', err);
                    return res.status(500).json({ 
                        message: 'Failed to create user account' 
                    });
                }

                console.log('✅ User created with ID:', this.lastID);
                
                // Create default profile details
                const profileQuery = `
                    INSERT INTO profile_details (user_id, about_me, why_get_in_shape)
                    VALUES (?, ?, ?)
                `;
                
                db.run(profileQuery, [this.lastID, 'Welcome to MyFitnessApp!', 'Start your fitness journey today!'], (err) => {
                    if (err) {
                        console.error('❌ Error creating profile details:', err);
                    } else {
                        console.log('✅ Default profile created for user:', this.lastID);
                    }
                });

                res.status(201).json({
                    message: 'User created successfully',
                    userId: this.lastID,
                    username: username
                });
            });
        });
    } catch (error) {
        console.error('❌ Error during registration:', error);
        res.status(500).json({ 
            message: 'Internal server error during registration' 
        });
    }
});

// User login
router.post('/login', (req, res) => {
    console.log('🔐 User login request');
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            message: 'Missing email or password' 
        });
    }

    // Find user by email
    const query = `
        SELECT id, username, email, full_name, password_hash 
        FROM users 
        WHERE email = ?
    `;

    db.get(query, [email], async (err, row) => {
        if (err) {
            console.error('❌ Database error finding user:', err);
            return res.status(500).json({ 
                message: 'Database error' 
            });
        }

        if (!row) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Handle existing users without passwords (like the admin user)
        if (!row.password_hash) {
            console.log('⚠️ User exists but has no password set:', email);
            return res.status(401).json({ 
                message: 'Please reset your password or contact administrator' 
            });
        }

        // Verify password
        try {
            const isPasswordValid = await bcrypt.compare(password, row.password_hash);
            
            if (!isPasswordValid) {
                return res.status(401).json({ 
                    message: 'Invalid email or password' 
                });
            }

            // Update last login
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);

            // Generate token (in a real app, use JWT)
            const token = `fake-jwt-token-${row.id}-${Date.now()}`;

            console.log('✅ User logged in:', row.email);
            
            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    fullName: row.full_name
                }
            });
        } catch (error) {
            console.error('❌ Password verification error:', error);
            res.status(500).json({ 
                message: 'Internal server error' 
            });
        }
    });
});

// Check if email exists (for frontend validation)
router.get('/check-email/:email', (req, res) => {
    const email = req.params.email;
    
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('❌ Database error checking email:', err);
            return res.status(500).json({ 
                message: 'Database error' 
            });
        }
        
        res.json({
            exists: !!row
        });
    });
});

module.exports = router;
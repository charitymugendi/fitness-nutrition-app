// backend/database/initDb.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'fitness.db');
console.log('📁 Database path:', dbPath);

// Check if database file exists, if not, create it
if (!fs.existsSync(dbPath)) {
    console.log('🆕 Creating new database file...');
    fs.closeSync(fs.openSync(dbPath, 'w'));
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    console.log('🚀 Initializing database tables...');
    
    // Read and execute the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
        console.error('❌ Schema file not found:', schemaPath);
        process.exit(1);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL by semicolons and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    let completed = 0;
    let total = statements.length;
    
    statements.forEach((statement, index) => {
        if (statement.trim()) {
            db.run(statement, (err) => {
                if (err) {
                    console.error(`❌ Error executing statement ${index + 1}:`, err.message);
                    console.log('Problematic statement:', statement.substring(0, 200) + '...');
                } else {
                    completed++;
                    console.log(`✅ Executed statement ${index + 1}/${total}`);
                }
                
                // When all statements are done, close the database
                if (completed === total) {
                    console.log('🎉 Database initialization completed!');
                    verifyData();
                }
            });
        } else {
            completed++;
        }
    });
}

function verifyData() {
    console.log('\n🔍 Verifying database data...');
    
    // Check users table
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error('❌ Error checking users:', err);
        } else {
            console.log(`👥 Users count: ${row.count}`);
            
            // Show existing users
            db.all("SELECT id, username, email FROM users", (err, users) => {
                if (err) {
                    console.error('❌ Error fetching users:', err);
                } else if (users.length > 0) {
                    console.log('\n📋 Existing users:');
                    users.forEach(user => {
                        console.log(`   👤 ${user.username} (${user.email}) - ID: ${user.id}`);
                    });
                }
            });
        }
    });
    
    // Check workout_videos table
    db.get("SELECT COUNT(*) as count FROM workout_videos", (err, row) => {
        if (err) {
            console.error('❌ Error checking workout_videos:', err);
        } else {
            console.log(`🎬 Workout videos count: ${row.count}`);
        }
    });
    
    // Show sample workout videos by muscle group
    db.all("SELECT muscle_group, COUNT(*) as count FROM workout_videos GROUP BY muscle_group", (err, rows) => {
        if (err) {
            console.error('❌ Error grouping workout videos:', err);
        } else {
            console.log('\n📊 Workout videos by muscle group:');
            rows.forEach(row => {
                console.log(`   ${row.muscle_group}: ${row.count} videos`);
            });
        }
        
        // Check if password_hash column exists
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                console.error('❌ Error checking table structure:', err);
            } else {
                const hasPasswordColumn = columns.some(col => col.name === 'password_hash');
                console.log(`\n🔐 Password authentication: ${hasPasswordColumn ? '✅ Available' : '❌ Not configured'}`);
            }
            
            // Close database after verification
            setTimeout(() => {
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err);
                    } else {
                        console.log('\n🏁 Database connection closed.');
                        console.log('\n🎉 Database is ready! You can now:');
                        console.log('   1. Install dependencies: npm install bcryptjs');
                        console.log('   2. Start your backend server: node server.js');
                        console.log('   3. Access the application:');
                        console.log('      • Sign Up: http://localhost:4000/signup.html');
                        console.log('      • Login: http://localhost:4000/login.html');
                        console.log('      • Workouts: http://localhost:4000/workout.html');
                        console.log('      • Profile: http://localhost:4000/profile.html');
                        console.log('\n💡 Note: The admin user "chacha" exists but needs password reset for login.');
                    }
                });
            }, 1000);
        });
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        } else {
            console.log('Database connection closed.');
            process.exit(0);
        }
    });
});
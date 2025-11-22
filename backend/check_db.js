const sqlite3 = require('sqlite3').Database;
const db = new sqlite3('workouts.db');

db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Tables in database:');
    console.log(tables);
  }
  db.close();
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('projectDB.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, icecreamtype TEXT, rating INT, feedback TEXT)"); 
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Database initialized successfully.');
});

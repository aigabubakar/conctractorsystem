const db = require('./db');

async function migrate() {
  try {
    console.log('Creating messages table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_type ENUM('admin', 'contractor') NOT NULL,
        sender_id INT NOT NULL,
        receiver_type ENUM('admin', 'contractor') NOT NULL,
        receiver_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE
      );
    `);
    
    console.log('Messages table created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

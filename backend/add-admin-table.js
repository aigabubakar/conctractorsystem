const db = require('./db');
const bcrypt = require('bcryptjs');

async function setupAdmins() {
    try {
        console.log('Creating admins table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if admin exists
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', ['admin']);
        
        if (rows.length === 0) {
            console.log('Inserting default admin...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);
            await db.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
            console.log('Default admin inserted successfully (admin / admin123).');
        } else {
            console.log('Admin already exists. Skipping insertion.');
        }
        
        console.log('Admin setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to setup admins:', err);
        process.exit(1);
    }
}

setupAdmins();

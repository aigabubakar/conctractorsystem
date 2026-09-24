const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDB() {
    try {
        console.log("Connecting to MySQL...");
        // First, connect without a specific database to create it if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const dbName = process.env.DB_NAME || 'contractor_registration';
        
        console.log(`Creating database ${dbName} if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        
        console.log(`Using database ${dbName}...`);
        await connection.query(`USE \`${dbName}\`;`);

        console.log("Creating payments table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_id VARCHAR(100) UNIQUE NOT NULL,
                payment_type VARCHAR(50) NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                rrr VARCHAR(100) UNIQUE NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'successful', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating contractors table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contractors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_id INT NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                location_address TEXT NOT NULL,
                postal_address TEXT NOT NULL,
                telephone VARCHAR(50) NOT NULL,
                email VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                cac_number VARCHAR(100) NULL,
                tin VARCHAR(100) NULL,
                cac_document_path VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
            )
        `);

        console.log("Database setup complete!");
        await connection.end();
    } catch (err) {
        console.error("Database setup failed:", err.message);
    }
}

setupDB();

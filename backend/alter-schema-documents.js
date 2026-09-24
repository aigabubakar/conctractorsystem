const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterSchema() {
    try {
        console.log("Connecting to database...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'contractor_registration'
        });

        console.log("Creating contractor_documents table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contractor_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                contractor_id INT NOT NULL,
                document_type VARCHAR(100) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE,
                UNIQUE KEY unique_contractor_doc (contractor_id, document_type)
            )
        `);

        console.log("Creating contractor_corporate_details table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contractor_corporate_details (
                contractor_id INT PRIMARY KEY,
                reg_no VARCHAR(100) NULL,
                reg_date VARCHAR(50) NULL,
                reg_place VARCHAR(150) NULL,
                paid_up_capital VARCHAR(100) NULL,
                total_assets VARCHAR(100) NULL,
                date_of_incorporation VARCHAR(50) NULL,
                chairman_name VARCHAR(255) NULL,
                chairman_address TEXT NULL,
                chairman_phone VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
            )
        `);

        console.log("Schema alteration complete!");
        await connection.end();
    } catch (err) {
        console.error("Failed to alter schema:", err.message);
    }
}

alterSchema();

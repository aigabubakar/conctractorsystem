const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateSchema() {
    try {
        console.log("Connecting to MySQL...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'contractor_registration'
        });

        console.log("Adding new columns to contractor_corporate_details...");

        const columns = [
            'ADD COLUMN secretary_name VARCHAR(255) NULL',
            'ADD COLUMN secretary_address TEXT NULL',
            'ADD COLUMN secretary_phone VARCHAR(100) NULL',
            'ADD COLUMN ceo_name VARCHAR(255) NULL',
            'ADD COLUMN directors JSON NULL',
            'ADD COLUMN principal_officers JSON NULL',
            'ADD COLUMN past_contracts JSON NULL',
            'ADD COLUMN abandoned_projects JSON NULL',
            'ADD COLUMN other_business_lines JSON NULL',
            'ADD COLUMN equipment JSON NULL',
            'ADD COLUMN declaration_accepted BOOLEAN DEFAULT FALSE'
        ];

        for (const col of columns) {
            try {
                await connection.query(`ALTER TABLE contractor_corporate_details ${col};`);
                console.log(`Successfully executed: ${col}`);
            } catch (err) {
                // If error is duplicate column (ER_DUP_FIELDNAME), ignore it
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped: Column already exists for ${col}`);
                } else {
                    console.error(`Error executing ${col}:`, err.message);
                }
            }
        }

        console.log("Migration complete!");
        await connection.end();
    } catch (err) {
        console.error("Migration failed:", err.message);
    }
}

migrateSchema();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'contractor_registration'
        });

        console.log("Altering contractors table...");
        
        // Add new columns if they don't exist
        try { await connection.query(`ALTER TABLE contractors ADD COLUMN location_address TEXT NOT NULL`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors ADD COLUMN postal_address TEXT NOT NULL`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors ADD COLUMN telephone VARCHAR(50) NOT NULL`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors ADD COLUMN email VARCHAR(255) NOT NULL`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors ADD COLUMN category VARCHAR(100) NOT NULL`); } catch (e) { console.log(e.message); }

        // Drop old columns if they exist
        try { await connection.query(`ALTER TABLE contractors DROP COLUMN rc_number`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors DROP COLUMN company_address`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors DROP COLUMN contact_person`); } catch (e) { console.log(e.message); }
        try { await connection.query(`ALTER TABLE contractors DROP COLUMN business_type`); } catch (e) { console.log(e.message); }

        console.log("Database alteration complete!");
        await connection.end();
    } catch (err) {
        console.error("Database alteration failed:", err.message);
    }
}

alterDB();

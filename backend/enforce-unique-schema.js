const mysql = require('mysql2/promise');
require('dotenv').config();

async function enforceConstraints() {
    try {
        console.log("Connecting to MySQL...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'contractor_registration'
        });

        console.log("Enforcing unique constraints on contractors table...");
        
        // Add unique constraints to email and telephone
        try {
            await connection.query('ALTER TABLE contractors ADD UNIQUE (email)');
            console.log("Added unique constraint on email.");
        } catch (e) {
            console.log("Unique constraint on email might already exist:", e.message);
        }

        try {
            await connection.query('ALTER TABLE contractors ADD UNIQUE (telephone)');
            console.log("Added unique constraint on telephone.");
        } catch (e) {
            console.log("Unique constraint on telephone might already exist:", e.message);
        }

        try {
            await connection.query('ALTER TABLE contractors ADD UNIQUE (cac_number)');
            console.log("Added unique constraint on cac_number.");
        } catch (e) {
            console.log("Unique constraint on cac_number might already exist:", e.message);
        }

        try {
            await connection.query('ALTER TABLE contractors ADD UNIQUE (tin)');
            console.log("Added unique constraint on tin.");
        } catch (e) {
            console.log("Unique constraint on tin might already exist:", e.message);
        }

        console.log("Enforcing unique constraints on contractor_corporate_details table...");
        try {
            await connection.query('ALTER TABLE contractor_corporate_details ADD UNIQUE (reg_no)');
            console.log("Added unique constraint on reg_no.");
        } catch (e) {
            console.log("Unique constraint on reg_no might already exist:", e.message);
        }

        console.log("Unique constraints enforcement complete!");
        await connection.end();
    } catch (err) {
        console.error("Failed to enforce constraints:", err.message);
    }
}

enforceConstraints();

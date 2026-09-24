const db = require('./db');

async function alterDB() {
    try {
        console.log("Adding cac_document_path to contractors table...");
        await db.query(`
            ALTER TABLE contractors 
            ADD COLUMN cac_document_path VARCHAR(255) NULL
        `);
        console.log("Database altered successfully!");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Database alteration failed:", err.message);
        }
    } finally {
        process.exit();
    }
}

alterDB();

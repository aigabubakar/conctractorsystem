const db = require('./db');

async function alterSchema() {
    try {
        console.log('Adding verification_status to contractors...');
        await db.query(`
            ALTER TABLE contractors 
            ADD COLUMN verification_status ENUM('incomplete', 'pending', 'approved', 'rejected') DEFAULT 'incomplete' AFTER category_payment_id
        `);
        console.log('Column added successfully.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column verification_status already exists. Skipping.');
        } else {
            console.error('Error adding column:', err.message);
        }
    } finally {
        // close the pool
        await db.end();
    }
}

alterSchema();

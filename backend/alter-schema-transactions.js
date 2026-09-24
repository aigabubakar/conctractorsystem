const db = require('./db');

async function alterSchema() {
    try {
        console.log("Adding transaction_id and payment_type to payments...");
        
        // Add columns (initially NULL to allow altering existing rows)
        await db.query(`ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(100) NULL AFTER id`);
        await db.query(`ALTER TABLE payments ADD COLUMN payment_type VARCHAR(50) NULL AFTER transaction_id`);
        
        // Populate existing rows
        const [rows] = await db.query('SELECT id FROM payments');
        for (let row of rows) {
            const txId = 'TXN-LEGACY-' + Math.floor(Math.random() * 1000000) + '-' + row.id;
            await db.query('UPDATE payments SET transaction_id = ?, payment_type = ? WHERE id = ?', [txId, 'registration', row.id]);
        }

        // Apply constraints
        await db.query(`ALTER TABLE payments MODIFY transaction_id VARCHAR(100) NOT NULL`);
        await db.query(`ALTER TABLE payments ADD UNIQUE (transaction_id)`);
        await db.query(`ALTER TABLE payments MODIFY payment_type VARCHAR(50) NOT NULL`);
        
        // Make rrr nullable (to allow saving footprint before contacting gateway)
        await db.query(`ALTER TABLE payments MODIFY rrr VARCHAR(100) NULL`);

        console.log("Schema altered successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Schema alteration failed:", e);
        process.exit(1);
    }
}

alterSchema();

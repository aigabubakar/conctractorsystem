const db = require('./db');

async function alterSchema() {
    try {
        console.log("Adding role to admins...");
        
        // Add role column to admins
        try {
            await db.query(`ALTER TABLE admins ADD COLUMN role ENUM('admin', 'super_admin') DEFAULT 'admin'`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        // Upgrade the first admin (usually id 1) to super_admin
        await db.query(`UPDATE admins SET role = 'super_admin' ORDER BY id ASC LIMIT 1`);
        
        console.log("Adding dispute fields to payments...");
        
        try {
            await db.query(`ALTER TABLE payments ADD COLUMN dispute_status ENUM('none', 'open', 'resolved') DEFAULT 'none'`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        try {
            await db.query(`ALTER TABLE payments ADD COLUMN dispute_reason TEXT NULL`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        try {
            await db.query(`ALTER TABLE payments ADD COLUMN dispute_resolution TEXT NULL`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        console.log("Super Admin schema altered successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Schema alteration failed:", e);
        process.exit(1);
    }
}

alterSchema();

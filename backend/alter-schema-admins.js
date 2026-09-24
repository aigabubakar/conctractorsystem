const db = require('./db');

async function alterAdmins() {
    try {
        console.log('Adding email column to admins table if it does not exist...');
        
        try {
            await db.query(`
                ALTER TABLE admins 
                ADD COLUMN email VARCHAR(255) NULL AFTER username;
            `);
            console.log('Successfully added email column to admins table.');
        } catch (alterErr) {
            if (alterErr.code === 'ER_DUP_FIELDNAME') {
                console.log('Email column already exists in admins table.');
            } else {
                throw alterErr;
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to alter admins table:', err);
        process.exit(1);
    }
}

alterAdmins();

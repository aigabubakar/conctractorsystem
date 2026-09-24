const db = require('./db');

async function alterSchema() {
    try {
        console.log('Adding profile_pic to contractors...');
        try {
            await db.query(`ALTER TABLE contractors ADD COLUMN profile_pic VARCHAR(255) NULL`);
            console.log('Successfully added profile_pic to contractors.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') console.log('profile_pic already exists in contractors.');
            else throw err;
        }

        console.log('Adding profile_pic to admins...');
        try {
            await db.query(`ALTER TABLE admins ADD COLUMN profile_pic VARCHAR(255) NULL`);
            console.log('Successfully added profile_pic to admins.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') console.log('profile_pic already exists in admins.');
            else throw err;
        }

        console.log('Schema alteration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

alterSchema();

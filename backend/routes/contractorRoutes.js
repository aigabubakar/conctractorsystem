const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore) => {

router.post('/api/contractors/check-registration', async (req, res) => {
    const { email, telephone } = req.body;
    try {
        const [existing] = await db.query('SELECT id, password_hash, email FROM contractors WHERE email = ? OR telephone = ? LIMIT 1', [email, telephone]);
        
        if (existing.length === 0) {
            return res.json({ success: true, exists: false });
        }

        const contractor = existing[0];
        const jwt = require('jsonwebtoken');

        if (contractor.password_hash === 'PENDING_SETUP') {
            // Completed step 1, but not step 2. Provide token to resume.
            const token = jwt.sign(
                { id: contractor.id, email: contractor.email, role: 'contractor' },
                process.env.JWT_SECRET, // Matching the hardcoded secret in /register
                { expiresIn: '1h' }
            );
            return res.json({ success: true, exists: true, step: 2, token });
        } else {
            // Already fully registered
            return res.json({ success: true, exists: true, step: 'completed' });
        }
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to check registration status.' });
    }
});


router.put('/api/contractors/profile', authenticateToken, async (req, res) => {
    const { location_address, postal_address, category, cac_number, tin, password, category_rrr } = req.body;
    const contractorId = req.user.id;

    if (!password) return res.status(400).json({ error: 'Password is required to complete setup.' });
    if (!category_rrr) return res.status(400).json({ error: 'Category payment verification (RRR) is required.' });

    try {
        // Uniqueness checks for CAC number and TIN
        if (cac_number) {
            const [existingCac] = await db.query('SELECT id FROM contractors WHERE cac_number = ? AND id != ?', [cac_number, contractorId]);
            if (existingCac.length > 0) return res.status(400).json({ error: 'CAC Number is already in use by another contractor.' });
        }
        if (tin) {
            const [existingTin] = await db.query('SELECT id FROM contractors WHERE tin = ? AND id != ?', [tin, contractorId]);
            if (existingTin.length > 0) return res.status(400).json({ error: 'TIN is already in use by another contractor.' });
        }

        // Verify the category payment RRR
        const [payments] = await db.query('SELECT id, status FROM payments WHERE rrr = ?', [category_rrr]);
        if (payments.length === 0) return res.status(404).json({ error: 'Category payment not found.' });
        if (payments[0].status !== 'successful') return res.status(400).json({ error: 'Category payment is not verified.' });
        
        const categoryPaymentId = payments[0].id;

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await db.query(
            'UPDATE contractors SET location_address = ?, postal_address = ?, category = ?, cac_number = ?, tin = ?, password_hash = ?, category_payment_id = ? WHERE id = ?',
            [location_address, postal_address, category, cac_number, tin, passwordHash, categoryPaymentId, contractorId]
        );
        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});


router.get('/api/contractors/me', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'contractor') return res.status(403).json({ error: 'Forbidden' });
        const [rows] = await db.query('SELECT id, company_name, location_address, postal_address, email, telephone, category, cac_document_path, verification_status, profile_pic, created_at FROM contractors WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const contractor = rows[0];
        
        // Fetch uploaded documents
        const [docs] = await db.query('SELECT document_type, file_path, uploaded_at FROM contractor_documents WHERE contractor_id = ?', [req.user.id]);
        contractor.documents = docs;
        
        // Fetch corporate details
        const [corpDetails] = await db.query('SELECT * FROM contractor_corporate_details WHERE contractor_id = ?', [req.user.id]);
        contractor.corporate_details = corpDetails.length > 0 ? corpDetails[0] : null;

        res.json({ success: true, data: contractor });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});


router.post('/api/contractors/upload-document', verifyToken, upload.single('document'), async (req, res) => {
    try {
        if (req.user.role !== 'contractor') return res.status(403).json({ error: 'Forbidden' });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });



        // Enforce Corporate Details first
        const [corpCheck] = await db.query('SELECT id FROM contractor_corporate_details WHERE contractor_id = ?', [req.user.id]);
        if (corpCheck.length === 0) {
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Please complete your Corporate Details in the Verification section before uploading documents.' });
        }
        
        const { document_type } = req.body;
        if (!document_type) return res.status(400).json({ error: 'document_type is required' });

        const documentPath = `/uploads/${req.file.filename}`;
        
        await db.query(`
            INSERT INTO contractor_documents (contractor_id, document_type, file_path) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), uploaded_at = CURRENT_TIMESTAMP
        `, [req.user.id, document_type, documentPath]);

        res.json({ success: true, message: 'Document uploaded', path: documentPath, document_type });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});


router.post('/api/contractors/corporate-details', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'contractor') return res.status(403).json({ error: 'Forbidden' });
        const {
            reg_no, reg_date, reg_place, paid_up_capital, total_assets, date_of_incorporation,
            chairman_name, chairman_address, chairman_phone,
            secretary_name, secretary_address, secretary_phone, ceo_name,
            directors, principal_officers, past_contracts, abandoned_projects, other_business_lines, equipment,
            declaration_accepted
        } = req.body;

        // Uniqueness check for Corporate Registration Number (reg_no)
        if (reg_no) {
            const [existingReg] = await db.query('SELECT contractor_id FROM contractor_corporate_details WHERE reg_no = ? AND contractor_id != ?', [reg_no, req.user.id]);
            if (existingReg.length > 0) return res.status(400).json({ error: 'Corporate Registration Number is already in use by another contractor.' });
        }

        await db.query(`
            INSERT INTO contractor_corporate_details 
            (contractor_id, reg_no, reg_date, reg_place, paid_up_capital, total_assets, date_of_incorporation, chairman_name, chairman_address, chairman_phone,
            secretary_name, secretary_address, secretary_phone, ceo_name, directors, principal_officers, past_contracts, abandoned_projects, other_business_lines, equipment, declaration_accepted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            reg_no=VALUES(reg_no), reg_date=VALUES(reg_date), reg_place=VALUES(reg_place), paid_up_capital=VALUES(paid_up_capital),
            total_assets=VALUES(total_assets), date_of_incorporation=VALUES(date_of_incorporation), chairman_name=VALUES(chairman_name),
            chairman_address=VALUES(chairman_address), chairman_phone=VALUES(chairman_phone),
            secretary_name=VALUES(secretary_name), secretary_address=VALUES(secretary_address), secretary_phone=VALUES(secretary_phone),
            ceo_name=VALUES(ceo_name), directors=VALUES(directors), principal_officers=VALUES(principal_officers), past_contracts=VALUES(past_contracts),
            abandoned_projects=VALUES(abandoned_projects), other_business_lines=VALUES(other_business_lines), equipment=VALUES(equipment), declaration_accepted=VALUES(declaration_accepted)
        `, [
            req.user.id, reg_no, reg_date, reg_place, paid_up_capital, total_assets, date_of_incorporation,
            chairman_name, chairman_address, chairman_phone,
            secretary_name, secretary_address, secretary_phone, ceo_name,
            JSON.stringify(directors || []), JSON.stringify(principal_officers || []), JSON.stringify(past_contracts || []), JSON.stringify(abandoned_projects || []), JSON.stringify(other_business_lines || []), JSON.stringify(equipment || []),
            declaration_accepted ? 1 : 0
        ]);

        res.json({ success: true, message: 'Corporate details saved successfully' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to save corporate details' });
    }
});


router.put('/api/contractors/update-profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'contractor') return res.status(403).json({ error: 'Forbidden' });
        const { company_name, email, telephone, location_address, postal_address } = req.body;
        
        // Uniqueness checks for email and telephone on update
        if (email) {
            const [existingEmail] = await db.query('SELECT id FROM contractors WHERE email = ? AND id != ?', [email, req.user.id]);
            if (existingEmail.length > 0) return res.status(400).json({ error: 'Email is already in use by another contractor.' });
        }
        if (telephone) {
            const [existingPhone] = await db.query('SELECT id FROM contractors WHERE telephone = ? AND id != ?', [telephone, req.user.id]);
            if (existingPhone.length > 0) return res.status(400).json({ error: 'Telephone number is already in use by another contractor.' });
        }

        await db.query(
            `UPDATE contractors SET company_name = ?, email = ?, telephone = ?, location_address = ?, postal_address = ? WHERE id = ?`,
            [company_name, email, telephone, location_address, postal_address, req.user.id]
        );
        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});


router.put('/api/contractors/update-password', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'contractor') return res.status(403).json({ error: 'Forbidden' });
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) return res.status(400).json({ error: 'Current and new password are required.' });

        const [rows] = await db.query('SELECT password_hash FROM contractors WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

        const bcrypt = require('bcryptjs');
        const validPassword = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid current password.' });

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(new_password, salt);

        await db.query('UPDATE contractors SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to update password.' });
    }
});


    return router;
};

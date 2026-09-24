const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore) => {

router.post('/api/contractors/register', authLimiter, async (req, res) => {
    const { rrr, company_name, location_address, postal_address, telephone, email, category } = req.body;

    try {
        const [payments] = await db.query('SELECT id, status FROM payments WHERE rrr = ?', [rrr]);
        if (payments.length === 0) return res.status(404).json({ error: 'Payment not found.' });
        
        const payment = payments[0];
        if (payment.status !== 'successful') return res.status(400).json({ error: 'Payment is not verified.' });

        // Uniqueness check for email and telephone
        const [existingEmail] = await db.query('SELECT id FROM contractors WHERE email = ?', [email]);
        if (existingEmail.length > 0) return res.status(400).json({ error: 'Email is already registered by another contractor.' });

        const [existingPhone] = await db.query('SELECT id FROM contractors WHERE telephone = ?', [telephone]);
        if (existingPhone.length > 0) return res.status(400).json({ error: 'Telephone number is already registered by another contractor.' });

        // Idempotency Check: Did this payment already result in a registration?
        const [existingContractor] = await db.query('SELECT id FROM contractors WHERE payment_id = ?', [payment.id]);
        
        let contractorId;
        if (existingContractor.length > 0) {
            // Already registered, just reuse the existing contractor ID
            contractorId = existingContractor[0].id;
        } else {
            // First time registering with this payment, insert the row
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('PENDING_SETUP', salt);

            const [result] = await db.query(
                'INSERT INTO contractors (payment_id, company_name, location_address, postal_address, telephone, email, category, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [payment.id, company_name, location_address, postal_address, telephone, email, category, passwordHash]
            );
            contractorId = result.insertId;
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: contractorId, email, role: 'contractor' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, message: 'Contractor registered successfully!', token });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to register contractor.' });
    }
});


router.post('/api/contractors/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM contractors WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const contractor = rows[0];
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, contractor.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: contractor.id, role: 'contractor' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token, role: 'contractor' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});


router.post('/api/admin/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const admin = rows[0];
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token, role: admin.role });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});


    return router;
};

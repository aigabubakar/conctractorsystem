const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore) => {

router.post('/api/remita/initiate', async (req, res) => {
    const { name, email, phone, payment_type = 'registration', category_name } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    try {
        // Fetch dynamic amount from DB based on payment_type (for now, specifically registration_fee)
        let amount = 10000.00;
        if (payment_type === 'registration') {
            const [settings] = await db.query('SELECT setting_value FROM system_settings WHERE setting_key = "registration_fee"');
            if (settings.length > 0) {
                amount = parseFloat(settings[0].setting_value);
            }
        } else if (payment_type === 'category') {
            if (!category_name) return res.status(400).json({ error: 'Category name is required for category payments.' });
            const [categories] = await db.query('SELECT registration_fee FROM contractor_categories WHERE name = ?', [category_name]);
            if (categories.length > 0) {
                amount = parseFloat(categories[0].registration_fee);
            } else {
                return res.status(400).json({ error: 'Invalid category specified.' });
            }
        }

        // 1. Check off-database memory for existing pending transaction
        const existing = PendingStore.findByEmailAndType(email, payment_type);
        if (existing) {
            return res.json({
                success: true,
                data: { transactionId: existing.transaction_id, rrr: existing.rrr, amount: amount }
            });
        }

        // 2. Generate new footprint if no pending transaction exists
        const transactionId = 'ESUI-CON-' + Math.floor(1000000 + Math.random() * 9000000).toString();
        const mockRRR = Math.floor(100000000000 + Math.random() * 900000000000).toString();

        // 3. Store OFF-DATABASE (JSON cache)
        PendingStore.add(mockRRR, {
            transaction_id: transactionId,
            payment_type,
            name,
            email,
            phone,
            amount
        });

        res.json({
            success: true,
            data: { transactionId: transactionId, rrr: mockRRR, amount: amount }
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to initiate payment.' });
    }
});


router.post('/api/remita/verify', async (req, res) => {
    const { rrr } = req.body;
    if (!rrr) return res.status(400).json({ error: 'RRR is required.' });

    try {
        // Check off-database JSON store first
        const pending = PendingStore.get(rrr);
        if (pending) {
            // Check if not already in DB
            const [exists] = await db.query('SELECT id FROM payments WHERE rrr = ?', [rrr]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO payments (transaction_id, payment_type, company_name, email, phone, rrr, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [pending.transaction_id, pending.payment_type, pending.name, pending.email, pending.phone, rrr, pending.amount, 'successful']
                );
            }
            PendingStore.remove(rrr);
        } else {
            // Fallback: If it's somehow already in the DB as pending (legacy), update it
            await db.query('UPDATE payments SET status = ? WHERE rrr = ?', ['successful', rrr]);
        }
        res.json({ success: true, data: { rrr: rrr, status: 'successful' } });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});


router.post('/api/remita/bypass', async (req, res) => {
    const { name, email, phone, payment_type = 'registration', amount = 10000.00 } = req.body;
    try {
        const mockRRR = 'DEV-' + Math.floor(Math.random() * 1000000000).toString();
        const mockTransactionId = 'DEV-TX-' + Math.floor(Math.random() * 1000000000).toString();
        await db.query(
            'INSERT INTO payments (transaction_id, company_name, email, phone, payment_type, rrr, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [mockTransactionId, name || 'Dev Test', email || 'dev@test.com', phone || '0000000000', payment_type, mockRRR, amount, 'successful']
        );
        res.json({ success: true, data: { rrr: mockRRR } });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to bypass payment.' });
    }
});


router.get('/api/admin/payments', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const [payments] = await db.query(`
            SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        const [countRow] = await db.query('SELECT COUNT(*) as total FROM payments');
        let total = countRow[0].total;
        
        // Merge pending transactions from off-database store
        if (page === 1) {
            const pendingMap = PendingStore.getAll();
            const pendingArr = Object.entries(pendingMap).map(([rrr, p]) => ({
                id: 'tmp-' + rrr,
                transaction_id: p.transaction_id,
                payment_type: p.payment_type,
                company_name: p.name,
                email: p.email,
                phone: p.phone,
                rrr: rrr,
                amount: p.amount,
                status: 'pending',
                created_at: p.created_at
            }));
            payments.unshift(...pendingArr);
            total += pendingArr.length;
        }
        
        res.json({ success: true, data: payments, pagination: { total, page, limit, totalPages: Math.ceil(total/limit) } });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});


router.get('/api/contractor/payments', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'contractor') return res.status(403).json({ error: 'Forbidden' });
        
        // Get contractor email from contractors table
        const [userRow] = await db.query('SELECT email FROM contractors WHERE id = ?', [req.user.id]);
        if (userRow.length === 0) return res.status(404).json({ error: 'User not found' });
        const email = userRow[0].email;

        const [payments] = await db.query(`
            SELECT * FROM payments WHERE email = ? ORDER BY created_at DESC
        `, [email]);
        
        // Add pending transactions from JSON cache
        const pendingMap = PendingStore.getAll();
        for (const [rrr, p] of Object.entries(pendingMap)) {
            if (p.email === email) {
                payments.unshift({
                    id: 'tmp-' + rrr,
                    transaction_id: p.transaction_id,
                    payment_type: p.payment_type,
                    company_name: p.name,
                    email: p.email,
                    phone: p.phone,
                    rrr: rrr,
                    amount: p.amount,
                    status: 'pending',
                    created_at: p.created_at
                });
            }
        }

        res.json({ success: true, data: payments });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});


    return router;
};

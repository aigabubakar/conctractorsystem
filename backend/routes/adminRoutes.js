const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore) => {

router.put('/api/admin/settings/:key', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { key } = req.params;
    const { value } = req.body;
    try {
        await db.query(
            'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
            [value, key]
        );
        res.json({ success: true, message: 'Setting updated successfully' });
    } catch (err) {
        logger.error('Error updating setting:', err);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});


router.put('/api/admin/categories/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    
    const { id } = req.params;
    const { registration_fee, name } = req.body;
    
    if (registration_fee === undefined && name === undefined) return res.status(400).json({ error: 'registration_fee or name is required' });

    try {
        let updateQuery = 'UPDATE contractor_categories SET ';
        let params = [];
        
        if (registration_fee !== undefined) {
            updateQuery += 'registration_fee = ?';
            params.push(registration_fee);
        }
        
        if (name !== undefined) {
            if (params.length > 0) updateQuery += ', ';
            updateQuery += 'name = ?';
            params.push(name);
        }
        
        updateQuery += ' WHERE id = ?';
        params.push(id);

        await db.query(updateQuery, params);
        res.json({ success: true, message: 'Category updated successfully' });
    } catch (err) {
        logger.error('Error updating category:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
});


router.post('/api/admin/categories', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { code, name, registration_fee } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and Name are required' });
    
    try {
        const [result] = await db.query(
            'INSERT INTO contractor_categories (code, name, registration_fee) VALUES (?, ?, ?)',
            [code, name, registration_fee || 0]
        );
        res.json({ success: true, message: 'Category added successfully', id: result.insertId });
    } catch (err) {
        logger.error('Error adding category:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category code already exists' });
        }
        res.status(500).json({ error: 'Failed to add category' });
    }
});


router.get('/api/admin/categories', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        const [categories] = await db.query('SELECT * FROM contractor_categories ORDER BY code ASC');
        res.json({ success: true, data: categories });
    } catch (err) {
        logger.error('Error fetching admin categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});


router.put('/api/admin/categories/:id/toggle', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    try {
        const [category] = await db.query('SELECT is_active FROM contractor_categories WHERE id = ?', [id]);
        if (category.length === 0) return res.status(404).json({ error: 'Category not found' });
        
        const newStatus = category[0].is_active ? 0 : 1;
        await db.query('UPDATE contractor_categories SET is_active = ? WHERE id = ?', [newStatus, id]);
        res.json({ success: true, is_active: newStatus, message: 'Status updated successfully' });
    } catch (err) {
        logger.error('Error toggling category status:', err);
        res.status(500).json({ error: 'Failed to toggle status' });
    }
});


router.delete('/api/admin/categories/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    try {
        await db.query('DELETE FROM contractor_categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        logger.error('Error deleting category:', err);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});


router.get('/api/admin/contractors', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const [contractors] = await db.query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM contractor_documents cd WHERE cd.contractor_id = c.id) as document_count
            FROM contractors c
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        const [countRow] = await db.query('SELECT COUNT(*) as total FROM contractors');
        const total = countRow[0].total;

        res.json({ success: true, data: contractors, pagination: { total, page, limit, totalPages: Math.ceil(total/limit) } });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch contractors' });
    }
});


router.post('/api/admin/contractors/:id/verify', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await db.query('UPDATE contractors SET verification_status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Contractor marked as ${status}` });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to update verification status' });
    }
});


router.get('/api/admin/contractors/:id/details', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        const contractorId = req.params.id;

        const [contractorRows] = await db.query('SELECT payment_id, category_payment_id FROM contractors WHERE id = ?', [contractorId]);
        let registrationPayment = null;
        let categoryPayment = null;

        if (contractorRows.length > 0) {
            const c = contractorRows[0];
            if (c.payment_id) {
                const [p1] = await db.query('SELECT * FROM payments WHERE id = ?', [c.payment_id]);
                if (p1.length > 0) registrationPayment = p1[0];
            }
            if (c.category_payment_id) {
                const [p2] = await db.query('SELECT * FROM payments WHERE id = ?', [c.category_payment_id]);
                if (p2.length > 0) categoryPayment = p2[0];
            }
        }

        const [corp] = await db.query('SELECT * FROM contractor_corporate_details WHERE contractor_id = ?', [contractorId]);
        const [docs] = await db.query('SELECT document_type, file_path as document_path, uploaded_at FROM contractor_documents WHERE contractor_id = ?', [contractorId]);

        res.json({ 
            success: true, 
            corporate_details: corp[0] || null, 
            documents: docs,
            payments: {
                registration: registrationPayment,
                category: categoryPayment
            }
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch details.' });
    }
});


router.put('/api/admin/update-profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        const { username, email, current_password, new_password } = req.body;

        if (!username) return res.status(400).json({ error: 'Username is required.' });

        const [rows] = await db.query('SELECT password_hash FROM admins WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Admin not found.' });

        let updateQuery = 'UPDATE admins SET username = ?, email = ?';
        let queryParams = [username, email || null];

        if (new_password) {
            if (!current_password) return res.status(400).json({ error: 'Current password is required to set a new password.' });
            const bcrypt = require('bcryptjs');
            const validPassword = await bcrypt.compare(current_password, rows[0].password_hash);
            if (!validPassword) return res.status(401).json({ error: 'Invalid current password.' });

            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(new_password, salt);
            
            updateQuery += ', password_hash = ?';
            queryParams.push(newHash);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(req.user.id);

        const [existing] = await db.query('SELECT id FROM admins WHERE username = ? AND id != ?', [username, req.user.id]);
        if (existing.length > 0) return res.status(400).json({ error: 'Username is already taken.' });

        await db.query(updateQuery, queryParams);
        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});


router.get('/api/admin/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        const [rows] = await db.query('SELECT id, username, email, profile_pic, created_at FROM admins WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
        res.json({ success: true, admin: rows[0] });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch admin profile.' });
    }
});


// --- NOTICES MANAGEMENT ---

// Get all notices (admin view)
router.get('/api/admin/notices', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        const [notices] = await db.query('SELECT * FROM system_notices ORDER BY created_at DESC');
        res.json({ success: true, data: notices });
    } catch (err) {
        logger.error('Error fetching notices:', err);
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});

// Create notice
router.post('/api/admin/notices', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { title, content, priority, is_active } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO system_notices (title, content, priority, is_active) VALUES (?, ?, ?, ?)',
            [title, content, priority || 'normal', is_active !== undefined ? is_active : 1]
        );
        res.json({ success: true, message: 'Notice created successfully', id: result.insertId });
    } catch (err) {
        logger.error('Error creating notice:', err);
        res.status(500).json({ error: 'Failed to create notice' });
    }
});

// Update notice
router.put('/api/admin/notices/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { title, content, priority, is_active } = req.body;
    try {
        await db.query(
            'UPDATE system_notices SET title = ?, content = ?, priority = ?, is_active = ? WHERE id = ?',
            [title, content, priority, is_active, id]
        );
        res.json({ success: true, message: 'Notice updated successfully' });
    } catch (err) {
        logger.error('Error updating notice:', err);
        res.status(500).json({ error: 'Failed to update notice' });
    }
});

// Delete notice
router.delete('/api/admin/notices/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        await db.query('DELETE FROM system_notices WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (err) {
        logger.error('Error deleting notice:', err);
        res.status(500).json({ error: 'Failed to delete notice' });
    }
});

    return router;
};

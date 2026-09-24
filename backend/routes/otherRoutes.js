const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore) => {

router.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, data: settings });
    } catch (err) {
        logger.error('Error fetching settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});


router.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM contractor_categories WHERE is_active = 1 ORDER BY code ASC');
        res.json({ success: true, data: categories });
    } catch (err) {
        logger.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});


router.post('/api/upload-profile-pic', verifyToken, upload.single('profile_pic'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const filePath = `/uploads/${req.file.filename}`;
        
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            await db.query('UPDATE admins SET profile_pic = ? WHERE id = ?', [filePath, req.user.id]);
        } else if (req.user.role === 'contractor') {
            await db.query('UPDATE contractors SET profile_pic = ? WHERE id = ?', [filePath, req.user.id]);
        } else {
            return res.status(403).json({ error: 'Invalid role' });
        }

        res.json({ success: true, message: 'Profile picture updated', profile_pic: filePath });
    } catch (err) {
        logger.error('Error uploading profile picture:', err);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
});



// Get all active notices (for public/index page)
router.get('/api/notices', async (req, res) => {
    try {
        const [notices] = await db.query('SELECT * FROM system_notices WHERE is_active = 1 ORDER BY priority DESC, created_at DESC');
        res.json({ success: true, data: notices });
    } catch (err) {
        logger.error('Error fetching notices:', err);
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});

    return router;
};

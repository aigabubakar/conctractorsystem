const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore, verifySuperAdmin) => {

    // --- MANAGE ADMINS ---
    
    // Get all admins
    router.get('/api/superadmin/admins', verifySuperAdmin, async (req, res) => {
        try {
            const [admins] = await db.query('SELECT id, username, role, created_at FROM admins ORDER BY id ASC');
            res.json(admins);
        } catch (err) {
            logger.error('Error fetching admins:', err);
            res.status(500).json({ error: 'Failed to fetch admins' });
        }
    });

    // Create new admin
    router.post('/api/superadmin/admins', verifySuperAdmin, async (req, res) => {
        const { username, password, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
        
        try {
            const [existing] = await db.query('SELECT id FROM admins WHERE username = ?', [username]);
            if (existing.length > 0) return res.status(400).json({ error: 'Username already exists' });

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            
            const adminRole = role === 'super_admin' ? 'super_admin' : 'admin';
            await db.query('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, adminRole]);
            
            res.json({ success: true, message: 'Admin created successfully' });
        } catch (err) {
            logger.error('Error creating admin:', err);
            res.status(500).json({ error: 'Failed to create admin' });
        }
    });

    // Reset admin password
    router.put('/api/superadmin/admins/:id/reset-password', verifySuperAdmin, async (req, res) => {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ error: 'New password is required' });

        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            
            await db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, id]);
            res.json({ success: true, message: 'Password reset successfully' });
        } catch (err) {
            logger.error('Error resetting admin password:', err);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    });

    // Delete admin
    router.delete('/api/superadmin/admins/:id', verifySuperAdmin, async (req, res) => {
        const { id } = req.params;
        
        // Prevent deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        try {
            await db.query('DELETE FROM admins WHERE id = ?', [id]);
            res.json({ success: true, message: 'Admin deleted successfully' });
        } catch (err) {
            logger.error('Error deleting admin:', err);
            res.status(500).json({ error: 'Failed to delete admin' });
        }
    });

    // --- MANAGE CONTRACTOR PASSWORDS ---
    
    // Reset contractor password
    router.put('/api/superadmin/contractors/:id/reset-password', verifySuperAdmin, async (req, res) => {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ error: 'New password is required' });

        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            
            await db.query('UPDATE contractors SET password_hash = ? WHERE id = ?', [hash, id]);
            res.json({ success: true, message: 'Contractor password reset successfully' });
        } catch (err) {
            logger.error('Error resetting contractor password:', err);
            res.status(500).json({ error: 'Failed to reset contractor password' });
        }
    });

    // --- MANAGE DISPUTES ---

    // Get all disputes
    router.get('/api/superadmin/disputes', verifySuperAdmin, async (req, res) => {
        try {
            const [disputes] = await db.query('SELECT * FROM payments WHERE dispute_status != "none" ORDER BY created_at DESC');
            res.json(disputes);
        } catch (err) {
            logger.error('Error fetching disputes:', err);
            res.status(500).json({ error: 'Failed to fetch disputes' });
        }
    });

    // Create or Resolve a dispute
    router.put('/api/superadmin/disputes/:id', verifySuperAdmin, async (req, res) => {
        const { id } = req.params;
        const { action, reason, resolution } = req.body; // action: 'open' or 'resolve'

        try {
            if (action === 'open') {
                await db.query('UPDATE payments SET dispute_status = "open", dispute_reason = ? WHERE id = ?', [reason || 'No reason provided', id]);
                res.json({ success: true, message: 'Dispute opened successfully' });
            } else if (action === 'resolve') {
                await db.query('UPDATE payments SET dispute_status = "resolved", dispute_resolution = ? WHERE id = ?', [resolution || 'Resolved by Super Admin', id]);
                res.json({ success: true, message: 'Dispute resolved successfully' });
            } else {
                res.status(400).json({ error: 'Invalid action' });
            }
        } catch (err) {
            logger.error('Error updating dispute:', err);
            res.status(500).json({ error: 'Failed to update dispute' });
        }
    });

    return router;
};

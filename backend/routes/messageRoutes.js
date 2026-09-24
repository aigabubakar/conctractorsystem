const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = (db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore) => {

router.get('/api/messages', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; // 'admin' or 'contractor'
        
        let query = `
            SELECT m.*, 
                   COALESCE(a.username, c.company_name, 'System') as sender_name
            FROM messages m
            LEFT JOIN admins a ON m.sender_type = 'admin' AND m.sender_id = a.id
            LEFT JOIN contractors c ON m.sender_type = 'contractor' AND m.sender_id = c.id
            WHERE m.receiver_type = ? 
        `;
        let params = [userRole];
        
        // If it's a contractor, they only see their own messages. 
        // Admins share a global inbox for all messages sent to 'admin'.
        if (userRole === 'contractor') {
            query += ` AND m.receiver_id = ? `;
            params.push(userId);
        }
        
        query += ` ORDER BY m.created_at DESC`;
        
        const [messages] = await db.query(query, params);
        res.json({ success: true, data: messages });
    } catch (err) {
        logger.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});


router.get('/api/messages/sent', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query = `
            SELECT m.*, 
                   COALESCE(a.username, c.company_name, 'System') as receiver_name
            FROM messages m
            LEFT JOIN admins a ON m.receiver_type = 'admin' AND m.receiver_id = a.id
            LEFT JOIN contractors c ON m.receiver_type = 'contractor' AND m.receiver_id = c.id
            WHERE m.sender_type = ? 
        `;
        let params = [userRole];
        
        if (userRole === 'contractor') {
            query += ` AND m.sender_id = ? `;
            params.push(userId);
        }
        
        query += ` ORDER BY m.created_at DESC`;
        
        const [messages] = await db.query(query, params);
        res.json({ success: true, data: messages });
    } catch (err) {
        logger.error('Error fetching sent messages:', err);
        res.status(500).json({ error: 'Failed to fetch sent messages' });
    }
});


router.get('/api/messages/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query = 'SELECT COUNT(*) as count FROM messages WHERE receiver_type = ? AND is_read = 0';
        let params = [userRole];
        
        if (userRole === 'contractor') {
            query += ' AND receiver_id = ?';
            params.push(userId);
        }
        
        const [rows] = await db.query(query, params);
        res.json({ success: true, count: rows[0].count });
    } catch (err) {
        logger.error('Error fetching unread count:', err);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});


router.post('/api/messages', verifyToken, async (req, res) => {
    try {
        const senderId = req.user.id;
        const senderType = req.user.role; // 'admin' or 'contractor'
        
        const { receiver_type, receiver_id, subject, body, parent_id } = req.body;
        
        if (!receiver_type || !receiver_id || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        await db.query(
            `INSERT INTO messages (sender_type, sender_id, receiver_type, receiver_id, subject, body, parent_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [senderType, senderId, receiver_type, receiver_id, subject, body, parent_id || null]
        );
        
        // Emit real-time notification to the receiver's room
        if (req.io) {
            req.io.to(`${receiver_type}_${receiver_id}`).emit('newMessage', {
                subject,
                senderType
            });
        }
        
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        logger.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});


router.put('/api/messages/:id/read', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const messageId = req.params.id;
        
        // Ensure user owns the message
        const [rows] = await db.query(
            'SELECT id FROM messages WHERE id = ? AND receiver_type = ? AND receiver_id = ?',
            [messageId, userRole, userId]
        );
        
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        await db.query('UPDATE messages SET is_read = 1 WHERE id = ?', [messageId]);
        res.json({ success: true, message: 'Message marked as read' });
    } catch (err) {
        logger.error('Error marking message read:', err);
        res.status(500).json({ error: 'Failed to update message' });
    }
});


    return router;
};

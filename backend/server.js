const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const winston = require('winston');

const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
const PendingStore = require('./PendingStore');
require('./cron'); // Initialize background jobs

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// JWT Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

const verifySuperAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
        }
        next();
    });
};

const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Setup Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const port = process.env.PORT || 3000;

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", credentials: true, // Allow frontend to connect
        methods: ["GET", "POST"]
    }
});

// Middleware to expose io to all routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);
    
    // Client can join a room using their user ID or role
    socket.on('join', (room) => {
        socket.join(room);
        logger.info(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
    });
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow images to load on frontend
app.use(cookieParser());

// Serve uploads statically for admin dashboard viewing
app.use('/uploads', express.static(uploadDir));

// Configure Multer for file uploads

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'document') {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    } else {
        cb(null, true); // Allow other fields like profile_pic (images)
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Temporarily increased to prevent lockout during dev
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Admin Toggle Category Active Status

// Admin Delete Category Endpoint

// Initiate Remita Payment

// Verify Remita Payment

// Dev Bypass Payment (For testing registration flow without real payment)

// Pre-Check Registration Status

// Register Contractor (with temporary dummy password)

// Middleware for authenticating JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: 'Unauthorized: No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token.' });
        req.user = user;
        next();
    });
}

// Update Contractor Profile (Step 2 of Registration)

// Contractor Login

// Get Logged-in Contractor

// Upload Document

// Corporate Details Endpoint

// --- ADMIN ENDPOINTS ---

// Admin Login

// Admin Get All Contractors

// Admin Get All Payments


// Admin Verify Contractor

// Admin Get Contractor Details (Documents & Corporate)

// Profile Update Endpoints



// Upload Profile Picture
// ==========================================
// INTERNAL MESSAGING SYSTEM
// ==========================================

// Get inbox messages

// Get sent messages

// Get unread count

// Send a message

// Mark message as read


// --- MODULAR ROUTES ---
const authRoutes = require('./routes/authRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore);
const adminRoutes = require('./routes/adminRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore);
const contractorRoutes = require('./routes/contractorRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore);
const paymentRoutes = require('./routes/paymentRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore);
const messageRoutes = require('./routes/messageRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore);
const otherRoutes = require('./routes/otherRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore);
const superAdminRoutes = require('./routes/superAdminRoutes')(db, logger, verifyToken, authenticateToken, authLimiter, upload, PendingStore, verifySuperAdmin);

app.use(authRoutes);
app.use(adminRoutes);
app.use(contractorRoutes);
app.use(paymentRoutes);
app.use(messageRoutes);
app.use(otherRoutes);
app.use(superAdminRoutes);

const errorHandler = require('./middleware/errorHandler');

// Attach global error handler at the end of routes
app.use(errorHandler);

server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});

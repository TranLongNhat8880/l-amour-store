const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { initSocket } = require('./src/config/socket');
require('dotenv').config();

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Global Rate Limiter (Prevent DDoS)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    message: { error: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau.' }
});
app.use('/api', globalLimiter);

// Restrict CORS to allowed origins
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Use API Routes (New Modular Structure)
app.use('/api', require('./src/modules'));

// Global Error Handler (Must be after all routes)
app.use(require('./src/middlewares/error.middleware'));

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Initialize Cron Jobs
const { initCronJobs } = require('./src/utils/cronJobs');
initCronJobs();

// Import DB to test connection on startup
require('./src/config/database');

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

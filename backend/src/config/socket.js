const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a room based on userId for targeted notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId);
                console.log(`User ${userId} joined their notification room`);
            }
        });

        // Join admin room
        socket.on('join_admin', () => {
            socket.join('admins');
            console.log(`Socket ${socket.id} joined admins room`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper to notify a specific user
const notifyUser = (userId, data) => {
    if (io) {
        io.to(userId).emit('notification', data);
    }
};

// Helper to notify all admins
const notifyAdmins = (data) => {
    if (io) {
        // Only emit admin_update for dashboard refresh, do not emit 'notification'
        // as NotificationModel handles the actual UI notification emission.
        io.to('admins').emit('admin_update', data);
    }
};

// Helper to notify all connected users
const notifyAll = (data) => {
    if (io) {
        io.emit('notification', data);
    }
};

module.exports = {
    initSocket,
    getIO,
    notifyUser,
    notifyAdmins,
    notifyAll
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.io event handlers
const socketHandler = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      if (!user.active) {
        return next(new Error('Authentication error: User is not active'));
      }
      
      // Attach user and permissions to socket
      socket.user = {
        id: user._id,
        role: user.role,
        permissions: decoded.permissions
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role})`);
    
    // Join room for user role
    socket.join(`role:${socket.user.role}`);
    
    // Handle patient monitoring room join
    socket.on('joinPatientRoom', (patientId) => {
      // Validate if user has permission to monitor this patient
      if (socket.user.permissions.includes('read:vitals')) {
        console.log(`User ${socket.user.id} joined patient room: ${patientId}`);
        socket.join(`patient:${patientId}`);
      } else {
        socket.emit('error', { message: 'Not authorized to monitor this patient' });
      }
    });
    
    // Handle patient monitoring room leave
    socket.on('leavePatientRoom', (patientId) => {
      console.log(`User ${socket.user.id} left patient room: ${patientId}`);
      socket.leave(`patient:${patientId}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
  
  return {
    // Function to emit vital sign updates to all listeners of a patient
    emitVitalSignUpdate: (patientId, vitalSign) => {
      io.to(`patient:${patientId}`).emit('vitalSignUpdate', vitalSign);
    },
    
    // Function to emit new alerts to all relevant users
    emitNewAlert: (alert) => {
      // Emit to all users monitoring this patient
      io.to(`patient:${alert.patientId}`).emit('newAlert', alert);
      
      // Emit to all users based on severity and role
      if (alert.severity === 'Critical') {
        io.to('role:doctor').emit('criticalAlert', alert);
        io.to('role:nurse').emit('criticalAlert', alert);
      } else if (alert.severity === 'High') {
        io.to('role:nurse').emit('highAlert', alert);
      }
    },
    
    // Function to emit alert resolution
    emitAlertResolution: (alertId, patientId) => {
      io.to(`patient:${patientId}`).emit('alertResolved', { alertId });
    }
  };
};

module.exports = socketHandler;
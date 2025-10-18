const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Test accounts database
const testAccounts = [
  {
    id: 'user-1',
    email: 'alice@stanford.edu',
    name: 'Alice Chen',
    institution: 'Stanford University',
    department: 'Materials Science',
    joinedDate: '2024-01-15T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileComplete: true,
  },
  {
    id: 'user-2',
    email: 'bob@mit.edu',
    name: 'Bob Rodriguez',
    institution: 'MIT',
    department: 'Chemical Engineering',
    joinedDate: '2024-01-20T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileComplete: true,
  },
  {
    id: 'user-3',
    email: 'charlie@berkeley.edu',
    name: 'Charlie Kim',
    institution: 'UC Berkeley',
    department: 'Physics',
    joinedDate: '2024-02-01T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileComplete: true,
  },
  {
    id: 'user-4',
    email: 'diana@stanford.edu',
    name: 'Diana Patel',
    institution: 'Stanford University',
    department: 'Chemistry',
    joinedDate: '2024-02-10T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileComplete: true,
  },
  {
    id: 'user-5',
    email: 'eve@caltech.edu',
    name: 'Eve Johnson',
    institution: 'Caltech',
    department: 'Materials Engineering',
    joinedDate: '2024-02-15T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileComplete: true,
  },
  {
    id: 'user-6',
    email: 'frank@harvard.edu',
    name: 'Frank Liu',
    institution: 'Harvard University',
    department: 'Applied Physics',
    joinedDate: '2024-02-20T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileComplete: true,
  }
];

// In-memory storage for connections and messages
const userConnections = new Map(); // userId -> Set of connected user IDs
const messages = new Map(); // conversationId -> Array of messages
const onlineUsers = new Set(); // Set of online user IDs

// Generate conversation ID between two users
const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

// API Routes
app.get('/api/users', (req, res) => {
  res.json(testAccounts);
});

app.get('/api/users/search', (req, res) => {
  const { query, currentUserId } = req.query;
  
  if (!query || !currentUserId) {
    return res.json([]);
  }

  const filteredUsers = testAccounts.filter(user => 
    user.id !== currentUserId &&
    (user.name.toLowerCase().includes(query.toLowerCase()) ||
     user.institution.toLowerCase().includes(query.toLowerCase()) ||
     user.department.toLowerCase().includes(query.toLowerCase()))
  );

  res.json(filteredUsers);
});

app.get('/api/users/:userId/connections', (req, res) => {
  const { userId } = req.params;
  const connections = userConnections.get(userId) || new Set();
  const connectedUsers = Array.from(connections).map(id => 
    testAccounts.find(user => user.id === id)
  ).filter(Boolean);
  
  res.json(connectedUsers);
});

app.post('/api/users/:userId/connections', (req, res) => {
  const { userId } = req.params;
  const { targetUserId } = req.body;
  
  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required' });
  }

  // Add bidirectional connection
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  if (!userConnections.has(targetUserId)) {
    userConnections.set(targetUserId, new Set());
  }
  
  userConnections.get(userId).add(targetUserId);
  userConnections.get(targetUserId).add(userId);
  
  res.json({ success: true });
});

app.delete('/api/users/:userId/connections/:targetUserId', (req, res) => {
  const { userId, targetUserId } = req.params;
  
  if (userConnections.has(userId)) {
    userConnections.get(userId).delete(targetUserId);
  }
  if (userConnections.has(targetUserId)) {
    userConnections.get(targetUserId).delete(userId);
  }
  
  res.json({ success: true });
});

app.get('/api/conversations/:userId', (req, res) => {
  const { userId } = req.params;
  const connections = userConnections.get(userId) || new Set();
  
  const conversations = Array.from(connections).map(connectedUserId => {
    const conversationId = getConversationId(userId, connectedUserId);
    const conversationMessages = messages.get(conversationId) || [];
    const connectedUser = testAccounts.find(user => user.id === connectedUserId);
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    
    return {
      id: conversationId,
      user: connectedUser,
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        timestamp: lastMessage.timestamp,
        senderId: lastMessage.senderId
      } : null,
      unreadCount: conversationMessages.filter(msg => 
        msg.senderId !== userId && !msg.read
      ).length
    };
  });
  
  // Sort by last message timestamp
  conversations.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
  });
  
  res.json(conversations);
});

app.get('/api/messages/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const conversationMessages = messages.get(conversationId) || [];
  res.json(conversationMessages);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User joins with their ID
  socket.on('join', (userId) => {
    socket.userId = userId;
    onlineUsers.add(userId);
    socket.join(`user-${userId}`);
    
    // Notify connections that user is online
    const connections = userConnections.get(userId) || new Set();
    connections.forEach(connectedUserId => {
      socket.to(`user-${connectedUserId}`).emit('user-online', { userId });
    });
    
    console.log(`User ${userId} joined`);
  });
  
  // Send message
  socket.on('send-message', (data) => {
    console.log('Backend received send-message:', data);
    const { conversationId, content, senderId, receiverId, type = 'text', material } = data;
    
    const message = {
      id: Date.now().toString(),
      content,
      senderId,
      receiverId,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      material
    };
    
    console.log('Backend created message:', message);
    
    // Store message
    if (!messages.has(conversationId)) {
      messages.set(conversationId, []);
    }
    messages.get(conversationId).push(message);
    
    // Send to receiver
    socket.to(`user-${receiverId}`).emit('new-message', message);
    
    // Send confirmation to sender
    socket.emit('message-sent', message);
    
    console.log(`Message sent from ${senderId} to ${receiverId} (type: ${type})`);
  });
  
  // Mark messages as read
  socket.on('mark-read', (data) => {
    const { conversationId, userId } = data;
    const conversationMessages = messages.get(conversationId) || [];
    
    conversationMessages.forEach(message => {
      if (message.senderId !== userId && !message.read) {
        message.read = true;
      }
    });
    
    // Notify sender that messages were read
    const otherUserId = conversationId.split('-').find(id => id !== userId);
    socket.to(`user-${otherUserId}`).emit('messages-read', { conversationId, userId });
  });

  // Delete message
  socket.on('delete-message', (data) => {
    const { conversationId, messageId, requesterId } = data;
    const conversationMessages = messages.get(conversationId) || [];
    const index = conversationMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      const [deleted] = conversationMessages.splice(index, 1);
      messages.set(conversationId, conversationMessages);

      // notify both participants
      const participants = conversationId.split('-');
      participants.forEach(userId => {
        socket.to(`user-${userId}`).emit('message-deleted', { conversationId, messageId });
      });
      // also notify requester directly (in case they initiated)
      socket.emit('message-deleted', { conversationId, messageId });

      console.log(`Message ${messageId} deleted by ${requesterId} in ${conversationId}`);
    }
  });
  
  // User disconnects
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      
      // Notify connections that user is offline
      const connections = userConnections.get(socket.userId) || new Set();
      connections.forEach(connectedUserId => {
        socket.to(`user-${connectedUserId}`).emit('user-offline', { userId: socket.userId });
      });
      
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Serve static files (for production)
app.use(express.static(path.join(__dirname, '../build')));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Test accounts available:');
  testAccounts.forEach(account => {
    console.log(`- ${account.name} (${account.email}) - ${account.institution}`);
  });
});

module.exports = { app, server, io };

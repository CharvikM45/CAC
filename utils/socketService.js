import io from 'socket.io-client';
import apiService from './apiService';
import { Platform } from 'react-native';

// Get the correct server URL based on platform
const getServerUrl = () => {
  // For development, try localhost first, then fallback to IP
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }
  // Try localhost first for mobile development (if using simulator/emulator)
  // If that doesn't work, use your computer's IP address
  return 'http://localhost:3001'; // Try localhost first
  // return 'http://192.168.1.10:3001'; // Fallback to IP if localhost doesn't work
};

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.currentUserId = null;
  }

  connect(userId) {
    if (!userId) {
      console.warn('SocketService: No userId provided for connection');
      return;
    }

    // Temporarily disable WebSocket connections to avoid errors
    console.log('SocketService: WebSocket connections disabled for now');
    return;

    // If already connected with the same user, don't reconnect
    if (this.socket && this.isConnected && this.currentUserId === userId) {
      console.log('SocketService: Already connected with same user, skipping connection');
      return;
    }

    console.log('SocketService: Attempting to connect with userId:', userId);
    this.currentUserId = userId;

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(getServerUrl(), {
      transports: ['websocket', 'polling'], // Add polling as fallback
      timeout: 10000, // 10 second timeout
      forceNew: true, // Force new connection
    });

    this.socket.on('connect', () => {
      console.log('SocketService: Connected to server');
      this.isConnected = true;
      this.socket.emit('join', userId);
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Disconnected from server, reason:', reason);
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection error:', error);
      this.isConnected = false;
      this.emit('connection-error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('SocketService: Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.socket.emit('join', userId);
      this.emit('connected');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('SocketService: Reconnection error:', error);
    });

    // Message events
    this.socket.on('new-message', (message) => {
      this.emit('new-message', message);
    });

    this.socket.on('message-sent', (message) => {
      this.emit('message-sent', message);
    });

    this.socket.on('messages-read', (data) => {
      this.emit('messages-read', data);
    });

    // Deletion event
    this.socket.on('message-deleted', (data) => {
      this.emit('message-deleted', data);
    });

    this.socket.on('user-online', (data) => {
      this.emit('user-online', data);
    });

    this.socket.on('user-offline', (data) => {
      this.emit('user-offline', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('SocketService: Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
    }
  }

  deleteMessage(conversationId, messageId, requesterId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete-message', { conversationId, messageId, requesterId });
    } else {
      // local fallback
      apiService.deleteLocalMessage(conversationId, messageId);
      this.emit('message-deleted', { conversationId, messageId });
    }
  }

  sendMessage(conversationId, content, senderId, receiverId, type = 'text', material = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', {
        conversationId,
        content,
        senderId,
        receiverId,
        type,
        material,
      });
    } else {
      // Fallback to local storage when backend is not available
      const message = {
        id: Date.now().toString(),
        content,
        senderId,
        receiverId,
        timestamp: new Date().toISOString(),
        read: false,
        type,
        material,
      };
      
      // Save locally
      apiService.saveLocalMessage(conversationId, message);
      
      // Emit locally
      this.emit('message-sent', message);
    }
  }

  markMessagesAsRead(conversationId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark-read', {
        conversationId,
        userId,
      });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService();

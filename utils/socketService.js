import io from 'socket.io-client';
import apiService from './apiService';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect(userId) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.socket.emit('join', userId);
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connection-error', error);
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
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
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

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User management
  async getAllUsers() {
    const backendUsers = await this.request('/users');
    const localUsers = await this.getLocalUsers();
    return [...backendUsers, ...localUsers];
  }

  async searchUsers(query, currentUserId) {
    try {
      // Get backend users
      const params = new URLSearchParams({
        query,
        currentUserId,
      });
      const backendUsers = await this.request(`/users/search?${params}`);
      
      // Get local users
      const localUsers = await this.getLocalUsers();
      const filteredLocalUsers = localUsers.filter(user => 
        user.id !== currentUserId &&
        (user.name.toLowerCase().includes(query.toLowerCase()) ||
         user.institution.toLowerCase().includes(query.toLowerCase()) ||
         user.department.toLowerCase().includes(query.toLowerCase()))
      );
      
      return [...backendUsers, ...filteredLocalUsers];
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to local users only
      const localUsers = await this.getLocalUsers();
      return localUsers.filter(user => 
        user.id !== currentUserId &&
        (user.name.toLowerCase().includes(query.toLowerCase()) ||
         user.institution.toLowerCase().includes(query.toLowerCase()) ||
         user.department.toLowerCase().includes(query.toLowerCase()))
      );
    }
  }

  async getLocalUsers() {
    try {
      const usersData = await AsyncStorage.getItem('mataid_users');
      if (usersData) {
        const users = JSON.parse(usersData);
        return Object.values(users).map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          institution: user.institution,
          department: user.department,
          joinedDate: user.joinedDate,
          lastLogin: user.lastLogin,
          profileComplete: user.profileComplete,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting local users:', error);
      return [];
    }
  }

  async getUserConnections(userId) {
    try {
      // Get backend connections
      const backendConnections = await this.request(`/users/${userId}/connections`);
      
      // Get local connections
      const localConnections = await this.getLocalConnections(userId);
      
      // Combine and deduplicate
      const allConnections = [...backendConnections, ...localConnections];
      const uniqueConnections = allConnections.filter((connection, index, self) => 
        index === self.findIndex(c => c.id === connection.id)
      );
      
      return uniqueConnections;
    } catch (error) {
      console.error('Error getting connections:', error);
      // Fallback to local connections only
      return await this.getLocalConnections(userId);
    }
  }

  async addConnection(userId, targetUserId) {
    try {
      console.log('Adding connection:', userId, '->', targetUserId);
      // Try backend first
      await this.request(`/users/${userId}/connections`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      console.log('Backend connection added successfully');
    } catch (error) {
      console.log('Backend connection failed, using local storage:', error);
    }
    
    // Always store locally as well
    await this.addLocalConnection(userId, targetUserId);
    console.log('Local connection added successfully');
    return { success: true };
  }

  async removeConnection(userId, targetUserId) {
    try {
      // Try backend first
      await this.request(`/users/${userId}/connections/${targetUserId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('Backend connection removal failed, using local storage');
    }
    
    // Always remove locally as well
    await this.removeLocalConnection(userId, targetUserId);
    return { success: true };
  }

  async getLocalConnections(userId) {
    try {
      const connectionsData = await AsyncStorage.getItem(`connections_${userId}`);
      if (connectionsData) {
        const connectionIds = JSON.parse(connectionsData);
        const allUsers = await this.getAllUsers();
        return connectionIds.map(id => allUsers.find(user => user.id === id)).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error getting local connections:', error);
      return [];
    }
  }

  async addLocalConnection(userId, targetUserId) {
    try {
      console.log('Adding local connection:', userId, '->', targetUserId);
      const connectionsData = await AsyncStorage.getItem(`connections_${userId}`);
      const connections = connectionsData ? JSON.parse(connectionsData) : [];
      console.log('Current local connections:', connections);
      
      if (!connections.includes(targetUserId)) {
        connections.push(targetUserId);
        await AsyncStorage.setItem(`connections_${userId}`, JSON.stringify(connections));
        console.log('Local connection added, new connections:', connections);
      } else {
        console.log('Connection already exists locally');
      }
    } catch (error) {
      console.error('Error adding local connection:', error);
    }
  }

  async removeLocalConnection(userId, targetUserId) {
    try {
      const connectionsData = await AsyncStorage.getItem(`connections_${userId}`);
      if (connectionsData) {
        const connections = JSON.parse(connectionsData);
        const updatedConnections = connections.filter(id => id !== targetUserId);
        await AsyncStorage.setItem(`connections_${userId}`, JSON.stringify(updatedConnections));
      }
    } catch (error) {
      console.error('Error removing local connection:', error);
    }
  }

  // Chat management
  async getConversations(userId) {
    try {
      // Get backend conversations
      const backendConversations = await this.request(`/conversations/${userId}`);
      
      // Get local conversations
      const localConversations = await this.getLocalConversations(userId);
      
      // Combine and deduplicate
      const allConversations = [...backendConversations, ...localConversations];
      const uniqueConversations = allConversations.filter((conversation, index, self) => 
        index === self.findIndex(c => c.id === conversation.id)
      );
      
      return uniqueConversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      // Fallback to local conversations only
      return await this.getLocalConversations(userId);
    }
  }

  async getMessages(conversationId) {
    try {
      // Try backend first
      return await this.request(`/messages/${conversationId}`);
    } catch (error) {
      console.log('Backend messages failed, using local storage');
      // Fallback to local messages
      return await this.getLocalMessages(conversationId);
    }
  }

  async getLocalConversations(userId) {
    try {
      console.log('Getting local conversations for user:', userId);
      const connections = await this.getLocalConnections(userId);
      console.log('Found connections:', connections);
      const conversations = [];
      
      for (const connection of connections) {
        const conversationId = [userId, connection.id].sort().join('-');
        const messages = await this.getLocalMessages(conversationId);
        const lastMessage = messages[messages.length - 1];
        
        conversations.push({
          id: conversationId,
          user: connection,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            senderId: lastMessage.senderId
          } : null,
          unreadCount: messages.filter(msg => 
            msg.senderId !== userId && !msg.read
          ).length
        });
      }
      
      console.log('Created conversations:', conversations);
      
      // Sort by last message timestamp
      conversations.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      });
      
      return conversations;
    } catch (error) {
      console.error('Error getting local conversations:', error);
      return [];
    }
  }

  async getLocalMessages(conversationId) {
    try {
      const messagesData = await AsyncStorage.getItem(`messages_${conversationId}`);
      return messagesData ? JSON.parse(messagesData) : [];
    } catch (error) {
      console.error('Error getting local messages:', error);
      return [];
    }
  }

  async saveLocalMessage(conversationId, message) {
    try {
      console.log('Saving local message:', { conversationId, message });
      const messages = await this.getLocalMessages(conversationId);
      messages.push(message);
      await AsyncStorage.setItem(`messages_${conversationId}`, JSON.stringify(messages));
      console.log('Message saved successfully');
    } catch (error) {
      console.error('Error saving local message:', error);
    }
  }

  async deleteLocalMessage(conversationId, messageId) {
    try {
      const messages = await this.getLocalMessages(conversationId);
      const filtered = messages.filter(m => m.id !== messageId);
      await AsyncStorage.setItem(`messages_${conversationId}`, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting local message:', error);
    }
  }

  async getDeletedMessageIds(conversationId) {
    try {
      const data = await AsyncStorage.getItem(`deleted_${conversationId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading deleted message ids:', error);
      return [];
    }
  }

  async addDeletedMessageId(conversationId, messageId) {
    try {
      const existing = await this.getDeletedMessageIds(conversationId);
      if (!existing.includes(messageId)) {
        existing.push(messageId);
        await AsyncStorage.setItem(`deleted_${conversationId}`, JSON.stringify(existing));
      }
    } catch (error) {
      console.error('Error writing deleted message id:', error);
    }
  }
}

export default new ApiService();

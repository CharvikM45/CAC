import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple authentication service (for demo purposes - in production, use a proper backend)
class AuthService {
  constructor() {
    this.usersKey = 'mataid_users';
    this.currentUserKey = 'mataid_current_user';
  }

  // Generate a simple user ID
  generateUserId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Hash password (simple implementation - use proper hashing in production)
  hashPassword(password) {
    // In production, use bcrypt or similar
    return btoa(password + 'mataid_salt');
  }

  // Get all users from storage
  async getAllUsers() {
    try {
      const usersData = await AsyncStorage.getItem(this.usersKey);
      return usersData ? JSON.parse(usersData) : {};
    } catch (error) {
      console.error('Error getting users:', error);
      return {};
    }
  }

  // Save users to storage
  async saveUsers(users) {
    try {
      await AsyncStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  // Register a new user
  async register(userData) {
    try {
      const { email, password, name, institution, department } = userData;
      
      // Validate required fields
      if (!email || !password || !name || !institution) {
        throw new Error('All required fields must be filled');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const users = await this.getAllUsers();
      
      // Check if user already exists
      if (users[email]) {
        throw new Error('An account with this email already exists');
      }

      // Create new user
      const userId = this.generateUserId();
      const hashedPassword = this.hashPassword(password);
      
      const newUser = {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        institution: institution.trim(),
        department: department?.trim() || '',
        joinedDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileComplete: true,
      };

      users[email] = newUser;
      await this.saveUsers(users);
      
      // Set as current user
      await this.setCurrentUser(newUser);
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const users = await this.getAllUsers();
      const user = users[email.toLowerCase()];
      
      if (!user) {
        throw new Error('No account found with this email');
      }

      const hashedPassword = this.hashPassword(password);
      if (user.password !== hashedPassword) {
        throw new Error('Invalid password');
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      users[email.toLowerCase()] = user;
      await this.saveUsers(users);

      // Set as current user
      await this.setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Set current user
  async setCurrentUser(user) {
    try {
      await AsyncStorage.setItem(this.currentUserKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(this.currentUserKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Logout user
  async logout() {
    try {
      await AsyncStorage.removeItem(this.currentUserKey);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const users = await this.getAllUsers();
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser || currentUser.id !== userId) {
        throw new Error('Unauthorized to update this profile');
      }

      // Find user by ID
      let userToUpdate = null;
      let userEmail = null;
      
      for (const [email, user] of Object.entries(users)) {
        if (user.id === userId) {
          userToUpdate = user;
          userEmail = email;
          break;
        }
      }

      if (!userToUpdate) {
        throw new Error('User not found');
      }

      // Update user data (exclude sensitive fields)
      const allowedUpdates = ['name', 'institution', 'department'];
      const updatedUser = { ...userToUpdate };
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          updatedUser[field] = updates[field].trim();
        }
      });

      updatedUser.updatedAt = new Date().toISOString();
      
      users[userEmail] = updatedUser;
      await this.saveUsers(users);
      await this.setCurrentUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Reset password (placeholder for future implementation)
  async resetPassword(email) {
    // In production, this would send a reset email
    throw new Error('Password reset not implemented yet');
  }

  // Delete account
  async deleteAccount(userId) {
    try {
      const users = await this.getAllUsers();
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser || currentUser.id !== userId) {
        throw new Error('Unauthorized to delete this account');
      }

      // Find and remove user
      let userEmail = null;
      for (const [email, user] of Object.entries(users)) {
        if (user.id === userId) {
          userEmail = email;
          break;
        }
      }

      if (userEmail) {
        delete users[userEmail];
        await this.saveUsers(users);
        await this.logout();
        return true;
      }

      throw new Error('User not found');
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  }

  // Clear all data (for development/reset purposes)
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        this.usersKey,
        this.currentUserKey,
        'userData', // Old user data
        'migration_completed', // Migration flag
        'favorites', // User favorites
      ]);
      console.log('All authentication data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AuthService();

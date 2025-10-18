import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import apiService from '../utils/apiService';
import socketService from '../utils/socketService';
import MaterialPickerModal from '../components/MaterialPickerModal';
import MaterialMessage from '../components/MaterialMessage';
import MaterialCard from '../components/MaterialCard';
import { materialsData } from '../data/materialsData';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, otherUser, currentUserId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const flatListRef = useRef(null);

  // Safety check for otherUser
  if (!otherUser || !otherUser.name) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: User information not available</Text>
        <TouchableOpacity
          style={styles.errorBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    loadMessages();
    
    // Listen for new messages
    socketService.on('new-message', handleNewMessage);
    socketService.on('message-sent', handleMessageSent);
    socketService.on('messages-read', handleMessagesRead);
    socketService.on('message-deleted', handleMessageDeleted);
    
    return () => {
      socketService.off('new-message', handleNewMessage);
      socketService.off('message-sent', handleMessageSent);
      socketService.off('messages-read', handleMessagesRead);
      socketService.off('message-deleted', handleMessageDeleted);
    };
  }, [conversationId]);

  useEffect(() => {
    // Mark messages as read when screen is focused
    markMessagesAsRead();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const conversationMessages = await apiService.getMessages(conversationId);
      const deletedIds = await apiService.getDeletedMessageIds(conversationId);
      const filtered = conversationMessages.filter(m => !deletedIds.includes(m.id));
      console.log('Loaded messages (filtered):', filtered);
      setMessages(filtered);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    console.log('Received new message:', message);
    if (message.senderId === otherUser.id || message.senderId === currentUserId) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
  };

  const handleMessageSent = (message) => {
    console.log('Message sent confirmation:', message);
    if (message.senderId === currentUserId) {
      setMessages(prev => [...prev, message]);
      setSending(false);
      scrollToBottom();
    }
  };

  const handleMessagesRead = (data) => {
    if (data.conversationId === conversationId && data.userId === otherUser.id) {
      setMessages(prev => 
        prev.map(msg => 
          msg.senderId === currentUserId ? { ...msg, read: true } : msg
        )
      );
    }
  };

  const handleMessageDeleted = ({ conversationId: cid, messageId }) => {
    if (cid === conversationId) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      // also remove locally for offline parity
      apiService.deleteLocalMessage(conversationId, messageId);
      apiService.addDeletedMessageId(conversationId, messageId);
    }
  };

  const handleDeleteMessage = (messageId) => {
    try {
      // Optimistic update
      setMessages(prev => prev.filter(m => m.id !== messageId));
      apiService.deleteLocalMessage(conversationId, messageId);
      apiService.addDeletedMessageId(conversationId, messageId);
      socketService.deleteMessage(conversationId, messageId, currentUserId);
    } catch (e) {
      console.error('Delete message failed', e);
    }
  };

  const markMessagesAsRead = () => {
    socketService.markMessagesAsRead(conversationId, currentUserId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    socketService.sendMessage(
      conversationId,
      messageContent,
      currentUserId,
      otherUser.id
    );
  };

  const handleSelectMaterial = async (material) => {
    try {
      setSending(true);

      const messageContent = `Shared material: ${material['Material Name']}`;
      
      socketService.sendMessage(
        conversationId,
        messageContent,
        currentUserId,
        otherUser.id,
        'material',
        material
      );

    } catch (error) {
      console.error('Error sharing material:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = ({ item: message }) => {
    const isOwn = message.senderId === currentUserId;
    
    // Debug log to check message structure
    console.log('Rendering message:', { 
      type: message.type, 
      hasMaterial: !!message.material,
      content: message.content,
      fullMessage: message
    });
    
    // If type/material missing, try to infer from content
    let inferredMaterial = message.material;
    if (!inferredMaterial && typeof message.content === 'string' && message.content.startsWith('Shared material:')) {
      const name = message.content.replace('Shared material:', '').trim();
      inferredMaterial = materialsData.find(m => m['Material Name'] === name);
    }

    // Handle material messages - check both type field and inferred material
    if ((message.type === 'material' || message.content?.startsWith('Shared material:')) && inferredMaterial) {
      console.log('Rendering as material card with material:', inferredMaterial['Material Name']);
      return (
        <View style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage
        ]}>
          <View style={styles.materialWrapper}>
            <MaterialCard
              material={inferredMaterial}
              isFavorite={false}
              onToggleFavorite={() => {}}
              onPress={() => {}}
              isSelectedForCompare={false}
              onToggleCompare={() => {}}
            />
            {isOwn && (
              <TouchableOpacity
                style={styles.deleteFab}
                onPress={() => handleDeleteMessage(message.id)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }
    
    // Handle regular text messages
    console.log('Rendering as text message');
    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwn ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(message.timestamp)}
            </Text>
            {isOwn && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={message.read ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={message.read ? Colors.primary : Colors.textSecondary}
                  style={styles.readIcon}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMessage(message.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser.name}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderMessage({ item })}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowMaterialPicker(true)}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.secondary} />
          )}
        </TouchableOpacity>
      </View>

      <MaterialPickerModal
        visible={showMaterialPicker}
        onClose={() => setShowMaterialPicker(false)}
        onSelectMaterial={handleSelectMaterial}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.secondary,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: Colors.secondary,
  },
  otherMessageTime: {
    color: Colors.textSecondary,
  },
  readIcon: {
    marginLeft: 4,
  },
  deleteButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  materialWrapper: {
    position: 'relative',
    width: '80%',
  },
  deleteFab: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error || '#ff4444',
    textAlign: 'center',
    marginTop: 50,
  },
  errorBackButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;

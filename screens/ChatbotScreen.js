import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { generateOpenAISuggestion } from '../utils/openaiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileButton from '../components/ProfileButton';

const SYSTEM_PROMPT = `You are an expert materials scientist and sustainability consultant specializing in sustainable materials design. Your role is to provide comprehensive, personalized recommendations for materials based on user needs.

When responding to user requests:
1. Analyze the specific requirements and constraints mentioned
2. Consider environmental impact, sustainability, and biodegradability
3. Evaluate cost-effectiveness and practical applications
4. Suggest specific materials with detailed properties and characteristics
5. Provide clear reasoning for your recommendations
6. Include information about availability, processing methods, and end-of-life considerations
7. Be specific and actionable in your advice

Always tailor your response to the user's specific needs rather than providing generic information. Focus on practical solutions and real-world applications.`;

// Matches your app palette
const ChatPalette = {
  bg: Colors.background,
  appBarBg: Colors.surface,
  appBarText: Colors.text,
  appBarSecondary: Colors.textSecondary,
  sentBg: '#1A73E8',
  sentText: '#FFFFFF',
  recvBg: Colors.card,
  recvText: Colors.text,
  border: Colors.border,
  inputBg: Colors.card,
  placeholder: Colors.textSecondary,
  icon: Colors.textSecondary,
};

// Height of your floating bottom tab bar area so we clear it
const TABBAR_CLEARANCE = 100;

const Avatar = ({ label = 'AI' }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{label}</Text>
  </View>
);

const TypingBubble = () => (
  <View style={[styles.row, styles.assistantRow, { paddingHorizontal: 24 }]}>
    <Avatar />
    <View>
      <View style={[styles.bubble, styles.assistantBubble]}>
        <View style={styles.typingDots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
      <Text style={[styles.timestamp, styles.assistantTimestamp]}>Typing…</Text>
    </View>
  </View>
);

const MessageBubble = ({ role, text, timestamp }) => {
  const isUser = role === 'user';
  if (isUser) {
    return (
      <View style={[styles.row, styles.userRow, { paddingHorizontal: 24 }]}>
        <View>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={[styles.bubbleText, styles.userText]}>{text}</Text>
          </View>
          <Text style={[styles.timestamp, styles.userTimestamp]}>{timestamp}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.row, styles.assistantRow, { paddingHorizontal: 24 }]}>
      <Avatar />
      <View>
        <View style={[styles.bubble, styles.assistantBubble]}>
          <Text style={[styles.bubbleText, styles.assistantText]}>{text}</Text>
        </View>
        <Text style={[styles.timestamp, styles.assistantTimestamp]}>{timestamp}</Text>
      </View>
    </View>
  );
};

const ChatbotScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        "Hi! I'm your sustainable materials assistant. Describe your product idea or problem, and I'll suggest biodegradable materials considering durability, moisture resistance, cost, and biodegradability.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState(72); // measured below
  const listRef = useRef(null);

  const canSend = useMemo(() => !!input.trim() && !loading, [input, loading]);

  useEffect(() => {
    if (listRef.current) {
      setTimeout(() => listRef.current.scrollToEnd({ animated: true }), 120);
    }
  }, [messages, loading, inputBarHeight]);

  const formatTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: formatTimestamp(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    try {
      const prompt = `User request: "${text}"\n\nPlease provide a comprehensive analysis and recommendation for sustainable materials. Focus on:\n- Material properties and characteristics\n- Environmental impact and sustainability\n- Cost considerations\n- Practical applications\n- Biodegradability and recyclability\n\nProvide detailed, specific recommendations based on the user's needs.`;
      const modelText = await generateOpenAISuggestion(prompt, SYSTEM_PROMPT);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: modelText,
          timestamp: formatTimestamp(),
        },
      ]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `Sorry, I encountered an error: ${error.message}. Please check your API key configuration and try again.`,
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <MessageBubble role={item.role} text={item.text} timestamp={item.timestamp} />
  );

  // Exact padding so last message sits above the input and the floating tab bar
  const listBottomPadding = inputBarHeight + TABBAR_CLEARANCE + 8;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ChatPalette.appBarBg} />

        {/* App Bar — matches your other screens */}
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Text style={styles.appBarTitle}>Materials Assistant</Text>
            <Text style={styles.appBarSubtitle}>Active now</Text>
          </View>
          <View style={styles.appBarRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search" size={22} color={ChatPalette.icon} />
            </TouchableOpacity>
            <ProfileButton onPress={() => navigation.navigate('Profile')} userData={null} />
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          {loading && <TypingBubble />}

          {/* Input bar — normal flow, raised above the tab bar */}
          <View
            style={[
              styles.inputContainer,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                marginBottom: TABBAR_CLEARANCE, // Keep margin to clear tab bar
              },
            ]}
            onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.leftIconBtn}>
                <Ionicons name="attach-outline" size={22} color={ChatPalette.icon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.leftIconBtn}>
                <Ionicons name="image-outline" size={22} color={ChatPalette.icon} />
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Text message"
                placeholderTextColor={ChatPalette.placeholder}
                style={styles.input}
                multiline
                maxLength={500}
                returnKeyType="default"
                blurOnSubmit={false}
              />

              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.micBtn]}
                onPress={canSend ? handleSend : undefined}
                disabled={!canSend}
              >
                {canSend ? (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                ) : (
                  <Ionicons name="mic" size={20} color={ChatPalette.icon} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatPalette.bg,
  },
  chatContainer: {
    flex: 1,
  },

  // App bar spacing that matches Profile/Explore
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 24, // your Explore screenshot shows 24
    backgroundColor: ChatPalette.appBarBg,
    borderBottomWidth: 1,
    borderBottomColor: ChatPalette.border,
  },
  appBarLeft: { flex: 1 },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appBarTitle: { color: ChatPalette.appBarText, fontSize: 20, fontWeight: '700' },
  appBarSubtitle: { color: ChatPalette.appBarSecondary, fontSize: 12, marginTop: 4 },
  iconBtn: { padding: 8, borderRadius: 20 },

  // Messages area uses the same side/top padding as other screens
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // Bubbles
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D3A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: { color: '#8AB4F8', fontWeight: '700' },

  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 8 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: ChatPalette.sentBg,
    borderBottomRightRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  assistantBubble: {
    backgroundColor: ChatPalette.recvBg,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ChatPalette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  userText: { color: ChatPalette.sentText },
  assistantText: { color: ChatPalette.recvText },

  timestamp: {
    fontSize: 11,
    color: ChatPalette.appBarSecondary,
    marginTop: 4,
    marginHorizontal: 10,
  },
  userTimestamp: { textAlign: 'right' },
  assistantTimestamp: { textAlign: 'left' },

  // Input bar — consistent look; not absolute
  inputContainer: {
    backgroundColor: ChatPalette.appBarBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ChatPalette.border,
    paddingHorizontal: 24, // matches content padding
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChatPalette.inputBg,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ChatPalette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftIconBtn: { padding: 8, borderRadius: 20 },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    color: ChatPalette.recvText,
    fontSize: 15,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: ChatPalette.sentBg,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  micBtn: { backgroundColor: 'transparent' },

  // Typing indicator
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9AA0A6', opacity: 0.9 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 0.5 },
});

export default ChatbotScreen;

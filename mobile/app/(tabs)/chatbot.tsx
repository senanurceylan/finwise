import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUi } from '@/components/common/ui';
import { ThemedText } from '@/components/themed-text';
import { usePreferences } from '@/context/PreferencesContext';
import { api } from '@/lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

type ChatbotMessageResponse = {
  reply: string;
};

const COPY = {
  tr: {
    title: 'Finans Asistanı',
    placeholder: 'Mesajınızı yazın…',
    send: 'Gönder',
    empty: 'Sohbete başlamak için bir mesaj gönderin.',
    fallbackError: 'Şu anda finans asistanına ulaşılamıyor. Lütfen daha sonra tekrar deneyin.',
  },
  en: {
    title: 'Finance Assistant',
    placeholder: 'Type your message…',
    send: 'Send',
    empty: 'Send a message to start the conversation.',
    fallbackError: 'The finance assistant is currently unavailable. Please try again later.',
  },
};

function createMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
  };
}

export default function ChatbotScreen() {
  const ui = useUi();
  const insets = useSafeAreaInsets();
  const { language } = usePreferences();
  const t = COPY[language] || COPY.tr;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length === 0 && !isTyping) return;
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, createMessage('user', text)]);
    setInput('');
    setIsTyping(true);

    let reply = t.fallbackError;

    try {
      const response = await api.post<ChatbotMessageResponse>('/chatbot/message', { message: text });
      if (typeof response?.reply === 'string' && response.reply.trim()) {
        reply = response.reply.trim();
      }
    } catch {
      // Backend hatasında fallback mesajı göster.
    }

    setMessages((prev) => [...prev, createMessage('bot', reply)]);
    setIsTyping(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: 'rgba(240, 185, 11, 0.18)', borderColor: 'rgba(240, 185, 11, 0.35)' }
              : { backgroundColor: ui.cardBg, borderColor: ui.border },
          ]}>
          <ThemedText style={[styles.bubbleText, { color: ui.text }]}>{item.text}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: ui.pageBg }]}>
      <View style={[styles.header, { borderBottomColor: ui.border }]}>
        <ThemedText type="title">{t.title}</ThemedText>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 ? styles.messagesContentEmpty : null,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          ListEmptyComponent={
            !isTyping ? (
              <ThemedText style={[styles.emptyText, { color: ui.muted }]}>{t.empty}</ThemedText>
            ) : null
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.messageRowBot}>
                <ThemedText style={[styles.typingText, { color: ui.muted }]}>…</ThemedText>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.composer,
            {
              borderTopColor: ui.border,
              backgroundColor: ui.pageBg,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.placeholder}
            placeholderTextColor={ui.muted}
            style={[
              styles.input,
              { backgroundColor: ui.cardBg, borderColor: ui.border, color: ui.text },
            ]}
            multiline
            maxLength={500}
            editable={!isTyping}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: ui.brand },
              (!input.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || isTyping}>
            <ThemedText style={[styles.sendButtonText, { color: ui.pageBg }]}>{t.send}</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  messagesContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 24,
  },
  messageRow: {
    width: '100%',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowBot: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  typingText: {
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  composer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  input: {
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

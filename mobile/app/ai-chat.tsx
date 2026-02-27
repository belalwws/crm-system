import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, timeAgo } from '@/lib/utils';
import { Card, LoadingScreen, EmptyState } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { ChatSession, ChatMessage } from '@/lib/types';

export default function AIChatScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const flatListRef = useRef<FlatList>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSessions, setShowSessions] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await api.listChatSessions();
      if (res.success) setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [getAuthToken]);

  useEffect(() => { fetchSessions(); }, []);

  const loadSession = async (sessionId: string) => {
    setActiveSession(sessionId);
    setShowSessions(false);
    try {
      const token = await getAuthToken();
      const res = await api.getChatMessages(sessionId);
      if (res.success) setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const createSession = async () => {
    try {
      const token = await getAuthToken();
      const res = await api.createChatSession({ title: 'New Chat' });
      if (res.success && res.data) {
        setSessions(prev => [res.data!, ...prev]);
        loadSession(res.data.id);
      }
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic add
    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(), role: 'user',
      content: text, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const token = await getAuthToken();
      let sessId = activeSession;
      if (!sessId) {
        const sessRes = await api.createChatSession({ title: text.substring(0, 50) });
        if (sessRes.success && sessRes.data) {
          sessId = sessRes.data.id;
          setActiveSession(sessId);
          setSessions(prev => [sessRes.data!, ...prev]);
        }
      }
      if (!sessId) return;

      const res = await api.sendChatMessage(sessId, { content: text });
      if (res.success && res.data) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempMsg.id);
          const newMsgs = Array.isArray(res.data) ? res.data : [res.data];
          return [...filtered, ...newMsgs];
        });
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
  };

  if (loading) return <LoadingScreen />;

  // Sessions list view
  if (showSessions) {
    return (
      <>
        <Stack.Screen options={{
          title: 'AI Assistant',
          headerRight: () => (
            <TouchableOpacity onPress={createSession}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {sessions.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40, backgroundColor: '#8b5cf620',
                alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
              }}>
                <Ionicons name="sparkles" size={40} color="#8b5cf6" />
              </View>
              <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                AI CRM Assistant
              </Text>
              <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                Ask about your customers, deals, market trends, or get AI-powered insights
              </Text>
              <TouchableOpacity
                onPress={createSession}
                style={{
                  backgroundColor: colors.primary, borderRadius: BorderRadius.lg,
                  paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.xl,
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                }}
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: '600' }}>Start a Chat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: Spacing.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => loadSession(item.id)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
                    marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
                    flexDirection: 'row', alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf620',
                    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
                  }}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                      {item.title || 'New Chat'}
                    </Text>
                    <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                      {timeAgo(item.updatedAt || item.createdAt)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </>
    );
  }

  // Chat view
  return (
    <>
      <Stack.Screen options={{
        title: 'AI Chat',
        headerLeft: () => (
          <TouchableOpacity onPress={() => { setShowSessions(true); setActiveSession(null); setMessages([]); }} style={{ marginRight: Spacing.md }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="sparkles" size={48} color="#8b5cf6" />
              <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, marginTop: Spacing.md }}>
                Ask me anything about your CRM data
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%', marginBottom: Spacing.md,
              }}>
                <View style={{
                  backgroundColor: isUser ? colors.primary : colors.card,
                  borderRadius: BorderRadius.lg,
                  borderTopRightRadius: isUser ? 4 : BorderRadius.lg,
                  borderTopLeftRadius: isUser ? BorderRadius.lg : 4,
                  padding: Spacing.md,
                  borderWidth: isUser ? 0 : 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: FontSize.md, color: isUser ? '#fff' : colors.text, lineHeight: 22,
                  }}>
                    {item.content}
                  </Text>
                </View>
                <Text style={{
                  fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 4,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={{
          flexDirection: 'row', padding: Spacing.md, paddingBottom: Spacing.lg,
          backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
          alignItems: 'flex-end', gap: Spacing.sm,
        }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask the AI assistant..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={2000}
            style={{
              flex: 1, backgroundColor: colors.background, borderRadius: BorderRadius.lg,
              borderWidth: 1, borderColor: colors.border, paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm, fontSize: FontSize.md, color: colors.text,
              maxHeight: 100, minHeight: 40,
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
              opacity: input.trim() && !sending ? 1 : 0.5,
            }}
          >
            <Ionicons name={sending ? 'hourglass' : 'send'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

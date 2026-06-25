import React, { useEffect, useRef, useCallback } from "react";
import { useChatMessages } from "@/hooks/useChatMessages";
import { View, Text, Pressable, TextInput, FlatList, Platform, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import type { ChatMessage } from "@/lib/types";
import {
  GRAY_105,
  GRAY_170,
  GRAY_450,
  GRAY_600,
  GRAY_850,
  PURPLE,
  WHITE,
  WHITE_A70,
} from "@/constants/colors";

import styles from "@/styles/chat/[id]";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, getMessages, sendMessage } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const {
    messages, setMessages,
    text, setText,
    loading, setLoading,
    sending, setSending,
    requestName, setRequestName,
    otherName, setOtherName,
  } = useChatMessages();
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    const url = new URL(`/api/requests/${id}`, getApiUrl());
    fetch(url.toString(), { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setRequestName(data.locationName || "Chat");
          const isCreator = user?.id === data.creatorId;
          setOtherName(isCreator ? "LoKater" : "Seeker");
        }
      })
      .catch(() => {});
  }, [id, user?.id]);

  const loadMessages = useCallback(async () => {
    if (!id) return;
    const msgs = await getMessages(id);
    setMessages(msgs);
    setLoading(false);
  }, [id, getMessages]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadMessages]);

  const handleSend = async () => {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    const msg = await sendMessage(id, text.trim());
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setText("");
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 + webInsetTop }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GRAY_850} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{requestName}</Text>
          <Text style={styles.headerSub}>{otherName}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={PURPLE} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={40} color={GRAY_170} />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation about this request</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={GRAY_450}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Ionicons name="send" size={18} color={WHITE} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

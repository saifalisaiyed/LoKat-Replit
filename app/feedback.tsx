import React from "react";
import { useFeedbackForm, type FeedbackType } from "@/hooks/useFeedbackForm";
import { View, Text, Pressable, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView, Alert } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import {
  EMERALD,
  GRAY_105,
  GRAY_120,
  GRAY_125,
  GRAY_150,
  GRAY_370,
  GRAY_600,
  GRAY_850,
  ORANGE,
  ORANGE_A08,
  PURPLE,
  PURPLE_A08,
  WHITE,
} from "@/constants/colors";

import styles from "./feedback.styles";

const TYPES: { key: FeedbackType; label: string; icon: string; color: string; bg: string }[] = [
  { key: "feedback", label: "General Feedback", icon: "message-square", color: PURPLE, bg: PURPLE_A08 },
  { key: "bug", label: "Bug Report", icon: "alert-triangle", color: ORANGE, bg: ORANGE_A08 },
];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const {
    type, setType,
    message, setMessage,
    loading, setLoading,
    sent, setSent,
  } = useFeedbackForm();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const canSubmit = message.trim().length >= 10;

  const handleSend = async () => {
    if (!canSubmit || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await apiRequest("POST", "/api/feedback", { type, message: message.trim() });
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_sendError: any) {
      Alert.alert("Error", "Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={GRAY_850} />
          </Pressable>
          <Text style={styles.title}>Send Feedback</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={EMERALD} />
          </View>
          <Text style={styles.successTitle}>Thank you!</Text>
          <Text style={styles.successText}>
            Your {type === "bug" ? "bug report" : "feedback"} has been sent to the LoKat team. We read every message and will use it to improve the app.
          </Text>
          <Pressable
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + webInsetTop }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={GRAY_850} />
        </Pressable>
        <Text style={styles.title}>Send Feedback</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>
          {"Help us improve LoKat. Whether it's a bug, a suggestion, or general thoughts — we want to hear from you."}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What kind of message?</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const active = type === t.key;
              return (
                <Pressable
                  key={t.key}
                  style={[
                    styles.typeCard,
                    active && { borderColor: t.color, borderWidth: 2, backgroundColor: t.bg },
                    !active && { borderColor: GRAY_150, borderWidth: 1.5 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setType(t.key);
                  }}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: active ? t.bg : GRAY_105 }]}>
                    <Feather name={t.icon as any} size={20} color={active ? t.color : GRAY_600} />
                  </View>
                  <Text style={[styles.typeLabel, active && { color: t.color, fontFamily: "Archivo_600SemiBold" }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder={
              type === "bug"
                ? "Describe the bug: what happened, what you expected, and how to reproduce it..."
                : "Share your thoughts, ideas, or suggestions..."
            }
            placeholderTextColor={GRAY_370}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
          <Text style={styles.charCount}>{message.trim().length} characters{message.trim().length < 10 ? " (minimum 10)" : ""}</Text>
        </View>

        <View style={styles.privacyNote}>
          <Feather name="lock" size={13} color={GRAY_600} />
          <Text style={styles.privacyText}>
            Your account email is included so we can follow up if needed. Messages go directly to the LoKat team.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && { opacity: 0.88 },
            (!canSubmit || loading) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Feather name="send" size={16} color={WHITE} />
              <Text style={styles.sendBtnText}>Send Message</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

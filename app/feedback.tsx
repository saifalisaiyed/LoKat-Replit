import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";
import { EMERALD, GRAY_105, GRAY_120, GRAY_125, GRAY_150, GRAY_370, ORANGE, ORANGE_A08, PURPLE_A08, WHITE } from "@/constants/colors";

type FeedbackType = "feedback" | "bug";

const TYPES: { key: FeedbackType; label: string; icon: string; color: string; bg: string }[] = [
  { key: "feedback", label: "General Feedback", icon: "message-square", color: Colors.light.tint, bg: PURPLE_A08 },
  { key: "bug", label: "Bug Report", icon: "alert-triangle", color: ORANGE, bg: ORANGE_A08 },
];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
            <Feather name="arrow-left" size={20} color={Colors.light.text} />
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
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
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
          Help us improve LoKat. Whether it's a bug, a suggestion, or general thoughts — we want to hear from you.
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
                    <Feather name={t.icon as any} size={20} color={active ? t.color : Colors.light.textSecondary} />
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
          <Feather name="lock" size={13} color={Colors.light.textSecondary} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_105 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: GRAY_105, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Archivo_600SemiBold", color: Colors.light.text },
  content: { padding: 20 },
  introText: {
    fontSize: 14, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", lineHeight: 20, marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold", textTransform: "uppercase",
    letterSpacing: 0.6, marginBottom: 10, marginLeft: 2,
  },
  typeRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 10,
  },
  typeIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  typeLabel: {
    fontSize: 13, fontFamily: "Archivo_500Medium",
    color: Colors.light.textSecondary, textAlign: "center",
  },
  messageInput: {
    backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5,
    borderColor: GRAY_150, padding: 16,
    fontSize: 14, color: Colors.light.text,
    fontFamily: "Archivo_400Regular", minHeight: 150,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", marginTop: 6, marginLeft: 2,
  },
  privacyNote: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: GRAY_120, borderRadius: 10, padding: 12, marginBottom: 20,
  },
  privacyText: {
    flex: 1, fontSize: 12, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", lineHeight: 17,
  },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.tint,
    borderRadius: 14, paddingVertical: 16,
    shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: WHITE, fontSize: 16, fontFamily: "Archivo_600SemiBold" },
  successContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, gap: 12,
  },
  successIcon: { marginBottom: 8 },
  successTitle: {
    fontSize: 24, fontFamily: "Archivo_700Bold", color: Colors.light.text,
  },
  successText: {
    fontSize: 14, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", textAlign: "center", lineHeight: 22,
    maxWidth: 300,
  },
  doneBtn: {
    marginTop: 16, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, backgroundColor: Colors.light.tint,
  },
  doneBtnText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_600SemiBold" },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  GRAY_105,
  GRAY_125,
  GRAY_600,
  GRAY_850,
  PURPLE,
  PURPLE_A06,
  PURPLE_A07,
  PURPLE_A15,
  WHITE,
} from "@/constants/colors";

const SECTIONS = [
  {
    title: "1. Data We Collect",
    subsections: [
      {
        heading: "Personal Information",
        body: "Name, email, phone number, and optional profile info you provide.",
      },
      {
        heading: "Location Data",
        body: "Real-time GPS location, only with your permission. Background location access is used for live photo requests.",
      },
      {
        heading: "Media & Content",
        body: "Photos and videos shared through the app. Request details and chat messages (encrypted).",
      },
      {
        heading: "Device & Usage",
        body: "Device type, operating system, unique IDs, app activity, crash logs, and diagnostics.",
      },
    ],
  },
  {
    title: "2. Why We Collect Data",
    body: "We collect data to:\n• Operate core app features (e.g. photo requests, live location)\n• Match users in real time based on location\n• Ensure safety and prevent abuse\n• Improve app functionality and performance\n• Comply with legal obligations",
  },
  {
    title: "3. Data Sharing",
    body: "We never sell your personal data. We may share information with:\n• Service providers (e.g., cloud storage, payment processors)\n• Other users, only to complete a request\n• Authorities, if required to comply with law or protect safety",
  },
  {
    title: "4. Your Controls",
    body: "You're always in control:\n• Location Access: Can be turned off anytime in device settings\n• Notifications: Fully customizable\n• Account Deletion: Request at lokat.official@gmail.com",
  },
  {
    title: "5. Data Security",
    body: "We use encryption, secure cloud services, and internal access controls to protect your data. While no system is perfect, we actively monitor for threats and misuse.",
  },
  {
    title: "6. Children's Privacy",
    body: "LoKat is not intended for users under 13. If we learn a child is using the app, we will delete their data and deactivate the account.",
  },
  {
    title: "7. Third-Party Links",
    body: "Our app may link to external services (e.g. maps, payments). We are not responsible for the privacy practices of those platforms.",
  },
  {
    title: "8. Changes to This Policy",
    body: "We may update this Privacy Policy as needed. All updates will be posted at lokat.ai/privacy. Continued use of the app means you accept any changes.",
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={GRAY_850} />
        </Pressable>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
      >
        <View style={styles.heroBanner}>
          <Feather name="shield" size={28} color={PURPLE} />
          <Text style={styles.heroTitle}>Built on Trust. Backed by Action.</Text>
          <Text style={styles.heroBody}>
            At LoKat, your privacy is our priority. This policy explains what data we collect, why we collect it, and how we use it when you use the LoKat app.
          </Text>
        </View>

        <Text style={styles.updated}>Last updated: February 26, 2026</Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {"subsections" in s && s.subsections ? (
              s.subsections.map((sub) => (
                <View key={sub.heading} style={styles.subsection}>
                  <Text style={styles.subsectionHeading}>{sub.heading}</Text>
                  <Text style={styles.sectionBody}>{sub.body}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionBody}>{(s as any).body}</Text>
            )}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Feather name="mail" size={16} color={PURPLE} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Questions?</Text>
            <Text style={styles.contactBody}>Reach out to us at lokat.official@gmail.com</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using LoKat, you acknowledge that you have read and understood this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  title: { fontSize: 17, fontFamily: "Archivo_600SemiBold", color: GRAY_850 },
  content: { padding: 20 },
  heroBanner: {
    backgroundColor: PURPLE_A07, borderRadius: 16,
    padding: 20, marginBottom: 20, alignItems: "center", gap: 8,
  },
  heroTitle: {
    fontSize: 16, fontFamily: "Archivo_700Bold",
    color: PURPLE, textAlign: "center", lineHeight: 22,
  },
  heroBody: {
    fontSize: 13, fontFamily: "Archivo_400Regular",
    color: GRAY_600, textAlign: "center", lineHeight: 19,
  },
  updated: {
    fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_400Regular", marginBottom: 20,
  },
  section: {
    backgroundColor: WHITE, borderRadius: 14, padding: 16,
    marginBottom: 12, gap: 4,
  },
  sectionTitle: {
    fontSize: 14, fontFamily: "Archivo_700Bold",
    color: GRAY_850, marginBottom: 8,
  },
  subsection: { marginBottom: 10 },
  subsectionHeading: {
    fontSize: 13, fontFamily: "Archivo_600SemiBold",
    color: GRAY_850, marginBottom: 3,
  },
  sectionBody: {
    fontSize: 13, color: GRAY_600,
    fontFamily: "Archivo_400Regular", lineHeight: 20,
  },
  contactCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: WHITE, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: PURPLE_A15,
  },
  contactTitle: {
    fontSize: 13, fontFamily: "Archivo_600SemiBold", color: GRAY_850,
  },
  contactBody: {
    fontSize: 13, fontFamily: "Archivo_400Regular",
    color: GRAY_600, marginTop: 2,
  },
  footer: {
    marginTop: 4, padding: 16,
    backgroundColor: PURPLE_A06, borderRadius: 12,
  },
  footerText: {
    fontSize: 13, color: PURPLE,
    fontFamily: "Archivo_500Medium", lineHeight: 20, textAlign: "center",
  },
});

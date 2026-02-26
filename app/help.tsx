import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "@/constants/colors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is LoKat?",
        a: "LoKat is a marketplace connecting people who want photos taken at specific locations (Seekers) with people willing to go there and take them (LoKaters). Seekers pay a reward; LoKaters earn it by fulfilling requests.",
      },
      {
        q: "How do I create a photo request?",
        a: "Tap the + button on the home map, drop a pin at your desired location, set your photo preferences (orientation, angle, timing), add a reward, and publish. LoKaters nearby will see your request and can claim it.",
      },
      {
        q: "How do I become a LoKater?",
        a: "Anyone with a LoKat account can be a LoKater. Browse open requests on the map, tap one you can reach, accept it, navigate to the location, take the photo, and submit. The reward is credited to your wallet instantly on completion.",
      },
    ],
  },
  {
    category: "Payments & Earnings",
    items: [
      {
        q: "When do I get paid?",
        a: "Earnings are credited to your wallet the moment a seeker confirms completion of your submitted photo. You can request a withdrawal at any time from the Wallet section of your profile.",
      },
      {
        q: "How long do withdrawals take?",
        a: "Withdrawals are processed within 2–3 business days. You'll receive an email confirmation once the funds are on their way.",
      },
      {
        q: "Is there a minimum withdrawal amount?",
        a: "Yes, the minimum withdrawal is $5.00. There are no fees for withdrawals over $10.",
      },
    ],
  },
  {
    category: "Requests & Photos",
    items: [
      {
        q: "What happens if a LoKater doesn't fulfil my request?",
        a: "Requests are automatically released back to open status if a LoKater abandons them. You can re-post or modify your request at any time until it's fulfilled.",
      },
      {
        q: "How close do I need to be to submit a photo?",
        a: "You must be within 300 metres of the target location before you can take a photo. The camera button is locked until you're close enough.",
      },
      {
        q: "Can I cancel a request I created?",
        a: "Yes. Open requests can be deleted from the request detail screen. Once a LoKater has accepted your request, you can still delete it — they will be notified.",
      },
    ],
  },
  {
    category: "Account",
    items: [
      {
        q: "Can I change my name or email?",
        a: "Yes. Go to your Profile → tap the edit icon next to your name → update your display name, email, or phone number.",
      },
      {
        q: "How do I change my password?",
        a: "Go to Profile → Privacy & Security → Change Password. You'll need your current password to set a new one.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Profile → Privacy & Security → Delete Account and follow the instructions. You can also email support@lokat.app to request deletion.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  return (
    <Pressable onPress={toggle} style={styles.faqItem}>
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={Colors.light.textSecondary} />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </Pressable>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Help Center</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
      >
        <View style={styles.heroBox}>
          <Feather name="help-circle" size={28} color={Colors.light.tint} />
          <View>
            <Text style={styles.heroTitle}>Frequently Asked Questions</Text>
            <Text style={styles.heroSub}>Find answers to common questions below</Text>
          </View>
        </View>

        {FAQ.map((section) => (
          <View key={section.category} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.category}</Text>
            <View style={styles.faqGroup}>
              {section.items.map((item, i) => (
                <View key={item.q}>
                  <FAQItem q={item.q} a={item.a} />
                  {i < section.items.length - 1 && <View style={styles.itemDivider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>Email us at support@lokat.app and we'll get back to you within 24 hours.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F2",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Archivo_600SemiBold", color: Colors.light.text },
  scrollContent: { paddingTop: 16, paddingHorizontal: 20 },
  heroBox: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(124,58,237,0.06)",
    borderRadius: 14, padding: 16, marginBottom: 20,
  },
  heroTitle: { fontSize: 15, fontFamily: "Archivo_600SemiBold", color: Colors.light.text },
  heroSub: { fontSize: 13, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular" },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold", textTransform: "uppercase",
    letterSpacing: 0.6, marginBottom: 10, marginLeft: 4,
  },
  faqGroup: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  faqItem: { paddingVertical: 14, paddingHorizontal: 16 },
  faqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: "Archivo_500Medium", color: Colors.light.text },
  faqA: {
    marginTop: 8, fontSize: 13, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", lineHeight: 20,
  },
  itemDivider: { height: 1, backgroundColor: "#F0F0F2", marginHorizontal: 16 },
  contactBox: {
    backgroundColor: "#fff", borderRadius: 14, padding: 20,
    alignItems: "center", gap: 6, marginBottom: 16,
  },
  contactTitle: { fontSize: 15, fontFamily: "Archivo_600SemiBold", color: Colors.light.text },
  contactText: {
    fontSize: 13, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", textAlign: "center", lineHeight: 20,
  },
});

import React from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
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
  WHITE,
} from "@/constants/colors";

import styles from "./terms.styles";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating a LoKat account or using the LoKat mobile application, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the app.",
  },
  {
    title: "2. The LoKat Service",
    body: "LoKat provides a marketplace platform that connects photo seekers with LoKaters. LoKat is not responsible for the quality of photos taken, the accuracy of locations, or any disputes between users. All transactions are between individual users.",
  },
  {
    title: "3. User Accounts",
    body: "You must be at least 18 years old to use LoKat. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate and current information when registering.",
  },
  {
    title: "4. Payments & Rewards",
    body: "Rewards are set by Seekers at the time of request creation. LoKat processes payments securely via Stripe. LoKat charges a platform fee on each completed transaction. Earnings are credited to your wallet upon request completion and can be withdrawn within 2–3 business days.",
  },
  {
    title: "5. Photo Content",
    body: "All photos taken through LoKat must comply with applicable laws and must not contain illegal, offensive, or rights-infringing content. By submitting a photo, you grant the requesting Seeker a licence to use it for personal purposes. LoKat is not responsible for how photos are used after delivery.",
  },
  {
    title: "6. Location Data",
    body: "LoKat requires access to your device location to verify proximity for request fulfillment and to display nearby requests. Location data is used solely within the app and is not sold to third parties.",
  },
  {
    title: "7. Prohibited Conduct",
    body: "You may not: misuse the platform to commit fraud; harass other users; upload false location data; create fake requests; or use automated scripts to interact with the service. Violations may result in immediate account termination.",
  },
  {
    title: "8. Limitation of Liability",
    body: "LoKat is provided 'as is' without warranties of any kind. To the fullest extent permitted by law, LoKat shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "9. Termination",
    body: "LoKat reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or otherwise harm the platform or its users.",
  },
  {
    title: "10. Changes to Terms",
    body: "We may update these Terms & Conditions from time to time. Continued use of the app after changes constitutes acceptance of the revised terms. We will notify users of material changes via in-app notice.",
  },
  {
    title: "11. Contact",
    body: "For questions about these terms, contact us at legal@lokat.app.",
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={GRAY_850} />
        </Pressable>
        <Text style={styles.title}>Terms & Conditions</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
      >
        <Text style={styles.updated}>Last updated: February 26, 2026</Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using LoKat, you acknowledge that you have read and understood these Terms & Conditions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

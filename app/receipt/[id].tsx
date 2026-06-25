import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import {
  BLACK,
  EMERALD,
  EMERALD_50,
  GRASS,
  GRAY_105,
  GRAY_125,
  GRAY_600,
  GRAY_850,
  INDIGO_50,
  PURPLE,
  WHITE,
} from "@/constants/colors";

export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const { earned, newBalance, intentId, locationName, reward } = useLocalSearchParams<{
    id: string;
    earned: string;
    newBalance: string;
    intentId?: string;
    locationName: string;
    reward: string;
  }>();
  const { refreshProfile } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const earnedAmount = parseFloat(earned || reward || "0");
  const balanceAmount = parseFloat(newBalance || "0");
  const shortIntentId = intentId ? intentId.replace("pi_", "").slice(0, 12).toUpperCase() : null;
  const now = new Date();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    refreshProfile();

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  const handleViewOrders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)/orders");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={44} color={WHITE} />
            </View>
          </Animated.View>
          <Text style={styles.successTitle}>Photo Delivered!</Text>
          <Text style={styles.successSub}>
            Your photo was submitted successfully. Payment is on its way.
          </Text>
        </View>

        <Animated.View
          style={[
            styles.receiptCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptHeaderLabel}>Payment Receipt</Text>
            <View style={styles.receiptBadge}>
              <View style={styles.receiptBadgeDot} />
              <Text style={styles.receiptBadgeText}>Processed</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Earned</Text>
            <Text style={styles.amountValue}>${earnedAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptRowLabel}>Location</Text>
            <Text style={styles.receiptRowValue} numberOfLines={1}>
              {locationName || "Photo Job"}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptRowLabel}>Date</Text>
            <Text style={styles.receiptRowValue}>
              {now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptRowLabel}>Time</Text>
            <Text style={styles.receiptRowValue}>
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </Text>
          </View>

          {shortIntentId && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptRowLabel}>Reference</Text>
              <Text style={[styles.receiptRowValue, styles.referenceText]}>
                #{shortIntentId}
              </Text>
            </View>
          )}

          <View style={styles.receiptRow}>
            <Text style={styles.receiptRowLabel}>Method</Text>
            <View style={styles.methodRow}>
              <Ionicons name="wallet-outline" size={14} color={PURPLE} />
              <Text style={styles.receiptRowValue}>LoKat Wallet</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>New Wallet Balance</Text>
            <Text style={styles.balanceValue}>${balanceAmount.toFixed(2)}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <Ionicons name="information-circle-outline" size={18} color={PURPLE} />
          <Text style={styles.infoText}>
            Earnings are held in your LoKat Wallet. Cash out anytime from your Profile.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <Pressable
            style={({ pressed }) => [
              styles.viewOrdersBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleViewOrders}
          >
            <Ionicons name="receipt-outline" size={18} color={PURPLE} />
            <Text style={styles.viewOrdersBtnText}>View Orders</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleDone}
          >
            <Text style={styles.doneBtnText}>Back to Map</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY_105,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 16,
  },
  successSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GRASS,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GRASS,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    color: GRAY_850,
    fontFamily: "Archivo_700Bold",
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 14,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  receiptCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  receiptHeaderLabel: {
    fontSize: 13,
    color: GRAY_600,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  receiptBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: EMERALD_50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  receiptBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: EMERALD,
  },
  receiptBadgeText: {
    fontSize: 12,
    color: EMERALD,
    fontFamily: "Archivo_600SemiBold",
  },
  amountRow: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 13,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  amountValue: {
    fontSize: 48,
    color: PURPLE,
    fontFamily: "Archivo_700Bold",
    letterSpacing: -1,
  },
  divider: {
    height: 1,
    backgroundColor: GRAY_125,
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  receiptRowLabel: {
    fontSize: 14,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  receiptRowValue: {
    fontSize: 14,
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
    maxWidth: "55%",
    textAlign: "right",
  },
  referenceText: {
    fontFamily: "Archivo_600SemiBold",
    color: PURPLE,
    fontSize: 13,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontSize: 15,
    color: GRAY_850,
    fontFamily: "Archivo_600SemiBold",
  },
  balanceValue: {
    fontSize: 20,
    color: GRAY_850,
    fontFamily: "Archivo_700Bold",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: INDIGO_50,
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PURPLE,
    fontFamily: "Archivo_400Regular",
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  viewOrdersBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PURPLE,
    backgroundColor: WHITE,
  },
  viewOrdersBtnText: {
    fontSize: 15,
    color: PURPLE,
    fontFamily: "Archivo_600SemiBold",
  },
  doneBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/store";
import { BLACK, BLACK_A45, EMERALD, EMERALD_A10, GRAY_100, GRAY_105, GRAY_125, GRAY_250, ORANGE, PURPLE_A08, WHITE } from "@/constants/colors.js";

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleWithdraw = async () => {
    if (profile.earnings <= 0) {
      Alert.alert("No Balance", "You have no available balance to withdraw.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWithdrawModalVisible(true);
  };

  const confirmWithdraw = async () => {
    setWithdrawing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWithdrawing(false);
    setWithdrawn(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Wallet & Payments</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet-outline" size={22} color={Colors.light.tint} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>${profile.earnings.toFixed(2)}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.withdrawBtn,
              pressed && { opacity: 0.88 },
              profile.earnings <= 0 && styles.withdrawBtnDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={profile.earnings <= 0}
          >
            <Feather name="download" size={16} color={WHITE} />
            <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How Payouts Work</Text>
          <View style={styles.infoCard}>
            {[
              { icon: "check-circle", color: EMERALD, text: "Earnings are credited instantly when a request is completed" },
              { icon: "clock", color: ORANGE, text: "Withdrawal requests are processed within 2–3 business days" },
              { icon: "shield", color: Colors.light.tint, text: "Payments are secured and processed via Stripe" },
              { icon: "dollar-sign", color: EMERALD, text: "No fees for withdrawals over $10" },
            ].map((item, index) => (
              <View key={index} style={[styles.infoRow, index > 0 && styles.infoRowBorder]}>
                <Feather name={item.icon as any} size={16} color={item.color} />
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transaction History</Text>
          <Pressable
            style={({ pressed }) => [styles.historyLink, pressed && { backgroundColor: GRAY_100 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/transaction-history");
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: PURPLE_A08 }]}>
              <Feather name="clock" size={18} color={Colors.light.tint} />
            </View>
            <Text style={styles.historyText}>View All Transactions</Text>
            <Feather name="chevron-right" size={16} color={GRAY_250} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !withdrawing && setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {withdrawn ? (
              <>
                <View style={styles.successIcon}>
                  <Feather name="check" size={28} color={EMERALD} />
                </View>
                <Text style={styles.modalTitle}>Request Submitted!</Text>
                <Text style={styles.modalBody}>
                  Your withdrawal of ${profile.earnings.toFixed(2)} has been requested. You'll receive your payment within 2–3 business days.
                </Text>
                <Pressable
                  style={styles.modalDoneBtn}
                  onPress={() => {
                    setWithdrawModalVisible(false);
                    setWithdrawn(false);
                  }}
                >
                  <Text style={styles.modalDoneText}>Done</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Withdraw Funds</Text>
                <Text style={styles.modalBody}>
                  Request a withdrawal of your full balance:
                </Text>
                <Text style={styles.modalAmount}>${profile.earnings.toFixed(2)}</Text>
                <Text style={styles.modalNote}>
                  Processing takes 2–3 business days. You'll receive a confirmation email when completed.
                </Text>
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => setWithdrawModalVisible(false)}
                    disabled={withdrawing}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalConfirmBtn, withdrawing && { opacity: 0.7 }]}
                    onPress={confirmWithdraw}
                    disabled={withdrawing}
                  >
                    {withdrawing ? (
                      <ActivityIndicator size="small" color={WHITE} />
                    ) : (
                      <Text style={styles.modalConfirmText}>Confirm</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_105 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: GRAY_105,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Archivo_600SemiBold", color: Colors.light.text },
  content: { flex: 1 },
  balanceCard: {
    margin: 20,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  walletIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: PURPLE_A08,
    alignItems: "center", justifyContent: "center",
  },
  balanceLabel: { fontSize: 13, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular" },
  balanceAmount: { fontSize: 28, color: Colors.light.tint, fontFamily: "Archivo_700Bold" },
  withdrawBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.tint,
    borderRadius: 12, paddingVertical: 14,
  },
  withdrawBtnDisabled: { opacity: 0.45 },
  withdrawBtnText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_600SemiBold" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 10, marginLeft: 4,
  },
  infoCard: { backgroundColor: WHITE, borderRadius: 12, overflow: "hidden" },
  infoRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: GRAY_125 },
  infoText: {
    flex: 1, fontSize: 13, color: Colors.light.text,
    fontFamily: "Archivo_400Regular", lineHeight: 18,
  },
  historyLink: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: WHITE, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  historyText: { flex: 1, fontSize: 15, fontFamily: "Archivo_400Regular", color: Colors.light.text },
  modalOverlay: {
    flex: 1, backgroundColor: BLACK_A45,
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  modalCard: {
    backgroundColor: WHITE, borderRadius: 20,
    padding: 24, width: "100%", maxWidth: 360, alignItems: "center", gap: 8,
  },
  successIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: EMERALD_A10,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontFamily: "Archivo_700Bold", color: Colors.light.text, marginBottom: 4 },
  modalBody: { fontSize: 14, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular", textAlign: "center" },
  modalAmount: { fontSize: 32, fontFamily: "Archivo_700Bold", color: Colors.light.tint, marginVertical: 4 },
  modalNote: {
    fontSize: 12, color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular", textAlign: "center", lineHeight: 18,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: GRAY_105, alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontFamily: "Archivo_500Medium", color: Colors.light.textSecondary },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.light.tint, alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontFamily: "Archivo_600SemiBold", color: WHITE },
  modalDoneBtn: {
    marginTop: 8, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12, backgroundColor: Colors.light.tint, alignItems: "center",
  },
  modalDoneText: { fontSize: 15, fontFamily: "Archivo_600SemiBold", color: WHITE },
});

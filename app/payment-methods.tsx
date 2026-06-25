import React from "react";
import { useWithdrawState } from "@/hooks/useWithdrawState";
import { View, Text, Pressable, Platform, Alert, Modal, ActivityIndicator } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import {
  BLACK,
  BLACK_A45,
  EMERALD,
  EMERALD_A10,
  GRAY_100,
  GRAY_105,
  GRAY_125,
  GRAY_250,
  GRAY_600,
  GRAY_850,
  ORANGE,
  PURPLE,
  PURPLE_A08,
  WHITE,
} from "@/constants/colors";

import styles from "@/styles/payment-methods";

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const {
    withdrawModalVisible, setWithdrawModalVisible,
    withdrawing, setWithdrawing,
    withdrawn, setWithdrawn,
  } = useWithdrawState();
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
          <Feather name="arrow-left" size={20} color={GRAY_850} />
        </Pressable>
        <Text style={styles.title}>Wallet & Payments</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet-outline" size={22} color={PURPLE} />
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
              { icon: "shield", color: PURPLE, text: "Payments are secured and processed via Stripe" },
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
              <Feather name="clock" size={18} color={PURPLE} />
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
                  {`Your withdrawal of $${profile.earnings.toFixed(2)} has been requested. You'll receive your payment within 2–3 business days.`}
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
                  {"Processing takes 2–3 business days. You'll receive a confirmation email when completed."}
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

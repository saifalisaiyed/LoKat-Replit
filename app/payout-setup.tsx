import React from "react";
import { usePayoutForm, type PayoutType } from "@/hooks/usePayoutForm";
import { View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import {
  DARK_MAP,
  GRAY_400,
  GRAY_650,
  PURPLE,
  PURPLE_A12,
  PURPLE_A18,
  RED_LIGHT,
  RED_LIGHT_A12,
  WHITE,
  WHITE_A06,
  WHITE_A08,
  WHITE_A10,
} from "@/constants/colors";

import styles from "@/styles/payout-setup";

export default function PayoutSetupScreen() {
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useApp();
  const {
    payoutType, setPayoutType,
    paypalEmail, setPaypalEmail,
    bankName, setBankName,
    accountNumber, setAccountNumber,
    routingNumber, setRoutingNumber,
    isSaving, setIsSaving,
    error, setError,
  } = usePayoutForm();

  const isValid =
    payoutType === "paypal"
      ? paypalEmail.includes("@")
      : bankName.trim().length > 0 && accountNumber.trim().length >= 4;

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const baseUrl = getApiUrl();
      const info = JSON.stringify(
        payoutType === "paypal"
          ? { type: "paypal", email: paypalEmail.trim() }
          : { type: "bank", bankName: bankName.trim(), accountNumber: accountNumber.trim(), routingNumber: routingNumber.trim() }
      );
      const res = await fetch(`${baseUrl}api/auth/payout-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payoutInfo: info }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await refreshProfile();
      router.back();
    } catch (_saveError) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { paddingTop: insets.top + webTop + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={WHITE} />
        </Pressable>
        <Text style={styles.headerTitle}>Set up payouts</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="wallet-outline" size={44} color={PURPLE} />
        </View>

        <Text style={styles.title}>How do you want to get paid?</Text>
        <Text style={styles.subtitle}>
          Enter your payout details so we can send you money when you deliver photos.
          Your earnings are tracked in your wallet and you can withdraw any time.
        </Text>

        <View style={styles.typeRow}>
          {(["paypal", "bank"] as PayoutType[]).map((type) => (
            <Pressable
              key={type}
              style={[styles.typeBtn, payoutType === type && styles.typeBtnActive]}
              onPress={() => setPayoutType(type)}
            >
              <Ionicons
                name={type === "paypal" ? "logo-paypal" : "business-outline"}
                size={20}
                color={payoutType === type ? WHITE : GRAY_400}
              />
              <Text style={[styles.typeBtnText, payoutType === type && styles.typeBtnTextActive]}>
                {type === "paypal" ? "PayPal" : "Bank Transfer"}
              </Text>
            </Pressable>
          ))}
        </View>

        {payoutType === "paypal" ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PayPal email address</Text>
            <TextInput
              style={styles.input}
              value={paypalEmail}
              onChangeText={setPaypalEmail}
              placeholder="you@example.com"
              placeholderTextColor={GRAY_650}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bank name</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. Chase, Wells Fargo"
              placeholderTextColor={GRAY_650}
              autoCorrect={false}
            />
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Account number</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Last 4 digits are fine"
              placeholderTextColor={GRAY_650}
              keyboardType="number-pad"
            />
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Routing number (optional)</Text>
            <TextInput
              style={styles.input}
              value={routingNumber}
              onChangeText={setRoutingNumber}
              placeholder="9-digit routing number"
              placeholderTextColor={GRAY_650}
              keyboardType="number-pad"
            />
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={RED_LIGHT} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          {"Your payout details are stored securely. We'll process withdrawals within 2-3 business days."}
        </Text>

        <Pressable
          style={[styles.saveBtn, (!isValid || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.saveBtnText}>Save payout info</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

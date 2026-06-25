import React from "react";
import { usePaymentWebView } from "@/hooks/usePaymentWebView";
import { View, Text, Pressable, ActivityIndicator, Modal, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import {
  DARK_MAP,
  GRAY_190,
  GRAY_400,
  GRAY_580,
  GREEN_500,
  GREEN_500_A12,
  PURPLE,
  PURPLE_A12,
  RED_LIGHT,
  RED_LIGHT_A12,
  WHITE,
  WHITE_A05,
  WHITE_A08,
} from "@/constants/colors";

import styles from "@/styles/payment-setup";

export default function PaymentSetupScreen() {
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useApp();
  const {
    isLoading, setIsLoading,
    showWebView, setShowWebView,
    webViewUrl, setWebViewUrl,
    webViewLoading, setWebViewLoading,
    status, setStatus,
  } = usePaymentWebView();

  const handleAddCard = async () => {
    setIsLoading(true);
    setStatus("idle");
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/payments/create-setup-intent`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create setup intent");
      const { clientSecret, publishableKey } = await res.json();

      const url = `${baseUrl}card-setup?pk=${encodeURIComponent(publishableKey)}&secret=${encodeURIComponent(clientSecret)}`;
      setWebViewUrl(url);
      setShowWebView(true);
    } catch {
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebViewMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "success") {
        setShowWebView(false);
        setStatus("done");
        try {
          const baseUrl = getApiUrl();
          await fetch(`${baseUrl}api/payments/payment-status`, {
            credentials: "include",
          });
        } catch {}
        await refreshProfile();
        setTimeout(() => router.back(), 1000);
      }
    } catch {}
  };

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <Pressable
        style={[styles.backBtn, { top: insets.top + webTop + 12 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={WHITE} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="card-outline" size={48} color={PURPLE} />
        </View>

        <Text style={styles.title}>Add a payment method</Text>
        <Text style={styles.subtitle}>
          Your card is only charged once a LoKater delivers your photo. We use
          Stripe to keep your payment info safe.
        </Text>

        <View style={styles.bullets}>
          {[
            { icon: "shield-checkmark-outline", text: "Secure — encrypted by Stripe" },
            { icon: "camera-outline", text: "Charged only on delivery" },
            { icon: "refresh-outline", text: "Cancel any request before it's accepted" },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.bullet}>
              <Ionicons name={icon as any} size={18} color={PURPLE} />
              <Text style={styles.bulletText}>{text}</Text>
            </View>
          ))}
        </View>

        {status === "done" && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN_500} />
            <Text style={styles.successText}>Card saved! Heading back…</Text>
          </View>
        )}

        {status === "error" && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color={RED_LIGHT} />
            <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          </View>
        )}

        <Pressable
          style={[styles.btn, (isLoading || status === "done") && styles.btnDisabled]}
          onPress={handleAddCard}
          disabled={isLoading || status === "done"}
        >
          {isLoading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color={WHITE} />
              <Text style={styles.btnText}>Add card</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipText}>Not now</Text>
        </Pressable>
      </View>

      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.webViewContainer}>
          <View style={[styles.webViewHeader, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.webViewTitle}>Add Card</Text>
            <Pressable onPress={() => setShowWebView(false)} style={styles.webViewClose}>
              <Ionicons name="close" size={22} color={WHITE} />
            </Pressable>
          </View>

          {webViewLoading && (
            <View style={styles.webViewSpinner}>
              <ActivityIndicator color={PURPLE} size="large" />
            </View>
          )}

          <WebView
            source={{ uri: webViewUrl }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            mixedContentMode="always"
          />
        </View>
      </Modal>
    </View>
  );
}

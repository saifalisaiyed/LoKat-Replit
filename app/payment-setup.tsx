import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import Colors from "@/constants/colors";

export default function PaymentSetupScreen() {
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

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
    } catch (error) {
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
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="card-outline" size={48} color={Colors.light.tint} />
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
              <Ionicons name={icon as any} size={18} color={Colors.light.tint} />
              <Text style={styles.bulletText}>{text}</Text>
            </View>
          ))}
        </View>

        {status === "done" && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.successText}>Card saved! Heading back…</Text>
          </View>
        )}

        {status === "error" && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color="#f87171" />
            <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          </View>
        )}

        <Pressable
          style={[styles.btn, (isLoading || status === "done") && styles.btnDisabled]}
          onPress={handleAddCard}
          disabled={isLoading || status === "done"}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color="#fff" />
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
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          {webViewLoading && (
            <View style={styles.webViewSpinner}>
              <ActivityIndicator color={Colors.light.tint} size="large" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B2E",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(124,58,237,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "Archivo_700Bold",
  },
  subtitle: {
    fontSize: 15,
    color: "#A1A1AA",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  bullets: {
    alignSelf: "stretch",
    gap: 14,
    marginBottom: 36,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
  },
  bulletText: {
    fontSize: 14,
    color: "#E4E4E7",
    flex: 1,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 16,
  },
  successText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248,113,113,0.12)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
  },
  skipBtn: {
    padding: 12,
  },
  skipText: {
    color: "#71717A",
    fontSize: 15,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#1A1B2E",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  webViewTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  webViewClose: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  webViewSpinner: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: "#1A1B2E",
  },
});

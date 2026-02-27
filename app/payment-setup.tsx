import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import Colors from "@/constants/colors";

export default function PaymentSetupScreen() {
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");

  const handleSetupCard = async () => {
    setIsLoading(true);
    setStatus("idle");
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/payments/setup-session`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create setup session");
      const { url } = await res.json();

      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: "#1A1B2E",
      });

      setStatus("checking");
      const statusRes = await fetch(`${baseUrl}api/payments/payment-status`, {
        credentials: "include",
      });
      const statusData = await statusRes.json();

      if (statusData.hasPaymentMethod) {
        await refreshProfile();
        setStatus("done");
        setTimeout(() => router.back(), 1200);
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <Pressable style={[styles.backBtn, { top: insets.top + webTop + 12 }]} onPress={() => router.back()}>
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
            <Text style={styles.errorText}>No card saved. Please try again.</Text>
          </View>
        )}

        {status === "checking" ? (
          <View style={styles.checkingRow}>
            <ActivityIndicator color={Colors.light.tint} />
            <Text style={styles.checkingText}>Verifying your card…</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSetupCard}
            disabled={isLoading || status === "done"}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Continue to Stripe</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipText}>Not now</Text>
        </Pressable>
      </View>
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
  checkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  checkingText: {
    color: "#A1A1AA",
    fontSize: 14,
  },
  skipBtn: {
    padding: 12,
  },
  skipText: {
    color: "#71717A",
    fontSize: 15,
  },
});

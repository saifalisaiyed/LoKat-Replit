import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, submitPhoto } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const request = requests.find((r) => r.id === id);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={64} color={Colors.light.border} />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSubtitle}>
          We need camera access to take photos for requests
        </Text>
        {permission.status === "denied" && !permission.canAskAgain ? (
          Platform.OS !== "web" ? (
            <Pressable
              style={styles.permBtn}
              onPress={() => {
                try {
                  const { Linking } = require("react-native");
                  Linking.openSettings();
                } catch (e) {}
              }}
            >
              <Text style={styles.permBtnText}>Open Settings</Text>
            </Pressable>
          ) : null
        ) : (
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.backLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (e) {
      console.log("Capture error:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedUri(null);
  };

  const handleSubmit = () => {
    if (!capturedUri || !id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    submitPhoto(id, capturedUri);
    router.dismissAll();
    router.replace("/(tabs)");
  };

  const toggleFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((f) => (f === "back" ? "front" : "back"));
  };

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: capturedUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={[styles.previewOverlay, { paddingTop: insets.top + 16 + webInsetTop }]}>
          <View style={styles.previewHeader}>
            {request && (
              <View style={styles.requestHint}>
                <Text style={styles.hintText}>
                  {request.orientation} / {request.angle.replace(/-/g, " ")}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.previewActions,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
        >
          <View style={styles.previewActionRow}>
            <Pressable
              style={({ pressed }) => [styles.retakeBtn, pressed && { opacity: 0.7 }]}
              onPress={handleRetake}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitPhotoBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleSubmit}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitPhotoBtnText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />
      <View style={[styles.cameraOverlay, { paddingTop: insets.top + 8 + webInsetTop }]}>
        <View style={styles.cameraTopBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
          {request && (
            <View style={styles.requestHint}>
              <Text style={styles.hintText}>
                {request.orientation} / {request.angle.replace(/-/g, " ")}
              </Text>
            </View>
          )}
          <Pressable onPress={toggleFacing} hitSlop={12}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      {request && (
        <View style={styles.guideOverlay}>
          {request.angle === "looking-up" && (
            <View style={styles.guideArrow}>
              <Ionicons name="arrow-up" size={40} color="rgba(255,255,255,0.4)" />
              <Text style={styles.guideText}>Point camera upward</Text>
            </View>
          )}
          {request.angle === "looking-down" && (
            <View style={styles.guideArrow}>
              <Ionicons name="arrow-down" size={40} color="rgba(255,255,255,0.4)" />
              <Text style={styles.guideText}>Point camera downward</Text>
            </View>
          )}
          {request.angle === "eye-level" && (
            <View style={styles.guideArrow}>
              <Ionicons name="remove" size={40} color="rgba(255,255,255,0.4)" />
              <Text style={styles.guideText}>Keep camera at eye level</Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.cameraBottomBar,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
      >
        <View style={styles.captureRow}>
          <View style={{ width: 50 }} />
          <Pressable
            style={({ pressed }) => [
              styles.captureBtn,
              pressed && { transform: [{ scale: 0.9 }] },
              isCapturing && { opacity: 0.5 },
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.captureBtnInner} />
          </Pressable>
          <View style={{ width: 50 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    gap: 12,
    padding: 40,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  permSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontFamily: "Archivo_400Regular",
  },
  permBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 8,
  },
  permBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Archivo_500Medium",
  },
  backLink: {
    fontSize: 15,
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cameraTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestHint: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hintText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
    fontFamily: "Archivo_500Medium",
  },
  guideOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  guideArrow: {
    alignItems: "center",
    gap: 8,
  },
  guideText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: "Archivo_400Regular",
  },
  cameraBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  captureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  previewBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Archivo_500Medium",
  },
  previewActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  previewActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  retakeBtn: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  retakeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_500Medium",
  },
  submitPhotoBtn: {
    flex: 0.6,
    backgroundColor: Colors.light.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitPhotoBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
});

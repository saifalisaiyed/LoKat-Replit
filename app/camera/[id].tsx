import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Image } from "expo-image";
import { File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import { uploadFileToStorage } from "@/client/utils/objectStorageExpo";
import { getApiUrl } from "@/lib/query-client";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function calcBearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLon = toRad(toLng - fromLng);
  const y = Math.sin(dLon) * Math.cos(toRad(toLat));
  const x =
    Math.cos(toRad(fromLat)) * Math.sin(toRad(toLat)) -
    Math.sin(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

function calcDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDist(m: number): string {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { id, userLat, userLng } = useLocalSearchParams<{
    id: string;
    userLat?: string;
    userLng?: string;
  }>();
  const { requests, submitPhoto, uploadAndSubmitPhoto } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const facing: CameraType = "back";
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  // GPS captured at shutter press for server-side verification
  const capturedLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(
    userLat && userLng
      ? { latitude: parseFloat(userLat), longitude: parseFloat(userLng) }
      : null
  );

  // AR-lite state
  const [liveLocation, setLiveLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    userLat && userLng
      ? { latitude: parseFloat(userLat), longitude: parseFloat(userLng) }
      : null
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const magnetometerRef = useRef<any>(null);
  const accelerometerRef = useRef<any>(null);
  const locationWatchRef = useRef<any>(null);
  // Sensor data lives in refs — no React state, no re-renders
  const accelRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: -1 });
  const filteredHeadingRef = useRef(0);
  const currentBearingRef = useRef<number | null>(null);
  // Reanimated shared value drives the arrow directly on the UI thread
  const arrowRotationSV = useSharedValue(0);

  const request = requests.find((r) => r.id === id);

  // AR sensors — native only
  useEffect(() => {
    if (Platform.OS === "web" || !request) return;

    // Tilt-compensated compass heading using Magnetometer + Accelerometer.
    // 33ms ticks → 30fps, low-pass filter kills jitter, arrowRotationSV
    // updated directly on the Reanimated UI thread — zero React re-renders.
    try {
      const { Magnetometer, Accelerometer } = require("expo-sensors");
      // 33ms ≈ 30fps; accelerometer slightly faster so data is fresh when mag fires
      Accelerometer.setUpdateInterval(25);
      Magnetometer.setUpdateInterval(33);

      accelerometerRef.current = Accelerometer.addListener((a: any) => {
        accelRef.current = a;
      });

      magnetometerRef.current = Magnetometer.addListener((m: any) => {
        const { x: ax, y: ay, z: az } = accelRef.current;

        // Tilt-compensated heading (works in portrait / vertical hold)
        const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
        const roll  = Math.atan2(ay, az);
        const xh = m.x * Math.cos(pitch) + m.z * Math.sin(pitch);
        const yh =
          m.x * Math.sin(roll) * Math.sin(pitch) +
          m.y * Math.cos(roll) -
          m.z * Math.sin(roll) * Math.cos(pitch);
        const rawHeading = (Math.atan2(-yh, xh) * (180 / Math.PI) + 360) % 360;

        // Circular low-pass filter (α=0.4: responsive yet smooth)
        const ALPHA = 0.4;
        let hdiff = rawHeading - filteredHeadingRef.current;
        if (hdiff >  180) hdiff -= 360;
        if (hdiff < -180) hdiff += 360;
        filteredHeadingRef.current = (filteredHeadingRef.current + hdiff * ALPHA + 360) % 360;

        // Compute shortest-path rotation toward target pin
        const bearing = currentBearingRef.current;
        if (bearing !== null) {
          const target = (bearing - filteredHeadingRef.current + 360) % 360;
          // Keep the shared value as a running total to avoid wrap-around jumps
          let rotDiff = target - (arrowRotationSV.value % 360);
          if (rotDiff >  180) rotDiff -= 360;
          if (rotDiff < -180) rotDiff += 360;
          // Interpolate to next position in 80ms — buttery smooth between ticks
          arrowRotationSV.value = withTiming(arrowRotationSV.value + rotDiff, {
            duration: 80,
            easing: Easing.out(Easing.quad),
          });
        }
      });
    } catch (_) {}

    // Live location → distance badge
    (async () => {
      try {
        const Location = require("expo-location");
        locationWatchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 3 },
          (loc: any) => {
            setLiveLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      } catch (_) {}
    })();

    return () => {
      magnetometerRef.current?.remove();
      accelerometerRef.current?.remove();
      locationWatchRef.current?.remove();
    };
  }, [request?.id]);

  // Derived AR values
  const arBearing = useMemo(() => {
    if (!liveLocation || !request) return null;
    return calcBearing(
      liveLocation.latitude,
      liveLocation.longitude,
      request.latitude,
      request.longitude
    );
  }, [liveLocation?.latitude, liveLocation?.longitude, request?.latitude, request?.longitude]);

  const arDistance = useMemo(() => {
    if (!liveLocation || !request) return null;
    return calcDistance(
      liveLocation.latitude,
      liveLocation.longitude,
      request.latitude,
      request.longitude
    );
  }, [liveLocation?.latitude, liveLocation?.longitude, request?.latitude, request?.longitude]);

  // Keep bearing ref fresh so the magnetometer listener (closure) can read it
  useEffect(() => {
    currentBearingRef.current = arBearing;
  }, [arBearing]);

  // Animated style for the arrow — runs on the UI thread, no React re-renders
  const arrowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotationSV.value}deg` }],
  }));

  // Pulse animation for compass ring when very close
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (arDistance !== null && arDistance < 20) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [arDistance !== null && arDistance < 20]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

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

  const processFacesAsync = async (uri: string) => {
    setIsProcessingFaces(true);
    try {
      // Send raw image to server — server handles face detection + blurring.
      // No expo-face-detector import (not available in Expo Go SDK 50+).
      const formData = new FormData();
      formData.append("image", { uri, type: "image/jpeg", name: "photo.jpg" } as any);

      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/photos/blur-faces`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.faceCount > 0 && data.blurredImageBase64) {
        const FileSystem = require("expo-file-system");
        const tmpPath = `${FileSystem.cacheDirectory}blurred_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(tmpPath, data.blurredImageBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setProcessedUri(tmpPath);
        setFaceCount(data.faceCount);
      }
    } catch (_) {
      // Fail silently — original image will be uploaded
    } finally {
      setIsProcessingFaces(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (Platform.OS !== "web") {
        try {
          const Location = require("expo-location");
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          capturedLocationRef.current = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        } catch (_) {}
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            capturedLocationRef.current = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
          },
          () => {},
          { enableHighAccuracy: true, timeout: 3000 }
        );
      }

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setProcessedUri(null);
        setFaceCount(0);
        if (Platform.OS !== "web") {
          processFacesAsync(photo.uri);
        }
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
    setProcessedUri(null);
    setFaceCount(0);
    setIsProcessingFaces(false);
  };

  const handleSubmit = async () => {
    if (!capturedUri || !id || isUploading || isProcessingFaces) return;
    setIsUploading(true);
    try {
      const uriToUpload = processedUri ?? capturedUri;
      if (Platform.OS !== "web") {
        const file = new File(uriToUpload);
        const uploadURL = await uploadFileToStorage(file);
        await uploadAndSubmitPhoto(id, uploadURL);
      } else {
        await submitPhoto(id, capturedUri);
      }

      const baseUrl = getApiUrl();
      const capturedLocation = capturedLocationRef.current;
      const paymentRes = await fetch(
        `${baseUrl}api/payments/complete-submission`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: id,
            latitude: capturedLocation?.latitude,
            longitude: capturedLocation?.longitude,
          }),
        }
      );

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json().catch(() => ({}));
        setIsUploading(false);
        if (errorData.code === "TOO_FAR") {
          Alert.alert(
            "Location Mismatch",
            `Your photo was taken ${errorData.distanceMeters}m from the target. Please go to the exact location and retake.`,
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Submission Failed",
            errorData.message || "Could not complete submission."
          );
        }
        return;
      }

      const paymentData = await paymentRes.json();
      const earned = paymentData?.earned ?? request?.reward ?? 0;
      const newBalance = paymentData?.newBalance ?? 0;
      const intentId = paymentData?.stripePaymentIntentId ?? "";
      const locationName = request?.locationName ?? "";

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace({
        pathname: "/receipt/[id]",
        params: {
          id,
          earned: String(earned),
          newBalance: String(newBalance),
          intentId,
          locationName,
          reward: String(request?.reward ?? earned),
        },
      });
    } catch (e) {
      console.error("Photo upload error:", e);
      setIsUploading(false);
      Alert.alert("Upload Failed", "Could not upload photo. Please try again.");
    }
  };

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image
          key={processedUri ?? capturedUri}
          source={{ uri: processedUri ?? capturedUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        {/* Face scan loading badge */}
        {isProcessingFaces && (
          <View style={styles.faceScanBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.faceScanText}>Scanning for faces…</Text>
          </View>
        )}

        {/* Face blurred confirmation badge */}
        {!isProcessingFaces && faceCount > 0 && (
          <View style={styles.faceBlurBadge}>
            <Ionicons name="eye-off-outline" size={14} color="#fff" />
            <Text style={styles.faceBlurText}>
              {faceCount === 1 ? "1 face auto-blurred" : `${faceCount} faces auto-blurred`}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.previewOverlay,
            { paddingTop: insets.top + 16 + webInsetTop },
          ]}
        >
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
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.previewActionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.retakeBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleRetake}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitPhotoBtn,
                pressed && { opacity: 0.85 },
                (isUploading || isProcessingFaces) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={isUploading || isProcessingFaces}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitPhotoBtnText}>Uploading…</Text>
                </>
              ) : isProcessingFaces ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitPhotoBtnText}>Processing…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitPhotoBtnText}>Send</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const showAR = Platform.OS !== "web" && !!request && arBearing !== null;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Rule-of-thirds grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.gridLine, styles.gridLineV, { left: "33.3%" }]} />
        <View style={[styles.gridLine, styles.gridLineV, { left: "66.7%" }]} />
        <View style={[styles.gridLine, styles.gridLineH, { top: "33.3%" }]} />
        <View style={[styles.gridLine, styles.gridLineH, { top: "66.7%" }]} />
      </View>

      {/* Top bar */}
      <View
        style={[
          styles.cameraOverlay,
          { paddingTop: insets.top + 8 + webInsetTop },
        ]}
      >
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
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowInstructions(true);
            }}
            hitSlop={12}
            style={styles.infoBtn}
          >
            <Ionicons name="information-circle" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* AR compass widget — top right below top bar */}
      {showAR && (
        <View
          style={[
            styles.arCompass,
            { top: insets.top + 72 + webInsetTop },
          ]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.arCompassRing, pulseStyle]}>
            <Animated.View
              style={[
                { alignItems: "center", justifyContent: "center" },
                arrowAnimStyle,
              ]}
            >
              <Ionicons name="arrow-up" size={22} color={Colors.light.tint} />
            </Animated.View>
          </Animated.View>
          <Text style={styles.arDistText}>
            {arDistance !== null ? formatDist(arDistance) : "--"}
          </Text>
          <Text style={styles.arLabel}>TO PIN</Text>
        </View>
      )}

      {/* Angle guide (center) */}
      {request && (
        <View style={styles.guideOverlay} pointerEvents="none">
          {request.angle === "looking-up" && (
            <View style={styles.guideArrow}>
              <Ionicons
                name="arrow-up"
                size={40}
                color="rgba(255,255,255,0.35)"
              />
              <Text style={styles.guideText}>Point camera upward</Text>
            </View>
          )}
          {request.angle === "looking-down" && (
            <View style={styles.guideArrow}>
              <Ionicons
                name="arrow-down"
                size={40}
                color="rgba(255,255,255,0.35)"
              />
              <Text style={styles.guideText}>Point camera downward</Text>
            </View>
          )}
          {request.angle === "eye-level" && (
            <View style={styles.guideArrow}>
              <Ionicons
                name="remove"
                size={40}
                color="rgba(255,255,255,0.35)"
              />
              <Text style={styles.guideText}>Keep camera at eye level</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes card — above bottom bar */}
      {request?.note ? (
        <View
          style={[
            styles.notesCard,
            {
              bottom:
                (Platform.OS === "web" ? 34 : insets.bottom) + 20 + 96,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name="document-text-outline"
            size={13}
            color="rgba(255,255,255,0.75)"
          />
          <Text style={styles.notesText} numberOfLines={2}>
            {request.note}
          </Text>
        </View>
      ) : null}

      {/* Bottom capture bar */}
      <View
        style={[
          styles.cameraBottomBar,
          {
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
          },
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

      {/* Instructions overlay */}
      {showInstructions && request && (
        <Pressable
          style={styles.instructionsBackdrop}
          onPress={() => setShowInstructions(false)}
        >
          <Pressable
            style={[styles.instructionsSheet, { paddingBottom: insets.bottom + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.instructionsDragger} />
            <Text style={styles.instructionsTitle}>Shot Instructions</Text>

            <View style={styles.instructionsGrid}>
              <View style={styles.instructionsCell}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.instructionsCellLabel}>Orientation</Text>
                <Text style={styles.instructionsCellValue} numberOfLines={1}>
                  {request.orientation}
                </Text>
              </View>
              <View style={styles.instructionsCell}>
                <Ionicons name="camera-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.instructionsCellLabel}>Angle</Text>
                <Text style={styles.instructionsCellValue} numberOfLines={1}>
                  {request.angle.replace(/-/g, " ")}
                </Text>
              </View>
              <View style={styles.instructionsCell}>
                <Ionicons name="time-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.instructionsCellLabel}>Timing</Text>
                <Text style={styles.instructionsCellValue} numberOfLines={1}>
                  {request.timing}
                </Text>
              </View>
              <View style={styles.instructionsCell}>
                <Ionicons name="location-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.instructionsCellLabel}>Location</Text>
                <Text style={styles.instructionsCellValue} numberOfLines={1}>
                  {request.locationName}
                </Text>
              </View>
            </View>

            {request.note ? (
              <View style={styles.instructionsNotes}>
                <Ionicons name="chatbubble-outline" size={15} color={Colors.light.tint} />
                <Text style={styles.instructionsNotesText}>{request.note}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.instructionsDoneBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.instructionsDoneBtnText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
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
  // Grid
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  gridLineV: {
    width: 1,
    top: 0,
    bottom: 0,
  },
  gridLineH: {
    height: 1,
    left: 0,
    right: 0,
  },
  // Top bar overlay
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
  // AR compass
  arCompass: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    zIndex: 20,
  },
  arCompassRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  arDistText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Archivo_600SemiBold",
    marginTop: 5,
  },
  arLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontFamily: "Archivo_500Medium",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  // Angle guide
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
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontFamily: "Archivo_400Regular",
  },
  // Notes card
  notesCard: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  notesText: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Archivo_400Regular",
    lineHeight: 18,
  },
  // Bottom bar
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
  // Preview
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
  infoBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  // Instructions overlay
  instructionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  instructionsSheet: {
    backgroundColor: "#1A1B2E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  instructionsDragger: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: "Archivo_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  instructionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  instructionsCell: {
    flex: 1,
    minWidth: "40%",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    alignItems: "flex-start",
  },
  instructionsCellLabel: {
    fontSize: 11,
    fontFamily: "Archivo_500Medium",
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  instructionsCellValue: {
    fontSize: 14,
    fontFamily: "Archivo_600SemiBold",
    color: "#fff",
    textTransform: "capitalize",
  },
  instructionsNotes: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "rgba(124,58,237,0.15)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.3)",
  },
  instructionsNotesText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Archivo_400Regular",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  instructionsDoneBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  instructionsDoneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
  faceScanBadge: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  faceScanText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Archivo_500Medium",
  },
  faceBlurBadge: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(22,163,74,0.88)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  faceBlurText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Archivo_500Medium",
  },
});

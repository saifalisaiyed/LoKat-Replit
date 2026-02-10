import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import { CATEGORIES, type Orientation, type Angle, type Timing, type Category } from "@/lib/types";

function OptionButton({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionBtn, selected && styles.optionBtnActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={selected ? "#fff" : Colors.light.textSecondary}
      />
      <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const REWARD_OPTIONS = [3, 5, 7, 10, 15];

export default function CreateRequestScreen() {
  const insets = useSafeAreaInsets();
  const { lat, lng, name: paramName, addr: paramAddr } = useLocalSearchParams<{
    lat: string;
    lng: string;
    name: string;
    addr: string;
  }>();
  const { createRequest } = useApp();

  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [angle, setAngle] = useState<Angle>("eye-level");
  const [timing, setTiming] = useState<Timing>("now");
  const [reward, setReward] = useState(5);
  const [note, setNote] = useState("");
  const [locationName, setLocationName] = useState(paramName || "");
  const [address, setAddress] = useState(paramAddr || "");
  const [category, setCategory] = useState<Category>("landmarks");

  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createRequest({
      latitude: parseFloat(lat || "40.7580"),
      longitude: parseFloat(lng || "-73.9855"),
      locationName:
        locationName ||
        `${parseFloat(lat || "0").toFixed(3)}, ${parseFloat(lng || "0").toFixed(3)}`,
      address: address || "New York, NY",
      category,
      orientation,
      angle,
      timing,
      reward,
      note: note || undefined,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 + webInsetTop }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={20} color={Colors.light.tint} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Drop Point</Text>
            <Text style={styles.locationCoords}>
              {parseFloat(lat || "0").toFixed(4)},{" "}
              {parseFloat(lng || "0").toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>What's the place called?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Brooklyn Bridge, Central Park..."
            placeholderTextColor={Colors.light.textSecondary}
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Address</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 123 Main St, New York, NY"
            placeholderTextColor={Colors.light.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryBtn,
                  category === cat.key && styles.categoryBtnActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat.key);
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={
                    category === cat.key ? "#fff" : Colors.light.tint
                  }
                />
                <Text
                  style={[
                    styles.categoryBtnText,
                    category === cat.key && styles.categoryBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Frame Style</Text>
          <View style={styles.optionsRow}>
            <OptionButton
              icon="phone-portrait-outline"
              label="Portrait"
              selected={orientation === "portrait"}
              onPress={() => setOrientation("portrait")}
            />
            <OptionButton
              icon="phone-landscape-outline"
              label="Landscape"
              selected={orientation === "landscape"}
              onPress={() => setOrientation("landscape")}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Perspective</Text>
          <View style={styles.optionsRow}>
            <OptionButton
              icon="arrow-up-circle-outline"
              label="Upwards"
              selected={angle === "looking-up"}
              onPress={() => setAngle("looking-up")}
            />
            <OptionButton
              icon="remove-circle-outline"
              label="Straight"
              selected={angle === "eye-level"}
              onPress={() => setAngle("eye-level")}
            />
            <OptionButton
              icon="arrow-down-circle-outline"
              label="Downwards"
              selected={angle === "looking-down"}
              onPress={() => setAngle("looking-down")}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Timeline</Text>
          <View style={styles.optionsRow}>
            <OptionButton
              icon="flash-outline"
              label="Urgent"
              selected={timing === "now"}
              onPress={() => setTiming("now")}
            />
            <OptionButton
              icon="time-outline"
              label="Scheduled"
              selected={timing === "scheduled"}
              onPress={() => setTiming("scheduled")}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Set Reward</Text>
          <View style={styles.rewardRow}>
            {REWARD_OPTIONS.map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.rewardBtn,
                  reward === r && styles.rewardBtnActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setReward(r);
                }}
              >
                <Text
                  style={[
                    styles.rewardBtnText,
                    reward === r && styles.rewardBtnTextActive,
                  ]}
                >
                  ${r}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Directives (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Help the LoKater get the perfect shot..."
            placeholderTextColor={Colors.light.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.submitBar,
          { paddingBottom: Platform.OS === "web" ? 34 + 12 : insets.bottom + 16 },
        ]}
      >
        <View style={styles.submitSummary}>
          <Text style={styles.submitTotal}>${reward.toFixed(2)}</Text>
          <Text style={styles.submitLabel}>Grand Total</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={handleSubmit}
        >
          <Feather name="plus-circle" size={20} color="#fff" />
          <Text style={styles.submitBtnText}>Launch Request</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.light.tint + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textTransform: "uppercase",
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
    marginTop: 2,
  },
  fieldGroup: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
    letterSpacing: 0.2,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  optionBtnActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontFamily: "Archivo_600SemiBold",
  },
  optionLabelActive: {
    color: "#fff",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: Colors.light.tint + "18",
  },
  categoryBtnActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
  },
  categoryBtnTextActive: {
    color: "#fff",
  },
  rewardRow: {
    flexDirection: "row",
    gap: 10,
  },
  rewardBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  rewardBtnActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  rewardBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  rewardBtnTextActive: {
    color: "#fff",
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    fontFamily: "Archivo_400Regular",
  },
  textArea: {
    minHeight: 120,
  },
  submitBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  submitSummary: {},
  submitTotal: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  submitLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  submitBtn: {
    backgroundColor: Colors.light.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 20,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Archivo_600SemiBold",
  },
});

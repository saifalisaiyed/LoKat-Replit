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
        size={22}
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
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();
  const { createRequest } = useApp();

  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [angle, setAngle] = useState<Angle>("eye-level");
  const [timing, setTiming] = useState<Timing>("now");
  const [reward, setReward] = useState(5);
  const [note, setNote] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
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
      <View style={[styles.header, { paddingTop: insets.top + 8 + webInsetTop }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.locationCard}>
          <Ionicons name="location" size={20} color={Colors.palette.emerald} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationCoords}>
              {parseFloat(lat || "0").toFixed(4)},{" "}
              {parseFloat(lng || "0").toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Brooklyn Bridge, Central Park..."
            placeholderTextColor={Colors.light.textSecondary}
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Address</Text>
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
                    category === cat.key ? "#fff" : Colors.light.textSecondary
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
          <Text style={styles.fieldLabel}>Orientation</Text>
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
          <Text style={styles.fieldLabel}>Angle</Text>
          <View style={styles.optionsRow}>
            <OptionButton
              icon="arrow-up-circle-outline"
              label="Looking Up"
              selected={angle === "looking-up"}
              onPress={() => setAngle("looking-up")}
            />
            <OptionButton
              icon="remove-circle-outline"
              label="Eye Level"
              selected={angle === "eye-level"}
              onPress={() => setAngle("eye-level")}
            />
            <OptionButton
              icon="arrow-down-circle-outline"
              label="Looking Down"
              selected={angle === "looking-down"}
              onPress={() => setAngle("looking-down")}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Timing</Text>
          <View style={styles.optionsRow}>
            <OptionButton
              icon="flash-outline"
              label="Now"
              selected={timing === "now"}
              onPress={() => setTiming("now")}
            />
            <OptionButton
              icon="time-outline"
              label="Later"
              selected={timing === "scheduled"}
              onPress={() => setTiming("scheduled")}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Reward</Text>
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
          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Any specific instructions for the LoKater..."
            placeholderTextColor={Colors.light.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.submitBar,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 },
        ]}
      >
        <View style={styles.submitSummary}>
          <Text style={styles.submitTotal}>${reward.toFixed(2)}</Text>
          <Text style={styles.submitLabel}>Total Cost</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={handleSubmit}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>Post Request</Text>
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
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
  },
  locationInfo: {
    flex: 1,
  },
  locationCoords: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    fontFamily: "DMSans_600SemiBold",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  optionBtnActive: {
    backgroundColor: Colors.palette.emerald,
    borderColor: Colors.palette.emerald,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontFamily: "DMSans_600SemiBold",
  },
  optionLabelActive: {
    color: "#fff",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.palette.emerald,
    borderColor: Colors.palette.emerald,
  },
  categoryBtnText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_500Medium",
  },
  categoryBtnTextActive: {
    color: "#fff",
  },
  rewardRow: {
    flexDirection: "row",
    gap: 8,
  },
  rewardBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  rewardBtnActive: {
    backgroundColor: Colors.palette.emerald,
    borderColor: Colors.palette.emerald,
  },
  rewardBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  rewardBtnTextActive: {
    color: "#fff",
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontFamily: "DMSans_400Regular",
  },
  textArea: {
    minHeight: 80,
  },
  submitBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitSummary: {},
  submitTotal: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  submitLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  submitBtn: {
    backgroundColor: Colors.palette.emerald,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
});

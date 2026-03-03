import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Animated,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import { consumePickedLocation } from "@/lib/mapPickerStore";
import Colors from "@/constants/colors";
import { type Orientation, type Angle, type Timing, type Category } from "@/lib/types";

function OptionChip({
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
      style={[styles.chip, selected && styles.chipActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={selected ? "#fff" : Colors.light.textSecondary}
      />
      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const RESTRICTED_PLACE_TYPES = [
  "school", "university", "secondary_school", "primary_school",
  "elementary_school", "high_school", "college", "boarding_school",
  "preschool", "daycare", "educational_institution",
  "hospital", "doctor", "health", "pharmacy", "medical_center",
  "government", "courthouse", "police", "fire_station", "embassy",
  "prison", "military", "army",
];

const RESTRICTED_FRIENDLY_NAMES: Record<string, string> = {
  school: "schools", secondary_school: "schools", primary_school: "schools",
  elementary_school: "schools", high_school: "schools", boarding_school: "schools",
  preschool: "schools", daycare: "childcare centres", educational_institution: "educational institutions",
  university: "universities", college: "colleges",
  hospital: "hospitals", doctor: "medical facilities", health: "medical facilities",
  pharmacy: "pharmacies", medical_center: "medical centres",
  government: "government buildings", courthouse: "courthouses",
  police: "police stations", fire_station: "fire stations",
  embassy: "embassies", prison: "prisons", military: "military facilities",
  army: "military facilities",
};

function getRestrictionReason(types: string[]): string | null {
  for (const t of types) {
    const lower = t.toLowerCase();
    if (RESTRICTED_PLACE_TYPES.includes(lower)) {
      return RESTRICTED_FRIENDLY_NAMES[lower] || "restricted locations";
    }
  }
  return null;
}

export default function CreateRequestScreen() {
  const insets = useSafeAreaInsets();
  const {
    lat,
    lng,
    name: paramName,
    addr: paramAddr,
    cat: paramCat,
    placeTypes: paramPlaceTypes,
  } = useLocalSearchParams<{
    lat: string;
    lng: string;
    name: string;
    addr: string;
    cat: string;
    placeTypes?: string;
  }>();
  const { createRequest, user } = useApp();

  const parsedTypes: string[] = React.useMemo(() => {
    if (!paramPlaceTypes || paramPlaceTypes === "[]") return [];
    try { return JSON.parse(paramPlaceTypes); } catch { return []; }
  }, [paramPlaceTypes]);

  const restrictionReason = getRestrictionReason(parsedTypes);

  const needsGeocode = !paramAddr || paramAddr === "New York, NY" || !paramName || paramName === "Custom Location";
  const [resolvedName, setResolvedName] = useState(paramName && paramName !== "Custom Location" ? paramName : "Selected Location");
  const [resolvedAddress, setResolvedAddress] = useState(paramAddr && paramAddr !== "New York, NY" ? paramAddr : "");
  const [geocoding, setGeocoding] = useState(needsGeocode);
  const [currentLat, setCurrentLat] = useState(parseFloat(lat || "40.7580"));
  const [currentLng, setCurrentLng] = useState(parseFloat(lng || "-73.9855"));

  useEffect(() => {
    if (!needsGeocode) return;
    const latitude = lat || "0";
    const longitude = lng || "0";
    const url = new URL("/api/reverse-geocode", getApiUrl());
    url.searchParams.set("lat", latitude);
    url.searchParams.set("lng", longitude);
    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => {
        if (!paramName || paramName === "Custom Location") {
          if (data.name) setResolvedName(data.name);
        }
        if (data.address) setResolvedAddress(data.address);
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      const picked = consumePickedLocation();
      if (picked) {
        setCurrentLat(picked.lat);
        setCurrentLng(picked.lng);
        setResolvedName(picked.name);
        setResolvedAddress(picked.address);
      }
    }, [])
  );

  const locationName = resolvedName;
  const address = resolvedAddress;
  const category = (paramCat as Category) || "landmarks";

  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [angle, setAngle] = useState<Angle>("eye-level");
  const [timing, setTiming] = useState<Timing>("now");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState("");

  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  const handleSubmit = async () => {
    if (!user?.hasPaymentMethod) {
      router.push("/payment-setup");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createRequest({
      latitude: currentLat,
      longitude: currentLng,
      locationName,
      address,
      category,
      orientation,
      angle,
      timing,
      reward: 5,
      note: note || undefined,
      scheduledDate: timing === "scheduled" ? scheduledDate?.toISOString() : undefined,
      scheduledTime: timing === "scheduled" ? scheduledTime?.toISOString() : undefined,
    });
    setShowConfirmation(true);
    Animated.timing(confirmAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  if (restrictionReason) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
        <View style={[styles.header, { paddingTop: 12 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Request</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconWrap}>
            <Ionicons name="ban" size={40} color="#EF4444" />
          </View>
          <Text style={styles.restrictedTitle}>Location Not Allowed</Text>
          <Text style={styles.restrictedBody}>
            Photo requests cannot be created at {restrictionReason}. Please choose a different public location such as a landmark, park, or street.
          </Text>
          <View style={styles.restrictedLocationCard}>
            <Ionicons name="location" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.restrictedLocationName} numberOfLines={1}>{locationName}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.restrictedBackBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.restrictedBackBtnText}>Choose Another Location</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webInsetTop }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{ width: 24 }} />
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
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            {geocoding ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <>
                <Text style={styles.locationName}>{locationName}</Text>
                <Text style={styles.locationAddr}>{address}</Text>
              </>
            )}
          </View>
          <Pressable
            style={styles.mapPickerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/map-picker",
                params: {
                  lat: currentLat.toString(),
                  lng: currentLng.toString(),
                },
              });
            }}
            hitSlop={8}
          >
            <Ionicons name="map-outline" size={20} color={Colors.light.primary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Orientation</Text>
          <View style={styles.chipRow}>
            <OptionChip
              icon="phone-portrait-outline"
              label="Portrait"
              selected={orientation === "portrait"}
              onPress={() => setOrientation("portrait")}
            />
            <OptionChip
              icon="phone-landscape-outline"
              label="Landscape"
              selected={orientation === "landscape"}
              onPress={() => setOrientation("landscape")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Perspective</Text>
          <View style={styles.chipRow}>
            <OptionChip
              icon="arrow-up-circle-outline"
              label="Upwards"
              selected={angle === "looking-up"}
              onPress={() => setAngle("looking-up")}
            />
            <OptionChip
              icon="eye-outline"
              label="Straight"
              selected={angle === "eye-level"}
              onPress={() => setAngle("eye-level")}
            />
            <OptionChip
              icon="arrow-down-circle-outline"
              label="Downwards"
              selected={angle === "looking-down"}
              onPress={() => setAngle("looking-down")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timeline</Text>
          <View style={styles.chipRow}>
            <OptionChip
              icon="flash-outline"
              label="Now"
              selected={timing === "now"}
              onPress={() => setTiming("now")}
            />
            <OptionChip
              icon="calendar-outline"
              label="Later"
              selected={timing === "scheduled"}
              onPress={() => setTiming("scheduled")}
            />
          </View>
          {timing === "scheduled" && (
            <View style={styles.scheduledFields}>
              <Pressable
                style={styles.scheduledField}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
                <Text style={[styles.scheduledFieldText, !scheduledDate && styles.scheduledPlaceholder]}>
                  {scheduledDate
                    ? scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                    : "Select date"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.light.textSecondary} />
              </Pressable>
              <Pressable
                style={styles.scheduledField}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTimePicker(true);
                }}
              >
                <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                <Text style={[styles.scheduledFieldText, !scheduledTime && styles.scheduledPlaceholder]}>
                  {scheduledTime
                    ? scheduledTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                    : "Select time"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
          )}

          {showDatePicker && (
            Platform.OS === "web" ? (
              <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setShowDatePicker(false)}>
                  <View style={styles.pickerSheet}>
                    <Text style={styles.pickerTitle}>Select Date</Text>
                    <DateTimePicker
                      value={scheduledDate || new Date()}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(_, date) => {
                        if (date) setScheduledDate(date);
                      }}
                    />
                    <Pressable style={styles.pickerDoneBtn} onPress={() => {
                      if (!scheduledDate) setScheduledDate(new Date());
                      setShowDatePicker(false);
                    }}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Modal>
            ) : (
              <DateTimePicker
                value={scheduledDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setScheduledDate(date);
                }}
              />
            )
          )}

          {showTimePicker && (
            Platform.OS === "web" ? (
              <Modal transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setShowTimePicker(false)}>
                  <View style={styles.pickerSheet}>
                    <Text style={styles.pickerTitle}>Select Time</Text>
                    <DateTimePicker
                      value={scheduledTime || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={(_, time) => {
                        if (time) setScheduledTime(time);
                      }}
                    />
                    <Pressable style={styles.pickerDoneBtn} onPress={() => {
                      if (!scheduledTime) setScheduledTime(new Date());
                      setShowTimePicker(false);
                    }}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Modal>
            ) : (
              <DateTimePicker
                value={scheduledTime || new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, time) => {
                  setShowTimePicker(false);
                  if (time) setScheduledTime(time);
                }}
              />
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Any specific instructions for the LoKater..."
            placeholderTextColor="#B0B0B0"
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
          styles.bottomBar,
          { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 8 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? "Submitting..." : "Launch Request"}
          </Text>
        </Pressable>
      </View>

      {showConfirmation && (
        <Animated.View
          style={[
            styles.confirmationOverlay,
            {
              opacity: confirmAnim,
              transform: [
                {
                  scale: confirmAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationIconWrap}>
              <Ionicons name="checkmark-circle" size={52} color={Colors.light.accent} />
            </View>
            <Text style={styles.confirmationTitle}>Request Launched!</Text>
            <Text style={styles.confirmationSub}>
              Your photo request for {locationName} is now live. A nearby LoKater will pick it up soon.
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  restrictedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  restrictedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  restrictedTitle: {
    fontSize: 22,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    textAlign: "center",
  },
  restrictedBody: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  restrictedLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    maxWidth: "100%",
  },
  restrictedLocationName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
    flex: 1,
  },
  restrictedBackBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  restrictedBackBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_600SemiBold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 28,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FAFAFA",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
  },
  locationInfo: {
    flex: 1,
    gap: 1,
  },
  locationName: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  locationAddr: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  mapPickerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EAFF",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
  },
  chipLabelActive: {
    color: "#fff",
  },
  scheduledFields: {
    gap: 8,
    marginTop: 4,
  },
  scheduledField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  scheduledFieldText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
  },
  scheduledPlaceholder: {
    color: "#B0B0B0",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: 320,
    alignItems: "center",
    gap: 12,
  },
  pickerTitle: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  pickerDoneBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 4,
  },
  pickerDoneText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_600SemiBold",
  },
  noteInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    fontFamily: "Archivo_400Regular",
    minHeight: 90,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  submitBtn: {
    backgroundColor: Colors.light.tint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_600SemiBold",
  },
  confirmationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  confirmationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: "center",
    marginHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  confirmationIconWrap: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    marginBottom: 8,
  },
  confirmationSub: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

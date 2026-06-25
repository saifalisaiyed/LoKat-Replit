import React, { useRef, useEffect, useCallback } from "react";
import { useRequestLocation } from "@/hooks/useRequestLocation";
import { useRequestForm } from "@/hooks/useRequestForm";
import { View, Text, Pressable, TextInput, Platform, Animated, Modal, ActivityIndicator, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import { consumePickedLocation } from "@/lib/mapPickerStore";
import MiniMap from "@/components/MiniMap";
import { type Orientation, type Angle, type Timing, type Category } from "@/lib/types";
import {
  BLACK,
  BLACK_A40,
  BLACK_A55,
  EMERALD_100,
  GRASS,
  GRAY_105,
  GRAY_130,
  GRAY_150,
  GRAY_170,
  GRAY_380,
  GRAY_600,
  GRAY_700,
  GRAY_80,
  GRAY_850,
  GREEN_100,
  GREEN_50,
  GREEN_600,
  GREEN_700,
  PURPLE,
  PURPLE_100,
  PURPLE_30,
  PURPLE_75,
  RED,
  RED_50,
  WHITE,
} from "@/constants/colors";

import styles from "@/styles/create-request";

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
        color={selected ? WHITE : GRAY_600}
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
  const {
    resolvedName, setResolvedName,
    resolvedAddress, setResolvedAddress,
    geocoding, setGeocoding,
    currentLat, setCurrentLat,
    currentLng, setCurrentLng,
    isCustomPinned, setIsCustomPinned,
    facingDirection, setFacingDirection,
  } = useRequestLocation({
    initialName: paramName && paramName !== "Custom Location" ? paramName : "Selected Location",
    initialAddress: paramAddr && paramAddr !== "New York, NY" ? paramAddr : "",
    initialGeocoding: needsGeocode,
    initialLat: parseFloat(lat || "40.7580"),
    initialLng: parseFloat(lng || "-73.9855"),
  });
  const beforePickRef = useRef<{ name: string; address: string; lat: number; lng: number } | null>(null);

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
        beforePickRef.current = {
          name: resolvedName,
          address: resolvedAddress,
          lat: currentLat,
          lng: currentLng,
        };
        setCurrentLat(picked.lat);
        setCurrentLng(picked.lng);
        setResolvedName(picked.name);
        setResolvedAddress(picked.address);
        setIsCustomPinned(true);
        setFacingDirection(picked.facingDirection || null);
      }
    }, [resolvedName, resolvedAddress, currentLat, currentLng])
  );

  const locationName = resolvedName;
  const address = resolvedAddress;
  const category = (paramCat as Category) || "landmarks";

  const {
    orientation, setOrientation,
    angle, setAngle,
    timing, setTiming,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime,
    showDatePicker, setShowDatePicker,
    showTimePicker, setShowTimePicker,
    reward, setReward,
    note, setNote,
    savedNote, setSavedNote,
    notesFocused, setNotesFocused,
    showConfirmation, setShowConfirmation,
    isSubmitting, setIsSubmitting,
  } = useRequestForm();

  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const confirmAnim = useRef(new Animated.Value(0)).current;

  const handleSubmit = async () => {
    if (!user?.hasPaymentMethod) {
      router.push("/payment-setup");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const submitLocationName = isCustomPinned && beforePickRef.current
      ? beforePickRef.current.name
      : locationName;
    const submitAddress = isCustomPinned && beforePickRef.current
      ? beforePickRef.current.address
      : address;
    const submitSpecificSpotName = isCustomPinned ? resolvedName : undefined;

    await createRequest({
      latitude: currentLat,
      longitude: currentLng,
      locationName: submitLocationName,
      address: submitAddress,
      ...(submitSpecificSpotName ? { specificSpotName: submitSpecificSpotName } : {}),
      ...(isCustomPinned && facingDirection ? { facingDirection } : {}),
      category,
      orientation,
      angle,
      timing,
      reward,
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
            <Ionicons name="chevron-back" size={24} color={GRAY_850} />
          </Pressable>
          <Text style={styles.headerTitle}>New Request</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconWrap}>
            <Ionicons name="ban" size={40} color={RED} />
          </View>
          <Text style={styles.restrictedTitle}>Location Not Allowed</Text>
          <Text style={styles.restrictedBody}>
            Photo requests cannot be created at {restrictionReason}. Please choose a different public location such as a landmark, park, or street.
          </Text>
          <View style={styles.restrictedLocationCard}>
            <Ionicons name="location" size={16} color={GRAY_600} />
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
          <Ionicons name="chevron-back" size={24} color={GRAY_850} />
        </Pressable>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <View style={styles.locationCard}>
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            {geocoding ? (
              <ActivityIndicator size="small" color={PURPLE} />
            ) : (
              <>
                <Text style={styles.locationName}>{locationName}</Text>
                <Text style={styles.locationAddr}>{address}</Text>
              </>
            )}
          </View>
        </View>

        {isCustomPinned ? (
          <View style={styles.pinnedContainer}>
            <MiniMap
              latitude={currentLat}
              longitude={currentLng}
              style={styles.miniMap}
            />
            <View style={styles.pinnedRow}>
              <View style={styles.pinnedIconWrap}>
                <Ionicons name="location" size={16} color={WHITE} />
              </View>
              <View style={styles.pinnedBody}>
                <Text style={styles.pinnedLabel}>Exact spot pinned</Text>
                <Text style={styles.pinnedSub}>{resolvedName}</Text>
                {facingDirection ? (
                  <View style={styles.dirBadge}>
                    <Ionicons name="compass-outline" size={11} color={PURPLE} />
                    <Text style={styles.dirBadgeText}>Facing {facingDirection}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.pinnedActions}>
                <Pressable
                  style={styles.pinnedChangeBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/map-picker",
                      params: { lat: currentLat.toString(), lng: currentLng.toString() },
                    });
                  }}
                >
                  <Text style={styles.pinnedChangeBtnText}>Change</Text>
                </Pressable>
                <Pressable
                  style={styles.pinnedClearBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const prev = beforePickRef.current;
                    if (prev) {
                      setResolvedName(prev.name);
                      setResolvedAddress(prev.address);
                      setCurrentLat(prev.lat);
                      setCurrentLng(prev.lng);
                    }
                    setIsCustomPinned(false);
                    setFacingDirection(null);
                  }}
                >
                  <Ionicons name="close" size={13} color={GRAY_600} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.pinpointCard, pressed && { opacity: 0.75 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/map-picker",
                params: { lat: currentLat.toString(), lng: currentLng.toString() },
              });
            }}
          >
            <View style={styles.pinpointIconWrap}>
              <Ionicons name="map-outline" size={18} color={PURPLE} />
            </View>
            <View style={styles.pinpointCardBody}>
              <Text style={styles.pinpointCardTitle}>Select exact spot on map</Text>
              <Text style={styles.pinpointCardSub}>Optional — refine the pin location</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={GRAY_600} />
          </Pressable>
        )}

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
                <Ionicons name="calendar-outline" size={16} color={GRAY_600} />
                <Text style={[styles.scheduledFieldText, !scheduledDate && styles.scheduledPlaceholder]}>
                  {scheduledDate
                    ? scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                    : "Select date"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={GRAY_600} />
              </Pressable>
              <Pressable
                style={styles.scheduledField}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTimePicker(true);
                }}
              >
                <Ionicons name="time-outline" size={16} color={GRAY_600} />
                <Text style={[styles.scheduledFieldText, !scheduledTime && styles.scheduledPlaceholder]}>
                  {scheduledTime
                    ? scheduledTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                    : "Select time"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={GRAY_600} />
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
          <Text style={styles.sectionLabel}>Reward</Text>
          <View style={styles.rewardRow}>
            {[3, 5, 10, 15, 20].map((amt) => (
              <Pressable
                key={amt}
                style={[styles.rewardChip, reward === amt && styles.rewardChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setReward(amt);
                }}
              >
                <Text style={[styles.rewardChipText, reward === amt && styles.rewardChipTextActive]}>
                  ${amt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.notesLabelRow}>
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            {notesFocused && note !== savedNote && (
              <Pressable
                style={styles.notesDoneBtn}
                onPress={() => { setSavedNote(note); Keyboard.dismiss(); setNotesFocused(false); }}
                hitSlop={8}
              >
                <Text style={styles.notesDoneBtnText}>Done</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={[styles.noteInput, notesFocused && styles.noteInputFocused]}
            placeholder="Any specific instructions for the LoKater..."
            placeholderTextColor={GRAY_380}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
          />
        </View>
      </KeyboardAwareScrollView>

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
          <Feather name="send" size={18} color={WHITE} />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? "Submitting..." : `Launch Request · $${reward}`}
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
              <Ionicons name="checkmark-circle" size={52} color={GRASS} />
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

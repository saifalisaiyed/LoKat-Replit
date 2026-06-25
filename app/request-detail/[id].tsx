import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { View, Text, Pressable, ScrollView, Platform, Dimensions, Modal, Alert, ActivityIndicator, TextInput, BackHandler } from "react-native";
import { Image } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import { CATEGORIES } from "@/lib/types";
import MapViewWrapper from "@/components/MapViewWrapper";
import AuthPromptModal from "@/components/AuthPromptModal";
import {
  BLACK_A03,
  BLACK_A04,
  BLACK_A40,
  BLUE,
  GOLD,
  GRASS,
  GRASS_A06,
  GRASS_A07,
  GRASS_A10,
  GRASS_A12,
  GRASS_A25,
  GRAY_105,
  GRAY_170,
  GRAY_600,
  GRAY_850,
  GREEN_500,
  ORANGE,
  PINK,
  PURPLE,
  PURPLE_A06,
  PURPLE_A07,
  PURPLE_A08,
  PURPLE_A12,
  PURPLE_A18,
  PURPLE_A20,
  PURPLE_LIGHT,
  RED,
  RED_100,
  SKY_100,
  SKY_A08,
  TEAL,
  WHITE,
  WHITE_A90,
} from "@/constants/colors";

import styles from "./[id].styles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.32;

const CATEGORY_COLORS: Record<string, string> = {
  landmarks: GOLD,
  nature: GREEN_500,
  markets: PINK,
  beaches: ORANGE,
  cityscapes: BLUE,
  food: RED,
  "hidden-gems": PURPLE_LIGHT,
  events: TEAL,
};

function getCatColor(key: string): string {
  return CATEGORY_COLORS[key] || PURPLE;
}

function hexToRgba(hex: string, alpha: number): string {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const FACING_FULL: Record<string, string> = {
  N: "North", NE: "Northeast", E: "East", SE: "Southeast",
  S: "South", SW: "Southwest", W: "West", NW: "Northwest",
};

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={18} color={PURPLE} />
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function RequestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, abandonRequest, deleteRequest, updateRequestNote, user, isAuthenticated } = useApp();
  const mapRef = useRef<any>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [menuVisible, setMenuVisible] = useState(false);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const {
    editingNote, setEditingNote,
    noteText, setNoteText,
    isSavingNote, setIsSavingNote,
  } = useNoteEditor();
  const [freshRequest, setFreshRequest] = useState<any | null>(null);
  const [loadingFresh, setLoadingFresh] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoadingFresh(true);
      const url = new URL(`/api/requests/${id}`, getApiUrl());
      fetch(url.toString(), { credentials: "include" })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setFreshRequest(data); })
        .catch(() => {})
        .finally(() => setLoadingFresh(false));
    }, [id])
  );

  const request = freshRequest || requests.find((req) => req.id === id);
  const userId = user?.id;
  const isMyRequest = request?.creatorId === userId;
  const isActiveLoKater = request?.status === "accepted" && request?.acceptedBy === userId;
  const safeCategory = request?.category || "landmarks";
  const categoryData = CATEGORIES.find((c) => c.key === safeCategory) || CATEGORIES[0];

  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isActiveLoKater });
    if (!isActiveLoKater) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [isActiveLoKater, navigation]);

  if (!request) {
    return (
      <View style={[styles.container, styles.centered]}>
        {loadingFresh ? (
          <ActivityIndicator size="large" color={PURPLE} />
        ) : (
          <>
            <Text style={styles.notFoundText}>Request not found</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>Go back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const mapRegion = {
    latitude: request.latitude,
    longitude: request.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleAccept = async () => {
    if (!isAuthenticated) { setAuthPromptVisible(true); return; }
    if (!user?.payoutInfo) {
      router.push("/payout-setup");
      return;
    }
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL(`/api/requests/${request.id}/accept`, baseUrl);
      const res = await fetch(url.toString(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await res.json();
      setIsAccepting(false);
      if (res.ok) {
        router.replace({ pathname: "/lokater-mode/[id]", params: { id: request.id } });
      } else {
        Alert.alert("Could not accept", result.message || "Failed to accept request");
      }
    } catch (error: any) {
      setIsAccepting(false);
      console.error("Accept request error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const handleIgnore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: "/lokater-mode/[id]", params: { id: request.id } });
  };

  const handleAbandon = () => {
    setMenuVisible(false);
    const doAbandon = () => {
      abandonRequest(request.id);
      router.replace({ pathname: "/(tabs)", params: { abandoned: "1" } });
    };
    if (Platform.OS === "web") {
      doAbandon();
    } else {
      Alert.alert(
        "Abandon Request",
        "Are you sure? The request will become available for other LoKaters.",
        [
          { text: "Keep Going", style: "cancel" },
          { text: "Abandon", style: "destructive", onPress: doAbandon },
        ]
      );
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteRequest(request.id);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapSection, { height: MAP_HEIGHT }]}>
        <MapViewWrapper
          selectedPin={{ latitude: request.latitude, longitude: request.longitude }}
          openRequests={[]}
          isSeeker={true}
          onMarkerPress={() => {}}
          permissionStatus={null}
          initialRegion={mapRegion}
          mapRef={mapRef}
          onMapPress={() => {}}
        />
        {!isActiveLoKater && (
          <Pressable
            style={[styles.backBtn, { top: insets.top + 12 + webInsetTop }]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={GRAY_850} />
          </Pressable>
        )}
        {isMyRequest && request.status === "open" && (
          <Pressable
            style={[styles.deleteBtn, { top: insets.top + 12 + webInsetTop }]}
            onPress={handleDelete}
            hitSlop={12}
          >
            <Ionicons name="trash-outline" size={20} color={RED} />
          </Pressable>
        )}
        {isActiveLoKater && (
          <Pressable
            style={[styles.deleteBtn, { top: insets.top + 12 + webInsetTop }]}
            onPress={() => setMenuVisible(true)}
            hitSlop={12}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={GRAY_850} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.locationName}>{request.locationName}</Text>
              <Text style={styles.address}>{request.address}</Text>
              {request.specificSpotName ? (
                <View style={styles.specificSpotRow}>
                  <Ionicons name="navigate-circle-outline" size={13} color={PURPLE} />
                  <Text style={styles.specificSpotText}>Exact spot: {request.specificSpotName}</Text>
                </View>
              ) : null}
              {request.facingDirection ? (
                <View style={styles.specificSpotRow}>
                  <Ionicons name="compass-outline" size={13} color={ORANGE} />
                  <Text style={[styles.specificSpotText, { color: ORANGE }]}>
                    Facing {FACING_FULL[request.facingDirection] ?? request.facingDirection}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>${request.reward}</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.categoryPill, { backgroundColor: hexToRgba(getCatColor(safeCategory), 0.12), borderColor: hexToRgba(getCatColor(safeCategory), 0.3) }]}>
              <Ionicons
                name={categoryData.icon as any}
                size={15}
                color={getCatColor(safeCategory)}
              />
              <Text style={[styles.categoryPillText, { color: getCatColor(safeCategory) }]}>
                {categoryData.label}
              </Text>
            </View>
          </View>

          {/* Accepted status card — shown to the seeker only while lokater is working */}
          {isMyRequest && request.status === "accepted" && (
            <View style={styles.acceptedCard}>
              <View style={styles.acceptedIconWrap}>
                <Ionicons name="walk" size={22} color={PURPLE} />
              </View>
              <View style={styles.acceptedInfo}>
                <Text style={styles.acceptedTitle}>LoKater accepted your request</Text>
                <Text style={styles.acceptedSub}>
                  {"They're heading to the location now. Use the chat below to share extra details or updates."}
                </Text>
              </View>
            </View>
          )}

          {/* Submitted status card — shown to seeker when photo has been sent */}
          {isMyRequest && request.status === "submitted" && (
            <View style={[styles.acceptedCard, styles.submittedCard]}>
              <View style={[styles.acceptedIconWrap, { backgroundColor: GRASS_A12 }]}>
                <Ionicons name="checkmark-circle" size={22} color={GRASS} />
              </View>
              <View style={styles.acceptedInfo}>
                <Text style={[styles.acceptedTitle, { color: GRASS }]}>Photo submitted!</Text>
                <Text style={styles.acceptedSub}>
                  Your photo is ready — scroll down to view it. Payment is being processed.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailsCard}>
            <DetailRow
              icon="phone-portrait-outline"
              label="Orientation"
              value={request.orientation === "portrait" ? "Portrait" : "Landscape"}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={request.angle === "looking-up" ? "arrow-up-circle-outline" : request.angle === "looking-down" ? "arrow-down-circle-outline" : "eye-outline"}
              label="Angle"
              value={request.angle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={request.timing === "now" ? "flash-outline" : "time-outline"}
              label="Timing"
              value={request.timing === "now" ? "As soon as possible" : request.scheduledTime ? new Date(request.scheduledTime).toLocaleString() : "Scheduled"}
            />
          </View>

          {/* Notes — seekers can add/edit when request is still active */}
          {(request.note || (isMyRequest && (request.status === "open" || request.status === "accepted"))) && (
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <Text style={styles.instructionsTitle}>Instructions</Text>
                {isMyRequest && (request.status === "open" || request.status === "accepted") && !editingNote && (
                  <Pressable
                    hitSlop={10}
                    onPress={() => { setNoteText(request.note ?? ""); setEditingNote(true); }}
                    style={styles.editNoteBtn}
                  >
                    <Ionicons name="pencil-outline" size={16} color={PURPLE} />
                    <Text style={styles.editNoteBtnText}>{request.note ? "Edit" : "Add"}</Text>
                  </Pressable>
                )}
              </View>

              {editingNote ? (
                <>
                  <TextInput
                    style={styles.noteInput}
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder="Describe what you're looking for — angle, framing, time of day…"
                    placeholderTextColor={GRAY_600}
                    multiline
                    autoFocus
                    maxLength={500}
                  />
                  <View style={styles.noteActions}>
                    <Pressable
                      style={({ pressed }) => [styles.noteCancelBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => setEditingNote(false)}
                      disabled={isSavingNote}
                    >
                      <Text style={styles.noteCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.noteSaveBtn, pressed && { opacity: 0.85 }, isSavingNote && { opacity: 0.6 }]}
                      disabled={isSavingNote}
                      onPress={async () => {
                        setIsSavingNote(true);
                        const result = await updateRequestNote(request.id, noteText);
                        setIsSavingNote(false);
                        if (result.ok) {
                          setEditingNote(false);
                        } else {
                          Alert.alert("Save failed", result.error || "Could not save note.");
                        }
                      }}
                    >
                      {isSavingNote
                        ? <ActivityIndicator size="small" color={WHITE} />
                        : <Text style={styles.noteSaveText}>Save</Text>
                      }
                    </Pressable>
                  </View>
                </>
              ) : request.note ? (
                <Text style={styles.instructionsText}>{request.note}</Text>
              ) : (
                <Text style={styles.noteEmptyText}>No instructions yet. Tap Edit to add some.</Text>
              )}
            </View>
          )}

          {request.photoUri && (
            <View style={styles.photoSection}>
              <Text style={styles.instructionsTitle}>Submitted Photo</Text>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: request.photoUri }}
                  style={styles.photo}
                  contentFit="cover"
                  onLoad={() => {
                    if (isMyRequest && request.status === "completed") {
                      const url = new URL(`/api/requests/${request.id}/photo-viewed`, getApiUrl());
                      fetch(url.toString(), { method: "POST", credentials: "include" }).catch(() => {});
                    }
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {request.status === "open" && !isMyRequest && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.ignoreBtn, pressed && { opacity: 0.7 }]}
            onPress={handleIgnore}
          >
            <Ionicons name="close" size={20} color={GRAY_600} />
            <Text style={styles.ignoreBtnText}>Ignore</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, isAccepting && { opacity: 0.7 }, pressed && !isAccepting && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <Feather name="check" size={20} color={WHITE} />
            )}
            <Text style={styles.acceptBtnText}>{isAccepting ? "Accepting..." : "Accept"}</Text>
          </Pressable>
        </View>
      )}

      {isActiveLoKater && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: request.id } })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={PURPLE} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, { flex: 1 }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleNavigate}
          >
            <Ionicons name="navigate" size={20} color={WHITE} />
            <Text style={styles.acceptBtnText}>Enter LoKater Mode</Text>
          </Pressable>
        </View>
      )}

      {request.status === "accepted" && isMyRequest && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.chatFullBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: request.id } })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={WHITE} />
            <Text style={styles.chatFullBtnText}>Message LoKater</Text>
          </Pressable>
        </View>
      )}

      {request.status === "completed" && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={GRASS} />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        </View>
      )}

      {request.status === "submitted" && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-done" size={22} color={PURPLE} />
            <Text style={[styles.completedText, { color: PURPLE }]}>Photo Sent</Text>
          </View>
        </View>
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuSheet, { paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16 }]}>
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>Options</Text>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: RED_100 }]}
              onPress={handleAbandon}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="close-circle-outline" size={20} color={RED} />
              </View>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemText}>Abandon Request</Text>
                <Text style={styles.menuItemSub}>Release for other LoKaters</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuCancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <AuthPromptModal
        visible={authPromptVisible}
        onClose={() => setAuthPromptVisible(false)}
        context="claim-request"
      />
    </View>
  );
}

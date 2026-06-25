import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import React from "react";
import { useApp } from "@/lib/store";
import {
  BLACK,
  GRAY_450,
  PURPLE,
  RED,
  WHITE,
} from "@/constants/colors";

import tabStyles from "@/styles/(tabs)/tabStyles";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "viewfinder.circle", selected: "viewfinder.circle.fill" }} />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "rectangle.on.rectangle", selected: "rectangle.on.rectangle.fill" }} />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications" href={null} />
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  useColorScheme();
  const isWeb = Platform.OS === "web";
  useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: GRAY_450,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: WHITE,
          borderTopWidth: 0,
          borderTopLeftRadius: 7,
          borderTopRightRadius: 7,
          elevation: 8,
          shadowColor: BLACK,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          paddingTop: 14,
          ...(isWeb ? { height: 94 } : { height: 80 }),
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: WHITE,
                borderTopLeftRadius: 7,
                borderTopRightRadius: 7,
              },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
              <Ionicons
                name={focused ? "map" : "map-outline"}
                size={22}
                color={focused ? WHITE : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
              <Ionicons
                name={focused ? "images" : "images-outline"}
                size={22}
                color={focused ? WHITE : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={focused ? WHITE : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

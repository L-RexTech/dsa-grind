import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDSA } from "@/context/DSAContext";
import { useColors } from "@/hooks/useColors";

export default function FocusGateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { backlogDays, getTodayProgress, state } = useDSA();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const progress = getTodayProgress();
  const shake = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const shakeAnim = Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]);
    shakeAnim.start();

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }, [shake, pulse]);

  const remaining = progress.total - progress.completed;
  const isBacklogged = backlogDays > 0;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: "#0d1117",
          paddingTop: topPad,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Close button — go back */}
      <Pressable
        style={[styles.closeBtn, { top: topPad + 12 }]}
        onPress={() => router.back()}
        hitSlop={12}
      >
        <Ionicons name="close" size={24} color="#8b949e" />
      </Pressable>

      <View style={styles.content}>
        {/* Blocked icon */}
        <Animated.View
          style={[
            styles.iconWrap,
            {
              backgroundColor: "#f85149" + "18",
              borderColor: "#f85149" + "60",
              transform: [{ translateX: shake }, { scale: pulse }],
            },
          ]}
        >
          <MaterialCommunityIcons name="instagram" size={64} color="#f85149" />
          <View style={styles.blockOverlay}>
            <Ionicons name="ban" size={36} color="#f85149" />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: "#e6edf3", fontFamily: "Inter_700Bold" }]}>
          Instagram Blocked
        </Text>

        <Text style={[styles.subtitle, { color: "#8b949e", fontFamily: "Inter_400Regular" }]}>
          {isBacklogged
            ? `You have ${backlogDays} day${backlogDays > 1 ? "s" : ""} of backlog. Clear your problems first.`
            : `You still have ${remaining} problem${remaining !== 1 ? "s" : ""} left today. Finish them to unlock.`}
        </Text>

        {/* Status */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: "#161b22", borderColor: "#30363d" },
          ]}
        >
          <View style={styles.statusRow}>
            <Ionicons
              name={progress.completed > 0 ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={progress.completed > 0 ? "#00ff88" : "#30363d"}
            />
            <Text style={[styles.statusText, { color: "#e6edf3", fontFamily: "Inter_500Medium" }]}>
              Today: {progress.completed}/{progress.total} solved
            </Text>
          </View>
          {isBacklogged && (
            <View style={styles.statusRow}>
              <Ionicons name="warning" size={20} color="#d29922" />
              <Text style={[styles.statusText, { color: "#e6edf3", fontFamily: "Inter_500Medium" }]}>
                Backlog: {backlogDays} day{backlogDays > 1 ? "s" : ""} missed
              </Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="fire" size={20} color={state.currentStreak > 0 ? "#d29922" : "#30363d"} />
            <Text style={[styles.statusText, { color: "#e6edf3", fontFamily: "Inter_500Medium" }]}>
              Streak: {state.currentStreak} day{state.currentStreak !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Native blocking note */}
        <View style={[styles.noteCard, { backgroundColor: "#21262d", borderColor: "#30363d" }]}>
          <Ionicons name="information-circle-outline" size={16} color="#58a6ff" />
          <Text style={[styles.noteText, { color: "#8b949e", fontFamily: "Inter_400Regular" }]}>
            For real Instagram blocking on Android, enable Focus Mode via Digital Wellbeing in Settings, or use the companion screen-time features.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.solveBtn, { backgroundColor: "#00ff88" }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.replace("/");
          }}
        >
          <Ionicons name="code-slash" size={20} color="#0d1117" />
          <Text style={[styles.solveBtnText, { color: "#0d1117", fontFamily: "Inter_700Bold" }]}>
            Go Solve Problems
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 20,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  blockOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#0d1117",
    borderRadius: 20,
    padding: 2,
  },
  title: { fontSize: 30, textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  statusCard: {
    width: "100%",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusText: { fontSize: 15 },
  noteCard: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  solveBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  solveBtnText: { fontSize: 18 },
});

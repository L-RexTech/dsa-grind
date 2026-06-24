import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressRing } from "@/components/ProgressRing";
import { QuestionCard } from "@/components/QuestionCard";
import { StreakBadge } from "@/components/StreakBadge";
import { useDSA } from "@/context/DSAContext";
import { useColors } from "@/hooks/useColors";
import {
  hasUsageAccess,
  hasOverlayPermission,
  openUsageAccessSettings,
  openOverlaySettings,
} from "@/modules/app-blocker";

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    state,
    todayAssignment,
    backlogDays,
    isBlocked,
    hasAllPermissions,
    markCompleted,
    markUncompleted,
    getQuestion,
    getTodayProgress,
  } = useDSA();
  const progress = getTodayProgress();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const allDone = progress.completed === progress.total && progress.total > 0;

  const needsUsage = !hasUsageAccess();
  const needsOverlay = !hasOverlayPermission();
  const showPermSetup = Platform.OS === "android" && !hasAllPermissions;

  const handleBlockedPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push("/focus-gate");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {dateStr}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Today's Grind
          </Text>
        </View>
        <StreakBadge streak={state.currentStreak} size="md" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn }}>

          {/* ── Permissions setup card ──────────────────────────────────────── */}
          {showPermSetup && (
            <View style={[styles.permCard, { backgroundColor: "#1c2128", borderColor: "#f0883e60" }]}>
              <View style={styles.permHeader}>
                <Ionicons name="shield-outline" size={20} color="#f0883e" />
                <Text style={[styles.permTitle, { fontFamily: "Inter_700Bold" }]}>
                  Enable Real Instagram Blocking
                </Text>
              </View>
              <Text style={[styles.permSub, { fontFamily: "Inter_400Regular" }]}>
                Grant 2 permissions so DSA Grind can detect and block Instagram after 3 PM.
              </Text>

              {/* Usage Access */}
              <Pressable
                style={[
                  styles.permRow,
                  {
                    backgroundColor: needsUsage ? "#21262d" : "#0d1117",
                    borderColor: needsUsage ? "#f0883e60" : "#00ff8860",
                  },
                ]}
                onPress={() => {
                  if (needsUsage) openUsageAccessSettings();
                }}
              >
                <Ionicons
                  name={needsUsage ? "ellipse-outline" : "checkmark-circle"}
                  size={22}
                  color={needsUsage ? "#f0883e" : "#00ff88"}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permRowTitle, { color: "#e6edf3", fontFamily: "Inter_600SemiBold" }]}>
                    Usage Access
                  </Text>
                  <Text style={[styles.permRowSub, { fontFamily: "Inter_400Regular" }]}>
                    Lets the app detect which app is open
                  </Text>
                </View>
                {needsUsage && (
                  <Text style={[styles.permBtn, { fontFamily: "Inter_600SemiBold" }]}>Grant →</Text>
                )}
              </Pressable>

              {/* Overlay permission */}
              <Pressable
                style={[
                  styles.permRow,
                  {
                    backgroundColor: needsOverlay ? "#21262d" : "#0d1117",
                    borderColor: needsOverlay ? "#f0883e60" : "#00ff8860",
                  },
                ]}
                onPress={() => {
                  if (needsOverlay) openOverlaySettings();
                }}
              >
                <Ionicons
                  name={needsOverlay ? "ellipse-outline" : "checkmark-circle"}
                  size={22}
                  color={needsOverlay ? "#f0883e" : "#00ff88"}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permRowTitle, { color: "#e6edf3", fontFamily: "Inter_600SemiBold" }]}>
                    Display Over Other Apps
                  </Text>
                  <Text style={[styles.permRowSub, { fontFamily: "Inter_400Regular" }]}>
                    Lets the app cover Instagram with a block screen
                  </Text>
                </View>
                {needsOverlay && (
                  <Text style={[styles.permBtn, { fontFamily: "Inter_600SemiBold" }]}>Grant →</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* ── Progress card ───────────────────────────────────────────────── */}
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.card,
                borderColor: allDone ? colors.primary + "60" : colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <ProgressRing completed={progress.completed} total={progress.total} size={110} />
            <View style={styles.progressText}>
              {allDone ? (
                <>
                  <Text style={[styles.doneTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    All done!
                  </Text>
                  <Text style={[styles.doneSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Streak maintained. Come back tomorrow.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.progressTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {progress.total - progress.completed} left today
                  </Text>
                  <Text style={[styles.progressSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Keep solving to maintain your streak
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* ── Backlog warning ─────────────────────────────────────────────── */}
          {backlogDays > 0 && (
            <Pressable
              style={[styles.backlogBanner, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive + "60" }]}
              onPress={handleBlockedPress}
            >
              <Ionicons name="warning" size={18} color={colors.destructive} />
              <Text style={[styles.backlogText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
                {backlogDays} day{backlogDays > 1 ? "s" : ""} of backlog — Instagram is blocked
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
            </Pressable>
          )}

          {/* ── Blocking active indicator ───────────────────────────────────── */}
          {isBlocked && hasAllPermissions && (
            <View style={[styles.blockingActive, { backgroundColor: "#ff000015", borderColor: "#f8514960" }]}>
              <Ionicons name="ban" size={16} color="#f85149" />
              <Text style={[styles.blockingActiveText, { fontFamily: "Inter_500Medium" }]}>
                Instagram is actively blocked right now
              </Text>
            </View>
          )}

          {/* ── Today's questions ───────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
            TODAY'S PROBLEMS
          </Text>

          {todayAssignment?.questionIds.map((qId, idx) => {
            const q = getQuestion(qId);
            if (!q) return null;
            const isCompleted = todayAssignment.completedIds.includes(qId);
            return (
              <QuestionCard
                key={qId}
                question={q}
                isCompleted={isCompleted}
                showCheckbox
                index={idx}
                onToggleComplete={() => {
                  if (isCompleted) markUncompleted(qId);
                  else markCompleted(qId);
                }}
              />
            );
          })}

          {!todayAssignment && (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="code-slash" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No questions assigned today yet
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 26 },
  scroll: { flex: 1 },
  content: { paddingTop: 20, paddingHorizontal: 20 },

  permCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  permHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  permTitle: { fontSize: 15, color: "#f0883e" },
  permSub: { fontSize: 13, color: "#8b949e", lineHeight: 18 },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  permRowTitle: { fontSize: 14, marginBottom: 2 },
  permRowSub: { fontSize: 12, color: "#8b949e" },
  permBtn: { fontSize: 13, color: "#f0883e" },

  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
  },
  progressText: { flex: 1 },
  doneTitle: { fontSize: 22, marginBottom: 4 },
  doneSub: { fontSize: 13 },
  progressTitle: { fontSize: 18, marginBottom: 4 },
  progressSub: { fontSize: 13 },
  backlogBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  backlogText: { flex: 1, fontSize: 13 },
  blockingActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  blockingActiveText: { fontSize: 13, color: "#f85149" },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
});

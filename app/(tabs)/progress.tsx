import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StreakBadge } from "@/components/StreakBadge";
import { useDSA } from "@/context/DSAContext";
import { useColors } from "@/hooks/useColors";

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, backlogDays } = useDSA();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  const totalCompleted = state.assignments.reduce(
    (acc, a) => acc + a.completedIds.length,
    0
  );
  const totalDays = state.assignments.length;
  const perfectDays = state.assignments.filter((a) => a.completedIds.length >= 3).length;

  const last14 = [...state.assignments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)
    .reverse();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Progress
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn }}>
          {/* Streak */}
          <View
            style={[
              styles.streakCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.streakRow}>
              <View>
                <Text style={[styles.streakLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Current streak
                </Text>
                <StreakBadge streak={state.currentStreak} size="lg" />
              </View>
              <View style={styles.streakDivider} />
              <View>
                <Text style={[styles.streakLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Best streak
                </Text>
                <StreakBadge streak={state.longestStreak} size="lg" />
              </View>
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Problems Solved" value={totalCompleted} color={colors.primary} />
            <StatCard label="Days Active" value={totalDays} color={colors.accent} />
            <StatCard label="Perfect Days" value={perfectDays} color={colors.success} />
            <StatCard
              label="Backlog Days"
              value={backlogDays}
              color={backlogDays > 0 ? colors.destructive : colors.mutedForeground}
            />
          </View>

          {/* Recent 14 days */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
            LAST 14 DAYS
          </Text>

          {last14.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="calendar-blank" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No activity yet. Start solving today!
              </Text>
            </View>
          ) : (
            last14.map((a) => {
              const isPerfect = a.completedIds.length >= 3;
              const hasBacklog = a.completedIds.length < 3;
              const today = new Date().toISOString().split("T")[0];
              const isToday = a.date === today;
              const d = new Date(a.date + "T12:00:00");
              const label = isToday ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <View
                  key={a.date}
                  style={[
                    styles.dayRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: isPerfect ? colors.primary + "40" : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.dayDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {label}
                  </Text>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              i < a.completedIds.length
                                ? isPerfect
                                  ? colors.primary
                                  : colors.accent
                                : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.dayStatus,
                      {
                        color: isPerfect
                          ? colors.primary
                          : isToday
                          ? colors.accent
                          : colors.destructive,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {isPerfect ? "Done" : isToday ? "Today" : "Missed"}
                  </Text>
                </View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26 },
  scroll: { flex: 1 },
  content: { paddingTop: 20, paddingHorizontal: 20 },
  streakCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  streakDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#30363d",
  },
  streakLabel: { fontSize: 12, marginBottom: 8 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 12, textAlign: "center" },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  dayDate: { width: 70, fontSize: 13 },
  dotsRow: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dayStatus: { width: 50, textAlign: "right", fontSize: 13 },
});

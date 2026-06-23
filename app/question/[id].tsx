import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDSA } from "@/context/DSAContext";
import { useColors } from "@/hooks/useColors";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#3fb950",
  Medium: "#d29922",
  Hard: "#f85149",
};

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getQuestion, todayAssignment, markCompleted, markUncompleted } = useDSA();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const question = getQuestion(id ?? "");
  const isInToday = todayAssignment?.questionIds.includes(id ?? "") ?? false;
  const isCompleted = todayAssignment?.completedIds.includes(id ?? "") ?? false;

  if (!question) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Question not found</Text>
      </View>
    );
  }

  const diffColor = DIFFICULTY_COLORS[question.difficulty] ?? colors.mutedForeground;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isCompleted) {
      markUncompleted(question.id);
    } else {
      markCompleted(question.id);
    }
  };

  const handleOpenLink = () => {
    if (question.url) {
      Linking.openURL(question.url);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerBadges}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + "22" }]}>
            <Text style={[styles.diffText, { color: diffColor, fontFamily: "Inter_600SemiBold" }]}>
              {question.difficulty}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {question.title}
        </Text>

        <View style={[styles.catBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.catText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            {question.category}
          </Text>
        </View>

        {/* Open on LeetCode */}
        {question.url && (
          <Pressable
            style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleOpenLink}
          >
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.accent} />
            <Text style={[styles.linkBtnText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
              Open on LeetCode
            </Text>
          </Pressable>
        )}

        {/* Notes */}
        {question.notes && (
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.notesLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              NOTES
            </Text>
            <Text style={[styles.notesText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
              {question.notes}
            </Text>
          </View>
        )}

        {/* Today's assignment status */}
        {isInToday && (
          <View style={[styles.statusCard, { backgroundColor: isCompleted ? colors.primary + "18" : colors.card, borderColor: isCompleted ? colors.primary + "60" : colors.border }]}>
            <View style={styles.statusRow}>
              <Ionicons
                name={isCompleted ? "checkmark-circle" : "time-outline"}
                size={20}
                color={isCompleted ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.statusText, { color: isCompleted ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {isCompleted ? "Completed today" : "On today's list"}
              </Text>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tipsLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
            APPROACH
          </Text>
          <Text style={[styles.tipsText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            1. Understand the problem fully before coding.{"\n"}
            2. Identify the key data structure or algorithm.{"\n"}
            3. Write brute force first, then optimize.{"\n"}
            4. Analyze time & space complexity.
          </Text>
        </View>
      </ScrollView>

      {/* Mark done button */}
      {isInToday && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[
              styles.markBtn,
              {
                backgroundColor: isCompleted ? colors.muted : colors.primary,
                borderColor: isCompleted ? colors.border : colors.primary,
              },
            ]}
            onPress={handleToggle}
          >
            <Ionicons
              name={isCompleted ? "close-circle-outline" : "checkmark-circle-outline"}
              size={22}
              color={isCompleted ? colors.mutedForeground : colors.primaryForeground}
            />
            <Text
              style={[
                styles.markBtnText,
                { color: isCompleted ? colors.mutedForeground : colors.primaryForeground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {isCompleted ? "Mark as Unsolved" : "Mark as Solved"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBadges: { flexDirection: "row", gap: 8 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  diffText: { fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 26, lineHeight: 34, marginBottom: 12 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, marginBottom: 20 },
  catText: { fontSize: 13 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  linkBtnText: { fontSize: 15 },
  notesCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  notesLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  notesText: { fontSize: 14, lineHeight: 22 },
  statusCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { fontSize: 14 },
  tipsCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  tipsLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  tipsText: { fontSize: 14, lineHeight: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  markBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  markBtnText: { fontSize: 17 },
  notFound: { fontSize: 16, textAlign: "center", marginTop: 60 },
});

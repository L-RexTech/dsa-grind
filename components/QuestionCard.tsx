import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { DSAQuestion } from "@/context/DSAContext";

interface QuestionCardProps {
  question: DSAQuestion;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  showCheckbox?: boolean;
  index?: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#3fb950",
  Medium: "#d29922",
  Hard: "#f85149",
};

export function QuestionCard({
  question,
  isCompleted = false,
  onToggleComplete,
  showCheckbox = false,
  index = 0,
}: QuestionCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    router.push(`/question/${question.id}`);
  };

  const handleCheck = () => {
    if (!onToggleComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleComplete();
  };

  const diffColor = DIFFICULTY_COLORS[question.difficulty] ?? colors.mutedForeground;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isCompleted ? colors.primary + "40" : colors.border,
            borderWidth: 1,
          },
        ]}
        onPress={handlePress}
      >
        <View style={styles.left}>
          <View style={styles.indexBadge}>
            <Text style={[styles.indexText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {String(index + 1).padStart(2, "0")}
            </Text>
          </View>
          <View style={styles.info}>
            <Text
              style={[
                styles.title,
                {
                  color: isCompleted ? colors.mutedForeground : colors.foreground,
                  textDecorationLine: isCompleted ? "line-through" : "none",
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
              numberOfLines={1}
            >
              {question.title}
            </Text>
            <View style={styles.tags}>
              <View style={[styles.diffTag, { backgroundColor: diffColor + "22" }]}>
                <Text style={[styles.tagText, { color: diffColor, fontFamily: "Inter_500Medium" }]}>
                  {question.difficulty}
                </Text>
              </View>
              <View style={[styles.catTag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {question.category}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          {showCheckbox && (
            <Pressable
              hitSlop={8}
              onPress={handleCheck}
              style={[
                styles.checkbox,
                {
                  backgroundColor: isCompleted ? colors.primary : "transparent",
                  borderColor: isCompleted ? colors.primary : colors.border,
                },
              ]}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
              )}
            </Pressable>
          )}
          {!showCheckbox && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.mutedForeground}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  indexBadge: {
    width: 28,
    alignItems: "center",
  },
  indexText: {
    fontSize: 12,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
  },
  diffTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
  },
  right: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

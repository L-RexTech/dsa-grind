import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak > 0) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [streak, pulse]);

  const iconSize = size === "lg" ? 32 : size === "md" ? 22 : 16;
  const fontSize = size === "lg" ? 28 : size === "md" ? 20 : 14;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: streak > 0 ? colors.warning + "22" : colors.muted,
          transform: streak > 0 ? [{ scale: pulse }] : [],
        },
      ]}
    >
      <MaterialCommunityIcons
        name="fire"
        size={iconSize}
        color={streak > 0 ? colors.warning : colors.mutedForeground}
      />
      <Text
        style={[
          styles.number,
          {
            color: streak > 0 ? colors.warning : colors.mutedForeground,
            fontSize,
            fontFamily: "Inter_700Bold",
          },
        ]}
      >
        {streak}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  number: {},
});

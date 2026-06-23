import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDSA, type Category, type Difficulty } from "@/context/DSAContext";
import { useColors } from "@/hooks/useColors";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const CATEGORIES: Category[] = [
  "Arrays", "Strings", "Linked List", "Trees", "Graphs", "DP",
  "Backtracking", "Binary Search", "Heap", "Stack/Queue",
  "Hashing", "Two Pointers", "Sliding Window", "Greedy", "Math",
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddQuestionModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addQuestion } = useDSA();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [category, setCategory] = useState<Category>("Arrays");
  const [notes, setNotes] = useState("");

  const DIFF_COLORS: Record<Difficulty, string> = {
    Easy: colors.success,
    Medium: colors.warning,
    Hard: colors.destructive,
  };

  const reset = () => {
    setTitle(""); setUrl(""); setDifficulty("Easy"); setCategory("Arrays"); setNotes("");
  };

  const handleSave = () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addQuestion({ title: title.trim(), url: url.trim() || undefined, difficulty, category, notes: notes.trim() || undefined });
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8, borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Add Question
          </Text>
          <Pressable
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: title.trim() ? colors.primary : colors.muted }]}
            disabled={!title.trim()}
          >
            <Text style={[styles.saveBtnText, { color: title.trim() ? colors.primaryForeground : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Problem Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="e.g. Two Sum"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          {/* URL */}
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>LeetCode URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="https://leetcode.com/problems/..."
            placeholderTextColor={colors.mutedForeground}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* Difficulty */}
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Difficulty</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDifficulty(d)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: difficulty === d ? DIFF_COLORS[d] + "22" : colors.card,
                    borderColor: difficulty === d ? DIFF_COLORS[d] : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: difficulty === d ? DIFF_COLORS[d] : colors.mutedForeground, fontFamily: difficulty === d ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === c ? colors.primary + "22" : colors.card,
                    borderColor: category === c ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.catText, { color: category === c ? colors.primary : colors.mutedForeground, fontFamily: category === c ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Notes */}
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Optional notes or hints..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17 },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 15 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  label: { fontSize: 12, letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  chipText: { fontSize: 14 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: { fontSize: 12 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
  },
});

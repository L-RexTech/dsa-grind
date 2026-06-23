import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionCard } from "@/components/QuestionCard";
import { AddQuestionModal } from "@/components/AddQuestionModal";
import { useDSA } from "@/context/DSAContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["All", "Arrays", "Strings", "Linked List", "Trees", "Graphs", "DP", "Backtracking", "Binary Search", "Heap", "Stack/Queue", "Hashing", "Two Pointers", "Sliding Window", "Greedy", "Math"] as const;
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;

export default function QuestionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, removeQuestion } = useDSA();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [diffFilter, setDiffFilter] = useState<string>("All");
  const [showAdd, setShowAdd] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    return state.questions.filter((q) => {
      const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "All" || q.category === catFilter;
      const matchDiff = diffFilter === "All" || q.difficulty === diffFilter;
      return matchSearch && matchCat && matchDiff;
    });
  }, [state.questions, search, catFilter, diffFilter]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Remove Question", `Remove "${title}" from your list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          removeQuestion(id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Questions
        </Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
          hitSlop={8}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { paddingHorizontal: 20, paddingTop: 14 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Search problems..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Difficulty filter */}
      <View style={styles.filterRow}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDiffFilter(d)}
            style={[
              styles.filterChip,
              {
                backgroundColor: diffFilter === d ? colors.primary + "22" : colors.card,
                borderColor: diffFilter === d ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: diffFilter === d ? colors.primary : colors.mutedForeground,
                  fontFamily: diffFilter === d ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <Pressable
              onLongPress={() => handleDelete(item.id, item.title)}
              delayLongPress={500}
            >
              <QuestionCard question={item} index={index} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyState, { marginHorizontal: 20 }]}>
            <Ionicons name="code-slash" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No questions found
            </Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground + "88", fontFamily: "Inter_400Regular" }]}>
              Tap + to add your first question
            </Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={[styles.count, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", paddingHorizontal: 20 }]}>
            {filtered.length} problem{filtered.length !== 1 ? "s" : ""}
          </Text>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 100 }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
      />

      <AddQuestionModal visible={showAdd} onClose={() => setShowAdd(false)} />
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
  headerTitle: { fontSize: 26 },
  searchWrap: {},
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 12 },
  count: { fontSize: 12, marginBottom: 8, marginTop: 4 },
  emptyState: {
    alignItems: "center",
    gap: 10,
    padding: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#30363d",
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  emptyHint: { fontSize: 12, textAlign: "center" },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  hasUsageAccess,
  hasOverlayPermission,
  startBlocker,
  stopBlocker,
} from "@/modules/app-blocker";

const BLOCKED_APPS = ["com.instagram.android"];

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Category =
  | "Arrays"
  | "Strings"
  | "Linked List"
  | "Trees"
  | "Graphs"
  | "DP"
  | "Backtracking"
  | "Binary Search"
  | "Heap"
  | "Stack/Queue"
  | "Hashing"
  | "Two Pointers"
  | "Sliding Window"
  | "Greedy"
  | "Math";

export interface DSAQuestion {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  url?: string;
  notes?: string;
}

export interface DailyAssignment {
  date: string; // YYYY-MM-DD
  questionIds: string[];
  completedIds: string[];
}

export interface DSAState {
  questions: DSAQuestion[];
  assignments: DailyAssignment[];
  currentStreak: number;
  longestStreak: number;
}

interface DSAContextValue {
  state: DSAState;
  todayAssignment: DailyAssignment | null;
  backlogDays: number;
  isBlocked: boolean;
  hasAllPermissions: boolean;
  addQuestion: (q: Omit<DSAQuestion, "id">) => void;
  removeQuestion: (id: string) => void;
  editQuestion: (id: string, updates: Partial<Omit<DSAQuestion, "id">>) => void;
  markCompleted: (questionId: string) => void;
  markUncompleted: (questionId: string) => void;
  getQuestion: (id: string) => DSAQuestion | undefined;
  getTodayProgress: () => { completed: number; total: number };
  generateTodayAssignment: () => void;
}

const DSAContext = createContext<DSAContextValue | null>(null);

const STORAGE_KEY = "@dsa_grind_state";
const QUESTIONS_PER_DAY = 3;

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function getTodayString(): string {
  return getDateString(new Date());
}

const DEFAULT_QUESTIONS: DSAQuestion[] = [
  { id: "q1", title: "Two Sum", difficulty: "Easy", category: "Hashing", url: "https://leetcode.com/problems/two-sum/" },
  { id: "q2", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", category: "Arrays", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  { id: "q3", title: "Valid Parentheses", difficulty: "Easy", category: "Stack/Queue", url: "https://leetcode.com/problems/valid-parentheses/" },
  { id: "q4", title: "Merge Two Sorted Lists", difficulty: "Easy", category: "Linked List", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
  { id: "q5", title: "Maximum Subarray", difficulty: "Medium", category: "DP", url: "https://leetcode.com/problems/maximum-subarray/" },
  { id: "q6", title: "Binary Search", difficulty: "Easy", category: "Binary Search", url: "https://leetcode.com/problems/binary-search/" },
  { id: "q7", title: "Climbing Stairs", difficulty: "Easy", category: "DP", url: "https://leetcode.com/problems/climbing-stairs/" },
  { id: "q8", title: "Reverse Linked List", difficulty: "Easy", category: "Linked List", url: "https://leetcode.com/problems/reverse-linked-list/" },
  { id: "q9", title: "Invert Binary Tree", difficulty: "Easy", category: "Trees", url: "https://leetcode.com/problems/invert-binary-tree/" },
  { id: "q10", title: "Lowest Common Ancestor of BST", difficulty: "Medium", category: "Trees", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/" },
  { id: "q11", title: "3Sum", difficulty: "Medium", category: "Two Pointers", url: "https://leetcode.com/problems/3sum/" },
  { id: "q12", title: "Container With Most Water", difficulty: "Medium", category: "Two Pointers", url: "https://leetcode.com/problems/container-with-most-water/" },
  { id: "q13", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "Sliding Window", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { id: "q14", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", category: "Binary Search", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
  { id: "q15", title: "Number of Islands", difficulty: "Medium", category: "Graphs", url: "https://leetcode.com/problems/number-of-islands/" },
  { id: "q16", title: "Course Schedule", difficulty: "Medium", category: "Graphs", url: "https://leetcode.com/problems/course-schedule/" },
  { id: "q17", title: "Word Search", difficulty: "Medium", category: "Backtracking", url: "https://leetcode.com/problems/word-search/" },
  { id: "q18", title: "Combination Sum", difficulty: "Medium", category: "Backtracking", url: "https://leetcode.com/problems/combination-sum/" },
  { id: "q19", title: "Coin Change", difficulty: "Medium", category: "DP", url: "https://leetcode.com/problems/coin-change/" },
  { id: "q20", title: "Longest Increasing Subsequence", difficulty: "Medium", category: "DP", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { id: "q21", title: "Top K Frequent Elements", difficulty: "Medium", category: "Heap", url: "https://leetcode.com/problems/top-k-frequent-elements/" },
  { id: "q22", title: "Trapping Rain Water", difficulty: "Hard", category: "Two Pointers", url: "https://leetcode.com/problems/trapping-rain-water/" },
  { id: "q23", title: "Merge K Sorted Lists", difficulty: "Hard", category: "Heap", url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
  { id: "q24", title: "Word Ladder", difficulty: "Hard", category: "Graphs", url: "https://leetcode.com/problems/word-ladder/" },
  { id: "q25", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", category: "Trees", url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/" },
  { id: "q26", title: "Sliding Window Maximum", difficulty: "Hard", category: "Sliding Window", url: "https://leetcode.com/problems/sliding-window-maximum/" },
  { id: "q27", title: "Regular Expression Matching", difficulty: "Hard", category: "DP", url: "https://leetcode.com/problems/regular-expression-matching/" },
  { id: "q28", title: "Valid Anagram", difficulty: "Easy", category: "Hashing", url: "https://leetcode.com/problems/valid-anagram/" },
  { id: "q29", title: "Group Anagrams", difficulty: "Medium", category: "Hashing", url: "https://leetcode.com/problems/group-anagrams/" },
  { id: "q30", title: "Product of Array Except Self", difficulty: "Medium", category: "Arrays", url: "https://leetcode.com/problems/product-of-array-except-self/" },
];

function computeStreaks(assignments: DailyAssignment[]): { current: number; longest: number } {
  const completed = assignments
    .filter((a) => a.completedIds.length >= QUESTIONS_PER_DAY)
    .map((a) => a.date)
    .sort()
    .reverse();

  if (completed.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  let longest = 0;
  let streak = 0;
  const today = getTodayString();

  for (let i = 0; i < completed.length; i++) {
    const date = completed[i];
    if (!date) continue;
    if (i === 0) {
      if (date === today || date === getDateString(new Date(Date.now() - 86400000))) {
        streak = 1;
      } else {
        break;
      }
    } else {
      const prev = completed[i - 1];
      if (!prev) continue;
      const diff =
        (new Date(prev).getTime() - new Date(date).getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        streak++;
      } else {
        break;
      }
    }
    if (streak > longest) longest = streak;
  }
  current = streak;

  // Recompute longest over all assignments
  let allStreak = 0;
  let maxStreak = 0;
  const allCompleted = assignments
    .filter((a) => a.completedIds.length >= QUESTIONS_PER_DAY)
    .map((a) => a.date)
    .sort();

  for (let i = 0; i < allCompleted.length; i++) {
    if (i === 0) {
      allStreak = 1;
    } else {
      const prev = allCompleted[i - 1];
      const curr = allCompleted[i];
      if (!prev || !curr) continue;
      const diff =
        (new Date(curr).getTime() - new Date(prev).getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        allStreak++;
      } else {
        allStreak = 1;
      }
    }
    if (allStreak > maxStreak) maxStreak = allStreak;
  }

  return { current, longest: maxStreak };
}

function computeBacklog(assignments: DailyAssignment[]): number {
  const today = getTodayString();
  return assignments.filter(
    (a) => a.date < today && a.completedIds.length < QUESTIONS_PER_DAY
  ).length;
}

export function DSAProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DSAState>({
    questions: DEFAULT_QUESTIONS,
    assignments: [],
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const [hasAllPermissions, setHasAllPermissions] = useState(false);

  // Re-evaluate isBlocked and permission status every 60 seconds
  useEffect(() => {
    const check = () => {
      setHasAllPermissions(hasUsageAccess() && hasOverlayPermission());
      setTick((t) => t + 1);
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DSAState;
          setState(parsed);
        }
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (next: DSAState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
  }, []);

  const updateState = useCallback(
    (updater: (prev: DSAState) => DSAState) => {
      setState((prev) => {
        const next = updater(prev);
        const { current, longest } = computeStreaks(next.assignments);
        const updated: DSAState = {
          ...next,
          currentStreak: current,
          longestStreak: longest,
        };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const addQuestion = useCallback(
    (q: Omit<DSAQuestion, "id">) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      updateState((prev) => ({
        ...prev,
        questions: [...prev.questions, { ...q, id }],
      }));
    },
    [updateState]
  );

  const removeQuestion = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      }));
    },
    [updateState]
  );

  const editQuestion = useCallback(
    (id: string, updates: Partial<Omit<DSAQuestion, "id">>) => {
      updateState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
      }));
    },
    [updateState]
  );

  const generateTodayAssignment = useCallback(() => {
    const today = getTodayString();
    updateState((prev) => {
      const existing = prev.assignments.find((a) => a.date === today);
      if (existing) return prev;

      const usedIds = new Set(prev.assignments.flatMap((a) => a.questionIds));
      const available = prev.questions.filter((q) => !usedIds.has(q.id));
      const pool = available.length >= QUESTIONS_PER_DAY ? available : prev.questions;

      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, QUESTIONS_PER_DAY).map((q) => q.id);

      return {
        ...prev,
        assignments: [
          ...prev.assignments,
          { date: today, questionIds: picked, completedIds: [] },
        ],
      };
    });
  }, [updateState]);

  const markCompleted = useCallback(
    (questionId: string) => {
      const today = getTodayString();
      updateState((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.date === today && !a.completedIds.includes(questionId)
            ? { ...a, completedIds: [...a.completedIds, questionId] }
            : a
        ),
      }));
    },
    [updateState]
  );

  const markUncompleted = useCallback(
    (questionId: string) => {
      const today = getTodayString();
      updateState((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.date === today
            ? { ...a, completedIds: a.completedIds.filter((id) => id !== questionId) }
            : a
        ),
      }));
    },
    [updateState]
  );

  const getQuestion = useCallback(
    (id: string) => state.questions.find((q) => q.id === id),
    [state.questions]
  );

  const getTodayProgress = useCallback(() => {
    const today = getTodayString();
    const assignment = state.assignments.find((a) => a.date === today);
    return {
      completed: assignment?.completedIds.length ?? 0,
      total: QUESTIONS_PER_DAY,
    };
  }, [state.assignments]);

  const todayAssignment =
    state.assignments.find((a) => a.date === getTodayString()) ?? null;

  const backlogDays = computeBacklog(state.assignments);

  // A "blocked" state: backlog > 0, or not all solved and it's past 3pm.
  // `tick` is referenced so re-renders happen every minute (from the interval above).
  const isBlocked = (() => {
    void tick; // keep tick in scope so re-evaluation fires on each minute tick
    if (backlogDays > 0) return true;
    const hour = new Date().getHours();
    const progress = getTodayProgress();
    if (hour >= 15 && progress.completed < progress.total) return true;
    return false;
  })();

  // Generate today's assignment once loaded
  useEffect(() => {
    if (loaded) {
      generateTodayAssignment();
    }
  }, [loaded, generateTodayAssignment]);

  // Start/stop native Instagram blocker service based on blocked state + permissions
  useEffect(() => {
    if (!loaded) return;
    if (isBlocked && hasAllPermissions) {
      startBlocker(BLOCKED_APPS);
    } else {
      stopBlocker();
    }
  }, [isBlocked, hasAllPermissions, loaded]);

  return (
    <DSAContext.Provider
      value={{
        state,
        todayAssignment,
        backlogDays,
        isBlocked,
        hasAllPermissions,
        addQuestion,
        removeQuestion,
        editQuestion,
        markCompleted,
        markUncompleted,
        getQuestion,
        getTodayProgress,
        generateTodayAssignment,
      }}
    >
      {children}
    </DSAContext.Provider>
  );
}

export function useDSA(): DSAContextValue {
  const ctx = useContext(DSAContext);
  if (!ctx) throw new Error("useDSA must be used within DSAProvider");
  return ctx;
}

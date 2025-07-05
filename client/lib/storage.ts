import {
  FlashcardSet,
  StudyProgress,
  QuizResult,
  StudySession,
} from "@/types/flashcard";

const STORAGE_KEYS = {
  SETS: "quizlet_sets",
  PROGRESS: "quizlet_progress",
  QUIZ_RESULTS: "quizlet_quiz_results",
  STUDY_SESSIONS: "quizlet_study_sessions",
} as const;

// FlashcardSet management
export const getSets = (): FlashcardSet[] => {
  try {
    const sets = localStorage.getItem(STORAGE_KEYS.SETS);
    return sets ? JSON.parse(sets) : [];
  } catch (error) {
    console.error("Error loading sets from localStorage:", error);
    return [];
  }
};

export const getSet = (id: string): FlashcardSet | null => {
  const sets = getSets();
  return sets.find((set) => set.id === id) || null;
};

export const saveSet = (set: FlashcardSet): void => {
  const sets = getSets();
  const existingIndex = sets.findIndex((s) => s.id === set.id);

  if (existingIndex >= 0) {
    sets[existingIndex] = { ...set, updatedAt: new Date().toISOString() };
  } else {
    sets.push(set);
  }

  localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
};

export const deleteSet = (id: string): void => {
  const sets = getSets().filter((set) => set.id !== id);
  localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));

  // Clean up related data
  deleteProgress(id);
  deleteQuizResults(id);
  deleteStudySessions(id);
};

// Study Progress management
export const getProgress = (setId: string): StudyProgress | null => {
  try {
    const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!progress) return null;

    const allProgress: StudyProgress[] = JSON.parse(progress);
    return allProgress.find((p) => p.setId === setId) || null;
  } catch (error) {
    console.error("Error loading progress from localStorage:", error);
    return null;
  }
};

export const saveProgress = (progress: StudyProgress): void => {
  try {
    const allProgress = getAllProgress();
    const existingIndex = allProgress.findIndex(
      (p) => p.setId === progress.setId,
    );

    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
  } catch (error) {
    console.error("Error saving progress to localStorage:", error);
  }
};

export const getAllProgress = (): StudyProgress[] => {
  try {
    const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return progress ? JSON.parse(progress) : [];
  } catch (error) {
    console.error("Error loading all progress from localStorage:", error);
    return [];
  }
};

export const deleteProgress = (setId: string): void => {
  const allProgress = getAllProgress().filter((p) => p.setId !== setId);
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
};

// Quiz Results management
export const saveQuizResult = (result: QuizResult): void => {
  try {
    const results = getQuizResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
  } catch (error) {
    console.error("Error saving quiz result to localStorage:", error);
  }
};

export const getQuizResults = (setId?: string): QuizResult[] => {
  try {
    const results = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    const allResults: QuizResult[] = results ? JSON.parse(results) : [];
    return setId ? allResults.filter((r) => r.setId === setId) : allResults;
  } catch (error) {
    console.error("Error loading quiz results from localStorage:", error);
    return [];
  }
};

export const deleteQuizResults = (setId: string): void => {
  const results = getQuizResults().filter((r) => r.setId !== setId);
  localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
};

// Study Sessions management
export const saveStudySession = (session: StudySession): void => {
  try {
    const sessions = getStudySessions();
    sessions.push(session);
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving study session to localStorage:", error);
  }
};

export const getStudySessions = (setId?: string): StudySession[] => {
  try {
    const sessions = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    const allSessions: StudySession[] = sessions ? JSON.parse(sessions) : [];
    return setId ? allSessions.filter((s) => s.setId === setId) : allSessions;
  } catch (error) {
    console.error("Error loading study sessions from localStorage:", error);
    return [];
  }
};

export const deleteStudySessions = (setId: string): void => {
  const sessions = getStudySessions().filter((s) => s.setId !== setId);
  localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
};

// Utility functions
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const exportData = () => {
  const data = {
    sets: getSets(),
    progress: getAllProgress(),
    quizResults: getQuizResults(),
    studySessions: getStudySessions(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quizlet-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);

    if (data.sets)
      localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(data.sets));
    if (data.progress)
      localStorage.setItem(
        STORAGE_KEYS.PROGRESS,
        JSON.stringify(data.progress),
      );
    if (data.quizResults)
      localStorage.setItem(
        STORAGE_KEYS.QUIZ_RESULTS,
        JSON.stringify(data.quizResults),
      );
    if (data.studySessions)
      localStorage.setItem(
        STORAGE_KEYS.STUDY_SESSIONS,
        JSON.stringify(data.studySessions),
      );

    return true;
  } catch (error) {
    console.error("Error importing data:", error);
    return false;
  }
};

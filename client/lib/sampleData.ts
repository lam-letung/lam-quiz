import { FlashcardSet, StudyProgress } from "@/types/flashcard";
import { generateId } from "@/lib/storage";

export const createSampleSets = (): FlashcardSet[] => [
  {
    id: generateId(),
    title: "Spanish Vocabulary - Beginners",
    description: "Essential Spanish words and phrases for beginners",
    cards: [
      {
        id: generateId(),
        term: "Hola",
        definition: "Hello",
        order: 0,
      },
      {
        id: generateId(),
        term: "Gracias",
        definition: "Thank you",
        order: 1,
      },
      {
        id: generateId(),
        term: "Adiós",
        definition: "Goodbye",
        order: 2,
      },
      {
        id: generateId(),
        term: "Por favor",
        definition: "Please",
        order: 3,
      },
      {
        id: generateId(),
        term: "Lo siento",
        definition: "I'm sorry",
        order: 4,
      },
      {
        id: generateId(),
        term: "Sí",
        definition: "Yes",
        order: 5,
      },
      {
        id: generateId(),
        term: "No",
        definition: "No",
        order: 6,
      },
      {
        id: generateId(),
        term: "¿Cómo estás?",
        definition: "How are you?",
        order: 7,
      },
      {
        id: generateId(),
        term: "Muy bien",
        definition: "Very well",
        order: 8,
      },
      {
        id: generateId(),
        term: "Hasta luego",
        definition: "See you later",
        order: 9,
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: generateId(),
    title: "Computer Science Fundamentals",
    description: "Core concepts and terminology in computer science",
    cards: [
      {
        id: generateId(),
        term: "Algorithm",
        definition:
          "A step-by-step procedure for solving a problem or completing a task",
        order: 0,
      },
      {
        id: generateId(),
        term: "Data Structure",
        definition:
          "A way of organizing and storing data for efficient access and modification",
        order: 1,
      },
      {
        id: generateId(),
        term: "Big O Notation",
        definition:
          "Mathematical notation describing the limiting behavior of a function when the argument tends towards a particular value or infinity",
        order: 2,
      },
      {
        id: generateId(),
        term: "Recursion",
        definition:
          "A programming technique where a function calls itself to solve smaller instances of the same problem",
        order: 3,
      },
      {
        id: generateId(),
        term: "API",
        definition:
          "Application Programming Interface - a set of protocols and tools for building software applications",
        order: 4,
      },
      {
        id: generateId(),
        term: "Binary Search",
        definition:
          "A search algorithm that finds the position of a target value within a sorted array",
        order: 5,
      },
      {
        id: generateId(),
        term: "Hash Table",
        definition:
          "A data structure that maps keys to values using a hash function",
        order: 6,
      },
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: generateId(),
    title: "Biology - Cell Structure",
    description: "Basic components and functions of cells",
    cards: [
      {
        id: generateId(),
        term: "Mitochondria",
        definition:
          "The powerhouse of the cell; organelles that produce energy (ATP)",
        order: 0,
      },
      {
        id: generateId(),
        term: "Nucleus",
        definition:
          "The control center of the cell containing DNA and regulating gene expression",
        order: 1,
      },
      {
        id: generateId(),
        term: "Ribosome",
        definition: "Cellular structure responsible for protein synthesis",
        order: 2,
      },
      {
        id: generateId(),
        term: "Endoplasmic Reticulum",
        definition:
          "Network of membranes involved in protein and lipid synthesis",
        order: 3,
      },
      {
        id: generateId(),
        term: "Golgi Apparatus",
        definition:
          "Organelle that modifies, packages, and ships proteins from the ER",
        order: 4,
      },
      {
        id: generateId(),
        term: "Cell Membrane",
        definition:
          "Semi-permeable barrier that controls what enters and exits the cell",
        order: 5,
      },
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: generateId(),
    title: "Mathematics - Algebra Basics",
    description: "Fundamental algebraic concepts and formulas",
    cards: [
      {
        id: generateId(),
        term: "Variable",
        definition: "A symbol that represents an unknown value",
        order: 0,
      },
      {
        id: generateId(),
        term: "Coefficient",
        definition: "A numerical factor in a term of an algebraic expression",
        order: 1,
      },
      {
        id: generateId(),
        term: "Linear Equation",
        definition:
          "An equation that makes a straight line when graphed (ax + b = c)",
        order: 2,
      },
      {
        id: generateId(),
        term: "Quadratic Formula",
        definition: "x = (-b ± √(b² - 4ac)) / 2a",
        order: 3,
      },
      {
        id: generateId(),
        term: "Factoring",
        definition:
          "Breaking down an expression into simpler multiplicative components",
        order: 4,
      },
    ],
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: generateId(),
    title: "History - World War II",
    description: "Key events and figures from WWII",
    cards: [
      {
        id: generateId(),
        term: "Pearl Harbor",
        definition:
          "December 7, 1941 - Japanese surprise attack that brought the US into WWII",
        order: 0,
      },
      {
        id: generateId(),
        term: "D-Day",
        definition:
          "June 6, 1944 - Allied invasion of Nazi-occupied France at Normandy",
        order: 1,
      },
      {
        id: generateId(),
        term: "Holocaust",
        definition:
          "Systematic persecution and murder of Jews and other groups by Nazi Germany",
        order: 2,
      },
      {
        id: generateId(),
        term: "Blitzkrieg",
        definition: "Lightning war - German rapid warfare strategy",
        order: 3,
      },
      {
        id: generateId(),
        term: "Manhattan Project",
        definition:
          "Top-secret US program to develop the atomic bomb during WWII",
        order: 4,
      },
    ],
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
];

export const createSampleProgress = (sets: FlashcardSet[]): StudyProgress[] =>
  sets.map((set, index) => ({
    setId: set.id,
    totalCards: set.cards.length,
    masteredCards: Math.floor(set.cards.length * (0.3 + index * 0.2)), // Varying progress
    lastStudied: new Date(Date.now() - index * 3600000).toISOString(), // Different study times
    studyStreak: Math.floor(Math.random() * 10) + 1,
  }));

import { FlashcardSet } from "@/types/flashcard";

// lib/api.ts
export async function fetchSetById(id: string): Promise<FlashcardSet> {
    const res = await fetch(`/api/flashcard-sets/${id}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  }
  
  export async function updateSet(id: string, set: FlashcardSet): Promise<void> {
    const res = await fetch(`/api/flashcard-sets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(set),
    });
    if (!res.ok) throw new Error("Failed to save");
  }
  
  
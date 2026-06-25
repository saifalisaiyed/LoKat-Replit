import { useState } from "react";

export function useNoteEditor() {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  return {
    editingNote, setEditingNote,
    noteText, setNoteText,
    isSavingNote, setIsSavingNote,
  };
}

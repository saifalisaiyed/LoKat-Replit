import { useState } from "react";
import type { Orientation, Angle, Timing } from "@/lib/types";

export function useRequestForm() {
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [angle, setAngle] = useState<Angle>("eye-level");
  const [timing, setTiming] = useState<Timing>("now");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reward, setReward] = useState(5);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [notesFocused, setNotesFocused] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    orientation, setOrientation,
    angle, setAngle,
    timing, setTiming,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime,
    showDatePicker, setShowDatePicker,
    showTimePicker, setShowTimePicker,
    reward, setReward,
    note, setNote,
    savedNote, setSavedNote,
    notesFocused, setNotesFocused,
    showConfirmation, setShowConfirmation,
    isSubmitting, setIsSubmitting,
  };
}

import { useState } from "react";

export type FeedbackType = "feedback" | "bug";

export function useFeedbackForm() {
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  return {
    type, setType,
    message, setMessage,
    loading, setLoading,
    sent, setSent,
  };
}

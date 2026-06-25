import { useState } from "react";
import type { ChatMessage } from "@/lib/types";

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [requestName, setRequestName] = useState("Chat");
  const [otherName, setOtherName] = useState("User");

  return {
    messages, setMessages,
    text, setText,
    loading, setLoading,
    sending, setSending,
    requestName, setRequestName,
    otherName, setOtherName,
  };
}

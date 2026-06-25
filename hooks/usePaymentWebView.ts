import { useState } from "react";

export function usePaymentWebView() {
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  return {
    isLoading, setIsLoading,
    showWebView, setShowWebView,
    webViewUrl, setWebViewUrl,
    webViewLoading, setWebViewLoading,
    status, setStatus,
  };
}

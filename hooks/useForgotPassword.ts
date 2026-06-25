import { useState } from "react";

export function useForgotPassword() {
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState<"email" | "code">("email");
  const [fpEmail, setFpEmail] = useState("");
  const [fpOTP, setFpOTP] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState(false);
  const [showFpPassword, setShowFpPassword] = useState(false);

  return {
    showForgot, setShowForgot,
    fpStep, setFpStep,
    fpEmail, setFpEmail,
    fpOTP, setFpOTP,
    fpNewPassword, setFpNewPassword,
    fpLoading, setFpLoading,
    fpError, setFpError,
    fpSuccess, setFpSuccess,
    showFpPassword, setShowFpPassword,
  };
}

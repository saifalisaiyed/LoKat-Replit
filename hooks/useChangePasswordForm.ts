import { useState } from "react";

export function useChangePasswordForm() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  return {
    currentPwd, setCurrentPwd,
    newPwd, setNewPwd,
    confirmPwd, setConfirmPwd,
    showCurrent, setShowCurrent,
    showNew, setShowNew,
    loading, setLoading,
    error, setError,
    success, setSuccess,
  };
}

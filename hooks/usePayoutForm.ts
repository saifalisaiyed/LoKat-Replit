import { useState } from "react";

export type PayoutType = "paypal" | "bank";

export function usePayoutForm() {
  const [payoutType, setPayoutType] = useState<PayoutType>("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  return {
    payoutType, setPayoutType,
    paypalEmail, setPaypalEmail,
    bankName, setBankName,
    accountNumber, setAccountNumber,
    routingNumber, setRoutingNumber,
    isSaving, setIsSaving,
    error, setError,
  };
}

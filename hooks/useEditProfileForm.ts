import { useState } from "react";

type ProfileInit = {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
};

export function useEditProfileForm({ initialName, initialEmail, initialPhone }: ProfileInit) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  return {
    name, setName,
    email, setEmail,
    phone, setPhone,
    loading, setLoading,
    error, setError,
    success, setSuccess,
  };
}

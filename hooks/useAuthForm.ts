import { useState } from "react";

export type CountryCode = { code: string; flag: string; name: string };

export function useAuthForm(initialCountry: CountryCode) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return {
    mode, setMode,
    selectedCountry, setSelectedCountry,
    phone, setPhone,
    email, setEmail,
    password, setPassword,
    error, setError,
    loading, setLoading,
    showCountryPicker, setShowCountryPicker,
    countrySearch, setCountrySearch,
    showPassword, setShowPassword,
  };
}

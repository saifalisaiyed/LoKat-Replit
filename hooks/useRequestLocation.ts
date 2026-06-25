import { useState } from "react";

type InitialLocationParams = {
  initialName: string;
  initialAddress: string;
  initialGeocoding: boolean;
  initialLat: number;
  initialLng: number;
};

export function useRequestLocation({
  initialName,
  initialAddress,
  initialGeocoding,
  initialLat,
  initialLng,
}: InitialLocationParams) {
  const [resolvedName, setResolvedName] = useState(initialName);
  const [resolvedAddress, setResolvedAddress] = useState(initialAddress);
  const [geocoding, setGeocoding] = useState(initialGeocoding);
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [isCustomPinned, setIsCustomPinned] = useState(false);
  const [facingDirection, setFacingDirection] = useState<string | null>(null);

  return {
    resolvedName, setResolvedName,
    resolvedAddress, setResolvedAddress,
    geocoding, setGeocoding,
    currentLat, setCurrentLat,
    currentLng, setCurrentLng,
    isCustomPinned, setIsCustomPinned,
    facingDirection, setFacingDirection,
  };
}

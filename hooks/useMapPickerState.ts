import { useState } from "react";

export function useMapPickerState(initialLat: number, initialLng: number) {
  const [centerCoord, setCenterCoord] = useState({ lat: initialLat, lng: initialLng });
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<"pick" | "direction">("pick");
  const [selectedDir, setSelectedDir] = useState("N");
  const [geocodedLocation, setGeocodedLocation] = useState<{ name: string; address: string } | null>(null);

  return {
    centerCoord, setCenterCoord,
    confirming, setConfirming,
    step, setStep,
    selectedDir, setSelectedDir,
    geocodedLocation, setGeocodedLocation,
  };
}

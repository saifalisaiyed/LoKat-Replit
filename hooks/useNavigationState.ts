import { useState } from "react";

export function useNavigationState() {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [routePolyline, setRoutePolyline] = useState<{ latitude: number; longitude: number }[]>([]);

  return {
    userLocation, setUserLocation,
    locationError, setLocationError,
    isTracking, setIsTracking,
    deviceHeading, setDeviceHeading,
    routePolyline, setRoutePolyline,
  };
}

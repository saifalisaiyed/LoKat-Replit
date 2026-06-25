import { useState } from "react";
import type { Category } from "@/lib/types";

export function useMapFilters() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("anywhere");
  const [locationFilterVisible, setLocationFilterVisible] = useState(false);
  const [myCoords, setMyCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);

  return {
    selectedCategory, setSelectedCategory,
    permissionStatus, setPermissionStatus,
    locationFilter, setLocationFilter,
    locationFilterVisible, setLocationFilterVisible,
    myCoords, setMyCoords,
    heatmapEnabled, setHeatmapEnabled,
  };
}

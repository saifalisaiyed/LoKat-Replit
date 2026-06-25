import { useState } from "react";

export type LocationResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
};

export function useHomeSearch() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  return {
    searchVisible, setSearchVisible,
    searchQuery, setSearchQuery,
    remoteResults, setRemoteResults,
    isSearching, setIsSearching,
  };
}

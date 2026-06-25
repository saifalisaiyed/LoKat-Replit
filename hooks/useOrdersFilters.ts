import { useState } from "react";

export type Tab = "active" | "history";
export type ActiveFilter = "all" | "requested";
export type HistoryFilter = "all" | "requested" | "fulfilled";

export function useOrdersFilters() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  return {
    activeTab, setActiveTab,
    activeFilter, setActiveFilter,
    historyFilter, setHistoryFilter,
  };
}

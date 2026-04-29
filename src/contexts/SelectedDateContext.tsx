import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { localDateStr } from "@/lib/utils";

interface SelectedDateContextValue {
  selectedDate: Date;
  selectedDateStr: string;
  setSelectedDate: (date: Date) => void;
  resetSelectedDate: () => void;
  isViewingToday: boolean;
}

const SelectedDateContext = createContext<SelectedDateContextValue | null>(null);

export const SelectedDateProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDateState, setSelectedDateState] = useState(() => {
    const isReload = performance.getEntriesByType("navigation").some((entry) => (entry as PerformanceNavigationTiming).type === "reload");
    if (isReload) {
      sessionStorage.removeItem("mounja_selected_date");
      return new Date();
    }
    const stored = sessionStorage.getItem("mounja_selected_date");
    return stored ? new Date(`${stored}T12:00:00`) : new Date();
  });

  const setSelectedDate = useCallback((date: Date) => {
    const next = new Date(date);
    next.setHours(12, 0, 0, 0);
    sessionStorage.setItem("mounja_selected_date", localDateStr(next));
    setSelectedDateState(next);
  }, []);

  const resetSelectedDate = useCallback(() => {
    const today = new Date();
    sessionStorage.setItem("mounja_selected_date", localDateStr(today));
    setSelectedDateState(today);
  }, []);

  const selectedDateStr = localDateStr(selectedDateState);
  const isViewingToday = selectedDateStr === localDateStr(new Date());

  const value = useMemo(
    () => ({ selectedDate: selectedDateState, selectedDateStr, setSelectedDate, resetSelectedDate, isViewingToday }),
    [selectedDateState, selectedDateStr, setSelectedDate, resetSelectedDate, isViewingToday]
  );

  return <SelectedDateContext.Provider value={value}>{children}</SelectedDateContext.Provider>;
};

export const useSelectedDate = () => {
  const context = useContext(SelectedDateContext);
  if (!context) throw new Error("useSelectedDate must be used within SelectedDateProvider");
  return context;
};
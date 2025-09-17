"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type View = "month" | "week" | "day";
type Filters = { staffId?: string; type?: "appointment"|"shift"|"timeOff" };

type CalendarState = {
  view: View;
  selectedDate: Date;
  filters: Filters;
  setView: (v: View) => void;
  setDate: (d: Date) => void;
  setFilters: (f: Filters) => void;
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      view: "month",
      selectedDate: new Date(),
      filters: {},
      setView: (view) => set({ view }),
      setDate: (selectedDate) => set({ selectedDate }),
      setFilters: (filters) => set({ filters }),
    }),
    {
      name: "calendar-store",
      partialize: (state) => ({ view: state.view, filters: state.filters }),
      merge: (persisted: any, current) => {
        const hydrated = { ...current, ...persisted } as CalendarState;
        if (persisted?.selectedDate) hydrated.selectedDate = new Date(persisted.selectedDate);
        return hydrated;
      },
    }
  )
);

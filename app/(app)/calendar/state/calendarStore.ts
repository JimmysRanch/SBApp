"use client";
import { create } from "zustand";

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

export const useCalendarStore = create<CalendarState>((set) => ({
  view: "month",
  selectedDate: new Date(),
  filters: {},
  setView: (view) => set({ view }),
  setDate: (selectedDate) => set({ selectedDate }),
  setFilters: (filters) => set({ filters }),
}));

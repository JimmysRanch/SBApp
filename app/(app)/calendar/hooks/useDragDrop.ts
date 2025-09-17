"use client";
import { useRef, useState } from "react";
export function useDragDrop() {
  const draggingId = useRef<string|null>(null);
  const [isDragging, setIsDragging] = useState(false);
  function onDragStart(id: string) { draggingId.current = id; setIsDragging(true); }
  function onDragEnd() { draggingId.current = null; setIsDragging(false); }
  return { draggingId, isDragging, onDragStart, onDragEnd };
}

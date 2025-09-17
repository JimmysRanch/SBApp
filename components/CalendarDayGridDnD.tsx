"use client";

import { Droppable, Draggable } from "react-beautiful-dnd";
import type { Appt, Employee, Service } from "@/hooks/useCalendarData";

export function DayGrid({
  date, employees, appointments, services, onApptClick
}: {
  date: Date;
  employees: Employee[];
  appointments: Appt[];
  services: Service[];
  onApptClick: (a: Appt) => void;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00–19:00
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* header row */}
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${employees.length}, 1fr)` }}>
          <div></div>
          {employees.map(emp => <div key={emp.id} className="p-2 text-sm font-semibold border-b bg-gray-50">{emp.name}</div>)}
        </div>
        {/* hour rows */}
        {hours.map(hour => (
          <div key={hour} className="grid" style={{ gridTemplateColumns: `80px repeat(${employees.length}, 1fr)` }}>
            <div className="border-r p-2 text-xs font-medium text-gray-600">{hour}:00</div>
            {employees.map(emp => {
              const droppableId = `${emp.id}-${hour}`;
              return (
                <Droppable droppableId={droppableId} key={droppableId}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="border min-h-[64px] p-2">
                      {appointments
                        .filter(a => a.employee_id === emp.id && new Date(a.start_time).toDateString() === date.toDateString() && new Date(a.start_time).getHours() === hour)
                        .sort((a,b)=> new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .map((a, index) => (
                          <Draggable key={a.id} draggableId={a.id} index={index}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                   onClick={() => onApptClick(a)}
                                   className="bg-blue-600 text-white text-xs rounded px-2 py-1 mb-1 cursor-grab">
                                <div className="font-semibold">{services.find(s => s.id === a.service_id)?.name || "Service"}</div>
                                <div>{new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

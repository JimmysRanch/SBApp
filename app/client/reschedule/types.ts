export type SlotOption = {
  id: string;
  staffId: string;
  staffName: string;
  startIso: string;
  endIso: string;
};

export type RescheduleReadyContext = {
  status: "ready";
  token: string;
  appointment: {
    id: string;
    serviceId: string;
    serviceName: string | null;
    startsAtIso: string;
    staffId: string | null;
    staffName: string | null;
  };
  slots: SlotOption[];
};

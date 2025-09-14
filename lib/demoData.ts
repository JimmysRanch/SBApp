export interface DemoAppointment {
  id: string;
  start: Date;
  petName: string;
  clientName: string;
  groomerName: string;
  service: string;
  status: string;
}

function makeDate(offset: number, hour: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function getDemoAppointments(): DemoAppointment[] {
  return [
    {
      id: '1',
      start: makeDate(0, 9),
      petName: 'Bella',
      clientName: 'Karen G.',
      groomerName: 'Richelle',
      service: 'Full Groom',
      status: 'Completed',
    },
    {
      id: '2',
      start: makeDate(0, 11),
      petName: 'Max',
      clientName: 'John S.',
      groomerName: 'Alex',
      service: 'Bath & Brush',
      status: 'Upcoming',
    },
    {
      id: '3',
      start: makeDate(0, 13),
      petName: 'Milo',
      clientName: 'Nancy D.',
      groomerName: 'Jamie',
      service: 'Nail Trim',
      status: 'Upcoming',
    },
    {
      id: '4',
      start: makeDate(1, 10),
      petName: 'Lucy',
      clientName: 'Amy R.',
      groomerName: 'Richelle',
      service: 'Full Groom',
      status: 'Upcoming',
    },
    {
      id: '5',
      start: makeDate(2, 9),
      petName: 'Rocky',
      clientName: 'Dylan P.',
      groomerName: 'Jamie',
      service: 'Bath & Brush',
      status: 'Upcoming',
    },
    {
      id: '6',
      start: makeDate(3, 15),
      petName: 'Bailey',
      clientName: 'Oscar W.',
      groomerName: 'Alex',
      service: 'Nail Trim',
      status: 'Upcoming',
    }
  ];
}

export const demoGroomers = ['Richelle', 'Alex', 'Jamie'];

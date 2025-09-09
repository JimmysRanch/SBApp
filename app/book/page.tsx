"use client";
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

// Types for clients, pets, employees
interface Client { id: string; full_name: string; }
interface Pet { id: string; name: string; }
interface Employee { id: string; name: string; }

/**
 * Booking page.  Provides a form for creating new appointments by
 * selecting a client, pet, groomer, date/time and service.  On
 * submission, inserts an appointment into the `appointments` table.
 */
export default function BookPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('');

  // Fetch clients and employees on mount
  useEffect(() => {
    const loadLists = async () => {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name')
        .order('full_name');
      setClients(clientsData ?? []);

      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, name')
        .eq('active', true)
        .order('name');
      setEmployees(employeesData ?? []);
    };
    loadLists();
  }, []);

  // Fetch pets whenever clientId changes
  useEffect(() => {
    const loadPets = async () => {
      if (clientId) {
        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name')
          .eq('client_id', clientId)
          .order('name');
        setPets(petsData ?? []);
      } else {
        setPets([]);
      }
      setPetId('');
    };
    loadPets();
  }, [clientId]);

  // Handle form submission to create new appointment
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const start = new Date(`${date}T${time}`);
    // Auto-calc a one hour end time.  Could make this configurable later.
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await supabase.from('appointments').insert({
      client_id: clientId,
      pet_id: petId,
      employee_id: employeeId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      service,
      status: 'Scheduled',
    });
    alert('Appointment created!');
    // reset form
    setClientId('');
    setPetId('');
    setEmployeeId('');
    setDate('');
    setTime('');
    setService('');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Book Appointment</h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {/* Client select */}
          <div>
            <label className="block mb-1">Client</label>
            <select
              className="border p-2 w-full"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.full_name}</option>
              ))}
            </select>
          </div>
          {/* Pet select */}
          <div>
            <label className="block mb-1">Pet</label>
            <select
              className="border p-2 w-full"
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              required
            >
              <option value="">Select pet</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>
          {/* Employee select */}
          <div>
            <label className="block mb-1">Groomer</label>
            <select
              className="border p-2 w-full"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Select groomer</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          {/* Date and Time */}
          <div>
            <label className="block mb-1">Date</label>
            <input
              type="date"
              className="border p-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Time</label>
            <input
              type="time"
              className="border p-2 w-full"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          {/* Service */}
          <div>
            <label className="block mb-1">Service</label>
            <input
              type="text"
              className="border p-2 w-full"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Create Appointment
          </button>
        </form>
      </main>
    </div>
  );
}

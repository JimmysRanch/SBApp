"use client";
import PageContainer from '@/components/PageContainer';
import Card from '@/components/Card';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

// Types for clients, pets, employees
interface Client { id: string; full_name: string; }
interface Pet { id: string; name: string; weight: number | null; }
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
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState<number>(0);

  const calculatePrice = (w: number) => {
    if (w <= 20) return 40;
    if (w <= 40) return 50;
    if (w <= 60) return 60;
    return 70;
  };

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
          .select('id, name, weight')
          .eq('client_id', clientId)
          .order('name');
        setPets(petsData ?? []);
      } else {
        setPets([]);
      }
      setPetId('');
      setWeight('');
      setPrice(0);
    };
    loadPets();
  }, [clientId]);

  const handlePetChange = (id: string) => {
    setPetId(id);
    const selected = pets.find((p) => p.id === id);
    const w = selected?.weight ?? null;
    if (w !== null) {
      setWeight(String(w));
      setPrice(calculatePrice(w));
    } else {
      setWeight('');
      setPrice(0);
    }
  };

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
      price,
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
    setWeight('');
    setPrice(0);
  };

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-3xl font-bold text-primary-dark">Book Appointment</h1>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          {/* Client select */}
          <div>
            <label className="mb-1 block">Client</label>
            <select
              className="w-full rounded-full border border-gray-300 p-2 px-4"
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
            <label className="mb-1 block">Pet</label>
            <select
              className="w-full rounded-full border border-gray-300 p-2 px-4"
              value={petId}
              onChange={(e) => handlePetChange(e.target.value)}
              required
            >
              <option value="">Select pet</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>
          {/* Weight */}
          <div>
            <label className="mb-1 block">Weight (lbs)</label>
            <input
              type="number"
              className="w-full rounded-full border border-gray-300 p-2 px-4"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                const w = Number(e.target.value);
                if (!isNaN(w)) setPrice(calculatePrice(w));
                else setPrice(0);
              }}
              required
            />
          </div>
          {/* Price */}
          <div>
            <label className="mb-1 block">Price</label>
            <input
              type="text"
              className="w-full rounded-full border border-gray-300 bg-gray-100 p-2 px-4"
              value={price ? `$${price.toFixed(2)}` : ''}
              readOnly
            />
          </div>
          {/* Employee select */}
          <div>
            <label className="mb-1 block">Groomer</label>
            <select
              className="w-full rounded-full border border-gray-300 p-2 px-4"
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
            <label className="mb-1 block">Date</label>
            <input
              type="date"
              className="w-full rounded-full border border-gray-300 p-2 px-4"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block">Time</label>
            <input
              type="time"
              className="w-full rounded-full border border-gray-300 p-2 px-4"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          {/* Service */}
          <div>
            <label className="mb-1 block">Service</label>
            <input
              type="text"
              className="w-full rounded-full border border-gray-300 p-2 px-4"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="rounded-full bg-primary px-4 py-2 text-white shadow hover:bg-primary-dark">
            Create Appointment
          </button>
        </form>
      </Card>
    </PageContainer>
  );
}

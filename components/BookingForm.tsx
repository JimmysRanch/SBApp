'use client';

import { useState } from 'react';

interface OwnerInfo {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
}

type Weight = 'small' | 'medium' | 'large';

interface Dog {
  name: string;
  gender: 'm' | 'f';
  fixed: boolean;
  weight: Weight;
  breed: string;
  vaccineExpiry: string; // ISO date string
  extras: {
    nailTrim: boolean;
    teethBrush: boolean;
    deShedding: boolean;
  };
}

const weightPrices: Record<Weight, number> = {
  small: 40,
  medium: 55,
  large: 70,
};

const extraPrices = {
  nailTrim: 10,
  teethBrush: 15,
  deShedding: 20,
};

const breedOptions = [
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'French Bulldog',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
];

function newDog(): Dog {
  return {
    name: '',
    gender: 'm',
    fixed: false,
    weight: 'small',
    breed: '',
    vaccineExpiry: '',
    extras: {
      nailTrim: false,
      teethBrush: false,
      deShedding: false,
    },
  };
}

export default function BookingForm() {
  const [owner, setOwner] = useState<OwnerInfo>({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    email: '',
  });
  const [dogs, setDogs] = useState<Dog[]>([newDog()]);

  const updateDog = (index: number, updates: Partial<Dog>) => {
    setDogs((ds) => ds.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const updateExtras = (index: number, extras: Partial<Dog['extras']>) => {
    setDogs((ds) =>
      ds.map((d, i) =>
        i === index ? { ...d, extras: { ...d.extras, ...extras } } : d
      )
    );
  };

  const addDog = () => setDogs((ds) => [...ds, newDog()]);

  const total = dogs.reduce((sum, dog) => {
    let dogPrice = weightPrices[dog.weight];
    Object.entries(dog.extras).forEach(([key, val]) => {
      if (val) dogPrice += extraPrices[key as keyof typeof extraPrices];
    });
    return sum + dogPrice;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missingDocs = dogs.some(
      (d) => !d.vaccineExpiry || new Date(d.vaccineExpiry) < new Date()
    );
    if (missingDocs) {
      alert(
        'Appointment saved as "Not currently Scheduled" until vaccinations are current.'
      );
    } else {
      alert('Appointment request submitted!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Owner info */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Owner Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="First name"
            className="rounded border p-2"
            value={owner.firstName}
            onChange={(e) => setOwner({ ...owner, firstName: e.target.value })}
          />
          <input
            required
            placeholder="Last name"
            className="rounded border p-2"
            value={owner.lastName}
            onChange={(e) => setOwner({ ...owner, lastName: e.target.value })}
          />
          <input
            required
            placeholder="Address"
            className="rounded border p-2 sm:col-span-2"
            value={owner.address}
            onChange={(e) => setOwner({ ...owner, address: e.target.value })}
          />
          <input
            required
            placeholder="Phone"
            className="rounded border p-2"
            value={owner.phone}
            onChange={(e) => setOwner({ ...owner, phone: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="rounded border p-2"
            value={owner.email}
            onChange={(e) => setOwner({ ...owner, email: e.target.value })}
          />
        </div>
      </section>

      {/* Dog sections */}
      {dogs.map((dog, idx) => {
        const expired = dog.vaccineExpiry && new Date(dog.vaccineExpiry) < new Date();
        return (
          <section key={idx} className="space-y-4 rounded border p-4">
            <h3 className="text-lg font-medium">Dog {idx + 1}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Name"
                className="rounded border p-2"
                value={dog.name}
                onChange={(e) => updateDog(idx, { name: e.target.value })}
              />
              <select
                className="rounded border p-2"
                value={dog.gender}
                onChange={(e) => updateDog(idx, { gender: e.target.value as 'm' | 'f' })}
              >
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={dog.fixed}
                  onChange={(e) => updateDog(idx, { fixed: e.target.checked })}
                />
                <span>Fixed/Neutered</span>
              </label>
              <select
                className="rounded border p-2"
                value={dog.weight}
                onChange={(e) => updateDog(idx, { weight: e.target.value as Weight })}
              >
                <option value="small">Up to 25 lbs</option>
                <option value="medium">26-50 lbs</option>
                <option value="large">51+ lbs</option>
              </select>
              <div className="sm:col-span-2">
                <input
                  list="breeds"
                  placeholder="Breed"
                  className="w-full rounded border p-2"
                  value={dog.breed}
                  onChange={(e) => updateDog(idx, { breed: e.target.value })}
                />
                <datalist id="breeds">
                  {breedOptions.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Vaccination record</label>
                <input type="file" accept="image/*,.pdf" className="block w-full text-sm" />
                <input
                  type="date"
                  className="mt-2 rounded border p-2"
                  value={dog.vaccineExpiry}
                  onChange={(e) => updateDog(idx, { vaccineExpiry: e.target.value })}
                />
                {expired && (
                  <p className="mt-1 text-sm text-red-600">
                    Vaccination record expired!
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 font-medium">Extras</p>
                <label className="mr-4 inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={dog.extras.nailTrim}
                    onChange={(e) => updateExtras(idx, { nailTrim: e.target.checked })}
                  />
                  <span className="ml-1">Nail trim (+${extraPrices.nailTrim})</span>
                </label>
                <label className="mr-4 inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={dog.extras.teethBrush}
                    onChange={(e) =>
                      updateExtras(idx, { teethBrush: e.target.checked })
                    }
                  />
                  <span className="ml-1">Teeth brushing (+${extraPrices.teethBrush})</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={dog.extras.deShedding}
                    onChange={(e) =>
                      updateExtras(idx, { deShedding: e.target.checked })
                    }
                  />
                  <span className="ml-1">De-shedding (+${extraPrices.deShedding})</span>
                </label>
              </div>
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={addDog}
        className="rounded bg-secondary px-3 py-1 text-sm text-white hover:bg-secondary-dark"
      >
        Add another dog
      </button>

      <div className="flex justify-between border-t pt-4 text-lg font-bold">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        className="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
      >
        Submit Request
      </button>
    </form>
  );
}


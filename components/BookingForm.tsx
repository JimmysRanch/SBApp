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
      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold">Owner information</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="owner-first-name" className="text-sm font-medium">
              First name
            </label>
            <input
              id="owner-first-name"
              required
              placeholder="First name"
              className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
              value={owner.firstName}
              autoComplete="given-name"
              onChange={(e) => setOwner({ ...owner, firstName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="owner-last-name" className="text-sm font-medium">
              Last name
            </label>
            <input
              id="owner-last-name"
              required
              placeholder="Last name"
              className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
              value={owner.lastName}
              autoComplete="family-name"
              onChange={(e) => setOwner({ ...owner, lastName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="owner-address" className="text-sm font-medium">
              Address
            </label>
            <input
              id="owner-address"
              required
              placeholder="Address"
              className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
              value={owner.address}
              autoComplete="street-address"
              onChange={(e) => setOwner({ ...owner, address: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="owner-phone" className="text-sm font-medium">
              Phone
            </label>
            <input
              id="owner-phone"
              required
              placeholder="Phone"
              className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
              value={owner.phone}
              type="tel"
              autoComplete="tel"
              onChange={(e) => setOwner({ ...owner, phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="owner-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="owner-email"
              required
              type="email"
              placeholder="Email"
              className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
              value={owner.email}
              autoComplete="email"
              onChange={(e) => setOwner({ ...owner, email: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      {/* Dog sections */}
      {dogs.map((dog, idx) => {
        const expired = dog.vaccineExpiry && new Date(dog.vaccineExpiry) < new Date();
        const sectionId = `dog-${idx + 1}`;
        const breedListId = `breed-options-${idx}`;
        const expiryMessageId = `${sectionId}-expiry`; // used conditionally

        return (
          <fieldset key={sectionId} className="space-y-4 rounded border p-4">
            <legend className="text-lg font-medium">Dog {idx + 1}</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor={`${sectionId}-name`} className="text-sm font-medium">
                  Name
                </label>
                <input
                  id={`${sectionId}-name`}
                  required
                  placeholder="Name"
                  className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
                  value={dog.name}
                  onChange={(e) => updateDog(idx, { name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${sectionId}-gender`} className="text-sm font-medium">
                  Gender
                </label>
                <select
                  id={`${sectionId}-gender`}
                  className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
                  value={dog.gender}
                  onChange={(e) => updateDog(idx, { gender: e.target.value as 'm' | 'f' })}
                >
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Fixed or neutered</span>
                <div className="flex items-center gap-2">
                  <input
                    id={`${sectionId}-fixed`}
                    className="h-4 w-4 rounded border focus-ring"
                    type="checkbox"
                    checked={dog.fixed}
                    onChange={(e) => updateDog(idx, { fixed: e.target.checked })}
                  />
                  <label htmlFor={`${sectionId}-fixed`} className="text-sm">
                    Fixed/Neutered
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${sectionId}-weight`} className="text-sm font-medium">
                  Weight
                </label>
                <select
                  id={`${sectionId}-weight`}
                  className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
                  value={dog.weight}
                  onChange={(e) => updateDog(idx, { weight: e.target.value as Weight })}
                >
                  <option value="small">Up to 25 lbs</option>
                  <option value="medium">26-50 lbs</option>
                  <option value="large">51+ lbs</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label htmlFor={`${sectionId}-breed`} className="text-sm font-medium">
                  Breed
                </label>
                <input
                  id={`${sectionId}-breed`}
                  list={breedListId}
                  placeholder="Breed"
                  className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
                  value={dog.breed}
                  onChange={(e) => updateDog(idx, { breed: e.target.value })}
                />
                <datalist id={breedListId}>
                  {breedOptions.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${sectionId}-vaccine-file`} className="mb-1 block text-sm font-medium">
                  Vaccination record upload
                </label>
                <input
                  id={`${sectionId}-vaccine-file`}
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-sm focus-ring"
                />
                <label htmlFor={`${sectionId}-vaccine-expiry`} className="mt-2 block text-sm font-medium">
                  Vaccination expiry date
                </label>
                <input
                  id={`${sectionId}-vaccine-expiry`}
                  type="date"
                  className="rounded border p-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
                  value={dog.vaccineExpiry}
                  aria-describedby={expired ? expiryMessageId : undefined}
                  onChange={(e) => updateDog(idx, { vaccineExpiry: e.target.value })}
                />
                {expired && (
                  <p id={expiryMessageId} className="mt-1 text-sm text-red-600">
                    Vaccination record expired!
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <fieldset>
                  <legend className="mb-2 font-medium">Extras</legend>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        id={`${sectionId}-nail-trim`}
                        className="h-4 w-4 rounded border focus-ring"
                        type="checkbox"
                        checked={dog.extras.nailTrim}
                        onChange={(e) => updateExtras(idx, { nailTrim: e.target.checked })}
                      />
                      <label htmlFor={`${sectionId}-nail-trim`} className="text-sm">
                        Nail trim (+${extraPrices.nailTrim})
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`${sectionId}-teeth-brush`}
                        className="h-4 w-4 rounded border focus-ring"
                        type="checkbox"
                        checked={dog.extras.teethBrush}
                        onChange={(e) =>
                          updateExtras(idx, { teethBrush: e.target.checked })
                        }
                      />
                      <label htmlFor={`${sectionId}-teeth-brush`} className="text-sm">
                        Teeth brushing (+${extraPrices.teethBrush})
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`${sectionId}-deshedding`}
                        className="h-4 w-4 rounded border focus-ring"
                        type="checkbox"
                        checked={dog.extras.deShedding}
                        onChange={(e) =>
                          updateExtras(idx, { deShedding: e.target.checked })
                        }
                      />
                      <label htmlFor={`${sectionId}-deshedding`} className="text-sm">
                        De-shedding (+${extraPrices.deShedding})
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={addDog}
        className="focus-ring rounded bg-secondary px-3 py-1 text-sm text-white hover:bg-secondary-dark"
      >
        Add another dog
      </button>

      <div className="flex justify-between border-t pt-4 text-lg font-bold" aria-live="polite">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        className="focus-ring w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
      >
        Submit Request
      </button>
    </form>
  );
}


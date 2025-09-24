'use client';

import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type DogGender = 'male' | 'female' | '';

type DogForm = {
  name: string;
  breed: string;
  gender: DogGender;
  age: string;
  neutered: boolean;
  hairType: string;
  weight: string;
  medical: string;
};

const emptyDog: DogForm = {
  name: '',
  breed: '',
  gender: '',
  age: '',
  neutered: false,
  hairType: '',
  weight: '',
  medical: '',
};

const textInputClass =
  'h-11 w-full rounded-xl border border-white/50 bg-white/95 px-4 text-base text-brand-navy placeholder:text-brand-navy/50 shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30';
const textAreaClass =
  'min-h-[96px] w-full rounded-xl border border-white/50 bg-white/95 px-4 py-3 text-base text-brand-navy placeholder:text-brand-navy/50 shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30';
const labelClass = 'text-sm font-semibold text-brand-navy';

const hearAboutUsOptions = [
  { value: '', label: 'Select one' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Nextdoor', label: 'Nextdoor' },
  { value: 'Google', label: 'Google' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Other', label: 'Other' },
];

const hairTypeOptions = [
  { value: '', label: 'Select coat type' },
  { value: 'Smooth', label: 'Smooth' },
  { value: 'Short', label: 'Short' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Long', label: 'Long' },
  { value: 'Wire', label: 'Wire' },
  { value: 'Curly', label: 'Curly' },
  { value: 'Double', label: 'Double' },
  { value: 'Hairless', label: 'Hairless' },
  { value: 'Other', label: 'Other' },
];

function hasDogData(dog: DogForm) {
  return (
    dog.name.trim() !== '' ||
    dog.breed.trim() !== '' ||
    dog.gender !== '' ||
    dog.age.trim() !== '' ||
    dog.neutered ||
    dog.hairType.trim() !== '' ||
    dog.weight.trim() !== '' ||
    dog.medical.trim() !== ''
  );
}

export default function NewClientPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [dogs, setDogs] = useState<DogForm[]>([{ ...emptyDog }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDog = (index: number, updates: Partial<DogForm>) => {
    setDogs((prev) => prev.map((dog, i) => (i === index ? { ...dog, ...updates } : dog)));
  };

  const addDog = () => {
    setDogs((prev) => [...prev, { ...emptyDog }]);
  };

  const resetError = () => {
    if (error) setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const digits = phone.replace(/\D/g, '');

      if (!trimmedFirst || !trimmedLast) {
        throw new Error('First name and last name are required.');
      }

      if (digits.length !== 10) {
        throw new Error('Please enter a valid 10 digit phone number.');
      }

      const dogsToSave = dogs.filter((dog) => hasDogData(dog));

      for (const dog of dogsToSave) {
        if (!dog.age.trim() || !dog.weight.trim() || !dog.hairType.trim()) {
          throw new Error('Please provide age, weight, and coat type for each dog you add.');
        }
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: `${trimmedFirst} ${trimmedLast}`,
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: digits,
          email: email.trim() || null,
          hear_about_us: hearAboutUs || null,
        })
        .select('id')
        .single();

      if (clientError || !client) {
        throw new Error(clientError?.message ?? 'Failed to create client.');
      }

      for (const dog of dogsToSave) {
        const { error: petError } = await supabase.from('pets').insert({
          client_id: client.id,
          name: dog.name.trim() || null,
          breed: dog.breed.trim() || null,
          gender: dog.gender || null,
          age: dog.age.trim() || null,
          neutered: dog.neutered,
          hair_type: dog.hairType.trim() || null,
          weight: dog.weight.trim() || null,
          medical: dog.medical.trim() || null,
          photo_url: null,
        });

        if (petError) {
          throw new Error(petError.message ?? 'Failed to save pet details.');
        }
      }

      router.push('/clients');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer className="max-w-5xl space-y-6 lg:space-y-5">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-navy">New Client</h1>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
          >
            Cancel
          </Link>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-300/60 bg-red-100/70 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="space-y-5 p-5 lg:space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-brand-navy">Owner information</h2>
              <p className="text-sm text-brand-navy/60">Tell us about the person who owns the pets.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className={textInputClass}
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    resetError();
                  }}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className={textInputClass}
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    resetError();
                  }}
                  autoComplete="family-name"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="phone">
                  Phone number <span className="font-normal text-brand-navy/60">(10 digits)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  className={textInputClass}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    resetError();
                  }}
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="email">
                  Email <span className="font-normal text-brand-navy/60">(optional)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={textInputClass}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetError();
                  }}
                  placeholder="jane@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className={labelClass} htmlFor="hearAboutUs">
                  How did they hear about you? <span className="font-normal text-brand-navy/60">(optional)</span>
                </label>
                <select
                  id="hearAboutUs"
                  name="hearAboutUs"
                  className={textInputClass}
                  value={hearAboutUs}
                  onChange={(event) => {
                    setHearAboutUs(event.target.value);
                    resetError();
                  }}
                >
                  {hearAboutUsOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-5 p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-brand-navy">Dog information</h2>
              <p className="text-sm text-brand-navy/60">
                Add each dog the client will bring in. Leave blank to skip. Age, weight, and coat type are required for each dog
                you add.
              </p>
            </div>

            <div className="space-y-4">
              {dogs.map((dog, index) => (
                <div
                  key={index}
                  className="space-y-4 border-t border-white/50 pt-5 first:border-t-0 first:pt-0"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className={labelClass} htmlFor={`dog-name-${index}`}>
                        Name
                      </label>
                      <input
                        id={`dog-name-${index}`}
                        type="text"
                        className={textInputClass}
                        value={dog.name}
                        onChange={(event) => updateDog(index, { name: event.target.value })}
                        placeholder="Charlie"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass} htmlFor={`dog-breed-${index}`}>
                        Breed
                      </label>
                      <input
                        id={`dog-breed-${index}`}
                        type="text"
                        className={textInputClass}
                        value={dog.breed}
                        onChange={(event) => updateDog(index, { breed: event.target.value })}
                        placeholder="Golden Retriever"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/50 bg-white/70 px-3 py-2">
                    <span className="text-sm font-semibold text-brand-navy">Gender:</span>
                    <label className="flex items-center gap-2 text-sm text-brand-navy">
                      <input
                        type="radio"
                        name={`dog-gender-${index}`}
                        value="male"
                        checked={dog.gender === 'male'}
                        onChange={() => updateDog(index, { gender: 'male' })}
                        className="h-4 w-4 border-brand-bubble text-primary focus:ring-brand-bubble"
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-2 text-sm text-brand-navy">
                      <input
                        type="radio"
                        name={`dog-gender-${index}`}
                        value="female"
                        checked={dog.gender === 'female'}
                        onChange={() => updateDog(index, { gender: 'female' })}
                        className="h-4 w-4 border-brand-bubble text-primary focus:ring-brand-bubble"
                      />
                      Female
                    </label>
                    <label className="flex items-center gap-2 text-sm text-brand-navy">
                      <input
                        type="checkbox"
                        checked={dog.neutered}
                        onChange={(event) => updateDog(index, { neutered: event.target.checked })}
                        className="h-4 w-4 rounded border-brand-bubble text-primary focus:ring-brand-bubble"
                      />
                      Spayed / neutered
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className={labelClass} htmlFor={`dog-age-${index}`}>
                        Age
                      </label>
                      <input
                        id={`dog-age-${index}`}
                        type="text"
                        className={textInputClass}
                        value={dog.age}
                        onChange={(event) => updateDog(index, { age: event.target.value })}
                        placeholder="2 years"
                        required={hasDogData(dog)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass} htmlFor={`dog-weight-${index}`}>
                        Weight
                      </label>
                      <input
                        id={`dog-weight-${index}`}
                        type="text"
                        className={textInputClass}
                        value={dog.weight}
                        onChange={(event) => updateDog(index, { weight: event.target.value })}
                        placeholder="45 lbs"
                        required={hasDogData(dog)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass} htmlFor={`dog-hair-${index}`}>
                        Coat / hair type
                      </label>
                      <select
                        id={`dog-hair-${index}`}
                        className={textInputClass}
                        value={dog.hairType}
                        onChange={(event) => updateDog(index, { hairType: event.target.value })}
                        required={hasDogData(dog)}
                      >
                        {hairTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass} htmlFor={`dog-medical-${index}`}>
                      Medical notes / allergies <span className="font-normal text-brand-navy/60">(optional)</span>
                    </label>
                    <textarea
                      id={`dog-medical-${index}`}
                      className={textAreaClass}
                      value={dog.medical}
                      onChange={(event) => updateDog(index, { medical: event.target.value })}
                      placeholder="Allergies, meds, behavioral notes"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addDog}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-dashed border-brand-bubble/60 bg-brand-bubble/10 px-3 py-2 text-sm font-semibold text-brand-bubble transition hover:bg-brand-bubble/15 focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M10 3a.75.75 0 0 1 .75.75V9.25h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H3.25a.75.75 0 0 1 0-1.5h5.5V3.75A.75.75 0 0 1 10 3Z" />
              </svg>
              Add another dog
            </button>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/clients"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
          >
            Back to clients
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-bubble/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create client'}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

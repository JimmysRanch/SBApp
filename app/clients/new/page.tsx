'use client';

import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
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
  photo: File | null;
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
  photo: null,
};

const textInputClass =
  'h-11 w-full rounded-xl border border-white/10 bg-brand-onyx/70 px-4 text-base text-brand-cream placeholder:text-brand-cream/40 shadow-[0_20px_55px_-35px_rgba(5,12,32,0.85)] transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30 backdrop-blur';
const textAreaClass =
  'min-h-[96px] w-full rounded-xl border border-white/10 bg-brand-onyx/70 px-4 py-3 text-base text-brand-cream placeholder:text-brand-cream/40 shadow-[0_20px_55px_-35px_rgba(5,12,32,0.85)] transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30 backdrop-blur';
const labelClass = 'text-sm font-semibold text-brand-cream';

const hearAboutUsOptions = [
  { value: '', label: 'Select one' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Nextdoor', label: 'Nextdoor' },
  { value: 'Google', label: 'Google' },
  { value: 'Friend', label: 'Friend' },
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
    dog.medical.trim() !== '' ||
    dog.photo !== null
  );
}

export default function NewClientPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [dogs, setDogs] = useState<DogForm[]>([{ ...emptyDog }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDog = (index: number, updates: Partial<DogForm>) => {
    setDogs((prev) => prev.map((dog, i) => (i === index ? { ...dog, ...updates } : dog)));
  };

  const handleDogPhotoChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    updateDog(index, { photo: file });
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

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: `${trimmedFirst} ${trimmedLast}`,
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: digits,
          email: email.trim() || null,
          address: address.trim() || null,
          hear_about_us: hearAboutUs || null,
        })
        .select('id')
        .single();

      if (clientError || !client) {
        throw new Error(clientError?.message ?? 'Failed to create client.');
      }

      for (const dog of dogs) {
        if (!hasDogData(dog)) continue;

        let photoUrl: string | null = null;

        if (dog.photo) {
          const extension = dog.photo.name.split('.').pop();
          const filePath = `${client.id}/${Date.now()}-${Math.random().toString(36).slice(2)}${extension ? `.${extension}` : ''}`;
          const { error: uploadError } = await supabase.storage.from('pet-photos').upload(filePath, dog.photo);
          if (uploadError) {
            throw new Error(uploadError.message ?? 'Failed to upload pet photo.');
          }

          const { data } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
          photoUrl = data.publicUrl ?? null;
        }

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
          photo_url: photoUrl,
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
    <PageContainer className="max-w-5xl space-y-10">
      <Card className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-cream/60">Create client</p>
            <h1 className="text-3xl font-bold text-brand-cream">Add new client</h1>
            <p className="text-sm text-brand-cream/70">
              Record owner details and their dogs so you can start scheduling appointments right away.
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-brand-onyx/70 px-4 py-2 text-sm font-semibold text-brand-cream shadow-[0_20px_55px_-35px_rgba(5,12,32,0.85)] transition hover:-translate-y-0.5 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-brand-bubble/40 bg-brand-bubble/10 px-4 py-3 text-sm text-brand-cream">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-brand-cream">Owner information</h2>
              <p className="text-sm text-brand-cream/60">Tell us about the person who owns the pets.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
                <label className={labelClass} htmlFor="phone">
                  Phone number <span className="font-normal text-brand-cream/60">(10 digits)</span>
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
              <div className="space-y-2">
                <label className={labelClass} htmlFor="email">
                  Email <span className="font-normal text-brand-cream/60">(optional)</span>
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
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass} htmlFor="address">
                  Address <span className="font-normal text-brand-cream/60">(optional)</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className={textInputClass}
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    resetError();
                  }}
                  placeholder="1234 Bubble Lane, Springfield"
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass} htmlFor="hearAboutUs">
                  How did they hear about you? <span className="font-normal text-brand-cream/60">(optional)</span>
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
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-brand-cream">Dog information</h2>
              <p className="text-sm text-brand-cream/60">Add each dog the client will bring in. Leave blank to skip.</p>
            </div>

            <div className="space-y-6">
              {dogs.map((dog, index) => (
                <div
                  key={index}
                  className="space-y-5 rounded-2xl border border-brand-bubble/30 bg-brand-onyx/60 p-5 shadow-[0_24px_55px_-35px_rgba(5,12,32,0.9)]"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                      <span className={labelClass}>Gender</span>
                      <div className="flex items-center gap-6 rounded-xl border border-white/10 bg-brand-onyx/70 px-4 py-3">
                        <label className="flex items-center gap-2 text-sm text-brand-cream">
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
                        <label className="flex items-center gap-2 text-sm text-brand-cream">
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
                      </div>
                    </div>
                    <div className="space-y-2">
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
                      />
                    </div>
                    <div className="space-y-2">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass} htmlFor={`dog-hair-${index}`}>
                        Coat / hair type
                      </label>
                      <input
                        id={`dog-hair-${index}`}
                        type="text"
                        className={textInputClass}
                        value={dog.hairType}
                        onChange={(event) => updateDog(index, { hairType: event.target.value })}
                        placeholder="Short double coat"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-brand-cream">
                      <input
                        type="checkbox"
                        checked={dog.neutered}
                        onChange={(event) => updateDog(index, { neutered: event.target.checked })}
                        className="h-4 w-4 rounded border-brand-bubble text-primary focus:ring-brand-bubble"
                      />
                      Neutered / spayed
                    </label>
                    <div className="space-y-2 md:w-1/2">
                      <label className={labelClass} htmlFor={`dog-photo-${index}`}>
                        Photo <span className="font-normal text-brand-cream/60">(optional)</span>
                      </label>
                      <input
                        id={`dog-photo-${index}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => handleDogPhotoChange(index, event)}
                        className="block w-full text-sm text-brand-cream file:mr-4 file:rounded-full file:border-0 file:bg-brand-bubble file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass} htmlFor={`dog-medical-${index}`}>
                      Medical notes / allergies <span className="font-normal text-brand-cream/60">(optional)</span>
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-bubble/60 bg-brand-bubble/10 px-4 py-2 text-sm font-semibold text-brand-bubble transition hover:bg-brand-bubble/15 focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
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
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/clients"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-brand-onyx/70 px-4 py-2 text-sm font-semibold text-brand-cream shadow-[0_20px_55px_-35px_rgba(5,12,32,0.85)] transition hover:-translate-y-0.5 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
            >
              Back to clients
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-6 py-3 text-sm font-semibold text-white shadow-[0_28px_65px_-35px_rgba(255,10,120,0.65)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-bubble/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create client'}
            </button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}

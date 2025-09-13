"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { dogBreeds } from "@/lib/dogBreeds";

type Dog = {
  name: string;
  breed: string;
  gender: "male" | "female" | "";
  age: string;
  neutered: boolean;
  hairType: string;
  weight: string;
  medical: string;
  photo: File | null;
};

const emptyDog: Dog = {
  name: "",
  breed: "",
  gender: "",
  age: "",
  neutered: false,
  hairType: "",
  weight: "",
  medical: "",
  photo: null,
};

export default function NewClientPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [hearAboutUs, setHearAboutUs] = useState("");
  const [dogs, setDogs] = useState<Dog[]>([{ ...emptyDog }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDog = (index: number, updates: Partial<Dog>) => {
    setDogs((prev) => prev.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const addDog = () => setDogs((d) => [...d, { ...emptyDog }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const digits = phone.replace(/\D/g, "");
    if (!firstName.trim() || !lastName.trim() || digits.length !== 10) {
      setError("First name, last name and 10 digit phone number are required");
      setSaving(false);
      return;
    }

    const { data: client, error: insertError } = await supabase
      .from("clients")
      .insert({
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: digits,
        email: email || null,
        address:
          street || city || stateCode || zip
            ? `${street}, ${city}, ${stateCode} ${zip}`
            : null,
        hear_about_us: hearAboutUs || null,
      })
      .select("id")
      .single();

    if (insertError || !client) {
      setError(insertError?.message || "Failed to create client");
      setSaving(false);
      return;
    }

    for (const dog of dogs) {
      let photoUrl: string | null = null;
      if (dog.photo) {
        const ext = dog.photo.name.split(".").pop();
        const filePath = `${client.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(filePath, dog.photo);
        if (!uploadError) {
          const { data } = supabase.storage.from("pet-photos").getPublicUrl(filePath);
          photoUrl = data.publicUrl;
        }
      }

      const { error: petError } = await supabase.from("pets").insert({
        client_id: client.id,
        name: dog.name || null,
        breed: dog.breed || null,
        gender: dog.gender || null,
        age: dog.age || null,
        neutered: dog.neutered,
        hair_type: dog.hairType || null,
        weight: dog.weight || null,
        medical: dog.medical || null,
        photo_url: photoUrl,
      });
      if (petError) {
        setError(petError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/clients");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Add New Client</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold mb-4">Owner</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block mb-1 font-medium">First Name</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full sm:max-w-[200px]"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Last Name</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full sm:max-w-[200px]"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone Number</label>
                <input
                  type="tel"
                  pattern="\\d{10}"
                  maxLength={10}
                  className="border rounded px-3 py-2 w-full sm:max-w-[10ch]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="email"
                  className="border rounded px-3 py-2 w-full sm:max-w-[200px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block mb-1 font-medium">Address</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">City</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">State</label>
                <input
                  type="text"
                  maxLength={2}
                  className="border rounded px-3 py-2 w-full sm:max-w-[60px]"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Zip</label>
                <input
                  type="text"
                  pattern="\\d{5}"
                  className="border rounded px-3 py-2 w-full sm:max-w-[80px]"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block mb-1 font-medium">How did you hear about us?</label>
                <div className="flex flex-wrap gap-4">
                  {['Facebook', 'Nextdoor', 'Google', 'Friend', 'Other'].map((opt) => (
                    <label key={opt} className="flex items-center">
                      <input
                        type="radio"
                        name="hearAboutUs"
                        value={opt}
                        checked={hearAboutUs === opt}
                        onChange={(e) => setHearAboutUs(e.target.value)}
                      />
                      <span className="ml-1">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Dog</h2>
            {dogs.map((dog, i) => (
              <div key={i} className="mb-6 border p-4 rounded">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="block mb-1 font-medium">Name</label>
                    <input
                      type="text"
                      className="border rounded px-3 py-2 w-full sm:max-w-[200px]"
                      value={dog.name}
                      onChange={(e) => updateDog(i, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Breed</label>
                    <input
                      type="text"
                      list="breed-options"
                      className="border rounded px-3 py-2 w-full sm:max-w-xs"
                      value={dog.breed}
                      onChange={(e) => updateDog(i, { breed: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Age</label>
                    <input
                      type="text"
                      className="border rounded px-3 py-2 w-full sm:max-w-[80px]"
                      value={dog.age}
                      onChange={(e) => updateDog(i, { age: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-3 flex flex-wrap items-center gap-4">
                    <span className="font-medium">Gender</span>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`gender-${i}`}
                        checked={dog.gender === "male"}
                        onChange={() => updateDog(i, { gender: "male" })}
                      />
                      <span className="ml-1">Male</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`gender-${i}`}
                        checked={dog.gender === "female"}
                        onChange={() => updateDog(i, { gender: "female" })}
                      />
                      <span className="ml-1">Female</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-1"
                        checked={dog.neutered}
                        onChange={(e) => updateDog(i, { neutered: e.target.checked })}
                      />
                      <span className="font-medium">Neutered</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 font-medium">Hair Type</label>
                    <input
                      type="text"
                      className="border rounded px-3 py-2 w-full"
                      value={dog.hairType}
                      onChange={(e) => updateDog(i, { hairType: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Weight</label>
                    <input
                      type="text"
                      className="border rounded px-3 py-2 w-full"
                      value={dog.weight}
                      onChange={(e) => updateDog(i, { weight: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block mb-1 font-medium">Medical Conditions / Allergies</label>
                    <textarea
                      className="border rounded px-3 py-2 w-full"
                      value={dog.medical}
                      onChange={(e) => updateDog(i, { medical: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block mb-1 font-medium">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => updateDog(i, { photo: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
              </div>
            ))}
            <datalist id="breed-options">
              {dogBreeds.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={addDog}
              className="bg-gray-200 px-3 py-2 rounded"
            >
              Add Another Dog
            </button>
          </section>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </main>
    </div>
  );
}

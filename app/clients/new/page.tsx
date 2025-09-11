"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  const [address, setAddress] = useState("");
  const [hearAboutUs, setHearAboutUs] = useState("");
  const [dogs, setDogs] = useState<Dog[]>([{ ...emptyDog }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);

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
        address: address || null,
        hear_about_us: hearAboutUs || null,
      })
      .select("id")
      .single();

    if (insertError || !client) {
      setError(insertError?.message || "Failed to create client");
      setSaving(false);
      return;
    }

    // Upload driver's license photo if provided and attach URL to the client
    if (licensePhoto) {
      const ext = licensePhoto.name.split(".").pop();
      const filePath = `${client.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error: licenseUploadError } = await supabase.storage
        .from("license-photos")
        .upload(filePath, licensePhoto);
      if (licenseUploadError) {
        setError(licenseUploadError.message);
        setSaving(false);
        return;
      }
      const { data: licenseData } = supabase.storage
        .from("license-photos")
        .getPublicUrl(filePath);
      const { error: licenseUpdateError } = await supabase
        .from("clients")
        .update({ license_photo_url: licenseData.publicUrl })
        .eq("id", client.id);
      if (licenseUpdateError) {
        setError(licenseUpdateError.message);
        setSaving(false);
        return;
      }
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Owner</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1 font-medium">First Name</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Last Name</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
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
                  className="border rounded px-3 py-2 w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="email"
                  className="border rounded px-3 py-2 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">Address</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">How did you hear about us?</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={hearAboutUs}
                  onChange={(e) => setHearAboutUs(e.target.value)}
                >
                  <option value="">Select one</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Nextdoor">Next-door</option>
                  <option value="Google">Google</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">{"Driver's License Photo"}</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setLicensePhoto(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Dog</h2>
            {dogs.map((dog, i) => (
              <div key={i} className="mb-6 space-y-4 border p-4 rounded">
                <div>
                  <label className="block mb-1 font-medium">Name</label>
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    value={dog.name}
                    onChange={(e) => updateDog(i, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Breed</label>
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    value={dog.breed}
                    onChange={(e) => updateDog(i, { breed: e.target.value })}
                  />
                </div>
                <div>
                  <span className="block mb-1 font-medium">Gender</span>
                  <div className="flex gap-4">
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
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Age</label>
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    value={dog.age}
                    onChange={(e) => updateDog(i, { age: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={dog.neutered}
                    onChange={(e) => updateDog(i, { neutered: e.target.checked })}
                  />
                  <span className="font-medium">Neutered</span>
                </div>
                <div>
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
                <div>
                  <label className="block mb-1 font-medium">Medical Conditions / Allergies</label>
                  <textarea
                    className="border rounded px-3 py-2 w-full"
                    value={dog.medical}
                    onChange={(e) => updateDog(i, { medical: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => updateDog(i, { photo: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
            ))}
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

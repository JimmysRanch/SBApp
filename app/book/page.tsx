import Sidebar from '@/components/Sidebar'

export default function BookPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold">Book Appointment</h1>
        <p className="mt-4">Booking functionality will go here.</p>
      </main>
    </div>
  )
}
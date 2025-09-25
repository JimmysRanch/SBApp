import React, { Suspense } from "react";
import BookingClient from "./BookingClient";

// prevent static export from trying to pre-render search params
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BookingClient />
    </Suspense>
  );
}

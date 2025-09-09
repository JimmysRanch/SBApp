import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export default function Page() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-6">
      <Suspense fallback={<div className="text-sm">Loading…</div>}>
        <ResetPasswordClient />
      </Suspense>
    </div>
  );
}

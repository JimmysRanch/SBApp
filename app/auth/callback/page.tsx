import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export default function Page() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6 text-sm">
      <Suspense fallback={<div>Signing you in…</div>}>
        <CallbackClient />
      </Suspense>
    </div>
  );
}

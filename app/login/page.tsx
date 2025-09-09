// app/login/page.tsx  (SERVER)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

'use client';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-800 to-blue-400 text-white">
      <h1 className="mb-1 text-5xl font-extrabold drop-shadow-md">
        <span className="text-white">Scruffy</span>{' '}
        <span className="text-pink-500">Butts</span>
      </h1>
      <p className="mb-6 text-center text-sm leading-tight">
        DOG GROOMING<br />NATALIA TX
      </p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <div className="mt-8 flex gap-8 text-5xl text-yellow-400">
        <span>✂️</span>
        <span>🪮</span>
        <span>🧼</span>
      </div>
    </div>
  );
}

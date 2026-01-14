import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Lock } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-admin-dark flex items-center justify-center text-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-admin-card p-8 rounded-xl border border-gray-800 shadow-2xl">
          <div className="flex justify-center mb-6 text-admin-accent">
            <Lock size={64} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-center mb-6 uppercase tracking-widest">
            SeshNx <span className="text-admin-accent">Admin</span>
          </h1>
          <SignIn
            afterSignInUrl="/"
            signUpUrl="/register"
            redirectUrl="/"
          />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xxs text-gray-600">
            Access is restricted to authorized personnel.<br/>
            All actions are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}

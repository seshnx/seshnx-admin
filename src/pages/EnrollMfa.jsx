import React, { useState, useEffect } from 'react';
import { multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import { ShieldCheck, Copy, CheckCircle } from 'lucide-react';

export default function EnrollMfa() {
  const { currentUser } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1);

  const initEnrollment = async () => {
    if (!currentUser) return;
    try {
      const multiFactorSession = await multiFactor(currentUser).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
      setSecret(totpSecret);
      
      const url = await QRCode.toDataURL(
        totpSecret.generateQrCodeUrl(currentUser.email, 'SeshNx Admin')
      );
      setQrCodeUrl(url);
      setStep(2);
    } catch (e) {
      console.error("Enrollment Error:", e);
      alert("Failed to initialize MFA setup. Ensure you are logged in.");
    }
  };

  const finalizeEnrollment = async () => {
    try {
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        secret, 
        verificationCode
      );
      await multiFactor(currentUser).enroll(multiFactorAssertion, "Admin Device");
      alert("MFA Enrolled Successfully!");
      window.location.href = '/'; // Redirect to dashboard
    } catch (e) {
      alert("Invalid Code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-admin-dark flex items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-admin-card p-8 rounded-xl border border-gray-800">
        <div className="flex justify-center mb-4 text-admin-accent">
            <ShieldCheck size={48} />
        </div>
        <h2 className="text-xl font-bold text-center mb-6">Setup Authenticator</h2>

        {step === 1 && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              Secure your admin account by linking a TOTP app (Google Authenticator, Authy, etc).
            </p>
            <button 
                onClick={initEnrollment}
                className="w-full bg-admin-accent hover:bg-blue-600 py-3 rounded font-bold"
            >
                Begin Setup
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-center bg-white p-2 rounded-lg w-fit mx-auto">
                <img src={qrCodeUrl} alt="Scan this QR" className="w-48 h-48" />
            </div>
            
            <div className="text-center space-y-2">
                <p className="text-xs text-gray-500 uppercase font-bold">Or enter manually</p>
                <code className="bg-black px-3 py-1 rounded border border-gray-800 text-sm text-admin-accent select-all">
                    {secret?.secretKey}
                </code>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Verification Code</label>
                <input 
                    className="w-full bg-black border border-gray-700 rounded p-3 text-center text-xl tracking-widest font-mono focus:border-admin-accent outline-none"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                />
            </div>

            <button 
                onClick={finalizeEnrollment}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold flex items-center justify-center gap-2"
            >
                <CheckCircle size={18} /> Activate MFA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

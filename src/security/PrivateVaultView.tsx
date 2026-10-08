import React, { useState } from 'react';
import {
  Download,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import {
  configureVaultPin,
  hasVaultPinConfigured,
  triggerBiometricUnlock,
  verifyVaultPin,
} from '../security/vaultCrypto';
import { MediaItem } from '../storage/studioDatabase';

interface PrivateVaultViewProps {
  vaultItems: MediaItem[];
  onRestoreFromVault: (id: string) => void;
  onDeleteFromVault: (id: string) => void;
}

export const PrivateVaultView: React.FC<PrivateVaultViewProps> = ({
  vaultItems,
  onRestoreFromVault,
  onDeleteFromVault,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(() => hasVaultPinConfigured());
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSetInitialPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (pinInput.length < 4) {
      setErrorMessage('PIN must be at least 4 digits.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setErrorMessage('PIN entries do not match.');
      return;
    }
    await configureVaultPin(pinInput);
    setPinConfigured(true);
    setIsUnlocked(true);
    setPinInput('');
    setConfirmPinInput('');
    setStatusMessage('PBKDF2 SHA-256 salted key derived & stored. Plain-text PIN is never stored.');
  };

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const valid = await verifyVaultPin(pinInput);
    if (valid) {
      setIsUnlocked(true);
      setPinInput('');
      setStatusMessage('Authenticated via PBKDF2-SHA256 Key Derivation.');
    } else {
      setErrorMessage('Invalid Vault PIN. Authentication failed.');
    }
  };

  const handleBiometricUnlock = async () => {
    setErrorMessage(null);
    const res = await triggerBiometricUnlock();
    if (res.success) {
      setIsUnlocked(true);
      setStatusMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Honest Platform Security Architecture Notice */}
      <div className="rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <ShieldCheck className="w-4 h-4" />
            <span>ENCRYPTED PRIVATE VAULT · ANDROID KEYSTORE / WEB CRYPTO AES-GCM</span>
          </div>
          {isUnlocked && (
            <button
              onClick={() => setIsUnlocked(false)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:border-[#F59E0B] flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Lock Vault Now</span>
            </button>
          )}
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Private Vault ({vaultItems.length} Protected Items)
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Items moved to the Private Vault are hidden from the normal Studio Gallery and protected by a salted PBKDF2-SHA256 key and biometric authentication.
        </p>

        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-200">Platform Limitation Disclosure:</strong> On Native Android, files are moved into app-private storage encrypted with Android Keystore (`EncryptedFile` AES256_GCM) and removed from public `MediaStore`. However, on rooted devices or before Android 10 scoped storage enforcement, third-party root file managers or OS-level device backups may still detect app container metadata. Never store plain-text PINs.
          </div>
        </div>
      </div>

      {!isUnlocked ? (
        <div className="max-w-md mx-auto rounded-3xl bg-[#131418] border border-zinc-800 p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                {pinConfigured ? 'Unlock Private Vault' : 'Create Encrypted Vault PIN'}
              </h2>
              <p className="text-xs text-zinc-400">
                {pinConfigured
                  ? 'Enter your PIN or use Biometric Authenticator'
                  : 'PIN is hashed with 100,000 PBKDF2 iterations'}
              </p>
            </div>
          </div>

          {!pinConfigured ? (
            <form onSubmit={handleSetInitialPin} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">NEW VAULT PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4–8 digit PIN"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-white tracking-widest"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">CONFIRM VAULT PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Confirm PIN"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-white tracking-widest"
                />
              </div>
              {errorMessage && <p className="text-xs text-rose-400">{errorMessage}</p>}
              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-[#F59E0B] text-black font-semibold text-sm hover:bg-[#F59E0B]/90 transition cursor-pointer"
              >
                Initialize Encrypted Vault
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlockWithPin} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">ENTER VAULT PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-white tracking-widest"
                />
              </div>

              {errorMessage && <p className="text-xs text-rose-400 leading-relaxed">{errorMessage}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="submit"
                  className="min-h-[48px] rounded-xl bg-[#F59E0B] text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F59E0B]/90 transition cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock with PIN</span>
                </button>
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  className="min-h-[48px] rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 hover:border-[#F59E0B] transition cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-[#F59E0B]" />
                  <span>Biometric Unlock</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
              {statusMessage}
            </div>
          )}

          {vaultItems.length === 0 ? (
            <div className="rounded-3xl bg-[#131418] border border-zinc-800 p-12 text-center space-y-2">
              <p className="text-base font-semibold text-white">Your Private Vault is empty</p>
              <p className="text-xs text-zinc-400">
                Click the &ldquo;Vault&rdquo; lock button on any photo or video in the Studio Gallery to move it into encrypted storage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vaultItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#131418] border border-zinc-800 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative h-48 bg-black">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 text-[11px] font-mono text-[#F59E0B] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>AES-GCM PROTECTED</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => onRestoreFromVault(item.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F59E0B] text-black text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Restore to Gallery</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <a
                          href={item.dataUrl}
                          download={item.title}
                          className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
                          title="Export Authenticated File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onDeleteFromVault(item.id)}
                          className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-rose-400 cursor-pointer"
                          title="Delete Permanently"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

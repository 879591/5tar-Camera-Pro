// Secure Vault Cryptography using Web Crypto API (PBKDF2 SHA-256 + AES-GCM)
// Never stores PIN in plain text. Stores only salted PBKDF2 hash in localStorage.

const PIN_HASH_KEY = '5tar_vault_pin_hash_v1';
const PIN_SALT_KEY = '5tar_vault_pin_salt_v1';
const WEBAUTHN_CRED_KEY = '5tar_vault_biometric_cred_v1';

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function hasVaultPinConfigured(): boolean {
  return !!localStorage.getItem(PIN_HASH_KEY) && !!localStorage.getItem(PIN_SALT_KEY);
}

export async function deriveKeyFromPin(pin: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBuf(saltHex),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function configureVaultPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufToHex(salt.buffer);
  const key = await deriveKeyFromPin(pin, saltHex);
  const exportedRaw = await crypto.subtle.exportKey('raw', key);
  const digest = await crypto.subtle.digest('SHA-256', exportedRaw);
  localStorage.setItem(PIN_SALT_KEY, saltHex);
  localStorage.setItem(PIN_HASH_KEY, bufToHex(digest));
}

export async function verifyVaultPin(pin: string): Promise<boolean> {
  const saltHex = localStorage.getItem(PIN_SALT_KEY);
  const expectedHash = localStorage.getItem(PIN_HASH_KEY);
  if (!saltHex || !expectedHash) return false;

  try {
    const key = await deriveKeyFromPin(pin, saltHex);
    const exportedRaw = await crypto.subtle.exportKey('raw', key);
    const digest = await crypto.subtle.digest('SHA-256', exportedRaw);
    return bufToHex(digest) === expectedHash;
  } catch {
    return false;
  }
}

export async function encryptVaultString(plainText: string, pin: string): Promise<{ cipherHex: string; ivHex: string }> {
  let saltHex = localStorage.getItem(PIN_SALT_KEY);
  if (!saltHex) {
    await configureVaultPin(pin);
    saltHex = localStorage.getItem(PIN_SALT_KEY)!;
  }
  const key = await deriveKeyFromPin(pin, saltHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    cipherHex: bufToHex(encrypted),
    ivHex: bufToHex(iv.buffer),
  };
}

export async function decryptVaultString(cipherHex: string, ivHex: string, pin: string): Promise<string> {
  const saltHex = localStorage.getItem(PIN_SALT_KEY);
  if (!saltHex) throw new Error('Vault salt missing');
  const key = await deriveKeyFromPin(pin, saltHex);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBuf(ivHex) },
    key,
    hexToBuf(cipherHex)
  );
  return new TextDecoder().decode(decrypted);
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function triggerBiometricUnlock(): Promise<{ success: boolean; message: string }> {
  try {
    const supported = await isBiometricAvailable();
    if (!supported) {
      return {
        success: false,
        message: 'Hardware Biometric Authenticator (WebAuthn / TouchID / Android BiometricPrompt) is not available in this browser frame. Please use your encrypted Vault PIN.',
      };
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: '5tar Camera Pro Vault' },
        user: {
          id: userId,
          name: 'studio@5tarcamerapro.local',
          displayName: '5tar Camera Pro Owner',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 30000,
      },
    });

    localStorage.setItem(WEBAUTHN_CRED_KEY, 'enrolled');
    return { success: true, message: 'Biometric authentication verified.' };
  } catch {
    return {
      success: false,
      message: 'Biometric prompt was cancelled or blocked by iframe security policy. Use your Vault PIN to unlock.',
    };
  }
}

package com.fivestar.camerapro.security

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.security.crypto.EncryptedFile
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.File
import java.security.MessageDigest

/**
 * 5tar Camera Pro — Android Keystore & Biometric Private Vault Manager
 * - Never stores plain-text PINs
 * - Uses MasterKey.KeyScheme.AES256_GCM backed by Android Hardware Keystore
 * - Encrypts vault files using EncryptedFile(AES256_GCM_HKDF_4KB)
 */
class PrivateVaultManager(private val context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val securePrefs = EncryptedSharedPreferences.create(
        context,
        "5tar_vault_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveSaltedPinHash(pin: String) {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(("5tar_salt_v1:$pin").toByteArray(Charsets.UTF_8))
        val hex = hashBytes.joinToString("") { "%02x".format(it) }
        securePrefs.edit().putString("vault_pin_hash", hex).apply()
    }

    fun verifyPin(pin: String): Boolean {
        val expected = securePrefs.getString("vault_pin_hash", null) ?: return false
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(("5tar_salt_v1:$pin").toByteArray(Charsets.UTF_8))
        val hex = hashBytes.joinToString("") { "%02x".format(it) }
        return expected == hex
    }

    fun encryptFileToVault(sourceBytes: ByteArray, fileName: String): File {
        val vaultDir = File(context.filesDir, "private_vault").apply { mkdirs() }
        val targetFile = File(vaultDir, "$fileName.enc")
        if (targetFile.exists()) targetFile.delete()

        val encryptedFile = EncryptedFile.Builder(
            context,
            targetFile,
            masterKey,
            EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
        ).build()

        encryptedFile.openFileOutput().use { out ->
            out.write(sourceBytes)
            out.flush()
        }
        return targetFile
    }

    fun authenticateWithBiometric(
        activity: FragmentActivity,
        onSuccess: () -> Unit,
        onFallbackPin: (String) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(context)
        val prompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    onFallbackPin(errString.toString())
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock 5tar Private Vault")
            .setSubtitle("Authenticate with fingerprint or face unlock")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .build()

        prompt.authenticate(promptInfo)
    }
}

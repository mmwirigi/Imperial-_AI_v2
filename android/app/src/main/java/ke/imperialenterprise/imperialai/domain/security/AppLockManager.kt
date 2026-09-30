package ke.imperialenterprise.imperialai.domain.security

import kotlinx.coroutines.flow.StateFlow

/**
 * Security abstraction for device authentication, PIN, and app locking (Section 30).
 */
interface AppLockManager {
    val isAppLockEnabled: StateFlow<Boolean>
    val isCurrentlyLocked: StateFlow<Boolean>
    val lockTimeoutMinutes: StateFlow<Int>
    val isBiometricAvailable: Boolean

    fun setAppLockEnabled(enabled: Boolean, pin: String? = null): Boolean
    fun setLockTimeoutMinutes(minutes: Int)
    fun unlockWithPin(pin: String): Boolean
    fun unlockWithBiometric(): Boolean
    fun lockNow()
    fun onAppForegrounded()
    fun onAppBackgrounded()
}

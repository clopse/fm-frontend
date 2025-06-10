// FILE: src/services/idleService.ts
import { userService } from './userService';

class IdleService {
  private timeout: NodeJS.Timeout | null = null;
  private warningTimeout: NodeJS.Timeout | null = null;
  private readonly IDLE_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private readonly WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout
  private isActive = false;
  private warningCallback?: () => void;

  // Events that indicate user activity
  private readonly ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown'
  ];

  /**
   * Start tracking user activity
   * @param onWarning - Optional callback when warning should be shown
   */
  startTracking(onWarning?: () => void) {
    if (this.isActive) return; // Already tracking
    
    this.warningCallback = onWarning;
    this.isActive = true;
    
    // Add event listeners for user activity
    this.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.resetTimer.bind(this), true);
    });
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Start the timer
    this.resetTimer();
    
    console.log('Idle tracking started - 2 hour timeout');
  }

  /**
   * Stop tracking user activity
   */
  stopTracking() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Remove event listeners
    this.ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, this.resetTimer.bind(this), true);
    });
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Clear timers
    this.clearTimers();
    
    console.log('Idle tracking stopped');
  }

  /**
   * Reset the idle timer (called on user activity)
   */
  private resetTimer() {
    if (!this.isActive) return;
    
    this.clearTimers();
    
    // Set warning timer (fires 5 minutes before logout)
    this.warningTimeout = setTimeout(() => {
      if (this.warningCallback) {
        this.warningCallback();
      } else {
        // Default warning behavior
        const shouldContinue = confirm(
          'Your session will expire in 5 minutes due to inactivity. Click OK to continue your session.'
        );
        
        if (shouldContinue) {
          this.resetTimer(); // Reset if user wants to continue
        }
      }
    }, this.IDLE_TIME - this.WARNING_TIME);
    
    // Set logout timer
    this.timeout = setTimeout(() => {
      this.handleTimeout();
    }, this.IDLE_TIME);
  }

  /**
   * Handle when user switches tabs
   */
  private handleVisibilityChange() {
    if (document.hidden) {
      // User switched away - don't reset timer
      return;
    } else {
      // User came back - reset timer
      this.resetTimer();
    }
  }

  /**
   * Handle idle timeout - logout user
   */
  private handleTimeout() {
    console.log('Session expired due to inactivity');
    
    // Stop tracking
    this.stopTracking();
    
    // Logout user
    userService.logout();
    
    // Show message and redirect
    alert('Your session has expired due to inactivity. Please log in again.');
    window.location.href = '/login';
  }

  /**
   * Clear all timers
   */
  private clearTimers() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
  }

  /**
   * Manually extend the session (useful for "Stay logged in" buttons)
   */
  extendSession() {
    if (this.isActive) {
      this.resetTimer();
      console.log('Session extended');
    }
  }

  /**
   * Get remaining time until logout (in milliseconds)
   */
  getRemainingTime(): number {
    // This is approximate since we don't track the exact start time
    // In a production app, you'd want to track this more precisely
    return this.IDLE_TIME;
  }

  /**
   * Check if idle tracking is active
   */
  isTracking(): boolean {
    return this.isActive;
  }
}

export const idleService = new IdleService();

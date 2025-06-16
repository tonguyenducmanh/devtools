/**
 * Global Event Bus for Vue 3 Option API
 * Handles event subscription, emission, and cleanup
 */
class TDEventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler callback
   * @returns {Function} - Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler callback to remove
   */
  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      // Cleanup empty event arrays
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {*} data - Data to pass to event handlers
   */
  emit(event, data, options = {}) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        if (callback && typeof callback == "function") {
          try {
            callback(data, options);
          } catch (error) {
            console.error(`Error in event handler for ${event}:`, error);
          }
        }
      });
    }
  }

  /**
   * Clear all event listeners
   * @param {string} [event] - Optional event name. If not provided, clears all events
   */
  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Export singleton instance
export default new TDEventBus();

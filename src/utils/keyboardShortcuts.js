/**
 * Keyboard Shortcuts Utility
 * 
 * This file contains the keyboard shortcut definitions and helper functions
 * for implementing keyboard shortcuts throughout the application.
 */

// Shortcut definitions - centralized for easy modification
export const SHORTCUTS = {
  ADD_TASK: { key: 'n', modifiers: {}, description: 'Add New Task' },
  ADD_PROJECT: { key: 'n', modifiers: { ctrl: true, shift: true }, description: 'Add New Project' },
  VIEW_REPORTS: {key: 'g', then: 'r', description: 'View Reports' },
  SEARCH: { key: '/', modifiers: { ctrl: true }, description: 'Search' },
  SHOW_SHORTCUTS: { key: '?', modifiers: {}, description: 'Show Shortcuts' },
  GO_DASHBOARD: { key: 'g', then: 'd', description: 'Go to Dashboard' },
  GO_PROJECTS: { key: 'g', then: 'p', description: 'Go to Projects' },
  GO_TASKS: { key: 'g', then: 't', description: 'Go to Tasks' },
  TOGGLE_FULLSCREEN: { key: 'f', modifiers: {}, description: 'Toggle Full Screen' },
  TOGGLE_DARK_MODE: { key: 'd', modifiers: { ctrl: true, shift: true }, description: 'Toggle Dark Mode' },
};

/**
 * Check if a keyboard event matches a shortcut definition
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} shortcut - The shortcut definition
 * @returns {Boolean} - Whether the event matches the shortcut
 */
export const matchesShortcut = (event, shortcut) => {
  // Check if the key matches (case-insensitive)
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }
  
  // Check modifiers
  const eventModifiers = {
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey
  };
  
  // For each modifier in the shortcut, check if it matches the event
  if (shortcut.modifiers) {
    for (const [modifier, required] of Object.entries(shortcut.modifiers)) {
      if (required && !eventModifiers[modifier]) {
        return false; // Required modifier is not pressed
      }
      
      // If the modifier is not required but is pressed, that's also a mismatch
      // But only check this for modifiers explicitly set to false in the shortcut
      if (modifier in shortcut.modifiers && !required && eventModifiers[modifier]) {
        return false;
      }
    }
  } else {
    // If no modifiers are specified in the shortcut, ensure no modifiers are pressed
    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
      return false;
    }
  }
  
  return true;
};

/**
 * Format a shortcut for display
 * @param {Object} shortcut - The shortcut definition
 * @returns {String} - Formatted shortcut for display
 */
export const formatShortcut = (shortcut) => {
  let parts = [];
  
  if (shortcut.modifiers) {
    if (shortcut.modifiers.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers.shift) parts.push('Shift');
    if (shortcut.modifiers.alt) parts.push('Alt');
    if (shortcut.modifiers.meta) parts.push('⌘');
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  if (shortcut.then) {
    return `${parts.join('+')} then ${shortcut.then.toUpperCase()}`;
  }
  
  return parts.join('+');
};

/**
 * Check if the event target is an editable element
 * @param {EventTarget} target - The event target
 * @returns {Boolean} - Whether the target is an editable element
 */
export const isEditableElement = (target) => {
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('.ql-editor') !== null
  );
};

/**
 * Get all shortcuts as an array for display
 * @returns {Array} - Array of shortcut objects with formatted display
 */
export const getShortcutsList = () => {
  return Object.entries(SHORTCUTS).map(([id, shortcut]) => ({
    id,
    description: shortcut.description,
    display: formatShortcut(shortcut)
  }));
};

export default {
  matchesShortcut,
  formatShortcut,
  isEditableElement,
  getShortcutsList
}; 
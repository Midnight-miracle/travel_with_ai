'use strict';

/**
 * Shared DOM/formatting helpers. Loaded on every page before
 * the page-specific script. Exposed as a single global `U`.
 */

const U = {
  /** querySelector shorthand */
  $(sel, root = document) {
    return root.querySelector(sel);
  },

  /** createElement with text/classes shorthand */
  el(tag, { text = '', className = '', attrs = {} } = {}) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  },

  /** Escape user text before injecting into HTML strings */
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  },

  /** Format a number as Indian Rupees, e.g. ₹12,500 */
  formatINR(n) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  },

  /** Read an object from sessionStorage, JSON-parsed */
  sessionGet(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** JSON-serialize an object into sessionStorage */
  sessionSet(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  /** Canonical interest options per the PRD (§7) */
  INTERESTS: [
    'Beaches', 'Nature', 'Adventure', 'History', 'Culture',
    'Food', 'Shopping', 'Nightlife', 'Religious', 'Photography',
  ],

  BUDGETS: ['Budget', 'Moderate', 'Luxury', 'Custom'],
  PREFERENCES: ['Cheapest', 'Fastest', 'Balanced', 'Road Trip'],
};

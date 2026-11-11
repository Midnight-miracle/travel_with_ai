'use strict';

/**
 * Thin wrapper around the backend REST API.
 * Every call goes through here so error handling and base-URL
 * logic stay in one place. Secret-key APIs are never called
 * directly from the browser (TRD §5) — only our Express routes.
 */

const API = {
  async _request(path, options = {}) {
    let res;
    try {
      res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
    } catch {
      throw new Error('Cannot reach the server. Is it running?');
    }

    let body = null;
    try { body = await res.json(); } catch { /* non-JSON error page */ }

    if (!res.ok) {
      const msg = body && body.error && body.error.message
        ? body.error.message
        : `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return body;
  },

  /** GET /api/health — used by the app shell to show API status */
  health() {
    return this._request('/api/health');
  },

  /**
   * POST /api/trips/generate — the core endpoint.
   * Sends the normalized trip request, returns the structured trip
   * (trip, transport, stays, itinerary, budget) from the AI engine.
   */
  generateTrip(request) {
    return this._request('/api/trips/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Destination autocomplete.
   * Phase 3 will proxy this through GET /api/geocode (Nominatim).
   * Until then it returns [] so the planner works offline.
   */
  async suggestDestinations(/* query */) {
    return [];
  },
};

'use strict';

/**
 * Results page: renders the generated trip stored in sessionStorage
 * (key: tripData) by the planner. Falls back to the empty state when
 * opened directly.
 */

(function () {
  const trip = U.sessionGet('tripData');
  const request = U.sessionGet('tripRequest');
  const bannerRoute = U.$('#banner-route');
  const bannerMeta = U.$('#banner-meta');
  const emptyState = U.$('#empty-state');
  const grid = U.$('#results-grid');

  if (!trip || !trip.itinerary) {
    if (emptyState) emptyState.hidden = false;
    if (grid) grid.hidden = true;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  /* ---------- Banner ---------- */
  if (bannerRoute) bannerRoute.textContent = `${trip.trip.request.from} → ${trip.trip.request.to}`;

  if (bannerMeta) {
    bannerMeta.innerHTML = '';
    const r = trip.trip.request;
    const bits = [
      `${r.people} ${r.people === 1 ? 'person' : 'people'}`,
      `${r.days} ${r.days === 1 ? 'day' : 'days'}`,
      r.budget === 'custom' && r.customBudgetAmount
        ? `Custom — up to ${U.formatINR(r.customBudgetAmount)}`
        : `${r.budget.charAt(0).toUpperCase()}${r.budget.slice(1)} budget`,
    ];
    bits.forEach((b) => bannerMeta.appendChild(U.el('span', { className: 'badge', text: b })));
    if (trip.trip.saved) {
      bannerMeta.appendChild(U.el('span', { className: 'badge', text: 'Saved' }));
    }
    if (r.interests && r.interests.length) {
      bannerMeta.appendChild(
        U.el('span', { className: 'badge soon', text: r.interests.join(' · ') })
      );
    }
  }

  const fmt = (n) => (Number.isFinite(n) ? U.formatINR(Math.round(n)) : '—');

  /* ---------- Transport ---------- */
  const transportBox = U.$('#transport-card');
  if (transportBox) {
    transportBox.innerHTML = '';
    const h = U.el('h2', { text: 'Transportation' });
    transportBox.appendChild(h);

    if (!trip.transport.length) {
      transportBox.appendChild(U.el('p', { text: 'No transport options returned.', className: 'muted' }));
    }
    trip.transport.forEach((t) => {
      const card = U.el('div', { className: 'option-card' });
      const head = U.el('div', { className: 'option-head' });
      head.appendChild(U.el('strong', { text: t.label }));
      if (Number.isFinite(t.totalCost)) {
        head.appendChild(U.el('span', { className: 'option-cost', text: fmt(t.totalCost) }));
      }
      card.appendChild(head);
      if (t.mode) card.appendChild(U.el('p', { className: 'muted', text: t.mode }));

      if (Array.isArray(t.steps) && t.steps.length) {
        const route = U.el('div', { className: 'route-steps' });
        t.steps.forEach((s, i) => {
          if (i > 0) route.appendChild(U.el('span', { className: 'route-arrow', text: '↓' }));
          const label = s.via ? `${s.from} → ${s.via} → ${s.to}` : `${s.from} → ${s.to}`;
          route.appendChild(U.el('span', { text: label }));
        });
        card.appendChild(route);
      }
      if (t.notes) card.appendChild(U.el('p', { className: 'option-notes', text: t.notes }));
      transportBox.appendChild(card);
    });
  }

  /* ---------- Accommodation ---------- */
  const stayBox = U.$('#stays-card');
  if (stayBox) {
    stayBox.innerHTML = '';
    stayBox.appendChild(U.el('h2', { text: 'Accommodation' }));
    trip.stays.forEach((s) => {
      const row = U.el('div', { className: 'stay-row' });
      row.appendChild(U.el('strong', { text: s.category }));
      if (Number.isFinite(s.pricePerNight)) {
        row.appendChild(U.el('span', { className: 'option-cost', text: `${fmt(s.pricePerNight)}/night` }));
      }
      if (s.notes) row.appendChild(U.el('p', { className: 'option-notes', text: s.notes }));
      stayBox.appendChild(row);
    });
  }

  /* ---------- Itinerary ---------- */
  const itinBox = U.$('#itinerary-card');
  if (itinBox) {
    itinBox.innerHTML = '';
    itinBox.appendChild(U.el('h2', { text: 'Itinerary' }));

    trip.itinerary.forEach((day) => {
      const wrap = U.el('div', { className: 'itinerary-day' });
      const head = U.el('div', { className: 'day-head' });
      head.appendChild(U.el('span', { className: 'day-tag', text: `Day ${day.day}` }));
      if (day.title) head.appendChild(U.el('h3', { text: day.title }));
      wrap.appendChild(head);

      const ul = U.el('ul', { className: 'timeline' });
      (day.activities || []).forEach((a) => {
        const li = U.el('li');
        if (a.start) {
          li.appendChild(U.el('span', { className: 'time', text: a.end ? `${a.start}–${a.end}` : a.start }));
        }
        li.appendChild(document.createTextNode(a.place));
        if (a.notes) li.appendChild(U.el('span', { className: 'muted', text: ` — ${a.notes}` }));
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
      itinBox.appendChild(wrap);
    });
  }

  /* ---------- Budget ---------- */
  const budgetBox = U.$('#budget-card');
  if (budgetBox) {
    budgetBox.innerHTML = '';
    budgetBox.appendChild(U.el('h2', { text: 'Budget breakdown' }));

    const b = trip.budget || {};
    const rows = [
      ['Transportation', b.transport],
      ['Accommodation', b.accommodation],
      ['Food', b.food],
      ['Local transport', b.localTransport],
      ['Activities', b.activities],
    ];

    const table = U.el('div', { className: 'budget-table' });
    rows.forEach(([label, val]) => {
      if (!Number.isFinite(val)) return;
      const row = U.el('div', { className: 'budget-row' });
      row.appendChild(U.el('span', { text: label }));
      row.appendChild(U.el('span', { className: 'budget-val', text: fmt(val) }));
      table.appendChild(row);
    });

    const total = U.el('div', { className: 'budget-row budget-total' });
    total.appendChild(U.el('span', { text: 'Total' }));
    total.appendChild(U.el('span', { className: 'budget-val', text: fmt(b.total) }));
    table.appendChild(total);

    const people = trip.trip.request.people;
    if (Number.isFinite(b.total) && people > 0) {
      const per = U.el('p', { className: 'budget-per-person', text: `${fmt(b.total / people)} / person` });
      table.appendChild(per);
    }

    budgetBox.appendChild(table);
    budgetBox.appendChild(
      U.el('p', { className: 'budget-note', text: 'Estimates only — not live prices. Engine: ' + trip.trip.engine.model + '.' })
    );
  }
})();

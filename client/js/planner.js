'use strict';

/**
 * Planner page: validates the trip form client-side, keeps a live
 * summary, and on submit stores the normalized request in
 * sessionStorage (key: tripRequest) then navigates to results.html.
 *
 * Phase 4 will instead POST to /api/trips/generate and pass the
 * generated trip to the results page — the shape stored here is
 * already the request body shape from TRD §6, so the switch is small.
 */

(function () {
  const form = U.$('#trip-form');
  if (!form) return;

  const fields = {
    from: U.$('#from'),
    to: U.$('#to'),
    people: U.$('#people'),
    days: U.$('#days'),
    date: U.$('#date'),
    budget: U.$('#budget'),
    customBudget: U.$('#custom-budget'),
    preference: U.$('#preference'),
    stay: U.$('#stay'),
  };

  const errorBoxes = {
    from: U.$('#err-from'),
    to: U.$('#err-to'),
    people: U.$('#err-people'),
    days: U.$('#err-days'),
  };

  const alertBox = U.$('#form-alert');
  const submitBtn = U.$('#submit-btn');
  const summaryBoxes = {
    route: U.$('#sum-route'),
    people: U.$('#sum-people'),
    days: U.$('#sum-days'),
    budget: U.$('#sum-budget'),
    preference: U.$('#sum-preference'),
    interests: U.$('#sum-interests'),
  };

  const selectedInterests = new Set();

  /* ---------- Interest chips ---------- */
  const chipRow = U.$('#interest-chips');
  U.INTERESTS.forEach((name) => {
    const chip = U.el('button', {
      text: name,
      className: 'chip',
      attrs: { type: 'button', 'aria-pressed': 'false', 'data-interest': name },
    });
    chip.addEventListener('click', () => {
      const on = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!on));
      if (on) selectedInterests.delete(name); else selectedInterests.add(name);
      renderSummary();
    });
    chipRow.appendChild(chip);
  });

  /* ---------- Destination autocomplete (UI only in Phase 1) ---------- */
  [fields.from, fields.to].forEach((input) => {
    const wrap = input.closest('.suggest-wrap');
    const list = U.$('.suggest-list', wrap);
    let hideTimer = null;

    input.addEventListener('input', async () => {
      clearTimeout(hideTimer);
      const q = input.value.trim();
      if (q.length < 2) { list.innerHTML = ''; list.hidden = true; return; }

      const suggestions = await API.suggestDestinations(q);
      list.innerHTML = '';
      if (!suggestions.length) { list.hidden = true; return; }

      suggestions.forEach((s) => {
        const li = U.el('li', { attrs: { role: 'option' }, text: s.name });
        if (s.sub) li.appendChild(U.el('span', { className: 'suggest-sub', text: s.sub }));
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = s.name;
          list.hidden = true;
          renderSummary();
        });
        list.appendChild(li);
      });
      list.hidden = false;
    });

    input.addEventListener('blur', () => {
      hideTimer = setTimeout(() => { list.hidden = true; }, 150);
    });
    input.addEventListener('input', renderSummary);
    void wrap; void list;
  });

  /* Summary reacts to every input */
  fields.people.addEventListener('input', renderSummary);
  fields.days.addEventListener('input', renderSummary);
  fields.customBudget.addEventListener('input', renderSummary);
  fields.preference.addEventListener('change', renderSummary);
  fields.stay.addEventListener('change', renderSummary);

  /* ---------- Live summary ---------- */
  function renderSummary() {
    const from = fields.from.value.trim() || '—';
    const to = fields.to.value.trim() || '—';
    summaryBoxes.route.textContent = `${from} → ${to}`;
    summaryBoxes.people.textContent = fields.people.value ? `${fields.people.value} people` : '—';
    summaryBoxes.days.textContent = fields.days.value ? `${fields.days.value} days` : '—';
    summaryBoxes.budget.textContent = currentBudgetLabel();
    summaryBoxes.preference.textContent = fields.preference.value
      ? fields.preference.selectedOptions[0].textContent
      : '—';
    summaryBoxes.interests.textContent =
      selectedInterests.size ? [...selectedInterests].join(', ') : '—';
  }

  function currentBudgetLabel() {
    const b = fields.budget.value;
    if (b === 'custom') {
      const amt = Number(fields.customBudget.value);
      return amt > 0 ? `Custom — up to ${U.formatINR(amt)}` : 'Custom';
    }
    return b ? b.charAt(0).toUpperCase() + b.slice(1) : '—';
  }

  /* Show/hide custom budget amount */
  fields.budget.addEventListener('change', () => {
    const customWrap = U.$('#custom-budget-wrap');
    customWrap.hidden = fields.budget.value !== 'custom';
    renderSummary();
  });

  /* ---------- Validation ---------- */
  function setError(key, message) {
    if (errorBoxes[key]) errorBoxes[key].textContent = message || '';
    fields[key].closest('.form-field').classList.toggle('invalid', Boolean(message));
  }

  function validate() {
    const errors = {};

    if (fields.from.value.trim().length < 2) errors.from = 'Enter your starting city.';
    if (fields.to.value.trim().length < 2) errors.to = 'Enter a destination.';
    if (fields.to.value.trim().toLowerCase() === fields.from.value.trim().toLowerCase() && fields.to.value.trim()) {
      errors.to = 'Destination must differ from origin.';
    }

    const people = Number(fields.people.value);
    if (!Number.isInteger(people) || people < 1 || people > 20) {
      errors.people = 'Between 1 and 20 people.';
    }

    const days = Number(fields.days.value);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      errors.days = 'Between 1 and 30 days.';
    }

    if (fields.budget.value === 'custom') {
      const amt = Number(fields.customBudget.value);
      if (!(amt > 0)) errors.budget = 'Enter a custom budget amount.';
    }

    if (fields.date.value) {
      const d = new Date(fields.date.value + 'T00:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (d < today) errors.date = 'Travel date cannot be in the past.';
    }

    for (const [key, msg] of Object.entries(errors)) {
      setError(key, msg);
    }
    // clear stale errors on fields that now validate
    for (const key of Object.keys(errorBoxes)) {
      if (!errors[key]) setError(key, '');
    }
    return Object.keys(errors).length === 0;
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.hidden = true;

    if (!validate()) {
      alertBox.textContent = 'Please fix the highlighted fields.';
      alertBox.hidden = false;
      return;
    }

    const request = {
      from: fields.from.value.trim(),
      to: fields.to.value.trim(),
      people: Number(fields.people.value),
      days: Number(fields.days.value),
      date: fields.date.value || null,
      budget: fields.budget.value,
      customBudgetAmount:
        fields.budget.value === 'custom' ? Number(fields.customBudget.value) : null,
      preference: fields.preference.value,
      stay: fields.stay.value || null,
      interests: [...selectedInterests].map((i) => i.toLowerCase()),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Planning your trip… (this can take ~30s)';
    form.classList.add('form-card-loading');

    try {
      const trip = await API.generateTrip(request);
      U.sessionSet('tripData', trip);
      U.sessionSet('tripRequest', request);
      location.href = 'results.html';
    } catch (err) {
      alertBox.textContent = err.message || 'Could not generate the trip. Please try again.';
      alertBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate my trip →';
      form.classList.remove('form-card-loading');
    }
  });

  renderSummary();
})();

// src/components/NewTripView.tsx
import { useState } from 'react';
import { HOME_CURRENCIES } from '../lib/constants';
import { saveTrip } from '../lib/storage';
import { todayLocal } from '../lib/helpers';
import type { Trip } from '../lib/types';

export function NewTripView({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (trip: Trip) => void;
}) {
  const today = todayLocal();
  const [tripName, setTripName] = useState('');
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [tripBudget, setTripBudget] = useState('');
  const [tripStartDate, setTripStartDate] = useState(today);

  const daysAgo =
    tripStartDate < today
      ? Math.round(
          (new Date(today + 'T00:00:00').getTime() -
            new Date(tripStartDate + 'T00:00:00').getTime()) /
            86400000,
        )
      : 0;

  const handleCreate = () => {
    const name = tripName.trim();
    if (!name) return;
    const budget = parseFloat(tripBudget);
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: name || 'My Trip',
      homeCurrency,
      dailyBudgetHome: isNaN(budget) || budget <= 0 ? 50 : budget,
      startDate: tripStartDate,
      expenses: [],
    };
    saveTrip(trip);
    onCreated(trip);
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <span className="topbar-title">New Trip</span>
        <div style={{ width: 64 }} />
      </div>
      <div className="page">
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div className="empty-icon">🌍</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a1714', marginTop: 8 }}>
            Plan your adventure
          </div>
          <div style={{ fontSize: 14, color: '#9a9088', marginTop: 4 }}>
            All totals will be shown in your home currency.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group animate-in">
            <label className="input-label">Trip name</label>
            <input
              className="input"
              placeholder="e.g. Southeast Asia 2025"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="input-group animate-in">
            <label className="input-label">Trip start date</label>
            <input
              className="input"
              type="date"
              max={today}
              value={tripStartDate}
              onChange={e => setTripStartDate(e.target.value)}
            />
            {daysAgo > 0 && (
              <div style={{
                fontSize: 12, color: '#c4a87a', marginTop: 6, padding: '8px 12px',
                background: '#fdf8f0', borderRadius: 8, border: '1px solid #f0e4c8',
                display: 'flex', alignItems: 'flex-start', gap: 6,
              }}>
                <span>📅</span>
                <span>
                  Trip started {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago — you'll be able to backfill
                  expenses for each past day when you add expenses.
                </span>
              </div>
            )}
          </div>

          <div className="input-group animate-in">
            <label className="input-label">Daily budget</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={tripBudget}
              onChange={e => setTripBudget(e.target.value)}
            />
          </div>

          <div className="input-group animate-in">
            <label className="input-label">Home currency — all totals shown in this</label>
            <div className="currency-grid">
              {HOME_CURRENCIES.map(c => (
                <button
                  key={c}
                  className={`currency-chip ${homeCurrency === c ? 'active' : ''}`}
                  onClick={() => setHomeCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-full btn-lg animate-in"
            style={{ marginTop: 8 }}
            disabled={!tripName.trim()}
            onClick={handleCreate}
          >
            Create Trip →
          </button>
        </div>
      </div>
    </div>
  );
}
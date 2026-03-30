// src/App.tsx
import { useState, useEffect } from 'react'
import { loadTrips, saveTrip, deleteTrip } from './lib/storage'
import { toUSD } from './lib/currency'
import { getAverageDailySpend, getBenchmark, getTripDays } from './lib/stats'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './lib/constants'
import type { Trip, Expense, Category } from './lib/types';
import './App.css'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

const CATEGORY_ICONS : Record<string, string> = {
  accomodation: '🏨',
  food: '🍜',
  transport: '🚌',
  activities: '🎭',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'THB', 'VND', 'IDR', 'INR', 'MXN', 'BRL', 'AUD', 'CAD'];

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [view, setView] = useState<'trips' | 'detail' | 'add' | 'new-trip'>('trips');
  // Add expense from state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');
  const [country, setCountry] = useState('');
  // New trip form state
  const [tripName, setTripName] = useState('');
  const [tripCurrency, setTripCurrency] = useState('USD');
  const [tripBudget, setTripBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  useEffect(() => { setTrips(loadTrips()); }, []);

  const refresh = () => {
    const fresh = loadTrips();
    setTrips(fresh);
    if (activeTrip) setActiveTrip(fresh.find(t => t.id === activeTrip.id) ?? null);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (!confirm('Delete this trip? This action cannot be undone.')) return;

    deleteTrip(tripId);
    
    const updatedTrips = loadTrips();
    setTrips(updatedTrips);

    if (activeTrip?.id === tripId) {
      setActiveTrip(null);
      setView('trips');
    }
    setDeleteConfirm(null);
  };

  const handleCreateTrip = () => {
    const budget = parseFloat(tripBudget);
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: tripName || 'My Trip',
      currency: tripCurrency,
      dailyBudgetUSD: isNaN(budget) || budget <= 0 ? 50 : budget,
      startDate: new Date().toISOString().split('T')[0],
      expenses: [],
    };
    saveTrip(trip);
    refresh();
    setView('trips');
    setTripName(''); setTripCurrency('USD'); setTripBudget('');
  };

  const handleAddExpense = async () => {
    if (!activeTrip || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    setSaving(true);
    let amountUSD = amountNum
    try {
      amountUSD = await toUSD(amountNum, activeTrip.currency);
    } catch (e) {
      console.error('Error converting currency:', e);
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: amountNum,
      amountUSD,
      category,
      note,
      date: new Date().toISOString().split('T')[0],
      country: country || 'Unknown',
    };
    saveTrip({ ...activeTrip, expenses: [...activeTrip.expenses, expense] });
    refresh();
    setAmount(''); setNote(''); setView('detail');
    setSaving(false);
    setView('detail');
  };

  const totalSpent = (trip: Trip) =>
    trip.expenses.reduce((sum, e) => sum + e.amountUSD, 0).toFixed(2);

  const formatDate = (d: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (d === today) return 'Today';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short'});
  };

  // TRIP LIST VIEW
  if (view === 'trips') return (
    <div className="app-shell">
      <div className="topbar">
        <span className="topbar-title">✈️ TravelLog</span>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}
          onClick={() => setView('new-trip')}>
          + New Trip
        </button>
      </div>
 
      <div className="page">
        {trips.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-icon">🗺️</div>
            <div className="empty-title">Start your journey</div>
            <div className="empty-sub" style={{ marginBottom: 24 }}>
              Create your first trip to start tracking expenses and staying on budget.
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setView('new-trip')}>
              + Create a trip
            </button>
          </div>
        ) : (
          <>
            <div className="section-header">{trips.length} trip{trips.length !== 1 ? 's' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trips.map((trip, i) => {
                const avg = getAverageDailySpend(trip);
                const over = avg > trip.dailyBudgetUSD;
                const pct = Math.min((avg / trip.dailyBudgetUSD) * 100, 100);
                const days = getTripDays(trip);
                const total = totalSpent(trip);
                return (
                  <div key={trip.id}
                    className="card card-press animate-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => { setActiveTrip(trip); setView('detail'); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: '#1a1714' }}>
                          {trip.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#9a9088', marginTop: 2 }}>
                          {days} day{days !== 1 ? 's' : ''} · {trip.currency} · ${trip.dailyBudgetUSD}/day budget
                        </div>
                      </div>
                      <span className={`btn ${over ? 'btn-danger' : 'btn-green'}`}
                        style={{ padding: '5px 10px', fontSize: 12, pointerEvents: 'none', minWidth: 70, textAlign: 'center' }}>
                        ${avg}/day
                      </span>
                    </div>
                    <div className="progress-track" style={{ marginBottom: 8 }}>
                      <div className="progress-fill"
                        style={{ width: `${pct}%`, background: over ? '#ef4444' : '#1a7a4a' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9a9088' }}>
                        ${total} total · {trip.expenses.length} expense{trip.expenses.length !== 1 ? 's' : ''}
                      </span>
                      <button className="btn btn-ghost"
                        style={{ fontSize: 12, color: '#c0392b', padding: '4px 8px' }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(trip.id); }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
 
      {deleteConfirm && (
        <div className="overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                Delete this trip?
              </div>
              <div style={{ fontSize: 14, color: '#9a9088', marginBottom: 24 }}>
                All expenses will be permanently removed. This can't be undone.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-full" style={{ background: '#f0ede7', color: '#6b6460' }}
                  onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-full" style={{ background: '#ef4444', color: '#fff' }}
                  onClick={() => handleDeleteTrip(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // NEW TRIP VIEW
    if (view === 'new-trip') return (
    <div className="app-shell">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={() => setView('trips')}>← Back</button>
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
            Set a budget and start tracking from day one.
          </div>
        </div>
 
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group animate-in">
            <label className="input-label">Trip name</label>
            <input className="input" placeholder="e.g. Southeast Asia 2025"
              value={tripName} onChange={e => setTripName(e.target.value)} />
          </div>
 
          <div className="input-group animate-in">
            <label className="input-label">Daily budget (USD)</label>
            <input className="input" type="number" min="1" placeholder="e.g. 50"
              value={tripBudget} onChange={e => setTripBudget(e.target.value)} />
          </div>
 
          <div className="input-group animate-in">
            <label className="input-label">Home currency</label>
            <div className="currency-grid">
              {CURRENCIES.map(c => (
                <button key={c} className={`currency-chip ${tripCurrency === c ? 'active' : ''}`}
                  onClick={() => setTripCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>
 
          <button
            className="btn btn-primary btn-full btn-lg animate-in"
            style={{ marginTop: 8 }}
            disabled={!tripName.trim()}
            onClick={handleCreateTrip}>
            Create Trip →
          </button>
        </div>
      </div>
    </div>
  );

  // TRIP DETAIL VIEW
 if (view === 'detail' && activeTrip) {
    const avg = getAverageDailySpend(activeTrip);
    const over = avg > activeTrip.dailyBudgetUSD;
    const pct = Math.min((avg / activeTrip.dailyBudgetUSD) * 100, 100);
    const days = getTripDays(activeTrip);
    const total = totalSpent(activeTrip);
 
    const grouped = [...activeTrip.expenses].reverse().reduce<Record<string, Expense[]>>((acc, e) => {
      (acc[e.date] ??= []).push(e);
      return acc;
    }, {});
 
    return (
      <div className="app-shell">
        <div className="topbar">
          <button className="btn btn-ghost" onClick={() => setView('trips')}>← Trips</button>
          <span className="topbar-title" style={{ fontSize: 16 }}>{activeTrip.name}</span>
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => setView('add')}>
            + Add
          </button>
        </div>
 
        <div className="page">
          <div className="trip-hero animate-in" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Total spent</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700 }}>${total}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Days tracked</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700 }}>{days}</div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Daily avg: <strong>${avg}</strong></span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Budget: <strong>${activeTrip.dailyBudgetUSD}</strong></span>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="progress-fill"
                  style={{ width: `${pct}%`, background: over ? '#ff6b6b' : '#4ade80' }} />
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {over
                ? `⚠️ $${(avg - activeTrip.dailyBudgetUSD).toFixed(0)} over budget per day`
                : `✅ $${(activeTrip.dailyBudgetUSD - avg).toFixed(0)} under budget per day`}
            </div>
          </div>
 
          {activeTrip.expenses.length === 0 ? (
            <div className="empty-state animate-in">
              <div className="empty-icon">💸</div>
              <div className="empty-title">No expenses yet</div>
              <div className="empty-sub" style={{ marginBottom: 20 }}>
                Log your first expense to start tracking your spending.
              </div>
              <button className="btn btn-primary" onClick={() => setView('add')}>+ Add expense</button>
            </div>
          ) : (
            <>
              <div className="section-header">
                {activeTrip.expenses.length} expense{activeTrip.expenses.length !== 1 ? 's' : ''}
              </div>
              {Object.entries(grouped).map(([date, exps]) => (
                <div key={date} className="animate-in">
                  <div className="date-badge">{formatDate(date)}</div>
                  <div className="card" style={{ padding: '4px 16px', marginBottom: 10 }}>
                    {exps.map(e => (
                      <div key={e.id} className="expense-row">
                        <div className="expense-icon"
                          style={{ background: CATEGORY_COLORS[e.category] + '22' }}>
                          {CATEGORY_ICONS[e.category]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#2d2a26' }}>
                            {CATEGORY_LABELS[e.category]}
                          </div>
                          {e.note && (
                            <div style={{ fontSize: 12, color: '#9a9088', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {e.note}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#2d2a26' }}>
                            {e.amount} {activeTrip.currency}
                          </div>
                          {activeTrip.currency !== 'USD' && (
                            <div style={{ fontSize: 11, color: '#b0a898' }}>≈ ${e.amountUSD.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ADD EXPENSE VIEW
  if (view === 'add' && activeTrip) {
    const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
    const symbol = currencySymbol[activeTrip.currency] ?? '';
 
    return (
      <div className="app-shell">
        <div className="topbar">
          <button className="btn btn-ghost" onClick={() => setView('detail')}>← Back</button>
          <span className="topbar-title" style={{ fontSize: 16 }}>Add Expense</span>
          <div style={{ width: 64 }} />
        </div>
        <div className="page">
          <div className="card animate-in" style={{ textAlign: 'center', padding: '24px 20px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#9a9088', marginBottom: 8 }}>
              Amount in {activeTrip.currency}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {symbol && (
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: '#c4a87a', fontWeight: 700 }}>
                  {symbol}
                </span>
              )}
              <input
                className="amount-input"
                style={{ width: 180 }}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
 
          <div className="animate-in" style={{ animationDelay: '0.05s', marginBottom: 16 }}>
            <div className="section-header" style={{ margin: '0 0 10px' }}>Category</div>
            <div className="cat-grid">
              {CATEGORIES.map(cat => (
                <button key={cat}
                  className={`cat-btn ${category === cat ? 'active' : ''}`}
                  style={category === cat ? { background: CATEGORY_COLORS[cat] } : {}}
                  onClick={() => setCategory(cat)}>
                  <span className="emoji">{CATEGORY_ICONS[cat]}</span>
                  {CATEGORY_LABELS[cat].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
 
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-in">
            <div className="input-group">
              <label className="input-label">Note (optional)</label>
              <input className="input" placeholder="e.g. Pad Thai at street market"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Country (optional)</label>
              <input className="input" placeholder="e.g. Thailand"
                value={country} onChange={e => setCountry(e.target.value)} />
            </div>
          </div>
 
          <button
            className="btn btn-primary btn-full btn-lg animate-in"
            style={{
              marginTop: 20,
              background: amount && parseFloat(amount) > 0 ? '#2d2a26' : '#c4bdb4',
              cursor: amount && parseFloat(amount) > 0 ? 'pointer' : 'not-allowed',
            }}
            disabled={!amount || parseFloat(amount) <= 0 || saving}
            onClick={handleAddExpense}>
            {saving ? 'Saving…' : `Save ${CATEGORY_ICONS[category]} Expense`}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
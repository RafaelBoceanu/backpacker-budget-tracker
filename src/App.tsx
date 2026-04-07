// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { loadTrips } from './lib/storage';
import { useCountryData } from './lib/countryData';
import type { Trip, Expense } from './lib/types';

import { TripsView }   from './components/TripsView.tsx';
import { NewTripView } from './components/NewTripView';
import { TripDetail }  from './components/TripDetail';
import { ExpenseForm } from './components/ExpenseForm';

import './App.css';

type View = 'trips' | 'new-trip' | 'detail' | 'add' | 'edit-expense';

export default function App() {
  const { countries, loadState } = useCountryData();

  const [trips, setTrips]             = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip]   = useState<Trip | null>(null);
  const [view, setView]               = useState<View>('trips');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => { setTrips(loadTrips()); }, []);

  const refresh = useCallback(() => {
    const fresh = loadTrips();
    setTrips(fresh);
    setActiveTrip(prev => prev ? (fresh.find(t => t.id === prev.id) ?? null) : null);
  }, []);

  const goToTrips = () => {
    setActiveTrip(null);
    setView('trips');
  };

  const goToDetail = (trip?: Trip) => {
    if (trip) setActiveTrip(trip);
    setView('detail');
    setEditingExpense(null);
  };

  // ── Trips list ────────────────────────────────────────────────────────────
  if (view === 'trips') {
    return (
      <TripsView
        trips={trips}
        onSelectTrip={trip => goToDetail(trip)}
        onNewTrip={() => setView('new-trip')}
        onRefresh={refresh}
      />
    );
  }

  // ── New trip ──────────────────────────────────────────────────────────────
  if (view === 'new-trip') {
    return (
      <NewTripView
        onBack={goToTrips}
        onCreated={trip => {
          refresh();
          goToDetail(trip);
        }}
      />
    );
  }

  // ── Trip detail ───────────────────────────────────────────────────────────
  if (view === 'detail' && activeTrip) {
    return (
      <TripDetail
        trip={activeTrip}
        countries={countries}
        onBack={goToTrips}
        onAddExpense={() => setView('add')}
        onEditExpense={expense => {
          setEditingExpense(expense);
          setView('edit-expense');
        }}
      />
    );
  }

  // ── Add expense ───────────────────────────────────────────────────────────
  if (view === 'add' && activeTrip) {
    return (
      <ExpenseForm
        trip={activeTrip}
        countries={countries}
        countriesReady={loadState === 'ready'}
        onBack={() => goToDetail()}
        onSaved={() => { refresh(); goToDetail(); }}
      />
    );
  }

  // ── Edit expense ──────────────────────────────────────────────────────────
  if (view === 'edit-expense' && activeTrip && editingExpense) {
    return (
      <ExpenseForm
        trip={activeTrip}
        countries={countries}
        countriesReady={loadState === 'ready'}
        editingExpense={editingExpense}
        onBack={() => goToDetail()}
        onSaved={() => { refresh(); goToDetail(); }}
      />
    );
  }

  // ── Fallback (shouldn't normally render) ──────────────────────────────────
  return (
    <TripsView
      trips={trips}
      onSelectTrip={trip => { setActiveTrip(trip); setView('detail'); }}
      onNewTrip={() => setView('new-trip')}
      onRefresh={refresh}
    />
  );
}
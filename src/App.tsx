// src/App.tsx
import { useState, useEffect, Children } from 'react'
import { loadTrips, saveTrip, deleteTrip } from './lib/storage'
import { toUSD } from './lib/currency'
import { getAverageDailySpend, getBenchmark, getTripDays } from './lib/stats'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './lib/constants'
import type { Trip, Expense, Category } from './lib/types';
import { parse } from 'date-fns'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

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
  };

  // UI WRAPPER
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='max-w-md mx-auto px-4 py-6 space-y-4'>{children}</div>
    </div>
  );

  // TRIP LIST VIEW
  if (view === 'trips') return (
    <Wrapper>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-extrabold'>My Trips</h1>
        <button onClick={() => setView('new-trip')}
          className='bg-primary hover:bg-blue-700 text-white px-3 py-2 rounded-xl shadow'>
            New Trip
          </button>
      </div>

      {/* {trips.length === 0 && (
        <p className='text-gray-500 text-sm'>No trips yet</p>
      )} */}
      
      {trips.map(trip => {
        const avg = getAverageDailySpend(trip);
        const over = avg > trip.dailyBudgetUSD;
        
        return (
          <div key={trip.id} 
            onClick={() => { setActiveTrip(trip); setView('detail'); }}
            className='bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition cursor-pointer'>
            
            <div className='flex justify-between'>
              <p className='font-semibold'>{trip.name}</p>

              <div className='flex items-center gap-2'>
                <p className={over ? 'text-danger' : 'text-success'}>
                  ${avg}/day
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(trip.id);
                  }}
                  className='text-xs text-danger hover:underline'
                >
                  Delete
                </button>
              </div>
            </div>

            <p className='text-xs text-gray-500 mt-1'>
              {getTripDays(trip)} days • ${trip.dailyBudgetUSD}/day
            </p>
          </div>
          );
        })}
    </Wrapper>
  );

  // NEW TRIP VIEW
  if (view === 'new-trip') return (
    <Wrapper>
      <button onClick={() => setView('trips')} className='text-sm'>Back</button>
      <h2 className='text-xl font-bold'>New Trip</h2>

      <input className='w-full border rounded-xl px-3 py-2'
        placeholder='Trip name' value={tripName} onChange={e => setTripName(e.target.value)} />

      <input className='w-full border rounded-xl px-3 py-2'
        placeholder='Daily budget' value={tripBudget} onChange={e => setTripBudget(e.target.value)} />
      
      <input className='w-full border rounded-xl px-3 py-2'
        placeholder='Currency' value={tripCurrency} onChange={e => setTripCurrency(e.target.value.toUpperCase())} />
      
      <button onClick={handleCreateTrip}
        className='w-full bg-secondary text-white py-2 rounded-xl shadow'>
        Create Trip
      </button>
    </Wrapper>
  );

  // TRIP DETAIL VIEW
  if (view === 'detail' && activeTrip) {
    const avg = getAverageDailySpend(activeTrip);
    const over = avg > activeTrip.dailyBudgetUSD;

    return (
      <Wrapper>
        <div className='flex justify-between'>
          <button onClick={() => setView('trips')}>Back</button>
          <button onClick={() => setView('add')}
            className='bg-primary text-white px-3 py-1.5 rounded-xl'>
              + Expense
            </button>
        </div>

        <h2 className='text-xl font-bold'>{activeTrip.name}</h2>

        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-white p-3 rounded-xl shadow'>
            <p className='text-xs'>Average daily spend</p>
            <p className={over ? 'text-danger text-xl' : 'text-success text-xl'}>
              ${avg}
            </p>
          </div>

          <div className='bg-white p-3 rounded-xl shadow'>
            <p className='text-xs'>Your budget</p>
            <p className='text-xl'>${activeTrip.dailyBudgetUSD}</p>
          </div>
          {/* {benchmark && (
            <div className='bg-gray-50 rounded-xl p-3 col-span-2'>
              <p className='text-xs text-gray-500'>Typical backpacker in this country</p>
              <p className='text-lg font-semibold'>${benchmark}/day</p>
              <p className='text-xs mt-1 text-gray-500'>
                You are spending {avg < benchmark ? `$${(benchmark - avg).toFixed(0)} less` : `$${(avg - benchmark).toFixed(0)} more`} than average
              </p>
            </div>
          )}
        </div>
        <div className='space-y-2 mt-2'>
          {[...activeTrip.expenses].reverse().map(e => (
            <div key={e.id} className='flex justify-between items-center border rounded-lg px-3 py-2'>
              <div className='flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full inline-block'
                  style={{ background: CATEGORY_COLORS[e.category] }} />
                <div>
                  <p className='text-sm font-medium'>{CATEGORY_LABELS[e.category]}</p>
                  {e.note && <p className='text-xs text-gray-500'>{e.note}</p>}
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold'>
                  {e.amount} {activeTrip.currency}
                </p>
                <p className='text-xs text-gray-400'>
                  ≈ ${e.amountUSD.toFixed(2)} USD
                </p>
              </div>
            </div>
          ))} */}
        </div>
      </Wrapper>
    );
  }

  // ADD EXPENSE VIEW
  if (view === 'add' && activeTrip) return (
    <Wrapper>
      <button onClick={() => setView('detail')}>Back</button>
      <h2 className='text-xl font-bold'>Add Expense</h2>

      <input className='w-full border rounded-xl px-3 py-2'
        placeholder='Amount' value={amount} onChange={e => setAmount(e.target.value)} />
      
      <div className='grid grid-cols-3 gap-2'>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`rounded-xl py-2 text-xs font-medium transition ${category === cat ? 'text-white scale-105 shadow' : 'bg-white'}`}
            style={category === cat ? { background: CATEGORY_COLORS[cat] } : {}}>
              {CATEGORY_LABELS[cat]}
            </button>
        ))}
      </div>

      {/* <input className='w-full border rounded px-3 py-2 text-sm'
        placeholder='Country' value={country} onChange={e => setCountry(e.target.value)} />
      <input className='w-full border rounded px-3 py-2 text-sm'
        placeholder='Note (optional)' value={note} onChange={e => setNote(e.target.value)} /> */}
      <button onClick={handleAddExpense}
        className='w-full bg-accent text-white py-2 rounded-xl'>
        Save Expense
      </button>
    </Wrapper>
  );

  return null;
}
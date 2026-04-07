// src/components/TripsView.tsx
import { useState } from 'react';
import type { Trip } from '../lib/types';
import { getAverageDailyHome, getTotalHome, getTripDays } from '../lib/stats';
import { deleteTrip, exportData, importData } from '../lib/storage';
import { fmt } from '../lib/helpers';

export function TripsView({
  trips,
  onSelectTrip,
  onNewTrip,
  onRefresh,
}: {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onNewTrip: () => void;
  onRefresh: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showDataMenu, setShowDataMenu] = useState(false);

  const handleDelete = (tripId: string) => {
    deleteTrip(tripId);
    onRefresh();
    setDeleteConfirm(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importData(file).then(result => {
      if (result.error) {
        setImportStatus(`❌ ${result.error}`);
      } else if (result.imported === 0) {
        setImportStatus('No new trips found (all already imported).');
      } else {
        setImportStatus(`✅ Imported ${result.imported} trip${result.imported !== 1 ? 's' : ''}.`);
        onRefresh();
      }
      setTimeout(() => setImportStatus(null), 4000);
    });
    e.target.value = '';
    setShowDataMenu(false);
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="topbar-title">✈️ Bocora</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 13, padding: '8px 10px' }}
              onClick={() => setShowDataMenu(v => !v)}
            >
              ⋯
            </button>
            {showDataMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                background: '#fff', border: '1px solid #ede9e0', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
                minWidth: 180, overflow: 'hidden',
              }}>
                {trips.length > 0 && (
                  <button
                    className="data-menu-item"
                    onClick={() => { exportData(); setShowDataMenu(false); }}
                  >
                    📤 Export backup
                  </button>
                )}
                <label className="data-menu-item" style={{ cursor: 'pointer' }}>
                  📥 Import backup
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                </label>
              </div>
            )}
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={onNewTrip}
          >
            + New Trip
          </button>
        </div>
      </div>

      <div className="page">
        {importStatus && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13,
            background: importStatus.startsWith('❌') ? '#fff0f0' : '#e8f7f0',
            color: importStatus.startsWith('❌') ? '#c0392b' : '#1a7a4a',
            border: `1px solid ${importStatus.startsWith('❌') ? '#fca5a5' : '#6ee7b7'}`,
          }}>
            {importStatus}
          </div>
        )}

        {trips.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-icon">🗺️</div>
            <div className="empty-title">Start your journey</div>
            <div className="empty-sub" style={{ marginBottom: 24 }}>
              Create your first trip to start tracking expenses in any currency.
            </div>
            <button className="btn btn-primary btn-lg" onClick={onNewTrip}>+ Create a trip</button>
          </div>
        ) : (
          <>
            <div className="section-header">{trips.length} trip{trips.length !== 1 ? 's' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trips.map((trip, i) => {
                const avg = getAverageDailyHome(trip);
                const over = avg > trip.dailyBudgetHome;
                const progress = Math.min((avg / trip.dailyBudgetHome) * 100, 100);
                const days = getTripDays(trip);
                const total = getTotalHome(trip);
                return (
                  <div
                    key={trip.id}
                    className="card card-press animate-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => onSelectTrip(trip)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: '#1a1714' }}>
                          {trip.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#9a9088', marginTop: 2 }}>
                          {days} day{days !== 1 ? 's' : ''} · {trip.homeCurrency} · {fmt(trip.dailyBudgetHome, trip.homeCurrency)}/day
                        </div>
                      </div>
                      <span
                        className={`btn ${over ? 'btn-danger' : 'btn-green'}`}
                        style={{ padding: '5px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap' }}
                      >
                        {fmt(avg, trip.homeCurrency)}/day
                      </span>
                    </div>
                    <div className="progress-track" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${progress}%`, background: over ? '#ef4444' : '#1a7a4a' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9a9088' }}>
                        {fmt(total, trip.homeCurrency)} total · {trip.expenses.length} expense{trip.expenses.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, color: '#c0392b', padding: '4px 8px' }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(trip.id); }}
                      >
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
                All expenses will be permanently removed.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-full" style={{ background: '#f0ede7', color: '#6b6460' }}
                  onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-full" style={{ background: '#ef4444', color: '#fff' }}
                  onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
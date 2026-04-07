// src/components/TripDetail.tsx
import { useState, useMemo } from 'react';
import type { Trip, Expense } from '../lib/types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../lib/constants';
import {
  getAverageDailyHome, getBudgetPace, getDailySpendSeries,
  getSpendByCategory, getSpendByCountry, getRollingAverage,
  getTotalHome, getTripDays,
} from '../lib/stats';
import { fmt, formatDate, todayLocal } from '../lib/helpers';
import { DonutChart, LineChart, DailyBarChart, CategoryBreakdown } from './Charts';
import { getBudgetForCountry } from '../lib/countryData';
import type { CountryInfo } from '../lib/countryData';

export function TripDetail({
  trip,
  countries,
  onBack,
  onAddExpense,
  onEditExpense,
}: {
  trip: Trip;
  countries: CountryInfo[];
  onBack: () => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
}) {
  const [tab, setTab] = useState<'log' | 'trends'>('log');
  const [projectionDays, setProjectionDays] = useState(30);

  const today = todayLocal();
  const avg = getAverageDailyHome(trip);
  const over = avg > trip.dailyBudgetHome;
  const progress = Math.min((avg / trip.dailyBudgetHome) * 100, 100);
  const days = getTripDays(trip);
  const total = getTotalHome(trip);

  const dailySeries      = useMemo(() => getDailySpendSeries(trip), [trip]);
  const catBreakdown     = useMemo(() => getSpendByCategory(trip), [trip]);
  const countryBreakdown = useMemo(() => getSpendByCountry(trip), [trip]);
  const pace             = useMemo(() => getBudgetPace(trip), [trip]);
  const rolling          = useMemo(() => getRollingAverage(trip, 7), [trip]);

  const recentAvg = rolling.slice(-3).reduce((s, r) => s + r.avg, 0) / 3;
  const olderAvg  = rolling.slice(-7, -3).reduce((s, r) => s + r.avg, 0) / 4;
  const acceleration = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const topCat = catBreakdown[0];
  const maxCountryTotal = countryBreakdown[0]?.total ?? 1;

  const grouped = [...trip.expenses].reverse().reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Trips</button>
        <span className="topbar-title" style={{ fontSize: 16 }}>{trip.name}</span>
        <button
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: 13 }}
          onClick={onAddExpense}
        >
          + Add
        </button>
      </div>

      <div className="page">
        {/* Hero */}
        <div className="trip-hero animate-in" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>
                Total spent
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>
                {fmt(total, trip.homeCurrency)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>
                Days tracked
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>
                {days}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.65 }}>
                Avg/day: <strong>{fmt(avg, trip.homeCurrency)}</strong>
              </span>
              <span style={{ fontSize: 12, opacity: 0.65 }}>
                Budget: <strong>{fmt(trip.dailyBudgetHome, trip.homeCurrency)}</strong>
              </span>
            </div>
            <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="progress-fill" style={{ width: `${progress}%`, background: over ? '#ff6b6b' : '#4ade80' }} />
            </div>
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {over
              ? `⚠️ ${fmt(avg - trip.dailyBudgetHome, trip.homeCurrency)} over budget per day`
              : `✅ ${fmt(trip.dailyBudgetHome - avg, trip.homeCurrency)} under budget per day`}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>
            Expense Log
          </button>
          <button className={`tab-btn ${tab === 'trends' ? 'active' : ''}`} onClick={() => setTab('trends')}>
            📊 Trends
          </button>
        </div>

        {/* LOG TAB */}
        {tab === 'log' && (
          trip.expenses.length === 0 ? (
            <div className="empty-state animate-in">
              <div className="empty-icon">💸</div>
              <div className="empty-title">No expenses yet</div>
              <div className="empty-sub" style={{ marginBottom: 20 }}>
                {trip.startDate < today
                  ? `Your trip started ${formatDate(trip.startDate)} — tap + Add to log past expenses by date.`
                  : 'Log your first expense to start tracking.'}
              </div>
              <button className="btn btn-primary" onClick={onAddExpense}>+ Add expense</button>
            </div>
          ) : (
            <>
              <div className="section-header">
                {trip.expenses.length} expense{trip.expenses.length !== 1 ? 's' : ''}
              </div>
              {Object.entries(grouped).map(([date, exps]) => (
                <div key={date} className="animate-in">
                  <div className="date-badge">{formatDate(date)}</div>
                  <div className="card" style={{ padding: '4px 16px', marginBottom: 10 }}>
                    {exps.map(e => (
                      <div
                        key={e.id}
                        className="expense-row"
                        onClick={() => onEditExpense(e)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="expense-icon" style={{ background: CATEGORY_COLORS[e.category] + '22' }}>
                          {CATEGORY_ICONS[e.category]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#2d2a26' }}>
                              {CATEGORY_LABELS[e.category]}
                            </span>
                            {e.country !== 'Unknown' && (
                              <span style={{ fontSize: 11, color: '#9a9088' }}>
                                {countries.find(c => c.name === e.country)?.flag ?? '🌍'} {e.country}
                              </span>
                            )}
                          </div>
                          {e.note && (
                            <div style={{
                              fontSize: 12, color: '#9a9088', marginTop: 1,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {e.note}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2a26' }}>
                              {fmt(e.amountHome, trip.homeCurrency)}
                            </div>
                            {e.currency !== trip.homeCurrency && (
                              <div style={{ fontSize: 11, color: '#b0a898' }}>
                                {e.amount.toFixed(2)} {e.currency}
                              </div>
                            )}
                          </div>
                          <span style={{ color: '#c4bdb4', fontSize: 14 }}>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )
        )}

        {/* TRENDS TAB */}
        {tab === 'trends' && (
          trip.expenses.length < 2 ? (
            <div className="empty-state animate-in">
              <div className="empty-icon">📊</div>
              <div className="empty-title">Not enough data yet</div>
              <div className="empty-sub">Add a few more expenses to see trends and insights.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {Math.abs(acceleration) > 10 && (
                <div className="insight-card animate-in">
                  <span className="insight-icon">{acceleration > 0 ? '📈' : '📉'}</span>
                  <div className="insight-text">
                    {acceleration > 0
                      ? <><strong>Spending up {Math.abs(acceleration).toFixed(0)}%</strong> over the past 3 days vs the week before. Biggest category: <strong>{CATEGORY_LABELS[topCat?.category]}</strong>.</>
                      : <><strong>Spending down {Math.abs(acceleration).toFixed(0)}%</strong> over the past 3 days — nice work!</>}
                  </div>
                </div>
              )}

              <div className="card animate-in">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Cumulative Spend</div>
                <LineChart series={dailySeries} budget={trip.dailyBudgetHome} />
                <div style={{ fontSize: 11, color: '#b0a898', marginTop: 8 }}>
                  Dashed line = budget pace · Blue line = actual spend
                </div>
              </div>

              <div className="card animate-in">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Daily Spend</div>
                <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 12 }}>
                  Last {Math.min(dailySeries.length, 30)} days · green = on budget, red = over
                </div>
                <DailyBarChart series={dailySeries} budget={trip.dailyBudgetHome} currency={trip.homeCurrency} />
              </div>

              {catBreakdown.length > 0 && (
                <div className="card animate-in">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Spend by Category</div>
                  <DonutChart data={catBreakdown} currency={trip.homeCurrency} />
                  <CategoryBreakdown data={catBreakdown} currency={trip.homeCurrency} />
                </div>
              )}

              {/* Budget Pace */}
              <div className="card animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Budget Pace</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, color: '#9a9088' }}>Project:</span>
                    <div style={{ display: 'flex', background: '#f0ede7', borderRadius: 8, overflow: 'hidden' }}>
                      {[7, 14, 30, 60, 90].map(d => (
                        <button
                          key={d}
                          onClick={() => setProjectionDays(d)}
                          style={{
                            padding: '4px 7px', border: 'none', cursor: 'pointer',
                            fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                            background: projectionDays === d ? '#2d2a26' : 'transparent',
                            color: projectionDays === d ? '#fff' : '#9a9088',
                            transition: 'all 0.12s',
                          }}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 10 }}>
                  Based on your current daily average
                </div>

                <div className="pace-row">
                  <span className="pace-label">Daily average</span>
                  <span className={`pace-value ${pace.onTrack ? 'ok' : 'over'}`}>
                    {fmt(pace.avgPerDay, trip.homeCurrency)}
                  </span>
                </div>
                <div className="pace-row">
                  <span className="pace-label">Daily budget</span>
                  <span className="pace-value">{fmt(pace.budget, trip.homeCurrency)}</span>
                </div>
                <div className="pace-row">
                  <span className="pace-label">Surplus / deficit per day</span>
                  <span className={`pace-value ${pace.surplusPerDay >= 0 ? 'ok' : 'over'}`}>
                    {pace.surplusPerDay >= 0 ? '+' : ''}{fmt(pace.surplusPerDay, trip.homeCurrency)}
                  </span>
                </div>

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0ede7' }}>
                  <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 8 }}>
                    {projectionDays}-day projection at current pace
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">Projected cost</span>
                    <span className="pace-value">
                      {fmt(pace.avgPerDay * projectionDays, trip.homeCurrency)}
                    </span>
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">Budget for {projectionDays} days</span>
                    <span className="pace-value">
                      {fmt(pace.budget * projectionDays, trip.homeCurrency)}
                    </span>
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">
                      {pace.avgPerDay > pace.budget ? 'Projected overspend' : 'Projected saving'}
                    </span>
                    <span className={`pace-value ${pace.avgPerDay > pace.budget ? 'over' : 'ok'}`}>
                      {pace.avgPerDay > pace.budget ? '−' : '+'}
                      {fmt(Math.abs(pace.budget - pace.avgPerDay) * projectionDays, trip.homeCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spend by Country */}
              {countryBreakdown.length > 0 && (
                <div className="card animate-in">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Spend by Country</div>
                  <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 14 }}>
                    Backpacker benchmark = typical USD daily spend
                  </div>
                  <table className="country-table">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Avg/day</th>
                        <th>Benchmark</th>
                        <th>vs avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryBreakdown.map(d => {
                        const benchmark = getBudgetForCountry(countries, d.country);
                        const hasData = benchmark !== null;
                        return (
                          <tr key={d.country}>
                            <td>
                              <div className="country-name-cell">
                                <span style={{ fontSize: 18 }}>
                                  {countries.find(c => c.name === d.country)?.flag ?? '🌍'}
                                </span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.country}</div>
                                  <div style={{ fontSize: 11, color: '#9a9088' }}>
                                    {d.days} day{d.days !== 1 ? 's' : ''}
                                  </div>
                                  <div className="country-bar-bg" style={{ width: 56 }}>
                                    <div
                                      className="country-bar-fill"
                                      style={{ width: `${(d.total / maxCountryTotal) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 600, color: d.avgPerDay > trip.dailyBudgetHome ? '#c0392b' : '#1a7a4a' }}>
                              {fmt(d.avgPerDay, trip.homeCurrency)}
                            </td>
                            <td style={{ color: '#6b6460', fontSize: 12 }}>
                              {hasData ? `$${benchmark}/day` : <span style={{ color: '#b0a898' }}>—</span>}
                            </td>
                            <td>
                              {hasData ? (() => {
                                const usdTotal = trip.expenses
                                  .filter(e => e.country === d.country)
                                  .reduce((s, e) => s + e.amountUSD, 0);
                                const avgUSD = usdTotal / d.days;
                                const diff = avgUSD - benchmark!;
                                const pctDiff = Math.round((diff / benchmark!) * 100);
                                const isOver = diff > 0;
                                return (
                                  <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: isOver ? '#c0392b' : '#1a7a4a',
                                    background: isOver ? '#fff0f0' : '#e8f7f0',
                                    padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap',
                                  }}>
                                    {isOver ? '▲' : '▼'} {Math.abs(pctDiff)}%
                                  </span>
                                );
                              })() : <span style={{ color: '#b0a898', fontSize: 12 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 12, fontSize: 11, color: '#b0a898', borderTop: '1px solid #f0ede7', paddingTop: 8 }}>
                    ▲/▼ vs benchmark is based on your USD equivalent spend. Benchmark = typical backpacker budget.
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
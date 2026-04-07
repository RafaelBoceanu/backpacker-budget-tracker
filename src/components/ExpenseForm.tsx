// src/components/ExpenseForm.tsx
import { useState, useEffect, useMemo } from 'react';
import type { Trip, Expense, Category } from '../lib/types'
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/constants';
import { convertCurrency } from '../lib/currency';
import { saveTrip } from '../lib/storage';
import { buildDayList, fmt, todayLocal } from '../lib/helpers';
import { CountryPicker } from './CountryPicker';
import { DayPicker } from './DayPicker';
import type { CountryInfo } from '../lib/countryData';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

const SYM_MAP: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
};

interface Props {
    trip: Trip;
    countries: CountryInfo[];
    countriesReady: boolean;
    editingExpense?: Expense | null;
    onBack: () => void;
    onSaved: () => void;
}

export function ExpenseForm({ trip, countries, countriesReady, editingExpense, onBack, onSaved }: Props) {
    const isEdit = !!editingExpense;
    const today = todayLocal();

    const [amount, setAmount] = useState(editingExpense ? editingExpense.amount.toString() : '');
    const [category, setCategory] = useState<Category>(editingExpense?.category ?? 'food');
    const [note, setNote] = useState(editingExpense?.note ?? '');
    const [country, setCountry] = useState(
        editingExpense && editingExpense.country !== 'Unknown' ? editingExpense.country : '',
    );
    const [flag, setFlag] = useState(() => {
        if (!editingExpense) return '🌍';
        return countries.find(c => c.name === editingExpense.country)?.flag ?? '🌍';
    });
    const [currency, setCurrency] = useState(editingExpense?.currency ?? 'USD');
    const [expenseDate, setExpenseDate] = useState(editingExpense?.date ?? today);
    const [inputInHome, setInputInHome] = useState(false);
    const [saving, setSaving] = useState(false);
    const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [countryError, setCountryError] = useState(false);

    const tripDayList = useMemo(() => buildDayList(trip.startDate), [trip.startDate]);

    const canToggle = country !== '' && currency !== trip.homeCurrency;
    const activeCur = inputInHome ? trip.homeCurrency : currency;
    const activeSym = SYM_MAP[activeCur] ?? (activeCur + ' ');
    useEffect(() => {
        const num = parseFloat(amount);
        if (!amount || num <= 0) { setConvertedPreview(null); return; }
        const fromCur = inputInHome ? trip.homeCurrency : currency;
        const toCur = inputInHome ? currency : trip.homeCurrency;
        if (fromCur === toCur) { setConvertedPreview(null); return; }
        const timer = setTimeout(async () => {
            try {
                const converted = await convertCurrency(num, fromCur, toCur);
                setConvertedPreview(fmt(converted, toCur));
            } catch {
                setConvertedPreview(null);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [amount, currency, trip.homeCurrency, inputInHome]);

    const buildExpense = async (): Promise<Expense> => {
        const amountNum = parseFloat(amount);
        const localAmount = inputInHome
            ? await convertCurrency(amountNum, trip.homeCurrency, currency).catch(() => amountNum)
            : amountNum;
        const [amountHome, amountUSD] = await Promise.all([
            inputInHome
                ? Promise.resolve(amountNum)
                : convertCurrency(localAmount, currency, trip.homeCurrency).catch(() => amountNum),
            convertCurrency(localAmount, currency, 'USD').catch(() => amountNum),
        ]);
        return {
            id: editingExpense?.id ?? crypto.randomUUID(),
            amount: localAmount,
            currency,
            amountHome,
            amountUSD,
            category,
            note,
            date: expenseDate,
            country: country || 'Unknown',
        };
    };

    const handleSave = async () => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) return;

        // Require country selection
        if (!country) {
            setCountryError(true);
            return;
        }

        setSaving(true);
        const expense = await buildExpense();
        if (isEdit && editingExpense) {
            saveTrip({ ...trip, expenses: trip.expenses.map(e => e.id === editingExpense.id ? expense : e) });
        } else {
            saveTrip({ ...trip, expenses: [...trip.expenses, expense] });
        }
        setSaving(false);
        onSaved();
    };

    const handleDelete = () => {
        saveTrip({ ...trip, expenses: trip.expenses.filter(e => e.id !== editingExpense!.id) });
        onSaved();
    };

    const amountNum = parseFloat(amount);
    const canSave = !isNaN(amountNum) && amountNum > 0 && !saving;

    return (
        <div className="app-shell">
            <div className="topbar">
                <button className="btn btn-ghost" onClick={onBack}>← Back</button>
                <span className="topbar-title" style={{ fontSize: 16 }}>
                    {isEdit ? 'Edit Expense' : 'Add Expense'}
                </span>
                {isEdit
                    ? <button
                        className="btn"
                        style={{ color: '#c0392b', background: 'transparent', fontSize: 13, padding: '8px 6px' }}
                        onClick={() => setDeleteConfirm(true)}
                    >
                        🗑 Delete
                    </button>
                    : <div style={{ width: 64 }} />}
            </div>

            <div className="page">
                {/* Date picker */}
                <div style={{ marginBottom: 16 }}>
                    <div className="section-header" style={{ margin: '0 0 8px' }}>Date</div>
                    {tripDayList.length > 1
                        ? <DayPicker days={tripDayList} selected={expenseDate} onChange={setExpenseDate} />
                        : <div style={{ fontSize: 13, color: '#9a9088', padding: '8px 0' }}>{expenseDate}</div>}
                </div>

                {/* Amount */}
                <div className="card animate-in" style={{ textAlign: 'center', padding: '20px 20px 16px', marginBottom: 16 }}>
                    {canToggle && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                            {([false, true] as const).map(inHome => (
                                <button
                                    key={String(inHome)}
                                    onClick={() => { setInputInHome(inHome); setAmount(''); }}
                                    style={{
                                        padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                                        fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                                        background: inputInHome === inHome ? '#2d2a26' : '#f0ede7',
                                        color: inputInHome === inHome ? '#fff' : '#6b6460',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {inHome ? trip.homeCurrency : currency}
                                </button>
                            ))}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 32,
                            color: '#c4a87a', fontWeight: 700, lineHeight: 1,
                        }}>
                            {activeSym}
                        </span>
                        <input
                            className="amount-input"
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus={!isEdit}
                        />
                    </div>
                    {convertedPreview && (
                        <div style={{ fontSize: 13, color: '#9a9088', marginTop: 8 }}>
                            ≈ <strong style={{ color: '#2d2a26' }}>{convertedPreview}</strong>
                        </div>
                    )}
                    {isEdit && editingExpense && (
                        <div style={{ fontSize: 11, color: '#b0a898', marginTop: 6 }}>
                            Originally {fmt(editingExpense.amountHome, trip.homeCurrency)}
                        </div>
                    )}
                </div>

                {/* Country */}
                <div style={{ marginBottom: 16 }}>
                    <div className="section-header" style={{ margin: '0 0 8px' }}>
                        Country & Currency
                        {countryError && (
                            <span style={{ color: '#ef4444', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                                — required
                            </span>
                        )}
                    </div>
                    {!countriesReady
                        ? <div style={{ fontSize: 13, color: '#9a9088', padding: '10px 0' }}>⏳ Loading countries…</div>
                        : <CountryPicker
                            value={country}
                            countries={countries}
                            onChange={(name, cur, fl) => {
                                setCountry(name);
                                setCurrency(cur);
                                setFlag(fl);
                                setInputInHome(false);
                                setAmount('');
                                setCountryError(false);
                            }}
                        />}
                    {country && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#6b6460', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>{flag}</span>
                            <span>
                                {inputInHome
                                    ? <>Entering in <strong>{trip.homeCurrency}</strong> → auto-converted to {currency}</>
                                    : <>Entering in <strong>{currency}</strong> → auto-converted to {trip.homeCurrency}</>}
                            </span>
                        </div>
                    )}
                </div>

                {/* Category */}
                <div style={{ marginBottom: 16 }}>
                    <div className="section-header" style={{ margin: '0 0 8px' }}>Category</div>
                    <div className="cat-grid">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`cat-btn ${category === cat ? 'active' : ''}`}
                                style={category === cat ? { background: CATEGORY_COLORS[cat] } : {}}
                                onClick={() => setCategory(cat)}
                            >
                                <span className="emoji">{CATEGORY_ICONS[cat]}</span>
                                {CATEGORY_LABELS[cat].split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div className="animate-in" style={{ animationDelay: '0.12s' }}>
                    <div className="input-group">
                        <label className="input-label">Note (optional)</label>
                        <input
                            className="input"
                            placeholder="e.g. Pad Thai at street market"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-full btn-lg animate-in"
                    style={{
                        marginTop: 20,
                        background: canSave ? '#2d2a26' : '#c4bdb4',
                        cursor: canSave ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!canSave}
                    onClick={handleSave}
                >
                    {saving
                        ? 'Converting & saving…'
                        : isEdit
                            ? `Save Changes ${CATEGORY_ICONS[category]}`
                            : `Save ${CATEGORY_ICONS[category]} Expense`}
                </button>
            </div>

            {deleteConfirm && (
                <div className="overlay" onClick={() => setDeleteConfirm(false)}>
                    <div className="sheet" onClick={e => e.stopPropagation()}>
                        <div className="sheet-handle" />
                        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                                Delete this expense?
                            </div>
                            <div style={{ fontSize: 14, color: '#9a9088', marginBottom: 24 }}>
                                This cannot be undone.
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-full" style={{ background: '#f0ede7', color: '#6b6460' }}
                                    onClick={() => setDeleteConfirm(false)}>Cancel</button>
                                <button className="btn btn-full" style={{ background: '#ef4444', color: '#fff' }}
                                    onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
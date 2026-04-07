// src/components/CountryPicker.tsx
import { useState, useRef, useEffect } from 'react';

export function CountryPicker({
    value,
    onChange,
    countries,
}: {
    value: string;
    onChange: (name: string, currency: string, flag: string) => void;
    countries: Array<{ name: string; flag: string; currency: string }>;
}) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = countries.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div ref={wrapRef} style={{ position: 'relative', zIndex: 100 }}>
            <input
                className="input"
                placeholder="Search country…"
                value={query}
                autoComplete="off"
                onChange={e => {
                    const lettersOnly = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
                    setQuery(lettersOnly);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
            />
            {open && filtered.length > 0 && (
                <div className="country-dropdown">
                    {filtered.map(c => (
                        <div
                            key={c.name}
                            className="country-option"
                            onMouseDown={e => {
                                e.preventDefault();
                                onChange(c.name, c.currency, c.flag);
                                setQuery(c.name);
                                setOpen(false);
                            }}
                        >
                            <span className="flag">{c.flag}</span>
                            <span>{c.name}</span>
                            <span className="currency-tag">{c.currency}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
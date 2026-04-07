// src/components/DayPicker.tsx
import React, { useRef, useEffect } from 'react';
import { todayLocal } from '../lib/helpers';

export function DayPicker({
    days,
    selected,
    onChange,
}: {
    days: string[];
    selected: string;
    onChange: (d: string) => void;
}) {
    const today = todayLocal();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null;
        el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [selected]);

    const label = (d: string) => {
        if (d === today) return { top: 'Today', bottom: '' };
        const dt = new Date(d + 'T00:00:00');
        return {
            top: dt.toLocaleDateString('en-GB', { weekday: 'short' }),
            bottom: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        };
    };

    return (
        <div
            ref={scrollRef}
            style={{
                display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 8px',
                scrollbarWidth: 'none',
            } as React.CSSProperties}
        >
            {days.map(d => {
                const { top, bottom } = label(d);
                const isSelected = d === selected;
                return (
                    <button 
                        key={d}
                        data-selected={isSelected}
                        onClick={() => onChange(d)}
                        style={{
                            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', minWidth: 56,
                            background: isSelected ? '#2d2a26' : '#f0ede7',
                            color: isSelected ? '#fff' : '#6b6460',
                            transition: 'all 0.15s',
                        }}
                    >
                        <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2}}>{top}</span>
                        {bottom && <span style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.2, marginTop: 2 }}>{bottom}</span>}
                    </button>
                );
            })}
        </div>
    );
}
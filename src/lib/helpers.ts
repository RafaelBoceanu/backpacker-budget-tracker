// src/lib/helpers.ts

export const fmt = (n: number, currency: string): string => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);

export const fmtShort = (n: number, currency: string): string => {
    if (n >= 1000) return `${currency} ${(n / 1000).toFixed(1)}k`;
    return `${currency} ${n.toFixed(0)}`;
};

export function locatDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function todayLocal(): string {
    return locatDateStr(new Date());
}

export function buildDayList(startDate: string): string[] {
    const today = todayLocal();
    const days: string[] = [];
    const cur = new Date(startDate + 'T00:00:00');
    const end = new Date(today + 'T00:00:00');
    if (cur > end) return [today];
    while (cur <= end) {
        days.push(locatDateStr(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return days.reverse();
}

export function formatDate(d: string): string {
    const today = todayLocal();
    if (d === today) return 'Today';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short',  
    });
}

export const pct = (value: number, max: number): number =>
    Math.min(Math.max((value / (max || 1)) * 100, 0), 100);
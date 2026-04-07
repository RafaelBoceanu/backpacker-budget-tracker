// src/lib/storage.ts
import type { Trip } from './types'

const KEY = 'bocora-trips-v1';

export const loadTrips = (): Trip[] => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
};

export const saveTrip = (trip: Trip): void => {
    const trips = loadTrips();
    const idx = trips.findIndex(t => t.id === trip.id);
    if (idx >= 0) trips[idx] = trip;
    else trips.unshift(trip);
    localStorage.setItem(KEY, JSON.stringify(trips));
};

export const deleteTrip = (id: string): void => {
    localStorage.setItem(KEY, JSON.stringify(loadTrips().filter(t => t.id !== id)));
};

export const exportData = (): void => {
    const trips = loadTrips();
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), trips }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bocora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<{ imported: number; error?: string }> => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const raw = JSON.parse(e.target?.result as string);
                const incoming: Trip[] = raw.trips ?? raw;
                if (!Array.isArray(incoming)) {
                    resolve({ imported: 0, error: 'Invalid backup file format.'});
                    return;
                }
                const existing = loadTrips();
                const existingIds = new Set(existing.map(t => t.id));
                let imported = 0;
                for (const trip of incoming) {
                    if (!trip.id || !trip.name || !trip.startDate) continue;
                    if (existingIds.has(trip.id)) continue;
                    existing.unshift(trip);
                    imported++;
                }
                localStorage.setItem(KEY, JSON.stringify(existing));
                resolve({ imported });
            } catch {
                resolve({ imported: 0, error: 'Could not read file. Is it a vaild Bocora backup?' });
            }
        };
        reader.onerror = () => resolve({ imported: 0, error: 'Failed to read file.' });
        reader.readAsText(file);
    });
};
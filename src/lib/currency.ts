// src/lib/currency.ts
const CACHE_KEY = 'bocora-exchange-rates-v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hrs
const FETCH_TIMEOUT_MS = 8000;

type RateCache = { base: string; rates: Record<string, number>; timestamp: number };

async function getRates(base: string): Promise<Record<string, number>> {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed: RateCache = JSON.parse(cached);
            if (parsed.base === base && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
                return parsed.rates;
            }
        }
    } catch {
        // If cache is corrupted or unavailable, ignore and fetch fresh rates
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {

        const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rates: Record<string, number> = data.rates ?? {};

        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ base, rates, timestamp: Date.now() }));
        } catch {
            // localStorage might be full or unavailable, continue without caching
        }

        return rates;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}


export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    try {
        const rates = await getRates(fromCurrency);
        const rate = rates[toCurrency];
        if (!rate) return amount;
        return parseFloat((amount * rate).toFixed(2));
    } catch {
        return amount; // Offline fallback
    }
}

export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    return convertCurrency(amount, fromCurrency, 'USD');
}
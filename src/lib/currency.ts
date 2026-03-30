// src/lib/currency.ts
const CACHE_KEY = 'exchange-rates-cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hrs

type RateCache = { base: string; rates: Record<string, number>; timestamp: number };

async function getRates(base: string): Promise<Record<string, number>> {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const parsed: RateCache = JSON.parse(cached);
        if (parsed.base === base && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            return parsed.rates;
        }
    }
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await res.json();
    const rates: Record<string, number> = data.rates ?? {};
    localStorage.setItem(CACHE_KEY, JSON.stringify({ base, rates, timestamp: Date.now() }));
    return rates;
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
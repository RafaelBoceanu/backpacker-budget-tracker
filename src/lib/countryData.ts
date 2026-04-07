// src/lib/countryData.ts
import { useState, useEffect } from 'react';

export interface CountryInfo {
  name: string;
  flag: string;
  currency: string;
  budget: number | null;
}

function flagFromCca2(cca2: string): string {
  if (!cca2 || cca2.length !== 2) return '🌍';
  const offset = 0x1F1E6 - 'A'.charCodeAt(0);
  return (
    String.fromCodePoint(cca2.charCodeAt(0) + offset) +
    String.fromCodePoint(cca2.charCodeAt(1) + offset)
  );
}

export const BUDGET_BY_COUNTRY: Record<string, number> = {
  // Southeast Asia
  Thailand: 35, Vietnam: 30, Indonesia: 35, Cambodia: 30, Laos: 25,
  Myanmar: 30, Philippines: 35, Malaysia: 45, Singapore: 90,
  // South Asia
  India: 25, Nepal: 25, 'Sri Lanka': 40, Maldives: 150,
  // East Asia
  Japan: 80, 'South Korea': 60, Taiwan: 50, China: 55,
  // Europe — Western
  Portugal: 65, Spain: 70, Italy: 80, Greece: 60, Germany: 75,
  France: 85, Netherlands: 80, Austria: 75, Belgium: 75, Ireland: 90,
  Switzerland: 130, Norway: 120, Sweden: 100, Denmark: 110, Finland: 95,
  Iceland: 140, 'United Kingdom': 90,
  // Europe — Eastern/Balkan
  'Czech Republic': 55, Hungary: 50, Poland: 50, Croatia: 65, Romania: 40,
  Bulgaria: 35, Serbia: 35, Albania: 30, 'North Macedonia': 30,
  Montenegro: 45, 'Bosnia and Herzegovina': 35,
  // Middle East / Caucasus
  Turkey: 40, Israel: 90, Jordan: 55, 'United Arab Emirates': 100,
  Georgia: 35, Armenia: 35, Azerbaijan: 40,
  // Americas
  Mexico: 45, Colombia: 40, Peru: 40, Bolivia: 30, Argentina: 45,
  Brazil: 50, Chile: 55, Ecuador: 35, Paraguay: 30, Uruguay: 55,
  'Costa Rica': 55, Guatemala: 35, Panama: 55, Cuba: 50,
  'Dominican Republic': 60, 'United States': 100, Canada: 95,
  // Africa
  Morocco: 40, Egypt: 30, Tunisia: 35, Algeria: 40, Kenya: 40,
  Tanzania: 45, Ethiopia: 25, Rwanda: 40, Uganda: 35,
  'South Africa': 50, Botswana: 55, Namibia: 50, Zambia: 45,
  Zimbabwe: 40, Mozambique: 35, Ghana: 40, Nigeria: 45, Senegal: 35,
  "Côte d'Ivoire": 40, Liberia: 35, 'Sierra Leone': 30, Cameroon: 40,
  Gabon: 55, Mauritius: 80, Madagascar: 30, Angola: 55,
  // Oceania
  Australia: 90, 'New Zealand': 85, Fiji: 70, Vanuatu: 75,
  Samoa: 65, 'Papua New Guinea': 60, 'Solomon Islands': 55,
};

interface RestCountry {
  name: { common: string };
  cca2: string;
  currencies?: Record<string, { name: string; symbol: string }>;
  independent?: boolean;
  unMember?: boolean;
}

const PREFERRED_CURRENCY: Record<string, string> = {
  Cambodia: 'USD',
  Ecuador:  'USD',
  Panama:   'USD',
  Zimbabwe: 'USD',
  Cuba:     'CUP',
};

let cachedCountries: CountryInfo[] | null = null;

const CCA2_MAP: Record<string, string> = {
  Thailand: 'TH', Vietnam: 'VN', Indonesia: 'ID', Cambodia: 'KH', Laos: 'LA',
  Myanmar: 'MM', Philippines: 'PH', Malaysia: 'MY', Singapore: 'SG',
  India: 'IN', Nepal: 'NP', 'Sri Lanka': 'LK', Maldives: 'MV',
  Japan: 'JP', 'South Korea': 'KR', Taiwan: 'TW', China: 'CN',
  Portugal: 'PT', Spain: 'ES', Italy: 'IT', Greece: 'GR', Germany: 'DE',
  France: 'FR', Netherlands: 'NL', Austria: 'AT', Belgium: 'BE', Ireland: 'IE',
  Switzerland: 'CH', Norway: 'NO', Sweden: 'SE', Denmark: 'DK', Finland: 'FI',
  Iceland: 'IS', 'United Kingdom': 'GB', Czechia: 'CZ', Hungary: 'HU',
  Poland: 'PL', Croatia: 'HR', Romania: 'RO', Bulgaria: 'BG', Serbia: 'RS',
  Albania: 'AL', 'North Macedonia': 'MK', Montenegro: 'ME',
  'Bosnia and Herzegovina': 'BA', Turkey: 'TR', Israel: 'IL', Jordan: 'JO',
  'United Arab Emirates': 'AE', Georgia: 'GE', Armenia: 'AM', Azerbaijan: 'AZ',
  Mexico: 'MX', Colombia: 'CO', Peru: 'PE', Bolivia: 'BO', Argentina: 'AR',
  Brazil: 'BR', Chile: 'CL', Ecuador: 'EC', Paraguay: 'PY', Uruguay: 'UY',
  'Costa Rica': 'CR', Guatemala: 'GT', Panama: 'PA', Cuba: 'CU',
  'Dominican Republic': 'DO', 'United States': 'US', Canada: 'CA',
  Morocco: 'MA', Egypt: 'EG', Tunisia: 'TN', Algeria: 'DZ', Kenya: 'KE',
  Tanzania: 'TZ', Ethiopia: 'ET', Rwanda: 'RW', Uganda: 'UG',
  'South Africa': 'ZA', Botswana: 'BW', Namibia: 'NA', Zambia: 'ZM',
  Zimbabwe: 'ZW', Mozambique: 'MZ', Ghana: 'GH', Nigeria: 'NG',
  Senegal: 'SN', "Côte d'Ivoire": 'CI', Liberia: 'LR', 'Sierra Leone': 'SL',
  Cameroon: 'CM', Gabon: 'GA', Mauritius: 'MU', Madagascar: 'MG',
  Angola: 'AO', Australia: 'AU', 'New Zealand': 'NZ', Fiji: 'FJ',
  Vanuatu: 'VU', Samoa: 'WS', 'Papua New Guinea': 'PG', 'Solomon Islands': 'SB',
};

const CURRENCY_MAP: Record<string, string> = {
  Thailand: 'THB', Vietnam: 'VND', Indonesia: 'IDR', Cambodia: 'USD',
  Laos: 'LAK', Myanmar: 'MMK', Philippines: 'PHP', Malaysia: 'MYR',
  Singapore: 'SGD', India: 'INR', Nepal: 'NPR', 'Sri Lanka': 'LKR',
  Maldives: 'MVR', Japan: 'JPY', 'South Korea': 'KRW', Taiwan: 'TWD',
  China: 'CNY', Portugal: 'EUR', Spain: 'EUR', Italy: 'EUR', Greece: 'EUR',
  Germany: 'EUR', France: 'EUR', Netherlands: 'EUR', Austria: 'EUR',
  Belgium: 'EUR', Ireland: 'EUR', Switzerland: 'CHF', Norway: 'NOK',
  Sweden: 'SEK', Denmark: 'DKK', Finland: 'EUR', Iceland: 'ISK',
  'United Kingdom': 'GBP', Czechia: 'CZK', Hungary: 'HUF', Poland: 'PLN',
  Croatia: 'EUR', Romania: 'RON', Bulgaria: 'BGN', Serbia: 'RSD',
  Albania: 'ALL', 'North Macedonia': 'MKD', Montenegro: 'EUR',
  'Bosnia and Herzegovina': 'BAM', Turkey: 'TRY', Israel: 'ILS',
  Jordan: 'JOD', 'United Arab Emirates': 'AED', Georgia: 'GEL',
  Armenia: 'AMD', Azerbaijan: 'AZN', Mexico: 'MXN', Colombia: 'COP',
  Peru: 'PEN', Bolivia: 'BOB', Argentina: 'ARS', Brazil: 'BRL',
  Chile: 'CLP', Ecuador: 'USD', Paraguay: 'PYG', Uruguay: 'UYU',
  'Costa Rica': 'CRC', Guatemala: 'GTQ', Panama: 'USD', Cuba: 'CUP',
  'Dominican Republic': 'DOP', 'United States': 'USD', Canada: 'CAD',
  Morocco: 'MAD', Egypt: 'EGP', Tunisia: 'TND', Algeria: 'DZD',
  Kenya: 'KES', Tanzania: 'TZS', Ethiopia: 'ETB', Rwanda: 'RWF',
  Uganda: 'UGX', 'South Africa': 'ZAR', Botswana: 'BWP', Namibia: 'NAD',
  Zambia: 'ZMW', Zimbabwe: 'USD', Mozambique: 'MZN', Ghana: 'GHS',
  Nigeria: 'NGN', Senegal: 'XOF', "Côte d'Ivoire": 'XOF', Liberia: 'LRD',
  'Sierra Leone': 'SLL', Cameroon: 'XAF', Gabon: 'XAF', Mauritius: 'MUR',
  Madagascar: 'MGA', Angola: 'AOA', Australia: 'AUD', 'New Zealand': 'NZD',
  Fiji: 'FJD', Vanuatu: 'VUV', Samoa: 'WST', 'Papua New Guinea': 'PGK',
  'Solomon Islands': 'SBD',
};

function buildFallback(): CountryInfo[] {
  return Object.entries(BUDGET_BY_COUNTRY)
    .map(([name, budget]) => ({
      name,
      flag: flagFromCca2(CCA2_MAP[name] ?? ''),
      currency: CURRENCY_MAP[name] ?? 'USD',
      budget,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchCountries(): Promise<CountryInfo[]> {
  if (cachedCountries) return cachedCountries;

  const res = await fetch(
    'https://restcountries.com/v3.1/all?fields=name,cca2,currencies,independent,unMember',
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error(`REST Countries API error: ${res.status}`);
  const raw: RestCountry[] = await res.json();

  const countries: CountryInfo[] = raw
    .filter(c => c.currencies && Object.keys(c.currencies).length > 0)
    .map(c => {
      const name = c.name.common;
      const flag = flagFromCca2(c.cca2);
      const currencyCodes = Object.keys(c.currencies!);
      const currency = PREFERRED_CURRENCY[name] ?? currencyCodes[0];
      const budget = BUDGET_BY_COUNTRY[name] ?? null;
      return { name, flag, currency, budget };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedCountries = countries;
  return countries;
}

export type CountryLoadState = 'loading' | 'ready' | 'error';

export function useCountryData() {
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loadState, setLoadState] = useState<CountryLoadState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries()
      .then(data => {
        setCountries(data);
        setLoadState('ready');
      })
      .catch(err => {
        console.warn('REST Countries API unavailable, using local fallback:', err.message);
        setErrorMsg('Country list loaded from offline data.');
        setCountries(buildFallback());
        setLoadState('ready'); // fallback is ready — not an error state for the UI
      });
  }, []);

  return { countries, loadState, errorMsg };
}

export function getBudgetForCountry(countries: CountryInfo[], name: string): number | null {
  return countries.find(c => c.name === name)?.budget ?? null;
}
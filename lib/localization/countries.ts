/**
 * Countries selectable in profiles. Visibility/eligibility is decided by the
 * jurisdiction engine — listing a country here does NOT make it eligible.
 */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "IL", name: "Illinois" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "NJ", name: "New Jersey" },
  { code: "NY", name: "New York" },
  { code: "OH", name: "Ohio" },
  { code: "PA", name: "Pennsylvania" },
  { code: "TX", name: "Texas" },
  { code: "WA", name: "Washington" },
];

export function countryName(code: string | null): string {
  if (!code) return "Not set";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

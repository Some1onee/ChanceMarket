import "server-only";

import { headers } from "next/headers";

/**
 * GeolocationProvider abstraction. The shipped provider reads trusted
 * proxy/CDN headers server-side (Vercel/Cloudflare). Swap via GEOLOCATION_PROVIDER.
 * The browser's own geolocation is NEVER trusted for eligibility.
 */

export type VisitorLocation = {
  countryCode: string | null;
  subdivisionCode: string | null;
  method: "ip_headers" | "provider" | "declared";
};

export interface GeolocationProvider {
  locate(): Promise<VisitorLocation>;
}

class HeadersGeolocationProvider implements GeolocationProvider {
  async locate(): Promise<VisitorLocation> {
    const headerStore = await headers();
    const country =
      headerStore.get("x-vercel-ip-country") ??
      headerStore.get("cf-ipcountry") ??
      headerStore.get("x-country-code");
    const subdivision =
      headerStore.get("x-vercel-ip-country-region") ?? headerStore.get("x-region-code");

    const normalizedCountry =
      country && /^[A-Z]{2}$/i.test(country) ? country.toUpperCase() : null;
    return {
      countryCode: normalizedCountry,
      subdivisionCode:
        normalizedCountry && subdivision && /^[A-Z0-9-]{1,10}$/i.test(subdivision)
          ? subdivision.toUpperCase()
          : null,
      method: "ip_headers",
    };
  }
}

/** Dev fallback: no CDN headers locally — treat as unknown (deny-by-default),
 * unless CM_DEV_GEO is set (e.g. "GB" or "US-CA") to simulate a location. */
class DevGeolocationProvider implements GeolocationProvider {
  private inner = new HeadersGeolocationProvider();

  async locate(): Promise<VisitorLocation> {
    const fromHeaders = await this.inner.locate();
    if (fromHeaders.countryCode) return fromHeaders;
    const simulated = process.env.CM_DEV_GEO;
    if (simulated) {
      const [country, subdivision] = simulated.split("-");
      return {
        countryCode: country?.toUpperCase() ?? null,
        subdivisionCode: subdivision?.toUpperCase() ?? null,
        method: "provider",
      };
    }
    return fromHeaders;
  }
}

export function getGeolocationProvider(): GeolocationProvider {
  const provider = process.env.GEOLOCATION_PROVIDER ?? "headers";
  if (provider === "headers" && process.env.NODE_ENV !== "production") {
    return new DevGeolocationProvider();
  }
  // Additional providers (MaxMind, ipinfo…) plug in here behind the same interface.
  return new HeadersGeolocationProvider();
}

export async function getVisitorLocation(): Promise<VisitorLocation> {
  return getGeolocationProvider().locate();
}

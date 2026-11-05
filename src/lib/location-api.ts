const API_BASE_URL = "https://countriesnow.space/api/v0.1";

type ApiResponse<T> = {
  error: boolean;
  msg?: string;
  data: T;
};

export interface LocationCountry {
  name: string;
  Iso2: string;
  Iso3: string;
}

async function requestLocationData<T>(
  path: string,
  body?: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let result: ApiResponse<T>;
  try {
    result = await response.json() as ApiResponse<T>;
  } catch {
    throw new Error("The locations service returned an unreadable response.");
  }

  if (!response.ok || result.error) {
    throw new Error(result.msg || "Unable to load location options.");
  }

  return result.data;
}

export function fetchLocationCountries(signal?: AbortSignal) {
  return requestLocationData<LocationCountry[]>("/countries/iso", undefined, signal);
}

export async function fetchLocationStates(country: string, signal?: AbortSignal) {
  const result = await requestLocationData<{ states: Array<{ name: string }> }>(
    "/countries/states",
    { country },
    signal,
  );
  return result.states.map((state) => state.name);
}

export function fetchLocationCities(country: string, state?: string, signal?: AbortSignal) {
  const apiState = country === "Nigeria" && state === "Federal Capital Territory"
    ? "Federal Capital Territory State"
    : state;

  return apiState
    ? requestLocationData<string[]>("/countries/state/cities", { country, state: apiState }, signal)
    : requestLocationData<string[]>("/countries/cities", { country }, signal);
}

import {
  getCitiesOfState,
  getCountries,
  getStatesOfCountry,
  type ICity,
  type ICountry,
  type IState,
} from "@countrystatecity/countries-browser";

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("The location request was cancelled.", "AbortError");
  }
}

export type LocationCountry = Pick<ICountry, "name" | "iso2">;
export type LocationState = Pick<IState, "name" | "iso2">;
export type LocationCity = Pick<ICity, "id" | "name">;

export async function fetchLocationCountries(signal?: AbortSignal): Promise<LocationCountry[]> {
  throwIfAborted(signal);
  const countries = await getCountries();
  throwIfAborted(signal);
  return countries.map(({ name, iso2 }) => ({ name, iso2 }));
}

export async function fetchLocationStates(
  countryCode: string,
  signal?: AbortSignal,
): Promise<LocationState[]> {
  throwIfAborted(signal);
  const states = await getStatesOfCountry(countryCode);
  throwIfAborted(signal);
  return states.map(({ name, iso2 }) => ({ name, iso2 }));
}

export async function fetchLocationCities(
  countryCode: string,
  stateCode: string | null,
  signal?: AbortSignal,
): Promise<LocationCity[]> {
  throwIfAborted(signal);
  const cities = await getCitiesOfState(countryCode, stateCode);
  throwIfAborted(signal);
  return cities.map(({ id, name }) => ({ id, name }));
}

export function getLocationStateLabel(countryCode: string, state: LocationState): string {
  if (countryCode === "NG" && state.iso2 === "FC") return "Federal Capital Territory";
  return state.name;
}

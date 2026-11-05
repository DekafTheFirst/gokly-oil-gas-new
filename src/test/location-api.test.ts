import { describe, expect, it } from "vitest";
import { getLocationStateLabel, type LocationState } from "@/lib/location-api";

describe("location data labels", () => {
  it("uses the familiar Federal Capital Territory label for Nigeria's FCT record", () => {
    const state: LocationState = { name: "Abuja Federal Capital Territory", iso2: "FC" };
    expect(getLocationStateLabel("NG", state)).toBe("Federal Capital Territory");
  });

  it("preserves upstream state names for other states", () => {
    const state: LocationState = { name: "Lagos State", iso2: "LA" };
    expect(getLocationStateLabel("NG", state)).toBe("Lagos State");
  });
});

import { describe, expect, it } from "vitest";
import type { CourseRecord } from "@/lib/courses";
import { filterCourseCatalog, type CourseCatalogFilters } from "@/lib/course-catalog";

const courses: CourseRecord[] = [
  {
    id: 1,
    title: "Offshore Safety Induction",
    code: "HSE-101",
    category: "Safety",
    description: "Core offshore safety procedures",
    tier: "FOUNDATION",
    individual_enrollment_enabled: true,
    created_at: "2026-01-01",
  },
  {
    id: 2,
    title: "Advanced Well Control",
    code: "IWCF-L4",
    category: "Technical",
    description: "Subsea well control simulator training",
    tier: "ADVANCED",
    individual_enrollment_enabled: false,
    created_at: "2026-01-02",
  },
  {
    id: 3,
    title: "First Aid at Sea",
    category: "Safety",
    description: "Medical response and first aid",
    tier: "INTERMEDIATE",
    individual_enrollment_enabled: true,
    created_at: "2026-01-03",
  },
];

const defaults: CourseCatalogFilters = {
  search: "",
  category: "all",
  tier: "all",
  enrollment: "all",
};

describe("filterCourseCatalog", () => {
  it("returns all courses when no filters are selected", () => {
    expect(filterCourseCatalog(courses, defaults)).toEqual(courses);
  });

  it("searches titles, codes, categories, descriptions, and tiers case-insensitively", () => {
    expect(filterCourseCatalog(courses, { ...defaults, search: " iwcf " }).map((course) => course.id)).toEqual([2]);
    expect(filterCourseCatalog(courses, { ...defaults, search: "medical response" }).map((course) => course.id)).toEqual([3]);
    expect(filterCourseCatalog(courses, { ...defaults, search: "foundation" }).map((course) => course.id)).toEqual([1]);
  });

  it("combines category, level, enrollment, and search filters", () => {
    expect(filterCourseCatalog(courses, {
      ...defaults,
      search: "safety",
      category: "Safety",
      tier: "FOUNDATION",
      enrollment: "individual",
    }).map((course) => course.id)).toEqual([1]);
  });

  it("filters organization-only courses separately from individual enrollment", () => {
    expect(filterCourseCatalog(courses, { ...defaults, enrollment: "organization" }).map((course) => course.id)).toEqual([2]);
    expect(filterCourseCatalog(courses, { ...defaults, enrollment: "individual" }).map((course) => course.id)).toEqual([1, 3]);
  });

  it("returns no matches when filters conflict", () => {
    expect(filterCourseCatalog(courses, {
      ...defaults,
      category: "Technical",
      tier: "FOUNDATION",
    })).toEqual([]);
  });
});

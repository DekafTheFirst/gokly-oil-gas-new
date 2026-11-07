import type { CourseRecord } from "./courses";

export type CourseCatalogEnrollmentFilter = "all" | "individual" | "organization";

export interface CourseCatalogFilters {
  search: string;
  category: string;
  tier: string;
  enrollment: CourseCatalogEnrollmentFilter;
}

export function filterCourseCatalog(courses: CourseRecord[], filters: CourseCatalogFilters) {
  const query = filters.search.trim().toLowerCase();

  return courses.filter((course) => {
    const matchesSearch =
      !query ||
      [course.title, course.code, course.category, course.description, course.short_description, course.tier]
        .some((value) => value?.toLowerCase().includes(query));
    const matchesCategory = filters.category === "all" || course.category === filters.category;
    const matchesTier = filters.tier === "all" || course.tier === filters.tier;
    const individuallyAvailable = course.individual_enrollment_enabled !== false;
    const matchesEnrollment =
      filters.enrollment === "all" ||
      (filters.enrollment === "individual" && individuallyAvailable) ||
      (filters.enrollment === "organization" && !individuallyAvailable);

    return matchesSearch && matchesCategory && matchesTier && matchesEnrollment;
  });
}

import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export const fetchCourses = async () => {
  return apiFetch("/courses");
};

export const createCourse = async (course) => {
  const token = getAuthToken();
  return apiFetch("/courses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: course,
  });
};

export const enrollInCourse = async (courseId) => {
  const token = getAuthToken();
  return apiFetch(`/courses/${courseId}/enroll`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

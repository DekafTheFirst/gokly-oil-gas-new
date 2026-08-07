import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface CourseRecord {
  id: number;
  title: string;
  category: string;
  description: string;
  tier: string;
  hours: string;
  image?: string | null;
  created_at: string;
}

export const fetchCourses = async (): Promise<CourseRecord[]> => {
  const data = await apiFetch(`/courses`);
  return data.courses || [];
};

export const createCourse = async (payload: Partial<CourseRecord>): Promise<CourseRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/courses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.course;
};

export const enrollInCourse = async (courseId: number): Promise<void> => {
  const token = getAuthToken();
  await apiFetch(`/courses/${courseId}/enroll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default { fetchCourses, createCourse, enrollInCourse };

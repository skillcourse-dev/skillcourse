import type { Course, ChapterWithMinutes, CourseSummary } from '@skillcourse-dev/shared';

export type { CourseSummary };

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    throw new ApiError(res.status, body, `${res.status} GET ${path}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  async listCourses(): Promise<CourseSummary[]> {
    const result = await get<{ courses: CourseSummary[] }>('/courses');
    return result.courses;
  },

  async getCourse(slug: string): Promise<Course> {
    return get<Course>(`/courses/${encodeURIComponent(slug)}`);
  },

  async getChapter(slug: string, index: number): Promise<ChapterWithMinutes> {
    return get<ChapterWithMinutes>(`/courses/${encodeURIComponent(slug)}/chapters/${index}`);
  },
};

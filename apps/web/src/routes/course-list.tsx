import { Link } from 'react-router';
import { apiClient } from '../lib/api-client.js';
import { useFetch } from '../lib/use-fetch.js';

export function CourseList() {
  const state = useFetch('courses', () => apiClient.listCourses());

  if (state.status === 'loading') {
    return <p className="text-neutral-500">Loading...</p>;
  }
  if (state.status === 'error') {
    return (
      <p className="text-red-600">
        Could not load courses: {state.error.message}
      </p>
    );
  }
  if (state.data.length === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-semibold">No courses yet</h2>
        <p className="mt-4 text-neutral-600">
          Add a course folder under <code className="rounded bg-neutral-100 px-2 py-1 text-sm">./courses/</code> and refresh.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Courses</h1>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.data.map((course) => (
          <li key={course.slug}>
            <Link
              to={`/courses/${course.slug}`}
              className="block rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm"
            >
              <h2 className="text-lg font-medium">{course.title.en}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{course.description.en}</p>
              <p className="mt-3 text-xs text-neutral-500">
                {course.chapterCount} {course.chapterCount === 1 ? 'chapter' : 'chapters'}
                {' · '}
                {course.estimatedMinutes} min
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

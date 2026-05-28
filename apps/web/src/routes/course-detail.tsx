import { Link, useParams } from 'react-router';
import { apiClient, ApiError } from '../lib/api-client.js';
import { useFetch } from '../lib/use-fetch.js';

export function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const state = useFetch(`course:${slug}`, () => apiClient.getCourse(slug ?? ''));

  if (!slug) {
    return <p className="text-red-600">Missing course slug.</p>;
  }
  if (state.status === 'loading') {
    return <p className="text-neutral-500">Loading...</p>;
  }
  if (state.status === 'error') {
    if (state.error instanceof ApiError && state.error.status === 404) {
      return <p className="text-neutral-600">Course not found: {slug}</p>;
    }
    return <p className="text-red-600">Could not load course: {state.error.message}</p>;
  }

  const course = state.data;
  return (
    <article>
      <header className="mb-8">
        <p className="text-sm text-neutral-500">v{course.metadata.version}</p>
        <h1 className="mt-1 text-3xl font-semibold">{course.metadata.title.en}</h1>
        <p className="mt-3 text-neutral-700">{course.metadata.description.en}</p>
        <p className="mt-3 text-xs text-neutral-500">
          {course.chapters.length} {course.chapters.length === 1 ? 'chapter' : 'chapters'}
          {' · '}
          {course.totalEstimatedMinutes} min
        </p>
      </header>

      <section aria-labelledby="chapters-heading" className="mb-12">
        <h2 id="chapters-heading" className="mb-4 text-xl font-semibold">
          Chapters
        </h2>
        <ol className="space-y-2">
          {course.chapters.map((ch) => (
            <li key={ch.index}>
              <Link
                to={`/courses/${course.slug}/chapters/${ch.index}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 transition hover:border-neutral-300"
              >
                <span className="font-medium">
                  <span className="text-neutral-400">{ch.index}.</span> {ch.title}
                </span>
                <span className="text-xs text-neutral-500">{ch.estimatedMinutes} min</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {course.companionSkills.length > 0 && (
        <section aria-labelledby="companion-heading">
          <h2 id="companion-heading" className="mb-4 text-xl font-semibold">
            Companion skills
          </h2>
          <ul className="space-y-2">
            {course.companionSkills.map((s) => (
              <li key={s.slug} className="rounded-md border border-neutral-200 bg-white p-3">
                <a href={s.url} className="font-medium text-blue-600 hover:underline">
                  {s.label}
                </a>
                <pre className="mt-2 overflow-x-auto rounded bg-neutral-100 px-3 py-2 text-sm">
                  {s.installCommand}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

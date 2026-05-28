import { Link, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { apiClient, ApiError } from '../lib/api-client.js';
import { useFetch } from '../lib/use-fetch.js';

export function ChapterView() {
  const { slug, index } = useParams<{ slug: string; index: string }>();
  const indexNum = index !== undefined ? Number(index) : NaN;
  const state = useFetch(`chapter:${slug}:${index}`, () =>
    apiClient.getChapter(slug ?? '', indexNum),
  );

  if (!slug || index === undefined) {
    return <p className="text-red-600">Missing slug or index.</p>;
  }
  if (state.status === 'loading') {
    return <p className="text-neutral-500">Loading...</p>;
  }
  if (state.status === 'error') {
    if (state.error instanceof ApiError) {
      if (state.error.status === 404) {
        return <p className="text-neutral-600">Chapter not found.</p>;
      }
      if (state.error.status === 400) {
        return <p className="text-red-600">Invalid chapter index: {index}</p>;
      }
    }
    return <p className="text-red-600">Could not load chapter: {state.error.message}</p>;
  }

  const chapter = state.data;
  return (
    <article>
      <div className="mb-6">
        <Link to={`/courses/${slug}`} className="text-sm text-blue-600 hover:underline">
          ← Back to course
        </Link>
      </div>
      <header className="mb-8">
        <p className="text-sm text-neutral-500">Chapter {chapter.index}</p>
        <h1 className="mt-1 text-3xl font-semibold">{chapter.title}</h1>
        <p className="mt-2 text-xs text-neutral-500">{chapter.estimatedMinutes} min read</p>
      </header>
      <div className="prose max-w-none prose-pre:bg-neutral-50 prose-pre:border prose-pre:border-neutral-200 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {chapter.body}
        </ReactMarkdown>
      </div>
    </article>
  );
}

import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-semibold">Not found</h1>
      <p className="mt-4 text-neutral-600">The page you were looking for does not exist.</p>
      <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
        Back to courses
      </Link>
    </div>
  );
}

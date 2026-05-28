import { Route, Routes } from 'react-router';
import { Layout } from './routes/layout.tsx';
import { NotFound } from './routes/not-found.tsx';
import { CourseList } from './routes/course-list.tsx';
import { CourseDetail } from './routes/course-detail.tsx';
import { ChapterView } from './routes/chapter-view.tsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<CourseList />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="courses/:slug/chapters/:index" element={<ChapterView />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

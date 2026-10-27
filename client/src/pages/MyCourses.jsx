
import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { fetchMyCourses } from '../api/courses.js';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        const result = await fetchMyCourses();

        if (cancelled) return;

        setCourses(result.courses || []);
        setError('');
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || 'Failed to load courses.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
        <p className="mt-1 text-sm text-slate-500">
          Courses assigned to your teacher account.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading courses…
        </p>
      ) : courses.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map(course => (
            <article
              key={course._id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                  <BookOpen size={18} />
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {course.code}
                </span>
              </div>

              <h3 className="font-bold text-slate-900">{course.name}</h3>

              <p className="mt-1 text-sm text-slate-500">
                {course.department} · {course.semester}
              </p>

              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                {[course.classTime, course.room]
                  .filter(Boolean)
                  .join(' · ') || 'Schedule not set'}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {course.students?.length || 0} enrolled
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <BookOpen className="mx-auto mb-2 text-slate-300" size={24} />
          <p className="text-sm text-slate-600">
            No courses have been assigned to you yet.
          </p>
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { getCourses } from "../services/courseService";
import { normalizeCoursesListResponse } from "../utils/courseApiHelpers";
import {
  createListFetchGuard,
  getListSessionCache,
  invalidateListSession,
  runGuardedListFetch,
} from "./useMasterListQuery";

const SESSION_SCOPE = "courses";
const SESSION_KEY = `${SESSION_SCOPE}:list`;

function getInitialState() {
  const cached = getListSessionCache(SESSION_KEY);
  return {
    courses: Array.isArray(cached) ? cached : (cached?.items ?? []),
    loading: cached == null,
  };
}

export function useCourseManagement() {
  const [courses, setCourses] = useState(() => getInitialState().courses);
  const [loading, setLoading] = useState(() => getInitialState().loading);
  const fetchGuardRef = useRef(null);

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard();
  }
  const fetchGuard = fetchGuardRef.current;

  const fetchCourses = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      await runGuardedListFetch({
        fetchGuard,
        sessionKey: SESSION_KEY,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getCourses({ page: 1, limit: 500 });
          return normalizeCoursesListResponse(data, { page: 1, limit: 500 })
            .items;
        },
        applyData: setCourses,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error);
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, "Failed to load courses"),
          );
          if (!hydratedFromSession) setCourses([]);
        },
      });
    },
    [fetchGuard],
  );

  useEffect(() => {
    let ignore = false;
    fetchCourses({ ignoreFlag: () => ignore });
    return () => {
      ignore = true;
    };
  }, [fetchCourses]);

  const patchCourseLocally = useCallback((id, patch) => {
    setCourses((prev) =>
      prev.map((row) =>
        String(row.id) === String(id) ? { ...row, ...patch } : row,
      ),
    );
  }, []);

  const removeCourseLocally = useCallback((id) => {
    setCourses((prev) => prev.filter((row) => String(row.id) !== String(id)));
  }, []);

  return {
    courses,
    loading,
    refreshCourses: () => {
      invalidateListSession(SESSION_SCOPE);
      return fetchCourses({ bypassCache: true });
    },
    patchCourseLocally,
    removeCourseLocally,
  };
}

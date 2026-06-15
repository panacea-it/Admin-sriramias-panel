import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import { getSubCategories } from "../services/examSubCategoryService";
import {
  mapExamSubCategoryStatusFilterToApi,
  normalizeExamSubCategoriesListResponse,
} from "../utils/examSubCategoryApiHelpers";
import {
  createListFetchGuard,
  getListSessionCache,
  runGuardedListFetch,
} from "./useMasterListQuery";

const SESSION_SCOPE = "exam-sub-categories";

function buildSessionKey(params) {
  return `${SESSION_SCOPE}:${JSON.stringify(params)}`;
}

function getInitialState() {
  const params = {};
  const cached = getListSessionCache(buildSessionKey(params));
  return {
    subCategories:
      cached != null ? normalizeExamSubCategoriesListResponse(cached) : [],
    loading: cached == null,
  };
}

export function useExamSubCategoryManagement() {
  const [subCategories, setSubCategories] = useState(
    () => getInitialState().subCategories,
  );
  const [loading, setLoading] = useState(() => getInitialState().loading);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [centerFilter, setCenterFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search, 400);
  const fetchGuardRef = useRef(null);

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard();
  }
  const fetchGuard = fetchGuardRef.current;

  const fetchSubCategories = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = {};
      const trimmedSearch = debouncedSearch.trim();

      if (trimmedSearch) {
        params.search = trimmedSearch;
      } else {
        const apiStatus = mapExamSubCategoryStatusFilterToApi(statusFilter);
        if (apiStatus) params.status = apiStatus;
        if (centerFilter !== "all") params.center = centerFilter;
      }

      const sessionKey = buildSessionKey(params);

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: () => getSubCategories(params),
        applyData: (data) =>
          setSubCategories(normalizeExamSubCategoriesListResponse(data)),
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error);
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(
              error,
              "Failed to load exam sub-categories",
            ),
          );
          if (!hydratedFromSession) setSubCategories([]);
        },
      });
    },
    [debouncedSearch, statusFilter, centerFilter, fetchGuard],
  );

  useEffect(() => {
    let ignore = false;
    fetchSubCategories({ ignoreFlag: () => ignore });
    return () => {
      ignore = true;
    };
  }, [fetchSubCategories]);

  const patchSubCategoryLocally = useCallback((subCategoryId, patch) => {
    setSubCategories((prev) =>
      prev.map((row) =>
        String(row.id) === String(subCategoryId) ? { ...row, ...patch } : row,
      ),
    );
  }, []);

  const removeSubCategoryLocally = useCallback((subCategoryId) => {
    setSubCategories((prev) =>
      prev.filter((row) => String(row.id) !== String(subCategoryId)),
    );
  }, []);

  return {
    subCategories,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    refreshSubCategories: () => fetchSubCategories({ bypassCache: true }),
    patchSubCategoryLocally,
    removeSubCategoryLocally,
  };
}

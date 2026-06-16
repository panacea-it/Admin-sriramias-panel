import axiosInstance from "./axiosInstance";

/**
 * Strictly fetches live data from the Test Management Dashboard API.
 */
export async function fetchLiveTMData(signal) {
  try {
    // Calling the real endpoint as per your Postman data
    const response = await axiosInstance.post(
      "/test-management/dashboard",
      {},
      { signal },
    );

    // Returning the 'data' object directly
    return response?.data?.data || null;
  } catch (error) {
    console.error("Critical API Error in TM Dashboard:", error);
    throw error; // Let the page handle the error state
  }
}

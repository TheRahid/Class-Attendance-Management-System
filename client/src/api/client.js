const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("rollcall-token");
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_URL}. Make sure the backend is running and VITE_API_URL is correct.`,
    );
  }

  const responseText = await response.text();
  let result = {};
  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    /* Non-JSON responses are usually an old server or an incorrect API route. */
  }
  if (!response.ok) {
    throw new Error(
      result.message ||
        `${options.method || "GET"} ${path} failed (${response.status} ${response.statusText}). Check that the backend is running the current API routes.`,
    );
  }
  return result;
}

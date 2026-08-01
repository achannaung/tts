/**
 * Utility helper to build API headers, automatically including custom Gemini API key if present
 */
export function getApiHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const storedKey = localStorage.getItem('custom_gemini_api_key');
  if (storedKey && storedKey.trim()) {
    headers['x-gemini-api-key'] = storedKey.trim();
  }

  return headers;
}

/**
 * Utility helper to build standard API headers
 */
export function getApiHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
}

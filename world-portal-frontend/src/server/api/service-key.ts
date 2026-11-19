/**
 * The header that proves a call comes from this website's server.
 *
 * The World Portal API closes the routes this server calls on a visitor's
 * behalf (the agency portal, the console's helpers and the console's token
 * request) to everyone but holders of SERVICE_AUTH_KEY, which is the same
 * value as the API's own. It is read from the server environment on each
 * call and must never reach the browser.
 *
 * Read straight from `process.env` rather than `serverEnv()`: that one refuses
 * to run while a console password is unset, and the agency portal must not go
 * down over the admin console's settings. A key shorter than the API's
 * 32-character minimum would be refused anyway, so it isn't sent.
 */
export function serviceKeyHeaders(): Record<string, string> {
  const key = process.env.SERVICE_AUTH_KEY?.trim();
  return key && key.length >= 32 ? { "x-service-key": key } : {};
}

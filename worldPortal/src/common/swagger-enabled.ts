/**
 * Whether to serve the OpenAPI docs at /api/docs. They list every route,
 * including the ones that need no login, so production serves them only
 * when ENABLE_SWAGGER=true.
 */
export function isSwaggerEnabled(env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV !== 'production') return true;
  return env.ENABLE_SWAGGER === 'true';
}

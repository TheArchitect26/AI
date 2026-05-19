const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function getAiBrainBaseUrl() {
  const serverEnv =
    (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } })
      .process?.env ?? {};
  const configured =
    serverEnv.AI_BRAIN_API_URL ||
    serverEnv.AI_BRAIN_API ||
    serverEnv.VITE_AI_BRAIN_API ||
    "http://172.236.24.95:4000";

  return trimTrailingSlash(configured.trim());
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_NEXUS_API_BASE_URL?.trim();
  return configured ? trimTrailingSlash(configured) : "";
}

export function getChatApiPath() {
  return import.meta.env.VITE_NEXUS_CHAT_API_PATH?.trim() || "/api/chat";
}

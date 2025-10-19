let config = null;

export async function loadConfig() {
  const response = await fetch("/config.json");
  if (!response.ok) throw new Error("Failed to load config.json");
  config = await response.json();
  window.APP_CONFIG = config;
  return config;
}

export function getConfig() {
  if (!config) throw new Error("Config not loaded yet!");
  return config;
}

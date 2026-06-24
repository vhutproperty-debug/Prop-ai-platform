export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") result[key] = value;
    else if (Array.isArray(value) && value[0]) result[key] = value[0];
  }
  return result;
}

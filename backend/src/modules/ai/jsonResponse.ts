const findJsonBounds = (value: string) => {
  const firstObject = value.indexOf("{");
  const firstArray = value.indexOf("[");

  const startCandidates = [firstObject, firstArray].filter((index) => index >= 0);
  if (!startCandidates.length) return null;

  const start = Math.min(...startCandidates);
  const open = value[start];
  const close = open === "{" ? "}" : "]";
  const end = value.lastIndexOf(close);

  if (end < start) return null;

  return { start, end };
};

export const parseJsonFromText = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    const bounds = findJsonBounds(value);
    if (!bounds) return null;

    try {
      return JSON.parse(value.slice(bounds.start, bounds.end + 1)) as T;
    } catch {
      return null;
    }
  }
};

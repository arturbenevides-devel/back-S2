export function databaseUrlWithPostgresSchema(
  datasourceUrl: string,
  schemaName: string,
): string {
  try {
    const u = new URL(datasourceUrl);
    u.searchParams.set('schema', schemaName);
    return u.toString();
  } catch {
    const joiner = datasourceUrl.includes('?') ? '&' : '?';
    return `${datasourceUrl}${joiner}schema=${encodeURIComponent(schemaName)}`;
  }
}

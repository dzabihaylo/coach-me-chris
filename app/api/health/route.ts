export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  // Step 1: Can we even parse the URL?
  try {
    new URL(url);
  } catch (e) {
    return Response.json({
      status: "error",
      step: "url-parse",
      error: String(e),
      url: JSON.stringify(url),
      urlLength: url.length,
      urlBytes: Array.from(url).map((c) => c.charCodeAt(0)).slice(0, 50),
    }, { status: 500 });
  }

  // Step 2: Test libsql
  try {
    const { createClient } = await import("@libsql/client/node");
    const client = createClient({ url, authToken: token });
    const result = await client.execute("SELECT count(*) as cnt FROM User");
    return Response.json({
      status: "ok",
      userCount: result.rows[0]?.cnt,
    });
  } catch (e) {
    return Response.json({
      status: "error",
      step: "libsql",
      error: String(e),
      stack: (e as Error).stack?.split("\n").slice(0, 5),
    }, { status: 500 });
  }
}

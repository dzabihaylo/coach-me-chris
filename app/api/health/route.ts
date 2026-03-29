export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  // Step 1: Test raw @libsql/client connection
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({ url, authToken: token });
    const result = await client.execute("SELECT count(*) as cnt FROM User");
    const count = result.rows[0]?.cnt;
    return Response.json({
      status: "ok",
      database: "connected",
      userCount: count,
      urlPrefix: url.substring(0, 30),
    });
  } catch (e) {
    return Response.json(
      {
        status: "error",
        step: "libsql-direct",
        error: String(e),
        urlPrefix: url.substring(0, 30),
        hasToken: token.length > 0,
      },
      { status: 500 }
    );
  }
}

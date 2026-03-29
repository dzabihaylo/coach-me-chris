export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  try {
    // Use explicit node import to avoid web bundle resolution
    const { createClient } = await import("@libsql/client/node");
    const client = createClient({ url, authToken: token });
    const result = await client.execute("SELECT count(*) as cnt FROM User");
    const count = result.rows[0]?.cnt;
    return Response.json({
      status: "ok",
      database: "connected",
      userCount: count,
    });
  } catch (e) {
    return Response.json(
      {
        status: "error",
        error: String(e),
        urlPrefix: url.substring(0, 30),
      },
      { status: 500 }
    );
  }
}

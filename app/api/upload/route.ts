import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(session.user.id, 5, 60_000); // 5 uploads/min
  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: `Unsupported file type: ${file.type}. Accepted: mp3, wav, m4a, mp4, webm, ogg, mov` },
      { status: 400 }
    );
  }

  try {
    const blob = await put(`recordings/${session.user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    return Response.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload]", message);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}

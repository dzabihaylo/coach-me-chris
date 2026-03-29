#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@libsql/client";
import { z } from "zod";

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

const db = createClient({
  url: process.env.DATABASE_URL ?? "file:../prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const server = new McpServer({
  name: "coach-me-chris",
  version: "1.0.0",
});

// ─── Tool: list recent call reviews ─────────────────────────────────────────
server.tool(
  "list_call_reviews",
  "List recent after-action call reviews with Voss dimension scores",
  {
    limit: z.number().min(1).max(50).default(10).describe("Number of reviews to return"),
  },
  async ({ limit }) => {
    const result = await db.execute({
      sql: `SELECT id, title, callDate, overallScore, coachingNotes,
                   tacticalEmpathy, mirroring, labeling, calibratedQuestions,
                   thatsRight, usingNo, accusationAudit, lossFraming,
                   ackermanBargaining, blackSwanDiscovery
            FROM CallReview ORDER BY callDate DESC LIMIT ?`,
      args: [limit],
    });

    const rows = result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.callDate,
      overallScore: r.overallScore,
      notes: r.coachingNotes,
      scores: {
        tacticalEmpathy: r.tacticalEmpathy,
        mirroring: r.mirroring,
        labeling: r.labeling,
        calibratedQuestions: r.calibratedQuestions,
        thatsRight: r.thatsRight,
        usingNo: r.usingNo,
        accusationAudit: r.accusationAudit,
        lossFraming: r.lossFraming,
        ackermanBargaining: r.ackermanBargaining,
        blackSwanDiscovery: r.blackSwanDiscovery,
      },
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    };
  }
);

// ─── Tool: get full call review with feedback ────────────────────────────────
server.tool(
  "get_call_review",
  "Get the full after-action review for a specific call, including detailed feedback and transcript",
  {
    id: z.string().describe("The call review ID"),
  },
  async ({ id }) => {
    const result = await db.execute({
      sql: `SELECT * FROM CallReview WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return { content: [{ type: "text", text: "Review not found" }] };
    }

    const row = result.rows[0];
    const feedback = row.feedbackJson ? JSON.parse(row.feedbackJson as string) : null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: row.id,
              title: row.title,
              date: row.callDate,
              overallScore: row.overallScore,
              summary: feedback?.executiveSummary,
              topOpportunity: feedback?.topOpportunity,
              highlights: feedback?.highlights,
              dimensionDetails: feedback?.dimensionDetails,
              transcript: row.transcriptText,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ─── Tool: get coaching trends / progress ─────────────────────────────────────
server.tool(
  "get_coaching_progress",
  "Get overall coaching progress — averages, trends, weakest dimensions, and practice session history",
  {},
  async () => {
    const reviewsResult = await db.execute({
      sql: `SELECT callDate, overallScore, tacticalEmpathy, mirroring, labeling,
                   calibratedQuestions, thatsRight, usingNo, accusationAudit,
                   lossFraming, ackermanBargaining, blackSwanDiscovery
            FROM CallReview ORDER BY callDate ASC`,
      args: [],
    });

    const practiceResult = await db.execute({
      sql: `SELECT drillType, score, rounds, createdAt FROM PracticeSession ORDER BY createdAt DESC LIMIT 20`,
      args: [],
    });

    const reviews = reviewsResult.rows;
    const avg = (key: string) =>
      reviews.length === 0
        ? 0
        : reviews.reduce((s, r) => s + ((r[key] as number) || 0), 0) / reviews.length;

    const dimensionAverages = {
      tacticalEmpathy: avg("tacticalEmpathy"),
      mirroring: avg("mirroring"),
      labeling: avg("labeling"),
      calibratedQuestions: avg("calibratedQuestions"),
      thatsRight: avg("thatsRight"),
      usingNo: avg("usingNo"),
      accusationAudit: avg("accusationAudit"),
      lossFraming: avg("lossFraming"),
      ackermanBargaining: avg("ackermanBargaining"),
      blackSwanDiscovery: avg("blackSwanDiscovery"),
    };

    const sorted = Object.entries(dimensionAverages).sort(([, a], [, b]) => a - b);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              totalCalls: reviews.length,
              avgOverallScore:
                reviews.length === 0
                  ? 0
                  : reviews.reduce((s, r) => s + ((r.overallScore as number) || 0), 0) /
                    reviews.length,
              dimensionAverages,
              weakestDimensions: sorted.slice(0, 3).map(([k, v]) => ({ dimension: k, score: v })),
              strongestDimensions: sorted.slice(-3).reverse().map(([k, v]) => ({ dimension: k, score: v })),
              recentCallHistory: reviews.slice(-5).map((r) => ({
                date: r.callDate,
                overallScore: r.overallScore,
              })),
              recentPracticeSessions: practiceResult.rows,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ─── Tool: list recent live coaching sessions ────────────────────────────────
server.tool(
  "list_live_sessions",
  "List recent live coaching sessions with the nudges that were surfaced",
  {
    limit: z.number().min(1).max(20).default(5).describe("Number of sessions to return"),
  },
  async ({ limit }) => {
    const result = await db.execute({
      sql: `SELECT id, startedAt, endedAt, nudgesJson, transcriptSnippets
            FROM LiveSession ORDER BY startedAt DESC LIMIT ?`,
      args: [limit],
    });

    const rows = result.rows.map((r) => ({
      id: r.id,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      nudges: safeJsonParse(r.nudgesJson as string, []),
      transcript: safeJsonParse(r.transcriptSnippets as string, []),
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    };
  }
);

// ─── Tool: manage whitelist ──────────────────────────────────────────────────
server.tool(
  "manage_whitelist",
  "List, add, or remove emails from the Coach Me Chris access whitelist",
  {
    action: z.enum(["list", "add", "remove"]).describe("Action to perform"),
    email: z.string().optional().describe("Email address (required for add/remove)"),
    role: z.enum(["user", "admin"]).default("user").optional().describe("Role for new entry (add only)"),
  },
  async ({ action, email, role }) => {
    if (action === "list") {
      const result = await db.execute({
        sql: `SELECT id, email, role, createdAt, addedBy FROM AllowedEmail ORDER BY createdAt DESC`,
        args: [],
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
      };
    }

    if (!email) {
      return { content: [{ type: "text", text: "Error: email is required for add/remove" }] };
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (action === "add") {
      const existing = await db.execute({
        sql: `SELECT id FROM AllowedEmail WHERE email = ?`,
        args: [normalizedEmail],
      });
      if (existing.rows.length > 0) {
        return { content: [{ type: "text", text: `${normalizedEmail} is already whitelisted` }] };
      }
      const id = `mcp-${Date.now()}`;
      await db.execute({
        sql: `INSERT INTO AllowedEmail (id, email, role, addedBy) VALUES (?, ?, ?, ?)`,
        args: [id, normalizedEmail, role ?? "user", "mcp-server"],
      });
      return {
        content: [{ type: "text", text: `Added ${normalizedEmail} as ${role ?? "user"}` }],
      };
    }

    if (action === "remove") {
      await db.execute({
        sql: `DELETE FROM AllowedEmail WHERE email = ?`,
        args: [normalizedEmail],
      });
      return {
        content: [{ type: "text", text: `Removed ${normalizedEmail} from whitelist` }],
      };
    }

    return { content: [{ type: "text", text: "Unknown action" }] };
  }
);

// ─── Tool: sync Granola meetings ─────────────────────────────────────────────
server.tool(
  "sync_granola_meetings",
  "Cache Granola meeting metadata into Coach Me Chris so they appear in the web UI meeting picker. Call this with meeting data fetched from the Granola MCP tools. Can also store the transcript if provided.",
  {
    meetings: z
      .array(
        z.object({
          id: z.string().describe("Granola meeting UUID"),
          title: z.string(),
          date: z.string().describe("ISO date string"),
          participants: z.array(z.string()).optional().describe("Participant names or emails"),
          durationMinutes: z.number().optional(),
          transcript: z.string().optional().describe("Full meeting transcript if available"),
        })
      )
      .describe("Array of Granola meetings to sync"),
  },
  async ({ meetings }) => {
    let synced = 0;
    let updated = 0;
    for (const m of meetings) {
      const existing = await db.execute({
        sql: `SELECT id, transcript FROM GranolaMeeting WHERE id = ?`,
        args: [m.id],
      });
      if (existing.rows.length > 0) {
        // Update if we now have a transcript and didn't before
        if (m.transcript && !existing.rows[0].transcript) {
          await db.execute({
            sql: `UPDATE GranolaMeeting SET transcript = ?, syncedAt = datetime('now') WHERE id = ?`,
            args: [m.transcript, m.id],
          });
          updated++;
        }
        continue;
      }
      await db.execute({
        sql: `INSERT INTO GranolaMeeting (id, title, date, participants, durationMinutes, transcript)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          m.id,
          m.title,
          m.date,
          JSON.stringify(m.participants ?? []),
          m.durationMinutes ?? null,
          m.transcript ?? null,
        ],
      });
      synced++;
    }
    return {
      content: [
        {
          type: "text",
          text: `Synced ${synced} new meeting(s), updated ${updated} transcript(s). Total in request: ${meetings.length}.`,
        },
      ],
    };
  }
);

// ─── Tool: import Granola meeting for analysis ───────────────────────────────
server.tool(
  "import_granola_for_review",
  "Import a Granola meeting transcript and create an after-action review in Coach Me Chris. The transcript will be analyzed by Claude for Voss dimension scoring. Provide the meeting data from the Granola MCP tools.",
  {
    granola_id: z.string().describe("Granola meeting UUID"),
    title: z.string().describe("Meeting title"),
    date: z.string().describe("ISO date string"),
    transcript: z.string().min(50).describe("Full meeting transcript"),
    participants: z.array(z.string()).optional(),
    durationMinutes: z.number().optional(),
  },
  async ({ granola_id, title, date, transcript, participants, durationMinutes }) => {
    // Cache the meeting
    const existing = await db.execute({
      sql: `SELECT id FROM GranolaMeeting WHERE id = ?`,
      args: [granola_id],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO GranolaMeeting (id, title, date, participants, durationMinutes, transcript)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          granola_id,
          title,
          date,
          JSON.stringify(participants ?? []),
          durationMinutes ?? null,
          transcript,
        ],
      });
    } else {
      await db.execute({
        sql: `UPDATE GranolaMeeting SET transcript = ?, syncedAt = datetime('now') WHERE id = ?`,
        args: [transcript, granola_id],
      });
    }

    return {
      content: [
        {
          type: "text",
          text: `Meeting "${title}" cached with transcript (${transcript.length} chars). To complete the review, open Coach Me Chris → After-Action Review → Import from Granola, and select this meeting. Or create the review via the /api/review endpoint with granolaId: "${granola_id}".`,
        },
      ],
    };
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

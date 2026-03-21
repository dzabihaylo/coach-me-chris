#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@libsql/client";
import { z } from "zod";
const db = createClient({
    url: process.env.DATABASE_URL ?? "file:../prisma/dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
});
const server = new McpServer({
    name: "coach-me-chris",
    version: "1.0.0",
});
// ─── Tool: list recent call reviews ─────────────────────────────────────────
server.tool("list_call_reviews", "List recent after-action call reviews with Voss dimension scores", {
    limit: z.number().min(1).max(50).default(10).describe("Number of reviews to return"),
}, async ({ limit }) => {
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
});
// ─── Tool: get full call review with feedback ────────────────────────────────
server.tool("get_call_review", "Get the full after-action review for a specific call, including detailed feedback and transcript", {
    id: z.string().describe("The call review ID"),
}, async ({ id }) => {
    const result = await db.execute({
        sql: `SELECT * FROM CallReview WHERE id = ?`,
        args: [id],
    });
    if (result.rows.length === 0) {
        return { content: [{ type: "text", text: "Review not found" }] };
    }
    const row = result.rows[0];
    const feedback = row.feedbackJson ? JSON.parse(row.feedbackJson) : null;
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    id: row.id,
                    title: row.title,
                    date: row.callDate,
                    overallScore: row.overallScore,
                    summary: feedback?.executiveSummary,
                    topOpportunity: feedback?.topOpportunity,
                    highlights: feedback?.highlights,
                    dimensionDetails: feedback?.dimensionDetails,
                    transcript: row.transcriptText,
                }, null, 2),
            },
        ],
    };
});
// ─── Tool: get coaching trends / progress ─────────────────────────────────────
server.tool("get_coaching_progress", "Get overall coaching progress — averages, trends, weakest dimensions, and practice session history", {}, async () => {
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
    const avg = (key) => reviews.length === 0
        ? 0
        : reviews.reduce((s, r) => s + (r[key] || 0), 0) / reviews.length;
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
                text: JSON.stringify({
                    totalCalls: reviews.length,
                    avgOverallScore: reviews.length === 0
                        ? 0
                        : reviews.reduce((s, r) => s + (r.overallScore || 0), 0) /
                            reviews.length,
                    dimensionAverages,
                    weakestDimensions: sorted.slice(0, 3).map(([k, v]) => ({ dimension: k, score: v })),
                    strongestDimensions: sorted.slice(-3).reverse().map(([k, v]) => ({ dimension: k, score: v })),
                    recentCallHistory: reviews.slice(-5).map((r) => ({
                        date: r.callDate,
                        overallScore: r.overallScore,
                    })),
                    recentPracticeSessions: practiceResult.rows,
                }, null, 2),
            },
        ],
    };
});
// ─── Tool: list recent live coaching sessions ────────────────────────────────
server.tool("list_live_sessions", "List recent live coaching sessions with the nudges that were surfaced", {
    limit: z.number().min(1).max(20).default(5).describe("Number of sessions to return"),
}, async ({ limit }) => {
    const result = await db.execute({
        sql: `SELECT id, startedAt, endedAt, nudgesJson, transcriptSnippets
            FROM LiveSession ORDER BY startedAt DESC LIMIT ?`,
        args: [limit],
    });
    const rows = result.rows.map((r) => ({
        id: r.id,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        nudges: r.nudgesJson ? JSON.parse(r.nudgesJson) : [],
        transcript: r.transcriptSnippets ? JSON.parse(r.transcriptSnippets) : [],
    }));
    return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    };
});
// ─── Start ───────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

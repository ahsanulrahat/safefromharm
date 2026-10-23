import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Lightweight readiness probe used by uptime checks after deployment. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

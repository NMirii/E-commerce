import { NextRequest, NextResponse } from "next/server";
import { getLogBuffer, clearLogBuffer, logger } from "@/lib/logger";
import { getCircuitsStatus, resetCircuit, tripCircuit } from "@/lib/resilient-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const memory = process.memoryUsage();
    const formattedMemory = {
      rss: Math.round(memory.rss / 1024 / 1024) + " MB",
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + " MB",
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + " MB",
      external: Math.round(memory.external / 1024 / 1024) + " MB",
    };

    return NextResponse.json({
      logs: getLogBuffer(),
      circuits: getCircuitsStatus(),
      memory: formattedMemory,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case "clear_logs":
        clearLogBuffer();
        logger.info("Server-side log buffer cleared.");
        return NextResponse.json({ success: true });

      case "reset_circuit":
        if (payload?.service) {
          resetCircuit(payload.service);
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Service name required" }, { status: 400 });

      case "trip_circuit":
        if (payload?.service) {
          tripCircuit(payload.service);
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Service name required" }, { status: 400 });

      case "trigger_server_error":
        logger.fatal("Simulated Critical Server Action Failure triggered.", {
          origin: "Reliability Dashboard",
          userId: "admin_user_01",
          errorCode: "DB_CONN_TIMEOUT",
        });
        throw new Error("SimulatedDatabaseError: Connection pool exhausted (simulated error).");

      case "trigger_payment_timeout":
        logger.warn("Simulated payment processor connection failure started.");
        throw new Error("StripeGatewayError: Request timeout after 5000ms (simulated error).");

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

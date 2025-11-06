import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SECURITY_NOTIFICATION_CONFIG } from "@/lib/security-notifications";

/**
 * Get security notification configuration
 * GET /api/admin/security/notifications
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      config: {
        adminEmail: SECURITY_NOTIFICATION_CONFIG.ADMIN_EMAIL,
        spikeThreshold: SECURITY_NOTIFICATION_CONFIG.SPIKE_THRESHOLD,
        spikeTimeWindow: SECURITY_NOTIFICATION_CONFIG.SPIKE_TIME_WINDOW / (60 * 1000), // in minutes
        lockoutDedupeWindow: SECURITY_NOTIFICATION_CONFIG.LOCKOUT_DEDUPE_WINDOW / (60 * 1000), // in minutes
        deviceDedupeWindow: SECURITY_NOTIFICATION_CONFIG.DEVICE_DEDUPE_WINDOW / (60 * 60 * 1000), // in hours
      },
    });
  } catch (error) {
    console.error("Error fetching notification config:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

/**
 * Update security notification configuration
 * POST /api/admin/security/notifications
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { adminEmail, spikeThreshold } = body;

    // Update configuration (in production, save to database)
    if (adminEmail) {
      SECURITY_NOTIFICATION_CONFIG.ADMIN_EMAIL = adminEmail;
    }
    
    if (spikeThreshold && spikeThreshold > 0) {
      SECURITY_NOTIFICATION_CONFIG.SPIKE_THRESHOLD = spikeThreshold;
    }

    return NextResponse.json({
      success: true,
      message: "Configuration updated",
      config: {
        adminEmail: SECURITY_NOTIFICATION_CONFIG.ADMIN_EMAIL,
        spikeThreshold: SECURITY_NOTIFICATION_CONFIG.SPIKE_THRESHOLD,
      },
    });
  } catch (error) {
    console.error("Error updating notification config:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}

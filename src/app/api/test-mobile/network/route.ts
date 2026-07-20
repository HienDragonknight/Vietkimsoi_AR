import os from "os";
import { NextResponse } from "next/server";

/** Returns LAN IPv4 addresses so the desktop test page can build mobile URLs. */
export async function GET() {
  const ips: string[] = [];

  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  const port = process.env.PORT ?? "3000";

  return NextResponse.json({
    ips: [...new Set(ips)],
    port,
    protocol: "https",
  });
}

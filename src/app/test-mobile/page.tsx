"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { needsCameraUserGesture } from "@/lib/device";

type NetworkInfo = {
  ips: string[];
  port: string;
  protocol: string;
};

type DeviceInfo = {
  userAgent: string;
  platform: string;
  viewport: string;
  pointer: string;
  needsCameraTap: boolean;
  secureContext: boolean;
  mediaDevices: boolean;
};

function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(data)}`;
}

export default function TestMobilePage() {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "testing" | "ok" | "error"
  >("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/test-mobile/network")
      .then((res) => res.json())
      .then((data: NetworkInfo) => setNetwork(data))
      .catch(() => setNetwork({ ips: [], port: "3000", protocol: "https" }));

    setDevice({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      pointer: window.matchMedia("(pointer: coarse)").matches
        ? "coarse (touch)"
        : "fine (mouse)",
      needsCameraTap: needsCameraUserGesture(),
      secureContext: window.isSecureContext,
      mediaDevices: !!navigator.mediaDevices?.getUserMedia,
    });
  }, []);

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "";

  const mobileUrls = useMemo(() => {
    if (!network) return [];
    const paths = ["/", "/test-mobile"];
    const bases =
      network.ips.length > 0
        ? network.ips.map(
            (ip) => `${network.protocol}://${ip}:${network.port}`
          )
        : [currentUrl].filter(Boolean);

    return bases.flatMap((base) =>
      paths.map((path) => ({ label: path, url: `${base}${path}` }))
    );
  }, [network, currentUrl]);

  const testCamera = async () => {
    setCameraStatus("testing");
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus("ok");
    } catch (e) {
      setCameraStatus("error");
      setCameraError(
        e instanceof Error ? e.message : "Không thể truy cập camera."
      );
    }
  };

  return (
    <main className="safe-top safe-bottom min-h-[100dvh] bg-[#0a0a0a] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">
            Dev · Mobile test
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Test mobile AR
          </h1>
          <p className="text-[14px] leading-relaxed text-white/60">
            Ouvrez cette page sur téléphone (même Wi‑Fi) ou scannez le QR code
            ci-dessous. La caméra AR nécessite HTTPS.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <h2 className="mb-3 text-[13px] font-semibold text-white/90">
            Accès rapide
          </h2>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-xl bg-white px-4 py-3 text-center text-[14px] font-medium text-black transition hover:bg-white/90"
            >
              Lancer le scan AR
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-white/15 px-4 py-3 text-center text-[14px] text-white/80 transition hover:bg-white/5"
            >
              Admin
            </Link>
          </div>
        </section>

        {mobileUrls.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h2 className="mb-3 text-[13px] font-semibold text-white/90">
              QR codes (réseau local)
            </h2>
            <p className="mb-4 text-[12px] text-white/50">
              Lancez{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">
                npm run dev:https
              </code>{" "}
              sur le PC, puis scannez avec le téléphone.
            </p>
            <div className="flex flex-col gap-5">
              {mobileUrls.map(({ label, url }) => (
                <div
                  key={url}
                  className="flex flex-col items-center gap-3 rounded-xl border border-white/8 bg-black/40 p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl(url)}
                    alt={`QR ${label}`}
                    width={220}
                    height={220}
                    className="rounded-lg bg-white"
                  />
                  <div className="w-full text-center">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-400/90">
                      {label}
                    </p>
                    <a
                      href={url}
                      className="mt-1 block break-all text-[12px] text-sky-300 underline-offset-2 hover:underline"
                    >
                      {url}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {network && network.ips.length === 0 && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-[13px] text-amber-100/90">
            Aucune IP LAN détectée. Sur mobile, ouvrez directement{" "}
            <span className="font-medium">{currentUrl || "cette URL"}</span>.
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <h2 className="mb-3 text-[13px] font-semibold text-white/90">
            Test caméra
          </h2>
          <button
            type="button"
            onClick={testCamera}
            disabled={cameraStatus === "testing"}
            className="w-full rounded-xl border border-white/15 px-4 py-3 text-[14px] font-medium transition hover:bg-white/5 disabled:opacity-50"
          >
            {cameraStatus === "testing"
              ? "Test en cours..."
              : "Tester l'accès caméra"}
          </button>
          {cameraStatus === "ok" && (
            <p className="mt-3 text-[13px] text-emerald-400">
              Caméra OK — prêt pour l&apos;AR.
            </p>
          )}
          {cameraStatus === "error" && (
            <p className="mt-3 text-[13px] text-rose-400">{cameraError}</p>
          )}
        </section>

        {device && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h2 className="mb-3 text-[13px] font-semibold text-white/90">
              Infos appareil
            </h2>
            <dl className="space-y-2 text-[12px]">
              {[
                ["URL actuelle", currentUrl],
                ["Viewport", device.viewport],
                ["Pointeur", device.pointer],
                [
                  "Gesture caméra requis",
                  device.needsCameraTap ? "Oui (mobile)" : "Non (desktop)",
                ],
                [
                  "Contexte sécurisé (HTTPS)",
                  device.secureContext ? "Oui" : "Non — caméra bloquée",
                ],
                [
                  "getUserMedia",
                  device.mediaDevices ? "Disponible" : "Indisponible",
                ],
                ["Platform", device.platform],
                ["User-Agent", device.userAgent],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-0.5 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="text-white/45">{key}</dt>
                  <dd className="break-all text-white/80">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}

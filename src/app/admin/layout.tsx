import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · AR Scan",
  description: "Quản lý marker, video và compile targets.mind",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-white antialiased">
      {children}
    </div>
  );
}

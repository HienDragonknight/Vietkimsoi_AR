import type { Metadata } from "next";
import { getArVideoContent } from "@/config";
import { ArVideoView } from "./ArVideoView";

interface ArVideoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ArVideoPageProps): Promise<Metadata> {
  const { id } = await params;
  const content = getArVideoContent(id);
  return { title: content.title };
}

export default async function ArVideoPage({ params }: ArVideoPageProps) {
  const { id } = await params;
  const content = getArVideoContent(id);

  return <ArVideoView content={content} />;
}

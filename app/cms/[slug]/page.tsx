import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export const instant = false;

export default async function CmsArticlePage({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.cmsContent.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-[#061B42] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/cms" className="font-bold">E-SERVICE HUB <span className="text-[#F4BD32]">NEWS</span></Link>
          <Link href="/" className="text-sm">← Home</Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/cms" className="text-sm font-bold text-[#9A7414]">← All updates</Link>
        <h1 className="mt-5 text-4xl font-bold text-[#061B42]">{item.title}</h1>
        {item.publishedAt && <p className="mt-3 text-sm text-slate-500">{item.publishedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>}
        {item.excerpt && <p className="mt-7 text-xl leading-8 text-slate-600">{item.excerpt}</p>}
        <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-700">{item.body}</div>
      </article>
    </main>
  );
}

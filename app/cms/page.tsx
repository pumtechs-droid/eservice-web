import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function CmsIndexPage() {
  const content = await prisma.cmsContent.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="bg-[#061B42] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-bold">E-SERVICE HUB <span className="text-[#F4BD32]">&amp; DIGITAL CYBER</span></Link>
          <Link href="/" className="text-sm">← Home</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-12">
        <p className="text-sm font-bold tracking-widest text-[#9A7414]">NEWS &amp; UPDATES</p>
        <h1 className="mt-2 text-4xl font-bold text-[#061B42]">Latest from E-SERVICE HUB</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {content.map((item) => (
            <Link key={item.id} href={`/cms/${item.slug}`} className="rounded-xl border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <h2 className="text-xl font-bold text-[#061B42]">{item.title}</h2>
              {item.excerpt && <p className="mt-3 text-sm text-slate-600">{item.excerpt}</p>}
              {item.publishedAt && <p className="mt-5 text-xs font-bold text-slate-400">{item.publishedAt.toLocaleDateString("en-GB")}</p>}
            </Link>
          ))}
          {content.length === 0 && <p className="rounded-xl border bg-white p-8 text-slate-600">No published content yet.</p>}
        </div>
      </section>
    </main>
  );
}

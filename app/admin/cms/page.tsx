"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type CmsItem = { id: string; title: string; slug: string; excerpt: string | null; body: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; updatedAt: string };

export default function AdminCmsPage() {
  const [items, setItems] = useState<CmsItem[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/cms", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setItems(result.content);
  }
  useEffect(() => {
    fetch("/api/admin/cms", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.content) setItems(result.content);
      });
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, excerpt, body, status }),
    });
    const result = await response.json();
    if (!response.ok) { setMessage(result.message || "Unable to save content."); return; }
    setTitle(""); setSlug(""); setExcerpt(""); setBody(""); setStatus("DRAFT");
    setMessage("Content saved successfully.");
    await load();
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between"><div><Link href="/admin/dashboard" className="text-sm text-slate-500">← Dashboard</Link><h1 className="mt-2 text-3xl font-bold text-[#061B42]">Content Management</h1></div></div>
        {message && <p role="status" className="mt-5 rounded-lg border bg-white px-4 py-3 text-sm">{message}</p>}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={create} className="rounded-xl border bg-white p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#061B42]">Create Content</h2>
            <label className="block text-sm font-semibold">Title<input className="mt-1 w-full rounded-lg border px-3 py-3" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
            <label className="block text-sm font-semibold">URL slug<input className="mt-1 w-full rounded-lg border px-3 py-3" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))} required /></label>
            <label className="block text-sm font-semibold">Excerpt<textarea className="mt-1 w-full rounded-lg border px-3 py-3" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} /></label>
            <label className="block text-sm font-semibold">Body<textarea rows={10} className="mt-1 w-full rounded-lg border px-3 py-3" value={body} onChange={(event) => setBody(event.target.value)} required /></label>
            <label className="block text-sm font-semibold">Status<select className="mt-1 w-full rounded-lg border px-3 py-3" value={status} onChange={(event) => setStatus(event.target.value)}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
            <button className="rounded-lg bg-[#061B42] px-5 py-3 font-bold text-white">Save Content</button>
          </form>
          <section className="space-y-3">
            {items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-5"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-slate-500">/cms/{item.slug}</p><h2 className="mt-1 text-lg font-bold text-[#061B42]">{item.title}</h2></div><span className="text-xs font-bold">{item.status}</span></div></article>)}
          </section>
        </div>
      </div>
    </main>
  );
}

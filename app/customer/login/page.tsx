"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/customer/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to continue.");
      router.push("/customer/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <Link href="/" className="text-sm font-bold text-[#061B42]">← E-SERVICE HUB</Link>
        <h1 className="mt-8 text-3xl font-bold text-[#061B42]">Customer Portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access your requests, quotations and payment status.
        </p>
        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button type="button" onClick={() => setMode("login")} className={`rounded-md py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-[#061B42] shadow" : "text-slate-500"}`}>Sign In</button>
          <button type="button" onClick={() => setMode("register")} className={`rounded-md py-2 text-sm font-semibold ${mode === "register" ? "bg-white text-[#061B42] shadow" : "text-slate-500"}`}>Create Account</button>
        </div>
        {message && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <>
              <label className="block text-sm font-semibold">Full name<input className="mt-1 w-full rounded-lg border px-3 py-3" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
              <label className="block text-sm font-semibold">Phone<input className="mt-1 w-full rounded-lg border px-3 py-3" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
            </>
          )}
          <label className="block text-sm font-semibold">Email<input type="email" className="mt-1 w-full rounded-lg border px-3 py-3" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="block text-sm font-semibold">Password<input type="password" minLength={10} className="mt-1 w-full rounded-lg border px-3 py-3" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button disabled={loading} className="w-full rounded-lg bg-[#061B42] px-5 py-3 font-bold text-white disabled:opacity-60">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </section>
    </main>
  );
}

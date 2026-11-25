"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type RequestOption = { id: string; reference: string; service: string; status: string };

export default function CustomerPaymentsPage() {
  const [requests, setRequests] = useState<RequestOption[]>([]);
  const [requestId, setRequestId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customer/requests", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setRequests(result.requests);
          if (result.requests[0]) setRequestId(result.requests[0].id);
        } else if (result.message) setMessage(result.message);
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const endpoint = method === "MPESA" ? "/api/payments/mpesa/initiate" : "/api/payments/manual";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount,
          phone,
          method,
          transactionReference: reference,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to process payment.");
      setMessage(result.message || "Payment submitted for verification.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to process payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10">
      <section className="mx-auto max-w-xl rounded-2xl border bg-white p-7 shadow-lg">
        <Link href="/customer/dashboard" className="text-sm text-slate-500">← Customer dashboard</Link>
        <h1 className="mt-4 text-3xl font-bold text-[#061B42]">Make a Payment</h1>
        {message && <p role="status" className="mt-5 rounded-lg border px-4 py-3 text-sm">{message}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Service request<select className="mt-1 w-full rounded-lg border px-3 py-3" value={requestId} onChange={(event) => setRequestId(event.target.value)} required>{requests.map((item) => <option key={item.id} value={item.id}>{item.reference} — {item.service}</option>)}</select></label>
          <label className="block text-sm font-semibold">Payment method<select className="mt-1 w-full rounded-lg border px-3 py-3" value={method} onChange={(event) => setMethod(event.target.value)}><option value="BANK_TRANSFER">Bank transfer</option><option value="MPESA">M-Pesa STK Push</option></select></label>
          <label className="block text-sm font-semibold">Amount (KES)<input type="number" min="1" step="0.01" className="mt-1 w-full rounded-lg border px-3 py-3" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
          {method === "MPESA" && <label className="block text-sm font-semibold">M-Pesa phone<input className="mt-1 w-full rounded-lg border px-3 py-3" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="254..." required /></label>}
          {method === "BANK_TRANSFER" && <label className="block text-sm font-semibold">Bank or transaction reference<input className="mt-1 w-full rounded-lg border px-3 py-3" value={reference} onChange={(event) => setReference(event.target.value)} /></label>}
          <button disabled={loading} className="w-full rounded-lg bg-[#061B42] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? "Processing..." : "Continue"}</button>
        </form>
      </section>
    </main>
  );
}


"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#061B42] px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#F4BD32]/30 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#F4BD32] bg-[#061B42]">
          <span className="text-4xl font-bold text-[#F4BD32]">
            E
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[#061B42]">
          You are Offline
        </h1>

        <p className="mt-4 text-sm leading-7 text-gray-600">
          It looks like your internet connection is unavailable.
          Please reconnect to continue accessing E-SERVICE HUB
          & DIGITAL CYBER services.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-7 w-full rounded-lg bg-[#061B42] px-5 py-3 font-semibold text-white transition hover:bg-[#0B2A60]"
        >
          Try Again
        </button>

        <p className="mt-6 text-xs font-medium tracking-wide text-[#9A7414]">
          QCE — Quality. Commitment. Excellence.
        </p>
      </section>
    </main>
  );
}

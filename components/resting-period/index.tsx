"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  diffDays,
  formatDateID,
  getTodayWIB,
  isRoastDate,
  milestoneStatus,
  type MilestoneStatus,
} from "./date";

const MILESTONES = [3, 7, 14, 21] as const;

function statusLabel(status: MilestoneStatus): string {
  if (status.kind === "today") return "Today";
  if (status.kind === "future") return `In ${status.days} day${status.days > 1 ? "s" : ""}`;
  return `${status.days} day${status.days > 1 ? "s" : ""} ago`;
}

function statusClass(status: MilestoneStatus): string {
  if (status.kind === "today") return "bg-foreground text-background";
  if (status.kind === "future") return "bg-white/10 text-foreground";
  return "bg-white/5 text-white/40";
}

export function RestingPeriod() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roastParam = searchParams.get("roast");
  const roast = roastParam && isRoastDate(roastParam) ? roastParam : null;

  const [copied, setCopied] = useState(false);
  const [clipboardFailed, setClipboardFailed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [today] = useState(() => getTodayWIB(new Date()));
  const dayCount = roast ? diffDays(roast, today) : null;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  function handleRoastChange(value: string) {
    if (!value) {
      router.replace("/resting-period/", { scroll: false });
      return;
    }
    router.replace(`/resting-period/?roast=${value}`, { scroll: false });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setClipboardFailed(false);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setClipboardFailed(true);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl tablet:text-3xl font-semibold text-foreground">
          Resting Period
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Track how long your coffee has been resting since roast day.
        </p>
      </header>

      <section className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="roast-date"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Roast date
          </label>
          <input
            id="roast-date"
            type="date"
            value={roast ?? ""}
            max="2100-12-31"
            onChange={(e) => handleRoastChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground [color-scheme:dark] focus:border-foreground focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!roast}
          aria-live="polite"
          className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </section>

      {clipboardFailed && (
        <div className="mb-8" aria-live="polite">
          <label
            htmlFor="copy-manually"
            className="mb-2 block text-sm text-white/60"
          >
            Copy manually
          </label>
          <input
            id="copy-manually"
            type="text"
            readOnly
            value={typeof window !== "undefined" ? window.location.href : ""}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"
          />
        </div>
      )}

      {!roast ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
          Enter your roast date above to see the resting milestones.
        </p>
      ) : (
        <>
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            {dayCount !== null && dayCount < 0 ? (
              <>
                <p className="text-sm uppercase tracking-wide text-white/40">
                  Not roasted yet
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  Roast on {formatDateID(roast)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm uppercase tracking-wide text-white/40">
                  {dayCount === 0 ? "Today is roast day" : `Today is day ${dayCount} since roast`}
                </p>
                <p className="mt-2 text-5xl font-bold text-foreground">
                  {dayCount === 0 ? "Roast day" : `${dayCount} days`}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Roasted on {formatDateID(roast)}
                </p>
              </>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {MILESTONES.map((day) => {
              const date = addDays(roast, day);
              const status = milestoneStatus(date, today);
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center justify-between gap-x-2 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm text-white/60">Day {day}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}
                  >
                    {statusLabel(status)}
                  </span>
                  <p className="mt-1 w-full text-lg font-semibold text-foreground">
                    {formatDateID(date)}
                  </p>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

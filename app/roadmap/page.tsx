"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import confetti from "canvas-confetti";
import {
  BadgeCheck,
  ChevronDown,
  ClipboardCopy,
  Lock,
  Moon,
  Rocket,
  Sparkles,
  Sun,
  Target,
  Timeline,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoadmapDay = {
  id: number;
  title: string;
  focus: string;
  outcome: string;
  tasks: string[];
  highlight: string;
};

const ROADMAP_DAYS: RoadmapDay[] = [
  {
    id: 1,
    title: "Foundations & Equality Charter",
    focus:
      "Define the neutral, evidence-first ethos and the public build scope.",
    outcome: "A clear charter and public milestone framing.",
    tasks: [
      "Write the Equality Charter and badge neutrality pledge.",
      "Draft the Passport promise and claims taxonomy.",
      "Set the 7-day public build commitments.",
      "Publish the first build log entry.",
    ],
    highlight: "Every contribution is valued by impact, not origin.",
  },
  {
    id: 2,
    title: "Roadmap UX & Narrative",
    focus: "Create the dashboard narrative and day-by-day checkpoints.",
    outcome: "A polished roadmap UI with visible momentum.",
    tasks: [
      "Design the day card layout and timeline views.",
      "Define the launch pad call-to-actions.",
      "Add copy buttons for public sharing.",
      "Review visual hierarchy for clarity.",
    ],
    highlight: "Show the work, show the proof, keep it human.",
  },
  {
    id: 3,
    title: "Passport Schema",
    focus: "Map the data model for authenticity signals and proof.",
    outcome: "Genesis-ready schema definitions and badge rules.",
    tasks: [
      "Define badge tiers and evidence requirements.",
      "Outline verification checkpoints and review flow.",
      "Document trust signals and claim resolution rules.",
      "Draft the Passport JSON structure.",
    ],
    highlight: "Evidence > origin. Signals > labels.",
  },
  {
    id: 4,
    title: "Proof & Verification Flow",
    focus: "Design proof capture, validation, and audit trace.",
    outcome: "Clear verification UX and audit trail spec.",
    tasks: [
      "Create the proof capture checklist.",
      "Sketch the audit trail and hash anchors.",
      "Define reviewer actions and approval gates.",
      "Publish a sample verification walkthrough.",
    ],
    highlight: "Transparency is the trust engine.",
  },
  {
    id: 5,
    title: "Public Build Ops",
    focus: "Operationalize the public build and social distribution.",
    outcome: "Repeatable public build cadence.",
    tasks: [
      "Finalize README and social templates.",
      "Prepare daily update cadence checklist.",
      "Publish the day 5 build log.",
      "Validate Genesis unlock criteria.",
    ],
    highlight: "Consistency turns momentum into proof.",
  },
  {
    id: 6,
    title: "Genesis Passport",
    focus: "Unlock the Genesis Passport and mint the first demo state.",
    outcome: "Genesis Passport ready for launch.",
    tasks: [
      "Compile the Genesis Passport dossier.",
      "Run the final verification sweep.",
      "Document the Genesis criteria and usage.",
      "Prepare launch artifacts.",
    ],
    highlight: "Genesis unlocks credibility for every future passport.",
  },
  {
    id: 7,
    title: "Launch & Retrospective",
    focus: "Publish, share, and capture lessons learned.",
    outcome: "Live demo with transparent retrospective.",
    tasks: [
      "Ship the launch announcement.",
      "Publish the 7-day retrospective.",
      "List next steps and open issues.",
      "Open the community feedback window.",
    ],
    highlight: "Ship, reflect, iterate — in public.",
  },
];

const PROGRESS_KEY = "forgeid-roadmap-progress";
const THEME_KEY = "forgeid-theme";
const STORAGE_EVENT = "forgeid-storage";

const README_COPY = `# ForgeID Passport Demo

A neutral human-AI authenticity passport tool. All badges are equal. The value of this work is determined solely by its quality, impact, and results — not by the human/AI ratio. Built in public over 7 days.`;

const X_COPY =
  "ForgeID Passport Demo: a neutral human–AI authenticity passport. Badges are equal, proof is what matters. Building in public over 7 days. #buildinpublic #authenticity #ai";

const LINKEDIN_COPY =
  "Announcing the ForgeID Passport Demo — a neutral authenticity passport for human + AI collaboration. Every badge is judged by quality and evidence, not by who (or what) produced it. Building in public over 7 days with daily logs.";

const normalizeProgress = (stored: Record<string, boolean[]> | null) => {
  const next: Record<string, boolean[]> = {};
  ROADMAP_DAYS.forEach((day) => {
    const dayKey = String(day.id);
    const existing = stored?.[dayKey] ?? [];
    next[dayKey] = day.tasks.map((_, index) => Boolean(existing[index]));
  });
  return next;
};

const useLocalStorageState = <T,>({
  key,
  fallback,
  parse,
  serialize,
}: {
  key: string;
  fallback: () => T;
  parse?: (value: string) => T;
  serialize?: (value: T) => string;
}) => {
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    const handler = () => callback();
    window.addEventListener("storage", handler);
    window.addEventListener(STORAGE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(STORAGE_EVENT, handler);
    };
  };

  const getSnapshot = () => {
    if (typeof window === "undefined") return fallback();
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback();
    return parse ? parse(raw) : (JSON.parse(raw) as T);
  };

  const value = useSyncExternalStore(subscribe, getSnapshot, fallback);

  const setValue = (next: T) => {
    if (typeof window === "undefined") return;
    const payload = serialize ? serialize(next) : JSON.stringify(next);
    localStorage.setItem(key, payload);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  return [value, setValue] as const;
};

const getDefaultTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function RoadmapPage() {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [progress, setProgress] = useLocalStorageState<Record<string, boolean[]>>({
    key: PROGRESS_KEY,
    fallback: () => normalizeProgress(null),
    parse: (raw) => normalizeProgress(JSON.parse(raw) as Record<string, boolean[]>),
  });
  const [theme, setTheme] = useLocalStorageState<"light" | "dark">({
    key: THEME_KEY,
    fallback: () => getDefaultTheme(),
    parse: (raw) => (raw === "dark" ? "dark" : "light"),
    serialize: (value) => value,
  });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const dayCompletion = useMemo(() => {
    return ROADMAP_DAYS.map((day) => {
      const checks = progress[String(day.id)] ?? day.tasks.map(() => false);
      const completed = checks.filter(Boolean).length;
      return {
        total: checks.length,
        completed,
        done: completed === checks.length,
      };
    });
  }, [progress]);

  const completedDays = dayCompletion.filter((day) => day.done).length;
  const genesisUnlocked = completedDays >= 5;

  const handleToggleTask = (dayId: number, taskIndex: number) => {
    const dayKey = String(dayId);
    const day = ROADMAP_DAYS.find((d) => d.id === dayId);
    if (!day) return;
    const current = progress[dayKey] ?? day.tasks.map(() => false);
    const wasComplete = current.every(Boolean);
    const next = [...current];
    next[taskIndex] = !next[taskIndex];
    const updated = { ...progress, [dayKey]: next };
    const isComplete = next.every(Boolean);
    if (!wasComplete && isComplete) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    setProgress(updated);
  };

  const handleCopy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-10 lg:px-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  ForgeID Passport Demo
                </p>
                <h1 className="text-2xl font-semibold md:text-3xl">
                  7-Day Authenticity Roadmap
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" /> Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" /> Dark
                </>
              )}
            </Button>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Equality Banner
            </p>
            <p className="mt-2 text-base text-foreground">
              All badges are equal. The value of this work is determined solely
              by its quality, impact, and results — not by the human/AI ratio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
              <BadgeCheck className="h-4 w-4" />
              {completedDays} of 7 days completed
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
              <Target className="h-4 w-4" />
              Genesis unlocks after Day 5
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-6">
            {ROADMAP_DAYS.map((day, index) => {
              const completion = dayCompletion[index];
              const isExpanded = expandedDay === day.id;
              const isLocked = day.id >= 6 && !genesisUnlocked;

              return (
                <motion.div
                  key={day.id}
                  layout
                  className={cn(
                    "rounded-3xl border border-border bg-card p-6 shadow-sm transition",
                    isLocked && "opacity-75",
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 text-left"
                    onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                          Day {day.id}
                        </span>
                        {completion?.done ? (
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            Complete
                          </span>
                        ) : isLocked ? (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            Locked
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            In progress
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold">{day.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {day.focus}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-muted/30 p-5">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-muted-foreground">
                              Outcome
                            </p>
                            <p className="text-sm text-foreground">
                              {day.outcome}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-muted-foreground">
                              Checklist
                            </p>
                            <div className="grid gap-2">
                              {day.tasks.map((task, taskIndex) => {
                                const checked =
                                  progress[String(day.id)]?.[taskIndex] ??
                                  false;
                                return (
                                  <label
                                    key={task}
                                    className={cn(
                                      "flex items-start gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm",
                                      checked && "border-primary/40",
                                      isLocked &&
                                        "cursor-not-allowed opacity-70",
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-1 h-4 w-4 accent-primary"
                                      checked={checked}
                                      onChange={() =>
                                        handleToggleTask(day.id, taskIndex)
                                      }
                                      disabled={isLocked}
                                    />
                                    <span>{task}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Highlight
                            </p>
                            <p className="text-sm">{day.highlight}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Timeline className="h-4 w-4" />
                Timeline view
              </div>
              <div className="mt-4 grid gap-4">
                {ROADMAP_DAYS.map((day, index) => {
                  const completion = dayCompletion[index];
                  const isLocked = day.id >= 6 && !genesisUnlocked;
                  return (
                    <div key={day.id} className="flex items-start gap-3">
                      <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
                        {day.id}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{day.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {completion?.done
                            ? "Completed"
                            : isLocked
                              ? "Locked until Genesis unlock"
                              : `${completion?.completed ?? 0}/${completion?.total ?? 0} tasks`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Rocket className="h-4 w-4" />
                Launch pad
              </div>
              <div className="mt-4 grid gap-3">
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => handleCopy("README", README_COPY)}
                >
                  Copy README snippet
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => handleCopy("X", X_COPY)}
                >
                  Copy X post
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => handleCopy("LinkedIn", LINKEDIN_COPY)}
                >
                  Copy LinkedIn post
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
                {copied && (
                  <p className="text-xs text-muted-foreground">
                    {copied} copied.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <BadgeCheck className="h-4 w-4" />
                Genesis Passport
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm">
                  The Genesis Passport activates after Day 5. It validates the
                  foundational evidence trail that unlocks Day 6–7.
                </p>
                <div
                  className={cn(
                    "rounded-2xl border border-dashed border-border px-4 py-3 text-sm",
                    genesisUnlocked
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/40",
                  )}
                >
                  {genesisUnlocked
                    ? "Genesis unlocked. Day 6–7 are now active."
                    : "Locked. Complete Days 1–5 to unlock Genesis."}
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div>• Evidence trail hash anchors documented</div>
                  <div>• Equality Charter signed-off</div>
                  <div>• Verification flow approved</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Motivational header
            </p>
            <h2 className="text-2xl font-semibold">
              Build it in public. Measure it in proof. Share it with the world.
            </h2>
            <p className="text-sm text-muted-foreground">
              This roadmap keeps the demo focused on transparent progress,
              equitable validation, and launch-ready outcomes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

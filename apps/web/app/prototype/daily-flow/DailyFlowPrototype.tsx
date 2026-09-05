"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { BrandMark, ButterflyIcon } from "../../../components/BrandMark";
import {
  PrototypeSwitcher,
  type PrototypeVariant,
} from "../../../components/prototype/PrototypeSwitcher";
import styles from "./prototype.module.css";

const LABELS: Record<PrototypeVariant, string> = {
  A: "Reader journey",
  B: "Tap-through edition",
  C: "Behind the scenes",
};

const EDITION_CARDS = [
  {
    role: "The Anchor",
    topic: "Rights & Policy",
    tone: "essential",
    headline: "A new workplace ruling changes what employers must report",
    summary:
      "The ruling expands reporting duties for workplace harassment complaints. It matters now because employers must update their internal process, while workers gain a clearer paper trail for escalation.",
    source: "Supreme Court order + verified reporting",
    reason: "In today's essential seven",
  },
  {
    role: "For You",
    topic: "Work & Money",
    tone: "personal",
    headline: "Three salary rules worth checking before your next offer",
    summary:
      "A quick comparison of take-home pay, maternity benefits, and retirement contributions can reveal more than the headline salary. Save this card as a checklist for your next negotiation.",
    source: "Labour Ministry guidance",
    reason: "Because you follow Work & Money",
  },
  {
    role: "The Number",
    topic: "Data",
    tone: "data",
    headline: "41.7% of women are now in the labour force",
    summary:
      "Participation has risen sharply, led by rural and self-employed work. The number signals movement, but it does not automatically mean safer, better-paid, or more secure jobs.",
    source: "PLFS 2023-24",
    reason: "A number that gives today's news context",
  },
  {
    role: "Useful Now",
    topic: "Health & Wellness",
    tone: "useful",
    headline: "The health benefit most families forget to claim",
    summary:
      "Before paying out of pocket, check whether your state and employer plans cover the procedure. Titli shows the eligibility steps, documents, and official helpline in one place.",
    source: "National Health Authority",
    reason: "Practical for your selected state",
  },
  {
    role: "Beyond the Metro",
    topic: "Rural & Grassroots",
    tone: "ground",
    headline: "A women-led water council cut a village's daily wait in half",
    summary:
      "Local women mapped broken taps, published repair times, and negotiated a maintenance fund. Their system is now being tested in three neighboring panchayats.",
    source: "Khabar Lahariya + panchayat record",
    reason: "A grounded story beyond metro headlines",
  },
  {
    role: "Another Lens",
    topic: "Science & Culture",
    tone: "explore",
    headline: "Why women are reshaping India's field research teams",
    summary:
      "More women in field teams changes which questions are asked and who feels safe answering. This story sits outside your usual feed, but adds a useful lens to public data.",
    source: "Research institute report",
    reason: "A different lens for balance",
  },
  {
    role: "The Lift",
    topic: "Women's Wins",
    tone: "lift",
    headline: "A first-time founder takes low-cost diagnostics to 40 clinics",
    summary:
      "Her portable test reduces travel for patients in smaller towns and returns results in under an hour. The next milestone is a public-hospital pilot this winter.",
    source: "Clinic records + founder interview",
    reason: "End the edition with agency",
  },
];

const JOURNEY = [
  {
    number: "01",
    time: "0:00",
    title: "A promise, not a tour",
    body: "Seven useful things. Five calm minutes. Every source visible.",
    signal: "No account wall",
  },
  {
    number: "02",
    time: "0:15",
    title: "Three choices",
    body: "Pick what matters now: health, money, safety, work, rights, wins.",
    signal: "Explicit intent",
  },
  {
    number: "03",
    time: "0:30",
    title: "Immediate value",
    body: "The strongest editor-selected story appears before personalization gets clever.",
    signal: "Trust first",
  },
  {
    number: "04",
    time: "2:00",
    title: "Quiet learning",
    body: "Dwell, saves, source opens, and skips tune the mix without interrupting reading.",
    signal: "Behavior, not surveillance",
  },
  {
    number: "05",
    time: "4:30",
    title: "A satisfying finish",
    body: "The seventh card completes the ritual. No bottomless feed and no guilt.",
    signal: "Edition complete",
  },
  {
    number: "06",
    time: "Tomorrow",
    title: "Return with purpose",
    body: "One fresh edition arrives at the reader's chosen time and resumes where needed.",
    signal: "Ritual, not compulsion",
  },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6zM14 3v4h4M9 11h6M9 15h6" />
    </svg>
  );
}

function PrototypeHeader({ eyebrow }: { eyebrow: string }) {
  return (
    <header className={styles.prototypeHeader}>
      <BrandMark size={26} />
      <span>{eyebrow}</span>
      <span className={styles.draftPill}>ROUGH DRAFT</span>
    </header>
  );
}

function VariantA() {
  return (
    <main className={`${styles.page} ${styles.journeyPage}`}>
      <PrototypeHeader eyebrow="The daily ritual" />
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>THE ONE-SENTENCE PRODUCT</p>
          <h1>
            Seven things worth knowing.
            <span> Five calm minutes.</span>
          </h1>
        </div>
        <p className={styles.heroCopy}>
          Titli should not feel like a smaller newspaper. It should feel like a trusted friend who has
          already done the sorting, checked the sources, and knows when to stop.
        </p>
      </section>

      <section className={styles.journeyRail} aria-label="First-touch journey">
        {JOURNEY.map((step, index) => (
          <article className={styles.journeyStep} key={step.number}>
            <div className={styles.stepTopline}>
              <span>{step.number}</span>
              <span>{step.time}</span>
            </div>
            <div className={styles.stepMark}>
              <span />
              {index < JOURNEY.length - 1 ? <i /> : null}
            </div>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            <small>{step.signal}</small>
          </article>
        ))}
      </section>

      <section className={styles.principleBand}>
        <div>
          <span>01</span>
          <h3>Editorial before algorithm</h3>
          <p>The system can rank. Only a human editor can decide what deserves the day.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Completion before consumption</h3>
          <p>The product earns tomorrow&apos;s return by letting today&apos;s session end.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Agency before anxiety</h3>
          <p>Sequence distress with context, action, and progress instead of outrage.</p>
        </div>
      </section>

      <footer className={styles.northStar}>
        <span>North star</span>
        <strong>Completed trusted editions per weekly active reader</strong>
        <p>Not total time spent.</p>
      </footer>
    </main>
  );
}

function OpeningScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className={styles.phoneOpening}>
      <div className={styles.largeButterfly}>
        <ButterflyIcon size={70} />
      </div>
      <p className={styles.phoneDate}>MONDAY &middot; 31 AUGUST</p>
      <h2>Your world, made clear.</h2>
      <p>Seven verified stories chosen for your day. About five minutes, then you are caught up.</p>
      <div className={styles.openingFacts}>
        <span>7 cards</span>
        <span>Every source visible</span>
        <span>No endless feed</span>
      </div>
      <button type="button" onClick={onStart} className={styles.primaryButton}>
        Begin today&apos;s Titli <ArrowIcon />
      </button>
    </div>
  );
}

function CardScreen({
  index,
  onNext,
  onBack,
  onDetail,
}: {
  index: number;
  onNext: () => void;
  onBack: () => void;
  onDetail: () => void;
}) {
  const card = EDITION_CARDS[index]!;
  return (
    <div className={styles.phoneFeed}>
      <div className={styles.phoneTopbar}>
        <BrandMark size={20} showWordmark={false} />
        <div className={styles.progressTrack}>
          <span style={{ width: `${((index + 1) / EDITION_CARDS.length) * 100}%` }} />
        </div>
        <b>{index + 1}/7</b>
      </div>
      <div className={`${styles.storyImage} ${styles[`tone_${card.tone}`]}`}>
        <span>{card.role}</span>
        <div className={styles.storyOrb} />
        <p>{card.topic}</p>
      </div>
      <div className={styles.storyBody}>
        <div className={styles.reason}>{card.reason}</div>
        <h2>{card.headline}</h2>
        <p>{card.summary}</p>
        <button type="button" onClick={onDetail} className={styles.sourceLine}>
          <SourceIcon /> {card.source}
        </button>
      </div>
      <div className={styles.phoneActions}>
        <button type="button" onClick={onBack} disabled={index === 0} aria-label="Previous card">
          &larr;
        </button>
        <div>
          <button type="button">Save</button>
          <button type="button">Share</button>
        </div>
        <button type="button" onClick={onNext} aria-label="Next card">
          &uarr;
        </button>
      </div>
    </div>
  );
}

function DetailScreen({ index, onClose }: { index: number; onClose: () => void }) {
  const card = EDITION_CARDS[index]!;
  return (
    <div className={styles.phoneDetail}>
      <button type="button" onClick={onClose} className={styles.closeButton}>
        &larr; Back to card {index + 1}
      </button>
      <p className={styles.phoneDate}>SOURCE & CONTEXT</p>
      <h2>{card.headline}</h2>
      <div className={styles.verificationBox}>
        <SourceIcon />
        <div>
          <span>Verified from</span>
          <strong>{card.source}</strong>
        </div>
      </div>
      <h3>What this changes</h3>
      <p>
        The short tells you what happened. This layer explains scope, caveats, next steps, and what
        Titli still cannot confirm. The source remains one tap away.
      </p>
      <h3>Why it reached you</h3>
      <p>{card.reason}. You can ask for less like this without hiding important essentials.</p>
      <button type="button" className={styles.secondaryButton}>Read the original source</button>
    </div>
  );
}

function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className={styles.phoneComplete}>
      <div className={styles.completionRing}>
        <ButterflyIcon size={52} />
      </div>
      <p className={styles.phoneDate}>TODAY&apos;S EDITION &middot; COMPLETE</p>
      <h2>You are caught up.</h2>
      <p>Seven stories. Five topics. Four verified primary sources. Come back tomorrow for a fresh edition.</p>
      <div className={styles.recapGrid}>
        <div><strong>2</strong><span>saved</span></div>
        <div><strong>5m</strong><span>well spent</span></div>
        <div><strong>1</strong><span>new lens</span></div>
      </div>
      <button type="button" className={styles.primaryButton}>Explore Women&apos;s Wins</button>
      <button type="button" onClick={onRestart} className={styles.textButton}>Replay prototype</button>
    </div>
  );
}

function VariantB() {
  const [screen, setScreen] = useState<"opening" | "feed" | "detail" | "complete">("opening");
  const [index, setIndex] = useState(0);

  function next() {
    if (index === EDITION_CARDS.length - 1) setScreen("complete");
    else setIndex((current) => current + 1);
  }

  function restart() {
    setIndex(0);
    setScreen("opening");
  }

  return (
    <main className={`${styles.page} ${styles.simulatorPage}`}>
      <PrototypeHeader eyebrow="Tap-through edition" />
      <section className={styles.simulatorIntro}>
        <p className={styles.kicker}>TRY THE FEEL</p>
        <h1>A finite feed with an ending.</h1>
        <p>
          Tap through the phone. The goal is a small emotional arc: orientation, relevance,
          perspective, utility, agency, completion.
        </p>
        <div className={styles.sequenceLegend}>
          {EDITION_CARDS.map((card, cardIndex) => (
            <button
              type="button"
              key={card.role}
              onClick={() => { setIndex(cardIndex); setScreen("feed"); }}
              className={index === cardIndex && screen === "feed" ? styles.activeSequence : ""}
            >
              <span>{String(cardIndex + 1).padStart(2, "0")}</span>
              {card.role}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.phoneStage}>
        <div className={styles.phoneShell}>
          <div className={styles.phoneSpeaker} />
          <div className={styles.phoneScreen}>
            {screen === "opening" ? <OpeningScreen onStart={() => setScreen("feed")} /> : null}
            {screen === "feed" ? (
              <CardScreen
                index={index}
                onNext={next}
                onBack={() => setIndex((current) => Math.max(0, current - 1))}
                onDetail={() => setScreen("detail")}
              />
            ) : null}
            {screen === "detail" ? <DetailScreen index={index} onClose={() => setScreen("feed")} /> : null}
            {screen === "complete" ? <CompletionScreen onRestart={restart} /> : null}
          </div>
        </div>
        <aside className={styles.liveNotes}>
          <div>
            <span>DESIGN BET</span>
            <h3>Progress changes the feed&apos;s meaning.</h3>
            <p>It says this is a briefing to finish, not a slot machine to keep pulling.</p>
          </div>
          <div>
            <span>TRUST BET</span>
            <h3>The source is part of the card.</h3>
            <p>Readers can inspect context without losing their place in the edition.</p>
          </div>
          <div>
            <span>RETENTION BET</span>
            <h3>The completion moment earns tomorrow.</h3>
            <p>Our return loop is freshness and confidence, not exhaustion.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

const PIPELINE = [
  { time: "05:30", title: "Listen", body: "RSS, government data, trusted desks", tag: "machine" },
  { time: "05:45", title: "Cluster", body: "Deduplicate events and find primary sources", tag: "machine" },
  { time: "06:00", title: "Judge", body: "Editor selects, verifies, and writes fresh", tag: "human" },
  { time: "06:40", title: "Compose", body: "Fill seven roles and check balance", tag: "human + rules" },
  { time: "07:00", title: "Publish", body: "One versioned edition reaches readers", tag: "system" },
  { time: "next open", title: "Learn", body: "Local signals tune tomorrow slowly", tag: "reader control" },
];

const SIGNALS = [
  ["Topic follow", "+5"],
  ["Save", "+4"],
  ["Source open", "+3"],
  ["Share", "+3"],
  ["Detail open", "+2"],
  ["Healthy dwell", "+1"],
  ["Fast skip", "-1"],
  ["Less like this", "-5"],
];

function VariantC() {
  return (
    <main className={`${styles.page} ${styles.systemPage}`}>
      <PrototypeHeader eyebrow="The system behind the calm" />
      <section className={styles.systemHero}>
        <div>
          <p className={styles.kicker}>THE ALGORITHM IS NOT THE PRODUCT</p>
          <h1>Judgment chooses. Ranking arranges. The reader stays in control.</h1>
        </div>
        <div className={styles.scoreCard}>
          <span>TITLI SCORE V1</span>
          <code>
            30% importance<br />
            20% relevance<br />
            15% freshness<br />
            15% utility<br />
            10% source quality<br />
            10% novelty<br />
            - fatigue
          </code>
        </div>
      </section>

      <section className={styles.pipeline}>
        {PIPELINE.map((stage, index) => (
          <article key={stage.title}>
            <div className={styles.pipelineNumber}>{String(index + 1).padStart(2, "0")}</div>
            <span className={styles.pipelineTime}>{stage.time}</span>
            <h2>{stage.title}</h2>
            <p>{stage.body}</p>
            <small>{stage.tag}</small>
          </article>
        ))}
      </section>

      <section className={styles.systemGrid}>
        <article className={styles.gatePanel}>
          <p className={styles.kicker}>HARD GATES BEFORE RANKING</p>
          <h2>A story earns eligibility.</h2>
          <div className={styles.gates}>
            <span>Editor reviewed</span>
            <span>Source linked</span>
            <span>Fresh enough</span>
            <span>Clustered</span>
            <span>Language ready</span>
            <span>Corrections clear</span>
          </div>
          <p className={styles.panelNote}>
            Discovery sources can nominate a story. They cannot independently validate a consequential claim.
          </p>
        </article>

        <article className={styles.signalPanel}>
          <p className={styles.kicker}>EXPLAINABLE SIGNALS</p>
          <h2>Learn slowly, forget gracefully.</h2>
          <div className={styles.signalList}>
            {SIGNALS.map(([signal, weight]) => (
              <div key={signal}><span>{signal}</span><strong>{weight}</strong></div>
            ))}
          </div>
          <p className={styles.panelNote}>Behavior decays over 21 days. Explicit choices do not.</p>
        </article>

        <article className={styles.composerPanel}>
          <p className={styles.kicker}>THE EDITION COMPOSER</p>
          <h2>Balance beats a perfect score.</h2>
          <ul>
            <li>Maximum two cards from one topic</li>
            <li>At least one data or primary-source card</li>
            <li>One exploration card outside the comfort zone</li>
            <li>No two high-distress cards back to back</li>
            <li>End with utility, agency, or progress</li>
          </ul>
          <div className={styles.explorationMeter}>
            <span>Personal fit</span><i /><b>85%</b>
            <span>Exploration</span><i /><b>15%</b>
          </div>
        </article>
      </section>

      <footer className={styles.systemFooter}>
        <div>
          <span>WHAT WE COPY</span>
          <p>Single-card focus, brevity, editorial curation, behavioral relevance, full-source escape hatch.</p>
        </div>
        <div>
          <span>WHAT MAKES TITLI OURS</span>
          <p>Women-first utility, finite editions, visible evidence, diversity rules, calm completion.</p>
        </div>
      </footer>
    </main>
  );
}

export function DailyFlowPrototype() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("variant")?.toUpperCase();
  const variant: PrototypeVariant = requested === "B" || requested === "C" ? requested : "A";

  return (
    <>
      {variant === "A" ? <VariantA /> : null}
      {variant === "B" ? <VariantB /> : null}
      {variant === "C" ? <VariantC /> : null}
      <PrototypeSwitcher current={variant} labels={LABELS} />
    </>
  );
}

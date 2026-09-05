"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type PropsWithChildren,
  type UIEvent,
} from "react";
import Image from "next/image";

import { ButterflyIcon } from "../../../components/BrandMark";
import styles from "./prototype.module.css";

type Scene = "today" | "reward" | "worth" | "explore" | "pulse" | "shh";
type MoodKey = "surprise" | "useful" | "hopeful" | "debatable";
type PrototypeStyle = CSSProperties & Record<`--${string}`, string | number>;

const EDITION_DATE = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Kolkata",
}).format(new Date()).replace(",", " /").toUpperCase();

const SCENES: Array<{ id: Scene; label: string; note: string }> = [
  { id: "today", label: "Today", note: "Masthead + progress" },
  { id: "reward", label: "Reward", note: "Seven complete" },
  { id: "worth", label: "Worth staying", note: "Compact story rail" },
  { id: "explore", label: "Explore", note: "Mood-led discovery" },
  { id: "pulse", label: "Pulse", note: "Immersive signals" },
  { id: "shh", label: "Shhh", note: "Private check-in" },
];

const TODAY_STORIES = [
  {
    role: "The Anchor",
    topic: "Rights & Policy",
    headline: "The workplace rule every team should know before a complaint is made",
    summary: "A clear look at what the law promises, where enforcement falls short, and what workers can ask for now.",
    source: "The Hindu / verified",
    tone: "oxblood",
  },
  {
    role: "The Number",
    topic: "Lives in data",
    headline: "Child marriage has fallen, but one in five young women was still married before 18",
    summary: "Progress is visible. The national average also hides large differences between states and communities.",
    source: "NFHS-6 / verified",
    tone: "lime",
  },
  {
    role: "Useful Now",
    topic: "Work & Money",
    headline: "Three details worth checking before you accept the salary on an offer letter",
    summary: "Take-home pay, maternity benefits, and retirement contributions can matter more than the headline number.",
    source: "Labour Ministry guidance",
    tone: "sky",
  },
  {
    role: "Beyond the Metro",
    topic: "Ground report",
    headline: "Women mapped every broken tap in their village, then cut the daily wait in half",
    summary: "A local maintenance system is now being tested in three neighbouring panchayats.",
    source: "Khabar Lahariya / records",
    tone: "sage",
  },
  {
    role: "Another Lens",
    topic: "Science & Culture",
    headline: "Who joins a field research team can change which questions finally get asked",
    summary: "More women researchers are changing access, trust, and the shape of public evidence.",
    source: "Research institute report",
    tone: "lilac",
  },
  {
    role: "For You",
    topic: "Health",
    headline: "The health benefit many families discover only after paying out of pocket",
    summary: "A short eligibility check can reveal whether a state or employer plan already covers the procedure.",
    source: "National Health Authority",
    tone: "peach",
  },
  {
    role: "The Lift",
    topic: "Women's Wins",
    headline: "A portable test built by a first-time founder now reaches forty smaller clinics",
    summary: "The next milestone is a public-hospital pilot that could reduce hours of travel for patients.",
    source: "Clinic records / interview",
    tone: "jade",
  },
];

const HOT_STORIES = [
  {
    reason: "Most read",
    headline: "Why a women-led water council changed more than the village queue",
    description: "A practical local system became a lesson in public accountability.",
    read: "2 min read",
    tone: "peach",
  },
  {
    reason: "Sources checked",
    headline: "What the new workplace reporting rule actually asks employers to do",
    description: "The requirement, the exceptions, and the part most teams still miss.",
    read: "3 min read",
    tone: "lilac",
  },
  {
    reason: "Readers stayed",
    headline: "The salary number that matters after the offer-letter excitement fades",
    description: "A short guide to comparing benefits without a spreadsheet headache.",
    read: "2 min read",
    tone: "sky",
  },
  {
    reason: "Fresh from Titli",
    headline: "A quieter way to understand what one national average leaves out",
    description: "Five state-level details put the headline percentage in context.",
    read: "4 min read",
    tone: "lime",
  },
  {
    reason: "Most opened",
    headline: "The women building safer field-research teams across India",
    description: "Small changes in who asks the questions are changing the answers.",
    read: "3 min read",
    tone: "sage",
  },
  {
    reason: "Worth knowing",
    headline: "The benefits question to ask before a medical bill arrives",
    description: "One early check can uncover coverage that is easy to miss.",
    read: "2 min read",
    tone: "sky",
  },
  {
    reason: "A small lift",
    headline: "Forty clinics are trying a test designed for shorter journeys",
    description: "A founder's portable idea is moving closer to a public pilot.",
    read: "3 min read",
    tone: "lilac",
  },
];

const TOPICS = [
  { name: "Work & Money", note: "8 fresh", accent: "#ebc3ac" },
  { name: "Rights", note: "Essential", accent: "#bfd0e3" },
  { name: "Health", note: "5 useful", accent: "#dce999" },
  { name: "Women's Wins", note: "A lift", accent: "#d8cae5" },
  { name: "Beyond Metro", note: "Grounded", accent: "#bac9bc" },
];

const MOODS: Array<{
  id: MoodKey;
  label: string;
  wash: string;
  wash2: string;
  accent: string;
  offset: number;
  description: string;
}> = [
  { id: "surprise", label: "Surprise me", description: "Unexpected, still worth it", wash: "#e2e5de", wash2: "#d8cae5", accent: "#826d78", offset: 0 },
  { id: "useful", label: "Useful", description: "Something I can use", wash: "#dfe6df", wash2: "#bfd0e3", accent: "#6d8177", offset: 2 },
  { id: "hopeful", label: "Hopeful", description: "Progress without fluff", wash: "#f1e7d9", wash2: "#dce999", accent: "#aa381e", offset: 4 },
  { id: "debatable", label: "Debatable", description: "Two sides, clearly sourced", wash: "#e4dfe2", wash2: "#ebc3ac", accent: "#741f19", offset: 1 },
];

const PULSE_METRICS = [
  {
    kind: "Safety signal",
    value: "31,516",
    unit: "cases registered",
    label: "Reported rape cases",
    period: "India / 2022",
    source: "National Crime Records Bureau",
    sourceUrl: "https://www.mha.gov.in/sites/default/files/AnnualReport_27122024.pdf",
    context: "A police-reported count, not a live incident total and not a measure of unreported violence.",
    tone: "lime",
  },
  {
    kind: "Progress signal",
    value: "12",
    unit: "verified achievements",
    label: "Women's wins",
    period: "Titli / 2026",
    source: "Titli editorial desk",
    sourceUrl: "/topic/womens-wins",
    context: "Published stories whose primary focus is a verified achievement led by women.",
    tone: "lilac",
  },
];

export function EditorialMotionPrototype({ initialScene = "today" }: { initialScene?: string }) {
  const [scene, setScene] = useState<Scene>(() => (
    SCENES.some((item) => item.id === initialScene) ? initialScene as Scene : "today"
  ));
  const [rewardRun, setRewardRun] = useState(0);

  useEffect(() => {
    const requested = window.location.hash.slice(1);
    if (!SCENES.some((item) => item.id === requested)) return;
    const frame = window.requestAnimationFrame(() => setScene(requested as Scene));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function showScene(next: Scene) {
    if (next === "reward") setRewardRun((value) => value + 1);
    setScene(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  return (
    <main className={styles.prototype}>
      <header className={styles.pageHeader}>
        <div className={styles.pageBrand}>
          <ButterflyIcon size={30} />
          <div>
            <strong>TITLI / EDITORIAL MOTION</strong>
            <span>Clickable direction prototype</span>
          </div>
        </div>
        <p>One daily edition. A meaningful ending. Discovery without the noise.</p>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.scenePanel} aria-label="Prototype scenes">
          <span className={styles.panelKicker}>SCENE MAP</span>
          <h1>Review the whole emotional arc.</h1>
          <p>Jump anywhere, then use the controls inside the phone to feel the transitions.</p>
          <nav>
            {SCENES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={scene === item.id ? styles.activeSceneButton : undefined}
                aria-current={scene === item.id ? "page" : undefined}
                onClick={() => showScene(item.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span><b>{item.label}</b><small>{item.note}</small></span>
                <ArrowIcon />
              </button>
            ))}
          </nav>
          <div className={styles.prototypeNote}>
            <span>PROTOTYPE RULE</span>
            Native screens stay unchanged until this direction is approved.
          </div>
        </aside>

        <section className={styles.phoneStage} aria-label={`${scene} prototype scene`}>
          <div className={styles.phoneShell}>
            <div className={styles.phoneSensor} />
            <div className={styles.phoneScreen}>
              <PhoneStatus scene={scene} />
              {scene === "today" ? <TodayScene onComplete={() => showScene("reward")} onExplore={() => showScene("explore")} /> : null}
              {scene === "reward" ? <RewardScene key={rewardRun} onContinue={() => showScene("worth")} /> : null}
              {scene === "worth" ? <WorthScene onExplore={() => showScene("explore")} /> : null}
              {scene === "explore" ? <ExploreScene onPulse={() => showScene("pulse")} onShh={() => showScene("shh")} /> : null}
              {scene === "pulse" ? <PulseScene onBack={() => showScene("explore")} /> : null}
              {scene === "shh" ? <ShhScene onBack={() => showScene("explore")} /> : null}
            </div>
          </div>
          <p className={styles.phoneHint}>Scroll Today, tune Explore, page through stories, and press anywhere inside Shhh.</p>
        </section>
      </div>
    </main>
  );
}

function PhoneStatus({ scene }: { scene: Scene }) {
  const dark = scene === "reward" || scene === "shh";
  return (
    <div className={`${styles.phoneStatus} ${dark ? styles.phoneStatusLight : ""}`}>
      <span>9:41</span>
      <span className={styles.statusMarks}><i /><i /><i /><b /></span>
    </div>
  );
}

function TodayScene({ onComplete, onExplore }: { onComplete: () => void; onExplore: () => void }) {
  const [index, setIndex] = useState(0);
  const feed = useRef<HTMLDivElement>(null);

  function syncProgress(event: UIEvent<HTMLDivElement>) {
    const readingLine = event.currentTarget.scrollTop + event.currentTarget.clientHeight * 0.32;
    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-story-index]"));
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, cardIndex) => {
      const distance = Math.abs(card.offsetTop - readingLine);
      if (distance < nearestDistance) {
        nearest = cardIndex;
        nearestDistance = distance;
      }
    });
    setIndex((current) => current === nearest ? current : nearest);
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target) return;
    const direction = event.key === "ArrowDown" || event.key === "PageDown" ? 1 : event.key === "ArrowUp" || event.key === "PageUp" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const next = Math.min(Math.max(index + direction, 0), TODAY_STORIES.length - 1);
    const card = feed.current?.querySelector<HTMLElement>(`[data-story-index="${next}"]`);
    if (card && feed.current) feed.current.scrollTo({ top: card.offsetTop - 12, behavior: "smooth" });
  }

  return (
    <section className={styles.todayScene}>
      <DailyMasthead current={index + 1} />
      <div
        ref={feed}
        className={styles.todayFeed}
        aria-label="Today's seven-story edition"
        tabIndex={0}
        onScroll={syncProgress}
        onKeyDown={handleKeys}
      >
        {TODAY_STORIES.map((story, storyIndex) => (
          <article className={styles.todayStory} data-story-index={storyIndex} key={story.headline}>
            <div className={`${styles.todayVisual} ${styles[`tone_${story.tone}`]}`}>
              <span>{story.topic}</span>
              <div className={styles.visualLines}><i /><i /><i /></div>
              <b>{String(storyIndex + 1).padStart(2, "0")}</b>
            </div>
            <div className={styles.todayCopy}>
              <span className={styles.storyRole}>{story.role}</span>
              <h2>{story.headline}</h2>
              <p>{story.summary}</p>
              <small>{story.source}</small>
            </div>
          </article>
        ))}
        <button type="button" className={styles.editionFinish} onClick={onComplete}>
          <span>SEVEN STORIES READ</span>
          <strong>Finish today&apos;s edition</strong>
          <ArrowIcon />
        </button>
      </div>
      <TabBar active="today" onExplore={onExplore} />
    </section>
  );
}

function DailyMasthead({ current }: { current?: number }) {
  return (
    <header className={styles.dailyMasthead}>
      <div className={styles.dailyBrand}>
        <ButterflyIcon size={27} />
        <div><strong>TITLI</strong><span>{EDITION_DATE}</span></div>
      </div>
      {current ? <b>{current}<span>/7</span></b> : <span className={styles.mastheadEdition}>DAILY EDITION</span>}
      {current ? (
        <div className={styles.editionProgress} aria-label={`Story ${current} of 7`}>
          <i style={{ width: `${(current / 7) * 100}%` }} />
        </div>
      ) : null}
    </header>
  );
}

function RewardScene({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => navigator.vibrate?.(28), 760);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className={styles.rewardScene}>
      <div className={styles.rewardGlow} />
      <div className={styles.rewardThreads} aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} style={{ "--thread-y": `${(index - 3) * 7}px` } as PrototypeStyle} />
        ))}
      </div>
      <div className={styles.rewardParticles} aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i
            key={index}
            style={{
              "--particle-angle": `${index * 20}deg`,
              "--particle-delay": `${620 + index * 18}ms`,
              "--particle-size": `${3 + (index % 3) * 2}px`,
            } as PrototypeStyle}
          />
        ))}
      </div>
      <div className={styles.rewardMark}><ButterflyIcon size={68} /></div>
      <div className={styles.rewardCopy}>
        <span>TODAY&apos;S EDITION COMPLETE</span>
        <h2>You did it.</h2>
        <p>Seven stories. You&apos;re caught up.</p>
      </div>
      <button type="button" className={styles.rewardContinue} onClick={onContinue}>
        <span>Swipe up for what readers stayed with</span><ArrowIcon down />
      </button>
    </section>
  );
}

function WorthScene({ onExplore }: { onExplore: () => void }) {
  return (
    <section className={styles.worthScene}>
      <DailyMasthead />
      <div className={styles.worthIntro}>
        <span>BEYOND TODAY&apos;S SEVEN</span>
        <h2>Worth staying for.</h2>
        <p>Stories readers spent real time with.</p>
      </div>
      <DragRail label="Worth staying for stories" step={230} className={styles.worthRail}>
        {HOT_STORIES.map((story, index) => (
          <article className={`${styles.worthTile} ${styles[`tile_${story.tone}`]}`} key={story.headline}>
            <div><span>{story.reason}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
            <h3>{story.headline}</h3>
            <p>{story.description}</p>
            <small>{story.read}</small>
          </article>
        ))}
      </DragRail>
      <div className={styles.railProgress}><i /><i /><i /></div>
      <button type="button" className={styles.exploreLink} onClick={onExplore}>Explore by what matters <ArrowIcon /></button>
      <TabBar active="today" onExplore={onExplore} />
    </section>
  );
}

function ExploreScene({ onPulse, onShh }: { onPulse: () => void; onShh: () => void }) {
  const [moodKey, setMoodKey] = useState<MoodKey>("surprise");
  const [selectedTopics, setSelectedTopics] = useState(["Work & Money", "Rights", "Women's Wins"]);
  const [spotlight, setSpotlight] = useState(0);
  const [openingShh, setOpeningShh] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const shhTimer = useRef<number | null>(null);
  const mood = MOODS.find((item) => item.id === moodKey) ?? MOODS[0]!;
  const orderedStories = rotate(HOT_STORIES, mood.offset);
  const orderedTopics = rotate(TOPICS, mood.offset);
  const story = orderedStories[spotlight % orderedStories.length]!;

  useEffect(() => () => {
    if (shhTimer.current) window.clearTimeout(shhTimer.current);
  }, []);

  function chooseMood(next: MoodKey) {
    setMoodKey(next);
    setSpotlight(0);
    navigator.vibrate?.(10);
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  }

  function changeSpotlight(direction: -1 | 1) {
    setSpotlight((current) => (current + direction + orderedStories.length) % orderedStories.length);
  }

  function finishSpotlightSwipe(event: PointerEvent<HTMLElement>) {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    if (Math.abs(distance) > 42) changeSpotlight(distance < 0 ? 1 : -1);
    swipeStart.current = null;
  }

  function openShh() {
    setOpeningShh(true);
    navigator.vibrate?.(12);
    shhTimer.current = window.setTimeout(onShh, 680);
  }

  const sceneStyle = {
    "--mood-wash": mood.wash,
    "--mood-wash-2": mood.wash2,
    "--mood-accent": mood.accent,
  } as PrototypeStyle;

  return (
    <section className={styles.exploreScene} style={sceneStyle}>
      <DailyMasthead />
      <div className={styles.exploreScroll}>
        <section className={styles.moodSection}>
          <span>TUNE TODAY</span>
          <h2>What should lead?</h2>
          <p>Choose a lens. Titli changes the order, never the facts.</p>
          <div className={styles.moodGrid}>
            {MOODS.map((item, itemIndex) => (
              <button
                type="button"
                key={item.id}
                className={item.id === moodKey ? styles.activeMood : undefined}
                aria-pressed={item.id === moodKey}
                style={{ "--lens-color": item.accent } as PrototypeStyle}
                onClick={() => chooseMood(item.id)}
              >
                <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                {item.id === moodKey ? <CheckIcon /> : null}
              </button>
            ))}
          </div>
          <div className={styles.lensStatus} key={moodKey}>
            <i style={{ backgroundColor: mood.accent }} />
            <span><b>{mood.label} is leading.</b> Topics and stories have been reordered.</span>
          </div>
        </section>

        <section className={styles.topicSection}>
          <div className={styles.sectionLine}><span>YOUR MIX</span><small>{selectedTopics.length} selected</small></div>
          <h2>Follow fewer things, better.</h2>
          <p className={styles.topicIntro}>Choose the beats you want Titli to remember.</p>
          <div className={styles.topicList}>
            {orderedTopics.map((topic) => {
              const selected = selectedTopics.includes(topic.name);
              return (
                <button
                  type="button"
                  key={topic.name}
                  className={`${styles.topicRow} ${selected ? styles.selectedTopic : ""}`}
                  style={{ "--topic-color": topic.accent } as PrototypeStyle}
                  aria-pressed={selected}
                  onClick={() => toggleTopic(topic.name)}
                >
                  <i />
                  <span><strong>{topic.name}</strong><small>{topic.note}</small></span>
                  <b>{selected ? "IN YOUR MIX" : "ADD"}</b>
                  {selected ? <CheckIcon /> : <PlusIcon />}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.spotlightSection}>
          <div className={styles.sectionLine}><span>START HERE</span><small>{String((spotlight % orderedStories.length) + 1).padStart(2, "0")} / {String(orderedStories.length).padStart(2, "0")}</small></div>
          <h2>A good place to start.</h2>
          <article
            className={`${styles.spotlight} ${styles[`tile_${story.tone}`]}`}
            key={`${moodKey}-${story.headline}`}
            tabIndex={0}
            onPointerDown={(event) => { swipeStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerUp={finishSpotlightSwipe}
            onPointerCancel={() => { swipeStart.current = null; }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") changeSpotlight(1);
              if (event.key === "ArrowLeft") changeSpotlight(-1);
            }}
          >
            <div className={styles.spotlightShape}><i /><i /></div>
            <span>{story.reason}</span>
            <h3>{story.headline}</h3>
            <p>{story.description}</p>
            <small>{story.read}</small>
          </article>
          <div className={styles.spotlightNav}>
            <span>Drag the story or use the arrows</span>
            <div>
              <button type="button" aria-label="Previous story" onClick={() => changeSpotlight(-1)}><ArrowIcon back /></button>
              <button type="button" aria-label="Next story" onClick={() => changeSpotlight(1)}><ArrowIcon /></button>
            </div>
          </div>
        </section>

        <button type="button" className={styles.pulseTicker} onClick={onPulse}>
          <span><PulseWave /></span>
          <span><small>WOMEN&apos;S PULSE / LIVE SIGNAL</small><strong>31,516</strong><b>reported cases / sourced</b></span>
          <ArrowIcon />
        </button>

        <button type="button" className={styles.shhPortal} onClick={openShh}>
          <span>PRIVATE ON THIS DEVICE</span>
          <strong>How heavy is today?</strong>
          <i>Enter quietly</i>
          <div className={styles.portalRipple} />
        </button>
      </div>
      {openingShh ? (
        <div className={styles.shhTransitionWash} aria-hidden="true">
          <Image src="/prototypes/editorial-motion/shushing-face.png" alt="" width={34} height={34} />
        </div>
      ) : null}
      <TabBar active="explore" onExplore={() => undefined} />
    </section>
  );
}

function PulseScene({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const metric = PULSE_METRICS[index]!;

  function move(direction: -1 | 1) {
    setIndex((current) => (current + direction + PULSE_METRICS.length) % PULSE_METRICS.length);
  }

  function finishSwipe(event: PointerEvent<HTMLElement>) {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    if (Math.abs(distance) > 42) move(distance < 0 ? 1 : -1);
    startX.current = null;
  }

  return (
    <section className={`${styles.pulseScene} ${styles[`pulse_${metric.tone}`]}`}>
      <header className={styles.overlayHeader}>
        <button type="button" onClick={onBack} aria-label="Back to Explore"><ArrowIcon back /></button>
        <div><span>WOMEN&apos;S PULSE</span><strong>WHAT IS MOVING</strong></div>
        <b>{String(index + 1).padStart(2, "0")} / {String(PULSE_METRICS.length).padStart(2, "0")}</b>
      </header>
      <article
        className={styles.pulsePoster}
        key={metric.kind}
        tabIndex={0}
        onPointerDown={(event) => { startX.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerUp={finishSwipe}
        onPointerCancel={() => { startX.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") move(1);
          if (event.key === "ArrowLeft") move(-1);
        }}
      >
        <div className={styles.pulseMeta}><span>{metric.kind}</span><b>{metric.period}</b></div>
        <PulseWave large />
        <div className={styles.pulseNumber}>{metric.value}</div>
        <span className={styles.pulseUnit}>{metric.unit}</span>
        <h2>{metric.label}</h2>
        <p>{metric.context}</p>
        <a href={metric.sourceUrl} target="_blank" rel="noreferrer">Source / {metric.source}<ArrowIcon /></a>
      </article>
      <div className={styles.pulseControls}>
        <button type="button" onClick={() => move(-1)} aria-label="Previous signal"><ArrowIcon back /></button>
        <span>{PULSE_METRICS.map((item, itemIndex) => <i key={item.kind} className={itemIndex === index ? styles.currentSignal : undefined} />)}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next signal"><ArrowIcon /></button>
      </div>
    </section>
  );
}

function ShhScene({ onBack }: { onBack: () => void }) {
  const [holding, setHolding] = useState(false);
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState("");
  const holdTimer = useRef<number | null>(null);
  const holdingRef = useRef(false);
  const levelRef = useRef(0);
  const threshold = useRef(0);

  useEffect(() => () => {
    if (holdTimer.current) window.clearInterval(holdTimer.current);
  }, []);

  function tick() {
    const next = Math.min(levelRef.current + 40 / 2600, 1);
    levelRef.current = next;
    setLevel(next);
    const nextThreshold = next >= 0.7 ? 2 : next >= 0.3 ? 1 : 0;
    if (nextThreshold > threshold.current) {
      threshold.current = nextThreshold;
      navigator.vibrate?.(nextThreshold === 2 ? 24 : 12);
    }
    if (next === 1 && holdTimer.current) {
      window.clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function startHold() {
    if (holdTimer.current) window.clearInterval(holdTimer.current);
    threshold.current = 0;
    levelRef.current = 0;
    holdingRef.current = true;
    setLevel(0);
    setResult("");
    setHolding(true);
    holdTimer.current = window.setInterval(tick, 40);
  }

  function stopHold() {
    if (!holdingRef.current) return;
    if (holdTimer.current) window.clearInterval(holdTimer.current);
    holdTimer.current = null;
    holdingRef.current = false;
    setHolding(false);
    navigator.vibrate?.(18);
    const finalLevel = levelRef.current;
    setResult(finalLevel < 0.3 ? "Light today." : finalLevel < 0.7 ? "A little tender." : "Heavy today.");
  }

  const holdStyle = {
    "--hold-level": level,
    "--hold-scale": 1 + level * 0.28,
    "--hold-opacity": 0.2 + level * 0.72,
    "--hold-y": `${18 - level * 18}%`,
    "--hold-angle": `${-8 + level * 16}deg`,
  } as PrototypeStyle;

  return (
    <section className={styles.shhScene} style={holdStyle}>
      <div className={styles.holdWash} />
      <header className={styles.shhHeader}>
        <button type="button" onClick={onBack} aria-label="Leave private space"><ArrowIcon back /></button>
        <span>PRIVATE / ON THIS DEVICE</span>
      </header>
      <div className={styles.shhQuestion}>
        <span>QUIET CHECK-IN</span>
        <h2>How heavy is today?</h2>
      </div>
      <button
        type="button"
        className={`${styles.shhTouchSurface} ${result ? styles.touchComplete : ""}`}
        aria-label="Press and release when the colour matches how today feels"
        aria-pressed={holding}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startHold(); }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={(event) => {
          if ((event.key === " " || event.key === "Enter") && !holding) startHold();
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") stopHold();
        }}
      >
        <span>Touch anywhere<small>Release when the colour feels right.</small></span>
      </button>
      <div className={styles.holdResult} aria-live="polite">
        <span>{result ? "NOTED / ONLY HERE" : holding ? "LET THE COLOUR BUILD" : ""}</span>
        <strong>{result}</strong>
      </div>
      <div className={styles.shhArrival} aria-hidden="true">
        <Image src="/prototypes/editorial-motion/shushing-face.png" alt="" width={34} height={34} />
        <span>Shhh...</span>
      </div>
    </section>
  );
}

function DragRail({ children, label, step, className }: PropsWithChildren<{ label: string; step: number; className: string }>) {
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scrollLeft: number } | null>(null);
  const suppressClick = useRef(false);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    drag.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const distance = event.clientX - drag.current.x;
    if (Math.abs(distance) > 8) {
      suppressClick.current = true;
    }
    event.currentTarget.scrollLeft = drag.current.scrollLeft - distance;
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    drag.current = null;
    if (currentDrag) {
      const distance = event.clientX - currentDrag.x;
      const direction = Math.abs(distance) > 36 ? (distance < 0 ? 1 : -1) : 0;
      const currentStep = Math.round(currentDrag.scrollLeft / step);
      const destination = Math.min(
        event.currentTarget.scrollWidth - event.currentTarget.clientWidth,
        Math.max(0, (currentStep + direction) * step),
      );
      event.currentTarget.scrollTo({ left: destination, behavior: "smooth" });
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    drag.current = null;
    suppressClick.current = false;
    if (currentDrag) event.currentTarget.scrollTo({ left: currentDrag.scrollLeft, behavior: "smooth" });
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    rail.current?.scrollBy({ left: event.key === "ArrowRight" ? step : -step, behavior: "smooth" });
  }

  return (
    <div
      ref={rail}
      className={className}
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeys}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={stopDrag}
      onPointerCancel={cancelDrag}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

function TabBar({ active, onExplore }: { active: "today" | "explore"; onExplore: () => void }) {
  return (
    <nav className={styles.tabBar} aria-label="Primary">
      <button type="button" className={active === "today" ? styles.activeTab : undefined}>
        <HomeIcon /><span>Today</span>
      </button>
      <button type="button" className={active === "explore" ? styles.activeTab : undefined} onClick={onExplore}>
        <ExploreIcon /><span>Explore</span>
      </button>
      <button type="button"><BookmarkIcon /><span>Saved</span></button>
    </nav>
  );
}

function rotate<T>(items: T[], offset: number) {
  const normalized = offset % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function ArrowIcon({ back = false, down = false }: { back?: boolean; down?: boolean }) {
  return (
    <svg className={down ? styles.arrowDown : back ? styles.arrowBack : undefined} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 7" /></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 10 8-6 8 6v10h-5v-6H9v6H4Z" /></svg>;
}

function ExploreIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 9-2 5 5-2 9-9 4-5-5Z" /><circle cx="12" cy="11" r="2" /></svg>;
}

function BookmarkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" /></svg>;
}

function PulseWave({ large = false }: { large?: boolean }) {
  return (
    <svg className={large ? styles.largePulseWave : styles.smallPulseWave} viewBox="0 0 180 56" aria-hidden="true">
      <path d="M2 31h27l9-18 14 35 13-26 11 9h22l8-15 13 28 11-13h48" />
    </svg>
  );
}

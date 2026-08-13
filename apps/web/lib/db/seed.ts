/**
 * Seed data for local development and demo purposes only.
 *
 * Data-card figures are real, verified national statistics (NFHS-4/5/6,
 * PLFS) — cited with their real survey names and years. State-breakdown
 * figures on the one card that has them are illustrative/approximate for
 * demoing that feature, not sourced from the actual NFHS-5 state fact
 * sheets — replace them with real figures before treating this as
 * production content. News cards are deliberately framed around
 * well-known, ongoing structural/policy topics rather than invented
 * dated events, since fabricating a specific "breaking news" story with
 * a fake date would risk being mistaken for real reporting — replace
 * these with real, freshly-written 60-word summaries of actual articles
 * per the brief's editorial workflow before real use.
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { db } from "./client";
import { cardReadings, cards, cardStateBreakdown, cardTopics, sources, topics } from "./schema";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const PALETTE = ["#5A181A", "#E4A069", "#2A1518", "#7A2E24", "#100A0C"];

async function makePlaceholderImage(seed: number): Promise<{
  path: string;
  width: number;
  height: number;
  blurDataURL: string;
}> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const width = 1200;
  const height = 800;
  const bg = PALETTE[seed % PALETTE.length];
  const fg = PALETTE[(seed + 2) % PALETTE.length];

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bg}"/>
    <circle cx="${(seed * 137) % width}" cy="${(seed * 251) % height}" r="${180 + (seed % 5) * 30}" fill="${fg}" opacity="0.45"/>
  </svg>`;

  const filename = `seed-${seed}.webp`;
  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const blurBuffer = await sharp(Buffer.from(svg)).resize(16).webp({ quality: 40 }).toBuffer();

  return {
    path: `/uploads/${filename}`,
    width,
    height,
    blurDataURL: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  };
}

async function main() {
  console.log("Seeding...");

  const topicRows = await db
    .insert(topics)
    .values([
      { title: "Gender-Based Violence", slug: "gender-based-violence", sortOrder: 0, shortDescription: "Domestic and sexual violence, legal response" },
      { title: "Work & Economy", slug: "work-economy", sortOrder: 1, shortDescription: "Employment, wages, unpaid labour" },
      { title: "Health & Reproductive Rights", slug: "health-reproductive-rights", sortOrder: 2, shortDescription: "Maternal health, bodily autonomy" },
      { title: "Education", slug: "education", sortOrder: 3, shortDescription: "Enrolment, dropout, literacy" },
      { title: "Law & Policy", slug: "law-policy", sortOrder: 4, shortDescription: "Legislation, courts, schemes" },
      { title: "Representation", slug: "representation", sortOrder: 5, shortDescription: "Politics, leadership, visibility" },
    ])
    .returning();

  const topicBySlug = Object.fromEntries(topicRows.map((t) => [t.slug, t.id]));

  const sourceRows = await db
    .insert(sources)
    .values([
      { name: "NFHS", kind: "data", url: "https://www.nfhsiips.in", publisher: "Ministry of Health and Family Welfare" },
      { name: "PLFS", kind: "data", url: "https://www.mospi.gov.in", publisher: "Ministry of Statistics and Programme Implementation" },
      { name: "Feminism in India", kind: "news", url: "https://feminisminindia.com" },
      { name: "Behanbox", kind: "news", url: "https://behanbox.com" },
      { name: "IndiaSpend", kind: "news", url: "https://www.indiaspend.com" },
      { name: "The Hindu", kind: "news", url: "https://www.thehindu.com" },
      { name: "Scroll.in", kind: "news", url: "https://scroll.in" },
      { name: "PIB", kind: "news", url: "https://pib.gov.in" },
    ])
    .returning();

  const sourceByName = Object.fromEntries(sourceRows.map((s) => [s.name, s.id]));

  let seedCounter = 0;
  async function image() {
    seedCounter += 1;
    return makePlaceholderImage(seedCounter);
  }

  // --- Data cards (real, verified national figures) ---

  const dataCards = [
    {
      headline: "29.3% of ever-married women have experienced spousal violence",
      body:
        "Nearly 3 in 10 ever-married women aged 18–49 report physical or sexual violence from a spouse, per NFHS-5 (2019–21). That's down only slightly from NFHS-4 — progress on this number has been slow, and it doesn't count violence outside marriage.",
      topics: ["gender-based-violence", "law-policy"],
      surveySource: "NFHS",
      readings: [
        { year: 2016, value: 31.2 },
        { year: 2021, value: 29.3 },
      ],
      metricUnit: "%",
      methodologyNote:
        "NFHS asks ever-married women 18–49 about physical/sexual violence by a current or former spouse. Figures are national averages; state-level rates vary widely.",
      stateBreakdown: [
        { state: "Karnataka", value: 44.4, year: 2021 },
        { state: "Bihar", value: 40.0, year: 2021 },
        { state: "Manipur", value: 39.6, year: 2021 },
        { state: "Himachal Pradesh", value: 6.6, year: 2021 },
        { state: "Goa", value: 8.9, year: 2021 },
      ],
      isContested: false,
    },
    {
      headline: "Child marriage before 18, among women 20–24, has fallen to 20.1%",
      body:
        "One in five women aged 20–24 was married before turning 18, per NFHS-6 (2023–24) — down from 23.3% in NFHS-5 and 26.8% in NFHS-4. Real progress, but still roughly 1 in 5 girls married as children.",
      topics: ["gender-based-violence", "law-policy", "health-reproductive-rights"],
      surveySource: "NFHS",
      readings: [
        { year: 2016, value: 26.8 },
        { year: 2021, value: 23.3 },
        { year: 2024, value: 20.1 },
      ],
      metricUnit: "%",
      isContested: false,
    },
    {
      headline: "Women's labour force participation jumped to 41.7%",
      body:
        "PLFS 2023–24 puts female labour force participation at 41.7%, up from 23.3% in 2017–18 — a sharp reversal after years of decline. Most of the rise is in rural areas and unpaid or self-employed work, not formal jobs.",
      topics: ["work-economy"],
      surveySource: "PLFS",
      readings: [
        { year: 2012, value: 31.2 },
        { year: 2018, value: 23.3 },
        { year: 2024, value: 41.7 },
      ],
      metricUnit: "%",
      methodologyNote:
        "PLFS Female Labour Force Participation Rate, usual status. The rise is driven largely by rural women and unpaid/self-employed work rather than salaried employment — a rising number doesn't always mean better jobs.",
      isContested: false,
    },
    {
      headline: "Rural women's workforce participation nearly doubled in six years",
      body:
        "In rural India specifically, female labour force participation rose from 21.1% (2017–18) to 35.6% (2023–24) per PLFS — even faster than the national trend. Economists are still debating how much reflects real opportunity versus rural distress.",
      topics: ["work-economy"],
      surveySource: "PLFS",
      readings: [
        { year: 2018, value: 21.1 },
        { year: 2024, value: 35.6 },
      ],
      metricUnit: "%",
      isContested: true,
      contestedNote:
        "Economists disagree on what's driving this rise — some read it as expanding opportunity, others as households needing more earners to cope with rural distress and inflation. Both readings are represented in the coverage; this card doesn't settle which is right.",
    },
  ];

  for (const dc of dataCards) {
    const img = await image();
    const slug = dc.headline
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 90);

    const [row] = await db
      .insert(cards)
      .values({
        cardType: "data",
        headline: dc.headline,
        slug,
        body: dc.body,
        imagePath: img.path,
        imageAlt: "Illustrative graphic",
        imageWidth: img.width,
        imageHeight: img.height,
        imageBlurDataUrl: img.blurDataURL,
        publishedAt: new Date().toISOString(),
        isContested: dc.isContested,
        contestedNote: (dc as { contestedNote?: string }).contestedNote ?? null,
        surveySourceId: sourceByName[dc.surveySource],
        metricValue: dc.readings[dc.readings.length - 1].value,
        metricUnit: dc.metricUnit,
        methodologyNote: (dc as { methodologyNote?: string }).methodologyNote ?? null,
      })
      .returning({ id: cards.id });

    await db.insert(cardTopics).values(dc.topics.map((t) => ({ cardId: row.id, topicId: topicBySlug[t] })));
    await db.insert(cardReadings).values(dc.readings.map((r) => ({ cardId: row.id, ...r })));
    if ("stateBreakdown" in dc && dc.stateBreakdown) {
      await db.insert(cardStateBreakdown).values(
        dc.stateBreakdown.map((s) => ({ cardId: row.id, state: s.state, value: s.value, year: s.year }))
      );
    }
  }

  // --- News cards (generic/evergreen framing — see file header) ---

  const newsCards: {
    headline: string;
    body: string;
    topics: string[];
    source: string;
    isContested?: boolean;
    contestedNote?: string;
  }[] = [
    {
      headline: "The POSH Act turns a decade old — enforcement still lags in practice",
      body:
        "India's workplace sexual harassment law (POSH Act, 2013) requires every employer with 10+ staff to set up an Internal Committee. Labour researchers and reporters have repeatedly found many companies, especially smaller ones, still haven't — leaving the law's protections unevenly available.",
      topics: ["work-economy", "law-policy"],
      source: "The Hindu",
    },
    {
      headline: "Nirbhaya Fund utilisation remains a recurring flashpoint in Parliament",
      body:
        "Set up after the 2012 Delhi gang-rape case to fund women's safety projects, the Nirbhaya Fund has faced repeated criticism from parliamentary committees and RTI-based reporting over slow disbursal and underused allocations across states.",
      topics: ["gender-based-violence", "law-policy"],
      source: "IndiaSpend",
    },
    {
      headline: "Marital rape exception remains under judicial review",
      body:
        "Indian law still exempts a husband from rape charges for non-consensual sex with his wife. The exception has been challenged in multiple High Court and Supreme Court cases; as of now, the exception stands, with the matter still pending final resolution.",
      topics: ["gender-based-violence", "law-policy"],
      source: "Scroll.in",
      isContested: true,
      contestedNote:
        "This is an active, contested legal question — courts, lawmakers, and advocacy groups remain split on whether and how to remove the exception. This card states where the law currently stands, not where it should end up.",
    },
    {
      headline: "Menstrual leave policy remains patchy across Indian workplaces",
      body:
        "A handful of states and companies have introduced menstrual leave in recent years, while most workplaces offer none. The debate continues between those who see it as overdue recognition and those who worry it could affect hiring of women — the policy landscape stays fragmented.",
      topics: ["work-economy", "health-reproductive-rights"],
      source: "Feminism in India",
    },
    {
      headline: "Maternity Benefit Act's 26-week leave rarely reaches informal workers",
      body:
        "India's Maternity Benefit Act guarantees 26 weeks of paid leave — but it legally applies only to formal-sector establishments. The vast majority of Indian women work informally, where the guarantee mostly doesn't reach them at all.",
      topics: ["work-economy", "law-policy"],
      source: "Behanbox",
    },
    {
      headline: "Women's political reservation law awaits delimitation to take effect",
      body:
        "The Nari Shakti Vandan Adhiniyam reserves a third of Lok Sabha and state assembly seats for women — but its rollout is tied to the next delimitation and census, meaning implementation is still years away by the law's own text.",
      topics: ["representation", "law-policy"],
      source: "The Hindu",
    },
    {
      headline: "Two-finger test banned, but reporting shows the practice persists",
      body:
        "The Supreme Court outlawed the so-called 'two-finger test' in sexual assault medical exams in 2013, calling it unconstitutional. Investigative reporting since has repeatedly found hospitals in several states still using it, despite the ban.",
      topics: ["gender-based-violence", "health-reproductive-rights"],
      source: "Behanbox",
    },
    {
      headline: "Anganwadi and ASHA workers, mostly women, still classified as 'volunteers'",
      body:
        "Millions of frontline health and childcare workers — nearly all women — are paid fixed 'honorariums' rather than wages, since they're officially classified as volunteers, not employees. Unions have long pushed for formal worker status; the classification hasn't changed.",
      topics: ["work-economy", "health-reproductive-rights"],
      source: "IndiaSpend",
    },
  ];

  for (const nc of newsCards) {
    const img = await image();
    const slug = nc.headline
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 90);

    const [row] = await db
      .insert(cards)
      .values({
        cardType: "news",
        headline: nc.headline,
        slug,
        body: nc.body,
        imagePath: img.path,
        imageAlt: "Illustrative graphic",
        imageWidth: img.width,
        imageHeight: img.height,
        imageBlurDataUrl: img.blurDataURL,
        publishedAt: new Date().toISOString(),
        isContested: nc.isContested ?? false,
        contestedNote: nc.contestedNote ?? null,
        sourceId: sourceByName[nc.source],
        sourceDate: new Date().toISOString().slice(0, 10),
      })
      .returning({ id: cards.id });

    await db.insert(cardTopics).values(nc.topics.map((t) => ({ cardId: row.id, topicId: topicBySlug[t] })));
  }

  console.log(`Seeded ${topicRows.length} topics, ${sourceRows.length} sources, ${dataCards.length + newsCards.length} cards.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

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
import fs from "node:fs/promises";
import { db } from "./client";
import {
  cardReadings,
  cards,
  cardStateBreakdown,
  cardTopics,
  editionCards,
  editions,
  sources,
  topics,
} from "./schema";
import { storedImagePath, uploadDirectory, uploadedImageUrl } from "../storage";
import { getDemoDeepDive } from "./demoDeepDives";

const PALETTE = ["#5A181A", "#E4A069", "#2A1518", "#7A2E24", "#100A0C"];

async function makePlaceholderImage(seed: number): Promise<{
  path: string;
  width: number;
  height: number;
  blurDataURL: string;
}> {
  await fs.mkdir(uploadDirectory, { recursive: true });
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
  await fs.writeFile(storedImagePath(filename)!, buffer);

  const blurBuffer = await sharp(Buffer.from(svg)).resize(16).webp({ quality: 40 }).toBuffer();

  return {
    path: uploadedImageUrl(filename),
    width,
    height,
    blurDataURL: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  };
}

async function main() {
  console.log("Seeding...");

  await db
    .insert(topics)
    .values([
      { id: "genre-health-wellness", title: "Health & Wellness", slug: "health-wellness", sortOrder: 0, shortDescription: "Physical, reproductive and mental wellbeing" },
      { id: "genre-safety-justice", title: "Safety & Justice", slug: "safety-justice", sortOrder: 1, shortDescription: "Safety, violence, policing and justice" },
      { id: "genre-work-money", title: "Work & Money", slug: "work-money", sortOrder: 2, shortDescription: "Jobs, wages, business and financial independence" },
      { id: "genre-rights-policy", title: "Rights & Policy", slug: "rights-policy", sortOrder: 3, shortDescription: "Laws, courts and schemes affecting women" },
      { id: "genre-education-skills", title: "Education & Skills", slug: "education-skills", sortOrder: 4, shortDescription: "Learning, training and opportunity" },
      { id: "genre-womens-wins", title: "Women's Wins", slug: "womens-wins", sortOrder: 5, shortDescription: "Verified achievements by women across India" },
      { id: "genre-rural-grassroots", title: "Rural & Grassroots", slug: "rural-grassroots", sortOrder: 6, shortDescription: "Women-led change beyond metropolitan India" },
      { id: "genre-sports-science-culture", title: "Sports, Science & Culture", slug: "sports-science-culture", sortOrder: 7, shortDescription: "Women shaping sport, research and culture" },
    ])
    .onConflictDoNothing();

  const topicRows = await db.select().from(topics);

  const topicBySlug = Object.fromEntries(topicRows.map((t) => [t.slug, t.id]));

  await db
    .insert(sources)
    .values([
      { id: "source-nfhs", name: "NFHS", kind: "data", url: "https://www.nfhsiips.in", publisher: "Ministry of Health and Family Welfare", trustTier: "primary" as const, sourceType: "official" as const },
      { id: "source-plfs", name: "PLFS", kind: "data", url: "https://www.mospi.gov.in", publisher: "Ministry of Statistics and Programme Implementation", trustTier: "primary" as const, sourceType: "official" as const },
      { id: "source-fii", name: "Feminism in India", kind: "news", url: "https://feminisminindia.com", trustTier: "trusted" as const, sourceType: "specialist" as const, feedUrl: "https://feminisminindia.com/feed/", ingestMethod: "rss" as const },
      { id: "source-behanbox", name: "BehanBox", kind: "news", url: "https://behanbox.com", trustTier: "trusted" as const, sourceType: "specialist" as const, feedUrl: "https://behanbox.com/feed/", ingestMethod: "rss" as const },
      { id: "source-isignal", name: "ISignal", kind: "news", url: "https://www.isignal.in", trustTier: "trusted" as const, sourceType: "data" as const, feedUrl: "https://www.isignal.in/feeds.xml", ingestMethod: "rss" as const },
      { id: "source-the-hindu", name: "The Hindu", kind: "news", url: "https://www.thehindu.com", trustTier: "trusted" as const, sourceType: "mainstream" as const, feedUrl: "https://www.thehindu.com/society/feeder/default.rss", ingestMethod: "rss" as const },
      { id: "source-scroll", name: "Scroll.in", kind: "news", url: "https://scroll.in", trustTier: "trusted" as const, sourceType: "mainstream" as const, feedUrl: "https://feeds.feedburner.com/ScrollinArticles.rss", ingestMethod: "rss" as const },
      { id: "source-pib", name: "PIB", kind: "news", url: "https://pib.gov.in", trustTier: "primary" as const, sourceType: "official" as const, feedUrl: "https://archive.pib.gov.in/newsite/rssenglish.aspx", ingestMethod: "rss" as const },
      { id: "source-bcci", name: "BCCI", kind: "news", url: "https://www.bcci.tv", publisher: "Board of Control for Cricket in India", trustTier: "primary" as const, sourceType: "official" as const },
      { id: "source-dst", name: "Department of Science and Technology", kind: "news", url: "https://dst.gov.in", publisher: "Government of India", trustTier: "primary" as const, sourceType: "official" as const },
    ])
    .onConflictDoNothing();

  const sourceRows = await db.select().from(sources);

  const sourceByName = Object.fromEntries(sourceRows.map((s) => [s.name, s.id]));

  let seedCounter = 0;
  const seededCardIds: string[] = [];
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
      topics: ["safety-justice", "rights-policy"],
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
      topics: ["safety-justice", "rights-policy", "health-wellness"],
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
      topics: ["work-money"],
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
      topics: ["work-money"],
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
        status: "published",
        primaryTopicId: topicBySlug[dc.topics[0]],
        headline: dc.headline,
        slug,
        body: dc.body,
        imagePath: img.path,
        imageAlt: "Illustrative graphic",
        imageWidth: img.width,
        imageHeight: img.height,
        imageBlurDataUrl: img.blurDataURL,
        publishedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isContested: dc.isContested,
        contestedNote: (dc as { contestedNote?: string }).contestedNote ?? null,
        surveySourceId: sourceByName[dc.surveySource],
        metricValue: dc.readings[dc.readings.length - 1].value,
        metricUnit: dc.metricUnit,
        methodologyNote: (dc as { methodologyNote?: string }).methodologyNote ?? null,
      })
      .returning({ id: cards.id });

    seededCardIds.push(row.id);

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
      headline: "More than 1.48 crore SHG women reached the Lakhpati Didi benchmark",
      body:
        "The Ministry of Rural Development reported in July 2025 that more than 1.48 crore women in self-help-group households had reached the Lakhpati Didi income benchmark. The measure tracks sustained annual household income, not a one-time payment, and sits within a wider rural livelihoods programme.",
      topics: ["rural-grassroots", "work-money"],
      source: "PIB",
    },
    {
      headline: "India women cricketers receive equal international match fees",
      body:
        "The BCCI adopted pay equity for international match fees in October 2022. Contracted women players now receive the same match fee as men for Tests, one-day internationals and T20 internationals. The policy does not make every part of cricket pay equal, but it removed one clear difference at international level.",
      topics: ["sports-science-culture"],
      source: "BCCI",
    },
    {
      headline: "A national programme supports women from PhDs to senior research",
      body:
        "The Department of Science and Technology runs WISE-KIRAN programmes for women across different stages of science careers. Its support includes doctoral and post-doctoral fellowships, research opportunities for senior scientists, and institutional work on gender equity. Eligibility and open calls differ by programme, so applicants should check the official portal.",
      topics: ["sports-science-culture", "education-skills"],
      source: "Department of Science and Technology",
    },
    {
      headline: "The POSH Act turns a decade old — enforcement still lags in practice",
      body:
        "India's workplace sexual harassment law (POSH Act, 2013) requires every employer with 10+ staff to set up an Internal Committee. Labour researchers and reporters have repeatedly found many companies, especially smaller ones, still haven't — leaving the law's protections unevenly available.",
      topics: ["work-money", "rights-policy"],
      source: "The Hindu",
    },
    {
      headline: "Nirbhaya Fund utilisation remains a recurring flashpoint in Parliament",
      body:
        "Set up after the 2012 Delhi gang-rape case to fund women's safety projects, the Nirbhaya Fund has faced repeated criticism from parliamentary committees and RTI-based reporting over slow disbursal and underused allocations across states.",
      topics: ["safety-justice", "rights-policy"],
      source: "ISignal",
    },
    {
      headline: "Marital rape exception remains under judicial review",
      body:
        "Indian law still exempts a husband from rape charges for non-consensual sex with his wife. The exception has been challenged in multiple High Court and Supreme Court cases; as of now, the exception stands, with the matter still pending final resolution.",
      topics: ["safety-justice", "rights-policy"],
      source: "Scroll.in",
      isContested: true,
      contestedNote:
        "This is an active, contested legal question — courts, lawmakers, and advocacy groups remain split on whether and how to remove the exception. This card states where the law currently stands, not where it should end up.",
    },
    {
      headline: "Menstrual leave policy remains patchy across Indian workplaces",
      body:
        "A handful of states and companies have introduced menstrual leave in recent years, while most workplaces offer none. The debate continues between those who see it as overdue recognition and those who worry it could affect hiring of women — the policy landscape stays fragmented.",
      topics: ["work-money", "health-wellness"],
      source: "Feminism in India",
    },
    {
      headline: "Maternity Benefit Act's 26-week leave rarely reaches informal workers",
      body:
        "India's Maternity Benefit Act guarantees 26 weeks of paid leave — but it legally applies only to formal-sector establishments. The vast majority of Indian women work informally, where the guarantee mostly doesn't reach them at all.",
      topics: ["work-money", "rights-policy"],
      source: "BehanBox",
    },
    {
      headline: "Women's political reservation law awaits delimitation to take effect",
      body:
        "The Nari Shakti Vandan Adhiniyam reserves a third of Lok Sabha and state assembly seats for women — but its rollout is tied to the next delimitation and census, meaning implementation is still years away by the law's own text.",
      topics: ["rights-policy"],
      source: "The Hindu",
    },
    {
      headline: "Two-finger test banned, but reporting shows the practice persists",
      body:
        "The Supreme Court outlawed the so-called 'two-finger test' in sexual assault medical exams in 2013, calling it unconstitutional. Investigative reporting since has repeatedly found hospitals in several states still using it, despite the ban.",
      topics: ["safety-justice", "health-wellness"],
      source: "BehanBox",
    },
    {
      headline: "Anganwadi and ASHA workers, mostly women, still classified as 'volunteers'",
      body:
        "Millions of frontline health and childcare workers — nearly all women — are paid fixed 'honorariums' rather than wages, since they're officially classified as volunteers, not employees. Unions have long pushed for formal worker status; the classification hasn't changed.",
      topics: ["work-money", "health-wellness"],
      source: "ISignal",
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
        status: "published",
        primaryTopicId: topicBySlug[nc.topics[0]],
        headline: nc.headline,
        slug,
        body: nc.body,
        deepDiveBody: getDemoDeepDive(nc.headline) ?? null,
        imagePath: img.path,
        imageAlt: "Illustrative graphic",
        imageWidth: img.width,
        imageHeight: img.height,
        imageBlurDataUrl: img.blurDataURL,
        publishedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isContested: nc.isContested ?? false,
        contestedNote: nc.contestedNote ?? null,
        sourceId: sourceByName[nc.source],
        sourceDate: new Date().toISOString().slice(0, 10),
      })
      .returning({ id: cards.id });

    seededCardIds.push(row.id);

    await db.insert(cardTopics).values(nc.topics.map((t) => ({ cardId: row.id, topicId: topicBySlug[t] })));
  }

  const editionDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [edition] = await db
    .insert(editions)
    .values({
      editionDate,
      status: "published",
      publishedAt: new Date().toISOString(),
      scheduledFor: new Date(`${editionDate}T01:30:00.000Z`).toISOString(),
    })
    .onConflictDoNothing()
    .returning({ id: editions.id });

  if (edition) {
    const composition = [
      [seededCardIds[2], "anchor", "A progress signal to open the day with agency", true, "low"],
      [seededCardIds[10], "for_you", "A workplace conversation with practical relevance", false, "low"],
      [seededCardIds[3], "number", "A verified number with the trade-offs kept visible", false, "low"],
      [seededCardIds[11], "useful_now", "Know where a workplace protection reaches and where it does not", false, "medium"],
      [seededCardIds[14], "beyond_metro", "A grounded story about the women holding public systems together", false, "low"],
      [seededCardIds[12], "another_lens", "A clear view of what the law promises and when it begins", false, "low"],
      [seededCardIds[1], "lift", "End with measurable progress while keeping the distance left to travel honest", false, "medium"],
    ] as const;

    await db.insert(editionCards).values(
      composition.map(([cardId, role, recommendationReason, isMandatory, distressLevel], position) => ({
        editionId: edition.id,
        cardId,
        position,
        role,
        recommendationReason,
        isMandatory,
        editorialImportance: role === "anchor" ? 100 : 65,
        practicalUtility: role === "useful_now" ? 100 : 60,
        distressLevel,
      }))
    );
  }

  console.log(`Seeded ${topicRows.length} topics, ${sourceRows.length} sources, ${dataCards.length + newsCards.length} cards.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

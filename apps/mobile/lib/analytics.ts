import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AnalyticsEventInput, AnalyticsEventType } from "@repo/api-client";

import { api } from "./api";

const INSTALLATION_ID_KEY = "titli-analytics-installation-id";
const EVENT_QUEUE_KEY = "titli-analytics-event-queue";
const sessionId = makeId("session");

type EventDetails = Omit<
  AnalyticsEventInput,
  "installationId" | "sessionId" | "eventType" | "occurredAt"
>;

type QueuedEvent = AnalyticsEventInput & { queueId: string };

let installationIdPromise: Promise<string> | null = null;
let queueWrite = Promise.resolve();
let flushPromise: Promise<void> | null = null;

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function getInstallationId() {
  if (!installationIdPromise) {
    installationIdPromise = (async () => {
      const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
      if (existing) return existing;
      const created = makeId("install");
      await AsyncStorage.setItem(INSTALLATION_ID_KEY, created);
      return created;
    })();
  }
  return installationIdPromise;
}

async function readQueue(): Promise<QueuedEvent[]> {
  const raw = await AsyncStorage.getItem(EVENT_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function trackEvent(eventType: AnalyticsEventType, details: EventDetails = {}) {
  const write = queueWrite.then(async () => {
    const installationId = await getInstallationId();
    const queue = await readQueue();
    queue.push({
      queueId: makeId("event"),
      installationId,
      sessionId,
      eventType,
      occurredAt: new Date().toISOString(),
      ...details,
    });
    await AsyncStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue.slice(-500)));
  });
  queueWrite = write.catch(() => undefined);
  void write.then(() => flushEvents()).catch(() => undefined);
}

export function flushEvents(): Promise<void> {
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    while (true) {
      await queueWrite.catch(() => undefined);
      const queue = await readQueue();
      const batch = queue.slice(0, 50);
      if (batch.length === 0) return;

      const acceptedIds = new Set(batch.map((event) => event.queueId));
      const payload = batch.map(({ queueId: _queueId, ...event }) => event);
      await api.trackEvents(payload);

      const removeAccepted = queueWrite.then(async () => {
        const latest = await readQueue();
        await AsyncStorage.setItem(
          EVENT_QUEUE_KEY,
          JSON.stringify(latest.filter((event) => !acceptedIds.has(event.queueId)))
        );
      });
      queueWrite = removeAccepted.catch(() => undefined);
      await removeAccepted;
    }
  })()
    .catch(() => undefined)
    .finally(() => {
      flushPromise = null;
    });

  return flushPromise;
}

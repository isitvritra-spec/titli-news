import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  applyReaderSignal,
  createReaderProfile,
  parseReaderProfile,
  type ReaderProfile,
  type ReaderSignal,
} from "./personalization";

const READER_PROFILE_KEY = "titli-reader-profile:v1";
let profileWrite = Promise.resolve<ReaderProfile>(createReaderProfile());

export async function readReaderProfile(): Promise<ReaderProfile> {
  const raw = await AsyncStorage.getItem(READER_PROFILE_KEY);
  if (!raw) return createReaderProfile();

  try {
    return parseReaderProfile(JSON.parse(raw));
  } catch {
    return createReaderProfile();
  }
}

export function recordReaderSignal(
  signal: ReaderSignal,
  topicSlugs: readonly string[],
): Promise<ReaderProfile> {
  const write = profileWrite.then(async () => {
    const profile = await readReaderProfile();
    const updated = applyReaderSignal(profile, signal, topicSlugs);
    if (updated !== profile) {
      await AsyncStorage.setItem(READER_PROFILE_KEY, JSON.stringify(updated));
    }
    return updated;
  });

  profileWrite = write.catch(() => createReaderProfile());
  return profileWrite;
}

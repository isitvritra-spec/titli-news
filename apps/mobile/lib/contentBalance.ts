import type { HotStory } from "@repo/api-client";

const INTENSE_PATTERN = /violence|rape|assault|harassment|nirbhaya|two-finger|posh|child marriage/i;

export function isIntenseStory(story: HotStory): boolean {
  return story.card.primaryGenre?.slug === "safety-justice"
    || INTENSE_PATTERN.test(story.card.headline);
}

export function selectBalancedHotStories(stories: readonly HotStory[], limit = 5): HotStory[] {
  const calmer = stories.filter((story) => !isIntenseStory(story));
  const intense = stories.filter(isIntenseStory);
  const result: HotStory[] = [];

  while (result.length < limit && (calmer.length > 0 || intense.length > 0)) {
    if (calmer.length > 0) result.push(calmer.shift()!);
    if (result.length < limit && intense.length > 0) result.push(intense.shift()!);
  }

  return result;
}

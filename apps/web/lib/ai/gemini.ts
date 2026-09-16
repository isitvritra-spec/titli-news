/**
 * Minimal Gemini client over plain fetch — no SDK, matching this project's
 * self-hosted, zero-extra-dependency approach. It is only ever reached when
 * GEMINI_API_KEY is set; without it the whole AI path is dormant and the editor
 * writes cards by hand exactly as before.
 *
 * The model and base URL are env-configurable on purpose: Google's model names
 * move, so a newer Flash model is a GEMINI_MODEL change rather than a code edit.
 */

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 30_000;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

type JsonSchema = Record<string, unknown>;

/**
 * Sends one prompt and parses a JSON object back, constrained by `schema`
 * (Gemini's structured-output mode). Throws on a missing key, an HTTP error, or
 * unparseable output — the caller decides how to surface that to the editor.
 */
export async function generateJson<T>(options: {
  system?: string;
  prompt: string;
  schema: JsonSchema;
  temperature?: number;
}): Promise<T> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const base = process.env.GEMINI_BASE_URL?.trim() || DEFAULT_BASE;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        ...(options.system ? { systemInstruction: { parts: [{ text: options.system }] } } : {}),
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          responseMimeType: "application/json",
          responseSchema: options.schema,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") throw new Error("Gemini returned no text");

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// Client-only: tesseract.js pulls in web workers/wasm, so this must never be imported
// from a Server Component. Workers are cached per language set so re-scanning within
// the same session doesn't re-download the trained data.

const LOCALE_TESSERACT_LANGS: Record<string, string[]> = {
  en: ["eng"],
  ja: ["eng", "jpn"],
  es: ["eng", "spa"],
};

const workers = new Map<string, Promise<import("tesseract.js").Worker>>();

async function getWorker(locale: string) {
  const langs = LOCALE_TESSERACT_LANGS[locale] ?? ["eng"];
  const key = langs.join("+");
  let worker = workers.get(key);
  if (!worker) {
    worker = import("tesseract.js").then(({ createWorker }) => createWorker(langs));
    workers.set(key, worker);
  }
  return worker;
}

export async function recognizeText(image: string, locale: string): Promise<string> {
  const worker = await getWorker(locale);
  const { data } = await worker.recognize(image);
  return data.text;
}

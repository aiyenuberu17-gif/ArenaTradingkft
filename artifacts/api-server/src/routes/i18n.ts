import { Router, type Request, type Response, type IRouter } from "express";

const router: IRouter = Router();

const supportedLanguageAliases = new Map<string, string>([
  ["da", "da"],
  ["dk", "da"],
  ["danish", "da"],
  ["en", "en"],
  ["gb", "en"],
  ["uk", "en"],
  ["us", "en"],
  ["ie", "en"],
  ["english", "en"],
  ["de", "de"],
  ["deu", "de"],
  ["at", "de"],
  ["ch", "de"],
  ["german", "de"],
  ["fr", "fr"],
  ["fra", "fr"],
  ["be", "fr"],
  ["ca", "fr"],
  ["french", "fr"],
  ["es", "es"],
  ["esp", "es"],
  ["mx", "es"],
  ["ar", "es"],
  ["spanish", "es"],
  ["nl", "nl"],
  ["nld", "nl"],
  ["dutch", "nl"],
  ["zh", "zh"],
  ["cn", "zh"],
  ["chinese", "zh"],
  ["ko", "ko"],
  ["kr", "ko"],
  ["korean", "ko"],
  ["pt", "pt"],
  ["br", "pt"],
  ["ptb", "pt"],
  ["portuguese", "pt"],
]);

function normalizeAcceptedLanguage(value: string | undefined): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const preferred = value
    .split(",")
    .map((entry) => entry.trim().split(";")[0])
    .find((language) => language && language !== "*");

  if (!preferred) {
    return null;
  }

  const normalized = preferred.toLowerCase();
  const prefix = normalized.split("-")[0];

  if (supportedLanguageAliases.has(prefix)) {
    return supportedLanguageAliases.get(prefix) ?? null;
  }

  return null;
}

function coerceCountryCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function ipCountryToLanguage(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const code = value.trim().toUpperCase();
  const map: Record<string, string> = {
    DK: "da",
    DE: "de",
    FR: "fr",
    ES: "es",
    GB: "en",
    UK: "en",
    IE: "en",
    US: "en",
    NL: "nl",
    CN: "zh",
    KR: "ko",
    BR: "pt",
  };

  return map[code] ?? null;
}

// Router is mounted under `/api` in the app bootstrap, so define paths
// relative to that base here (e.g. `/i18n/...`).
router.get("/i18n/language-detection", (req: Request, res: Response) => {
  const acceptLanguage = req.headers["accept-language"];
  const cfCountry = coerceCountryCode(req.headers["cf-ipcountry"] ?? req.headers["x-country-code"] ?? req.headers["cf-ipcountry"]);
  const ipLanguage = ipCountryToLanguage(cfCountry);
  const headerLanguage = normalizeAcceptedLanguage(typeof acceptLanguage === "string" ? acceptLanguage : undefined);

  const detectedLanguage = ipLanguage ?? headerLanguage ?? "da";
  const source = ipLanguage ? "ip" : headerLanguage ? "browser" : "browser";

  res.json({ language: detectedLanguage, source });
});

export default router;

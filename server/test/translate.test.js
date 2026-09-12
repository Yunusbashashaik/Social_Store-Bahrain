import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { translateEnglishToArabic } from "../src/services/translate.js";

describe("English to Arabic translation", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses MyMemory when it returns Arabic", async () => {
    globalThis.fetch = async (url) => {
      assert.match(String(url), /mymemory/);
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            responseData: { translatedText: "الملف الشخصي" },
          }),
      };
    };
    const text = await translateEnglishToArabic("Personal Profile");
    assert.equal(text, "الملف الشخصي");
  });

  it("falls back when MyMemory returns a quota warning", async () => {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      if (String(url).includes("mymemory")) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              responseData: {
                translatedText:
                  "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY",
              },
            }),
        };
      }
      if (String(url).includes("clients5.google.com")) {
        return {
          ok: true,
          text: async () => JSON.stringify(["استمتع بالبث"]),
        };
      }
      throw new Error(`unexpected url ${url}`);
    };
    const text = await translateEnglishToArabic("Enjoy streaming");
    assert.equal(text, "استمتع بالبث");
    assert.equal(calls.length, 2);
  });

  it("keeps emoji-only lines and translates English lines", async () => {
    globalThis.fetch = async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          responseData: { translatedText: "دعم على مدار الساعة" },
        }),
    });
    const text = await translateEnglishToArabic("✨\n24/7 Support");
    assert.equal(text, "✨\nدعم على مدار الساعة");
  });
});

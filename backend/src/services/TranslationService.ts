import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';
import crypto from 'crypto';

type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'ja'];

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
};

export class TranslationService {
  async translateText(text: string, targetLang: string): Promise<string> {
    if (targetLang === 'en') return text;

    const cacheKey = `translation:${this.getTextHash(text)}:${targetLang}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const translated = await this.performTranslation(text, targetLang);
    await cacheSet(cacheKey, translated, 3600);
    return translated;
  }

  async translateToAll(text: string, excludeLang: string = 'en'): Promise<Record<string, string>> {
    const translations: Record<string, string> = { en: text };

    const langsToTranslate = SUPPORTED_LANGUAGES.filter((l) => l !== 'en');

    const results = await Promise.allSettled(
      langsToTranslate.map((lang) => this.translateText(text, lang))
    );

    results.forEach((result, idx) => {
      const lang = langsToTranslate[idx];
      if (result.status === 'fulfilled') {
        translations[lang] = result.value;
      } else {
        translations[lang] = text;
        logger.warn('Translation failed', { lang, error: result.reason });
      }
    });

    return translations;
  }

  async translateAnnouncement(text: string): Promise<Record<string, string>> {
    return this.translateToAll(text);
  }

  getSupportedLanguages(): { code: string; name: string }[] {
    const SUPPORTED_LANGS = ['en', 'es', 'fr', 'de', 'ja'] as const;
    return SUPPORTED_LANGS.map((code) => ({
      code,
      name: LANGUAGE_NAMES[code] || code,
    }));
  }

  private async performTranslation(text: string, targetLang: string): Promise<string> {
    // Google Translate API or fallback to simple mock
    // In production, integrate with Google Translate or AWS Translate
    try {
      if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        return await this.googleTranslate(text, targetLang);
      }
    } catch (error: any) {
      logger.warn('Google Translate failed, using fallback', { error: error.message });
    }

    return this.mockTranslate(text, targetLang);
  }

  private async googleTranslate(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: 'en',
      }),
    });

    const data = await response.json() as any;
    return data.data.translations[0].translatedText;
  }

  private mockTranslate(text: string, targetLang: string): string {
    const prefixes: Record<string, string> = {
      es: '[ES] ',
      fr: '[FR] ',
      de: '[DE] ',
      ja: '[JA] ',
    };
    return `${prefixes[targetLang] || ''}${text}`;
  }

  private getTextHash(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }
}

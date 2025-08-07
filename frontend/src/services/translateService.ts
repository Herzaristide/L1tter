export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationError {
  error: string;
  message: string;
}

class TranslateService {
  private readonly apiUrl = 'http://localhost:5000/translate';
  private readonly detectUrl = 'http://localhost:5000/detect';
  private readonly languagesUrl = 'http://localhost:5000/languages';

  /**
   * Translate text to French using LibreTranslate API
   */
  async translateToFrench(
    text: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new Error('No text to translate');
      }

      // If source language is not provided, detect it first
      let sourceLang = sourceLanguage;
      if (!sourceLang) {
        sourceLang = await this.detectLanguage(trimmedText);
      }

      // Fallback to 'en' if detection fails or unsupported
      const supportedLangs = [
        'en',
        'fr',
        'es',
        'de',
        'it',
        'pt',
        'ru',
        'zh',
        'ja',
        'ko',
      ];
      if (!supportedLangs.includes(sourceLang)) {
        sourceLang = 'en';
      }

      // Skip translation if source is already French
      if (sourceLang === 'fr') {
        return {
          translatedText: trimmedText,
          sourceLanguage: 'fr',
          targetLanguage: 'fr',
        };
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: trimmedText,
          source: sourceLang,
          target: 'fr',
          format: 'text',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Translation failed: ${response.status} ${response.statusText} ${errorText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        translatedText: data.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: 'fr',
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(
        error instanceof Error
          ? `Translation failed: ${error.message}`
          : 'Translation service unavailable'
      );
    }
  }

  /**
   * Detect the language of the given text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(this.detectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Return the most confident language detection
      if (data.length > 0) {
        return data[0].language;
      }

      // Default to English if detection fails
      return 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      // Default to English if detection fails
      return 'en';
    }
  }

  /**
   * Translate text between any two languages
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      let sourceLang = sourceLanguage;
      if (!sourceLang) {
        sourceLang = await this.detectLanguage(text);
      }

      // Skip translation if source and target are the same
      if (sourceLang === targetLanguage) {
        return {
          translatedText: text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLanguage,
        };
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLanguage,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Translation failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        translatedText: data.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLanguage,
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(
        error instanceof Error
          ? `Translation failed: ${error.message}`
          : 'Translation service unavailable'
      );
    }
  }

  /**
   * Get supported languages from LibreTranslate
   */
  async getSupportedLanguages(): Promise<
    Array<{ code: string; name: string }>
  > {
    try {
      const response = await fetch(this.languagesUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }

      const languages = await response.json();
      return languages;
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      // Return common languages as fallback
      return [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'French' },
        { code: 'es', name: 'Spanish' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
      ];
    }
  }
}

export const translateService = new TranslateService();

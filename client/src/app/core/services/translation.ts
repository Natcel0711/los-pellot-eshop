import { Service, signal } from '@angular/core';
import { Lang, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'lp_lang';

// Lightweight runtime i18n — no build-per-locale, just a signal that flips
// the active dictionary so the whole app re-renders in the new language.
@Service()
export class Translation {
  private readonly current = signal<Lang>(this.detectInitial());

  readonly lang = this.current.asReadonly();

  t(key: string, params?: Record<string, string | number>): string {
    let value = TRANSLATIONS[this.current()][key] ?? TRANSLATIONS.es[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`{{${name}}}`, String(replacement));
      }
    }
    return value;
  }

  // Category names come from the database (admin-editable, Spanish-only),
  // so translate the known seeded categories by id and fall back to the
  // raw DB name for anything an admin has added or renamed.
  categoryLabel(id: string, fallbackName: string): string {
    return TRANSLATIONS[this.current()][`category.${id}`] ?? fallbackName;
  }

  setLang(lang: Lang): void {
    this.current.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — choice just won't persist across reloads */
    }
  }

  toggle(): void {
    this.setLang(this.current() === 'es' ? 'en' : 'es');
  }

  private detectInitial(): Lang {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  }
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'es-419' | 'es-ES';
export const LOCALE_STORAGE_KEY = 'pokemon-team-generator:locale';

const SPAIN_VARIANTS: Record<string, string> = {
  'Guardados': 'Equipos guardados',
  'Elige tu juego, marca tus límites y descubre a tus próximos compañeros.':
    'Escoge tu juego, fija tus límites y descubre a tus próximos compañeros.',
  'Prepara tu expedición': 'Prepara tu aventura',
  'Métodos disponibles': 'Métodos de obtención',
  'Equipo generado respetando tus reglas.': 'Equipo creado respetando tus reglas.',
  'Gestiona toda tu colección': 'Organiza toda tu colección',
  'Configura tus regiones y genera tu colección': 'Configura tus regiones y crea tu colección',
  'Generar colección': 'Crear colección',
  'Tu mochila de equipos': 'Tu colección de equipos',
  'Aún no guardaste equipos': 'Todavía no has guardado equipos',
  'Guardados en este navegador. Puedes volver a cualquiera cuando quieras.':
    'Se guardan en este navegador. Puedes recuperarlos cuando quieras.',
  'Genera una expedición y usa “Guardar equipo”.':
    'Genera un equipo y pulsa «Guardar equipo».',
  'Ir al generador': 'Volver al generador',
  'Cada formato conserva su propio borrador en este navegador.':
    'Cada formato mantiene un borrador distinto en este navegador.',
  'Elige una coincidencia': 'Escoge una coincidencia',
  'Pokémon del espacio seleccionado': 'Pokémon de la casilla seleccionada',
  'Espacio': 'Casilla',
  'Tu aventura. Tus reglas.': 'Tu aventura. Tus reglas.',
};

export function translate(value: string, locale: Locale): string {
  return locale === 'es-ES' ? SPAIN_VARIANTS[value] ?? value : value;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (value: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) === 'es-ES' ? 'es-ES' : 'es-419';
  } catch {
    return 'es-419';
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Browser storage may be unavailable; selection remains in memory.
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale, setLocale, t: (key: string) => translate(key, locale)
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// Standalone page embeds and old unit tests can render without the app shell.
// Keep a stable, neutral default instead of crashing the generator.
const FALLBACK_LOCALE: LocaleContextValue = {
  locale: 'es-419',
  setLocale: () => undefined,
  t: (key: string) => key
};

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext) ?? FALLBACK_LOCALE;
}

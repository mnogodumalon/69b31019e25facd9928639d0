// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface KursleiterVerwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    telefon?: string;
    yoga_stil?: LookupValue[];
    biografie?: string;
    foto?: string;
    email?: string;
  };
}

export interface KursVerwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kursgebuehr?: number;
    kursname?: string;
    kursbeschreibung?: string;
    yoga_stil_kurs?: LookupValue;
    niveau?: LookupValue;
    kursleiter?: string; // applookup -> URL zu 'KursleiterVerwaltung' Record
    wochentag?: LookupValue;
    startzeit?: string;
    endzeit?: string;
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    enddatum?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    max_teilnehmer?: number;
  };
}

export interface TeilnehmerAnmeldung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gesundheitshinweise?: string;
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    einverstaendnis?: boolean;
    teilnehmer_vorname?: string;
    teilnehmer_nachname?: string;
    teilnehmer_email?: string;
    teilnehmer_telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kurs?: string; // applookup -> URL zu 'KursVerwaltung' Record
    erfahrungslevel?: LookupValue;
  };
}

export const APP_IDS = {
  KURSLEITER_VERWALTUNG: '69b30fff0a134593baec686c',
  KURS_VERWALTUNG: '69b31003a9aa2b70f81275a4',
  TEILNEHMER_ANMELDUNG: '69b310033fe9f7cfd2c5e838',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'kursleiter_verwaltung': {
    yoga_stil: [{ key: "hatha", label: "Hatha Yoga" }, { key: "vinyasa", label: "Vinyasa Yoga" }, { key: "yin", label: "Yin Yoga" }, { key: "ashtanga", label: "Ashtanga Yoga" }, { key: "kundalini", label: "Kundalini Yoga" }, { key: "restorative", label: "Restorative Yoga" }, { key: "power", label: "Power Yoga" }, { key: "bikram", label: "Bikram Yoga" }],
  },
  'kurs_verwaltung': {
    yoga_stil_kurs: [{ key: "vinyasa", label: "Vinyasa Yoga" }, { key: "hatha", label: "Hatha Yoga" }, { key: "yin", label: "Yin Yoga" }, { key: "ashtanga", label: "Ashtanga Yoga" }, { key: "kundalini", label: "Kundalini Yoga" }, { key: "restorative", label: "Restorative Yoga" }, { key: "power", label: "Power Yoga" }, { key: "bikram", label: "Bikram Yoga" }],
    niveau: [{ key: "anfaenger", label: "Anfänger" }, { key: "mittelstufe", label: "Mittelstufe" }, { key: "fortgeschrittene", label: "Fortgeschrittene" }, { key: "alle", label: "Alle Niveaus" }],
    wochentag: [{ key: "montag", label: "Montag" }, { key: "dienstag", label: "Dienstag" }, { key: "mittwoch", label: "Mittwoch" }, { key: "donnerstag", label: "Donnerstag" }, { key: "freitag", label: "Freitag" }, { key: "samstag", label: "Samstag" }, { key: "sonntag", label: "Sonntag" }],
  },
  'teilnehmer_anmeldung': {
    erfahrungslevel: [{ key: "anfaenger", label: "Anfänger" }, { key: "mittelstufe", label: "Mittelstufe" }, { key: "fortgeschrittene", label: "Fortgeschrittene" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kursleiter_verwaltung': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'telefon': 'string/tel',
    'yoga_stil': 'multiplelookup/checkbox',
    'biografie': 'string/textarea',
    'foto': 'file',
    'email': 'string/email',
  },
  'kurs_verwaltung': {
    'kursgebuehr': 'number',
    'kursname': 'string/text',
    'kursbeschreibung': 'string/textarea',
    'yoga_stil_kurs': 'lookup/select',
    'niveau': 'lookup/radio',
    'kursleiter': 'applookup/select',
    'wochentag': 'lookup/select',
    'startzeit': 'string/text',
    'endzeit': 'string/text',
    'startdatum': 'date/date',
    'enddatum': 'date/date',
    'ort': 'string/text',
    'max_teilnehmer': 'number',
  },
  'teilnehmer_anmeldung': {
    'gesundheitshinweise': 'string/textarea',
    'anmeldedatum': 'date/date',
    'einverstaendnis': 'bool',
    'teilnehmer_vorname': 'string/text',
    'teilnehmer_nachname': 'string/text',
    'teilnehmer_email': 'string/email',
    'teilnehmer_telefon': 'string/tel',
    'geburtsdatum': 'date/date',
    'kurs': 'applookup/select',
    'erfahrungslevel': 'lookup/radio',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKursleiterVerwaltung = StripLookup<KursleiterVerwaltung['fields']>;
export type CreateKursVerwaltung = StripLookup<KursVerwaltung['fields']>;
export type CreateTeilnehmerAnmeldung = StripLookup<TeilnehmerAnmeldung['fields']>;
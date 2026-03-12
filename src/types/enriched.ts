import type { KursVerwaltung, TeilnehmerAnmeldung } from './app';

export type EnrichedKursVerwaltung = KursVerwaltung & {
  kursleiterName: string;
};

export type EnrichedTeilnehmerAnmeldung = TeilnehmerAnmeldung & {
  kursName: string;
};

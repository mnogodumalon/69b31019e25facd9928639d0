import type { EnrichedKursVerwaltung, EnrichedTeilnehmerAnmeldung } from '@/types/enriched';
import type { KursVerwaltung, KursleiterVerwaltung, TeilnehmerAnmeldung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface KursVerwaltungMaps {
  kursleiterVerwaltungMap: Map<string, KursleiterVerwaltung>;
}

export function enrichKursVerwaltung(
  kursVerwaltung: KursVerwaltung[],
  maps: KursVerwaltungMaps
): EnrichedKursVerwaltung[] {
  return kursVerwaltung.map(r => ({
    ...r,
    kursleiterName: resolveDisplay(r.fields.kursleiter, maps.kursleiterVerwaltungMap, 'vorname', 'nachname'),
  }));
}

interface TeilnehmerAnmeldungMaps {
  kursVerwaltungMap: Map<string, KursVerwaltung>;
}

export function enrichTeilnehmerAnmeldung(
  teilnehmerAnmeldung: TeilnehmerAnmeldung[],
  maps: TeilnehmerAnmeldungMaps
): EnrichedTeilnehmerAnmeldung[] {
  return teilnehmerAnmeldung.map(r => ({
    ...r,
    kursName: resolveDisplay(r.fields.kurs, maps.kursVerwaltungMap, 'kursname'),
  }));
}

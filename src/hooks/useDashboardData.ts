import { useState, useEffect, useMemo, useCallback } from 'react';
import type { KursleiterVerwaltung, KursVerwaltung, TeilnehmerAnmeldung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [kursleiterVerwaltung, setKursleiterVerwaltung] = useState<KursleiterVerwaltung[]>([]);
  const [kursVerwaltung, setKursVerwaltung] = useState<KursVerwaltung[]>([]);
  const [teilnehmerAnmeldung, setTeilnehmerAnmeldung] = useState<TeilnehmerAnmeldung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [kursleiterVerwaltungData, kursVerwaltungData, teilnehmerAnmeldungData] = await Promise.all([
        LivingAppsService.getKursleiterVerwaltung(),
        LivingAppsService.getKursVerwaltung(),
        LivingAppsService.getTeilnehmerAnmeldung(),
      ]);
      setKursleiterVerwaltung(kursleiterVerwaltungData);
      setKursVerwaltung(kursVerwaltungData);
      setTeilnehmerAnmeldung(teilnehmerAnmeldungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const kursleiterVerwaltungMap = useMemo(() => {
    const m = new Map<string, KursleiterVerwaltung>();
    kursleiterVerwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kursleiterVerwaltung]);

  const kursVerwaltungMap = useMemo(() => {
    const m = new Map<string, KursVerwaltung>();
    kursVerwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kursVerwaltung]);

  return { kursleiterVerwaltung, setKursleiterVerwaltung, kursVerwaltung, setKursVerwaltung, teilnehmerAnmeldung, setTeilnehmerAnmeldung, loading, error, fetchAll, kursleiterVerwaltungMap, kursVerwaltungMap };
}
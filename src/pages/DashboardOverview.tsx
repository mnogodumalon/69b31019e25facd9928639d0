import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichKursVerwaltung, enrichTeilnehmerAnmeldung } from '@/lib/enrich';
import type { EnrichedKursVerwaltung } from '@/types/enriched';
import type { KursVerwaltung, TeilnehmerAnmeldung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Pencil, Trash2, Users, BookOpen, Clock, MapPin, Euro, ChevronRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { KursVerwaltungDialog } from '@/components/dialogs/KursVerwaltungDialog';
import { TeilnehmerAnmeldungDialog } from '@/components/dialogs/TeilnehmerAnmeldungDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

const WEEKDAYS = [
  { key: 'montag', label: 'Mo' },
  { key: 'dienstag', label: 'Di' },
  { key: 'mittwoch', label: 'Mi' },
  { key: 'donnerstag', label: 'Do' },
  { key: 'freitag', label: 'Fr' },
  { key: 'samstag', label: 'Sa' },
  { key: 'sonntag', label: 'So' },
];

const STIL_COLORS: Record<string, string> = {
  vinyasa: 'bg-violet-100 text-violet-700 border-violet-200',
  hatha: 'bg-amber-100 text-amber-700 border-amber-200',
  yin: 'bg-blue-100 text-blue-700 border-blue-200',
  ashtanga: 'bg-orange-100 text-orange-700 border-orange-200',
  kundalini: 'bg-pink-100 text-pink-700 border-pink-200',
  restorative: 'bg-teal-100 text-teal-700 border-teal-200',
  power: 'bg-red-100 text-red-700 border-red-200',
  bikram: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const NIVEAU_COLORS: Record<string, string> = {
  anfaenger: 'bg-green-100 text-green-700',
  mittelstufe: 'bg-yellow-100 text-yellow-700',
  fortgeschrittene: 'bg-red-100 text-red-700',
  alle: 'bg-slate-100 text-slate-600',
};

export default function DashboardOverview() {
  const {
    kursleiterVerwaltung, kursVerwaltung, teilnehmerAnmeldung,
    kursleiterVerwaltungMap, kursVerwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedKursVerwaltung = enrichKursVerwaltung(kursVerwaltung, { kursleiterVerwaltungMap });
  const enrichedTeilnehmerAnmeldung = enrichTeilnehmerAnmeldung(teilnehmerAnmeldung, { kursVerwaltungMap });

  // Dialog state
  const [kursDialogOpen, setKursDialogOpen] = useState(false);
  const [editKurs, setEditKurs] = useState<EnrichedKursVerwaltung | null>(null);
  const [deleteKursTarget, setDeleteKursTarget] = useState<EnrichedKursVerwaltung | null>(null);

  const [anmeldungDialogOpen, setAnmeldungDialogOpen] = useState(false);
  const [editAnmeldung, setEditAnmeldung] = useState<TeilnehmerAnmeldung | null>(null);
  const [preselectedKursId, setPreselectedKursId] = useState<string | undefined>(undefined);
  const [deleteAnmeldungTarget, setDeleteAnmeldungTarget] = useState<TeilnehmerAnmeldung | null>(null);

  // Selected course for detail panel
  const [selectedKursId, setSelectedKursId] = useState<string | null>(null);

  // Filter state
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activeStil, setActiveStil] = useState<string | null>(null);

  // Computed stats
  const totalKurse = kursVerwaltung.length;
  const totalLeiter = kursleiterVerwaltung.length;
  const totalAnmeldungen = teilnehmerAnmeldung.length;
  const totalRevenue = useMemo(() => {
    return kursVerwaltung.reduce((sum, k) => sum + (k.fields.kursgebuehr ?? 0), 0);
  }, [kursVerwaltung]);

  // Filtered courses
  const filteredKurse = useMemo(() => {
    return enrichedKursVerwaltung.filter(k => {
      if (activeDay && k.fields.wochentag?.key !== activeDay) return false;
      if (activeStil && k.fields.yoga_stil_kurs?.key !== activeStil) return false;
      return true;
    });
  }, [enrichedKursVerwaltung, activeDay, activeStil]);

  // Group courses by weekday
  const coursesByDay = useMemo(() => {
    const grouped: Record<string, EnrichedKursVerwaltung[]> = {};
    WEEKDAYS.forEach(d => { grouped[d.key] = []; });
    filteredKurse.forEach(k => {
      const day = k.fields.wochentag?.key;
      if (day && grouped[day]) {
        grouped[day].push(k);
      } else {
        if (!grouped['ohne']) grouped['ohne'] = [];
        grouped['ohne'].push(k);
      }
    });
    return grouped;
  }, [filteredKurse]);

  // Selected course detail
  const selectedKurs = useMemo(() => {
    if (!selectedKursId) return null;
    return enrichedKursVerwaltung.find(k => k.record_id === selectedKursId) ?? null;
  }, [selectedKursId, enrichedKursVerwaltung]);

  const selectedKursTeilnehmer = useMemo(() => {
    if (!selectedKursId) return [];
    return enrichedTeilnehmerAnmeldung.filter(t => {
      const id = extractRecordId(t.fields.kurs);
      return id === selectedKursId;
    });
  }, [selectedKursId, enrichedTeilnehmerAnmeldung]);

  // Active yoga styles in current data
  const activeStile = useMemo(() => {
    const styles = new Set<string>();
    enrichedKursVerwaltung.forEach(k => {
      if (k.fields.yoga_stil_kurs?.key) styles.add(k.fields.yoga_stil_kurs.key);
    });
    return Array.from(styles);
  }, [enrichedKursVerwaltung]);

  const handleCreateKurs = useCallback(async (fields: KursVerwaltung['fields']) => {
    await LivingAppsService.createKursVerwaltungEntry(fields);
    fetchAll();
  }, [fetchAll]);

  const handleUpdateKurs = useCallback(async (fields: KursVerwaltung['fields']) => {
    if (!editKurs) return;
    await LivingAppsService.updateKursVerwaltungEntry(editKurs.record_id, fields);
    fetchAll();
  }, [editKurs, fetchAll]);

  const handleDeleteKurs = useCallback(async () => {
    if (!deleteKursTarget) return;
    await LivingAppsService.deleteKursVerwaltungEntry(deleteKursTarget.record_id);
    if (selectedKursId === deleteKursTarget.record_id) setSelectedKursId(null);
    setDeleteKursTarget(null);
    fetchAll();
  }, [deleteKursTarget, selectedKursId, fetchAll]);

  const handleCreateAnmeldung = useCallback(async (fields: TeilnehmerAnmeldung['fields']) => {
    await LivingAppsService.createTeilnehmerAnmeldungEntry(fields);
    fetchAll();
  }, [fetchAll]);

  const handleUpdateAnmeldung = useCallback(async (fields: TeilnehmerAnmeldung['fields']) => {
    if (!editAnmeldung) return;
    await LivingAppsService.updateTeilnehmerAnmeldungEntry(editAnmeldung.record_id, fields);
    fetchAll();
  }, [editAnmeldung, fetchAll]);

  const handleDeleteAnmeldung = useCallback(async () => {
    if (!deleteAnmeldungTarget) return;
    await LivingAppsService.deleteTeilnehmerAnmeldungEntry(deleteAnmeldungTarget.record_id);
    setDeleteAnmeldungTarget(null);
    fetchAll();
  }, [deleteAnmeldungTarget, fetchAll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wochenplan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle Yoga-Kurse auf einen Blick</p>
        </div>
        <Button onClick={() => { setEditKurs(null); setKursDialogOpen(true); }} className="shrink-0">
          <Plus size={16} className="mr-1.5 shrink-0" />
          Neuer Kurs
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Kurse gesamt"
          value={String(totalKurse)}
          description="aktive Kurse"
          icon={<BookOpen size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Kursleiter"
          value={String(totalLeiter)}
          description="Trainer"
          icon={<UserCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Anmeldungen"
          value={String(totalAnmeldungen)}
          description="Teilnehmer"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ges. Kursgebühren"
          value={formatCurrency(totalRevenue)}
          description="Summe"
          icon={<Euro size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-muted-foreground mr-1">Tag:</span>
        {WEEKDAYS.map(d => (
          <button
            key={d.key}
            onClick={() => setActiveDay(activeDay === d.key ? null : d.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeDay === d.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {d.label}
          </button>
        ))}
        {activeStile.length > 0 && (
          <>
            <span className="text-xs font-medium text-muted-foreground ml-3 mr-1">Stil:</span>
            {activeStile.map(stilKey => {
              const label = enrichedKursVerwaltung.find(k => k.fields.yoga_stil_kurs?.key === stilKey)?.fields.yoga_stil_kurs?.label ?? stilKey;
              return (
                <button
                  key={stilKey}
                  onClick={() => setActiveStil(activeStil === stilKey ? null : stilKey)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeStil === stilKey
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </>
        )}
        {(activeDay || activeStil) && (
          <button
            onClick={() => { setActiveDay(null); setActiveStil(null); }}
            className="px-3 py-1 rounded-full text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Main layout: week planner + detail panel */}
      <div className="flex flex-col xl:flex-row gap-5">
        {/* Week planner */}
        <div className="flex-1 min-w-0">
          {kursVerwaltung.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border bg-muted/20">
              <BookOpen size={48} className="text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold text-foreground">Noch keine Kurse</p>
                <p className="text-sm text-muted-foreground mt-1">Erstelle deinen ersten Kurs</p>
              </div>
              <Button variant="outline" onClick={() => { setEditKurs(null); setKursDialogOpen(true); }}>
                <Plus size={16} className="mr-1.5" /> Kurs erstellen
              </Button>
            </div>
          ) : filteredKurse.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border bg-muted/20">
              <p className="text-sm text-muted-foreground">Keine Kurse für diesen Filter</p>
              <button onClick={() => { setActiveDay(null); setActiveStil(null); }} className="text-xs text-primary underline">Filter entfernen</button>
            </div>
          ) : (
            <div className="space-y-4">
              {WEEKDAYS.filter(d => coursesByDay[d.key]?.length > 0).map(day => (
                <div key={day.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {day.label === 'Mo' ? 'Montag' :
                       day.label === 'Di' ? 'Dienstag' :
                       day.label === 'Mi' ? 'Mittwoch' :
                       day.label === 'Do' ? 'Donnerstag' :
                       day.label === 'Fr' ? 'Freitag' :
                       day.label === 'Sa' ? 'Samstag' : 'Sonntag'}
                    </h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{coursesByDay[day.key].length} Kurs{coursesByDay[day.key].length !== 1 ? 'e' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {coursesByDay[day.key]
                      .sort((a, b) => (a.fields.startzeit ?? '').localeCompare(b.fields.startzeit ?? ''))
                      .map(kurs => (
                        <KursCard
                          key={kurs.record_id}
                          kurs={kurs}
                          teilnehmerCount={enrichedTeilnehmerAnmeldung.filter(t => extractRecordId(t.fields.kurs) === kurs.record_id).length}
                          isSelected={selectedKursId === kurs.record_id}
                          onClick={() => setSelectedKursId(selectedKursId === kurs.record_id ? null : kurs.record_id)}
                          onEdit={() => { setEditKurs(kurs); setKursDialogOpen(true); }}
                          onDelete={() => setDeleteKursTarget(kurs)}
                        />
                      ))}
                  </div>
                </div>
              ))}
              {/* Courses without weekday */}
              {coursesByDay['ohne']?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kein Wochentag</h2>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {coursesByDay['ohne'].map(kurs => (
                      <KursCard
                        key={kurs.record_id}
                        kurs={kurs}
                        teilnehmerCount={enrichedTeilnehmerAnmeldung.filter(t => extractRecordId(t.fields.kurs) === kurs.record_id).length}
                        isSelected={selectedKursId === kurs.record_id}
                        onClick={() => setSelectedKursId(selectedKursId === kurs.record_id ? null : kurs.record_id)}
                        onEdit={() => { setEditKurs(kurs); setKursDialogOpen(true); }}
                        onDelete={() => setDeleteKursTarget(kurs)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedKurs && (
          <div className="xl:w-80 shrink-0">
            <div className="rounded-2xl border border-border bg-card overflow-hidden sticky top-4">
              {/* Course header */}
              <div className={`px-4 py-4 ${STIL_COLORS[selectedKurs.fields.yoga_stil_kurs?.key ?? ''] ?? 'bg-muted'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{selectedKurs.fields.kursname || 'Kurs'}</h3>
                    <p className="text-xs mt-0.5 opacity-70">{selectedKurs.fields.yoga_stil_kurs?.label ?? '—'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditKurs(selectedKurs); setKursDialogOpen(true); }}
                      className="p-1.5 rounded-lg bg-white/40 hover:bg-white/70 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteKursTarget(selectedKurs)}
                      className="p-1.5 rounded-lg bg-white/40 hover:bg-white/70 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Course info */}
              <div className="px-4 py-3 space-y-2.5 border-b border-border">
                {(selectedKurs.fields.startzeit || selectedKurs.fields.endzeit) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-foreground">{selectedKurs.fields.startzeit ?? '?'} – {selectedKurs.fields.endzeit ?? '?'}</span>
                  </div>
                )}
                {selectedKurs.fields.ort && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{selectedKurs.fields.ort}</span>
                  </div>
                )}
                {selectedKurs.kursleiterName && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{selectedKurs.kursleiterName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedKurs.fields.niveau && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${NIVEAU_COLORS[selectedKurs.fields.niveau.key ?? ''] ?? 'bg-muted text-muted-foreground'}`}>
                      {selectedKurs.fields.niveau.label}
                    </span>
                  )}
                  {selectedKurs.fields.kursgebuehr != null && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      {formatCurrency(selectedKurs.fields.kursgebuehr)}
                    </span>
                  )}
                  {selectedKurs.fields.max_teilnehmer != null && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      max. {selectedKurs.fields.max_teilnehmer} TN
                    </span>
                  )}
                </div>
                {selectedKurs.fields.startdatum && (
                  <div className="text-xs text-muted-foreground">
                    {formatDate(selectedKurs.fields.startdatum)} – {selectedKurs.fields.enddatum ? formatDate(selectedKurs.fields.enddatum) : '…'}
                  </div>
                )}
                {selectedKurs.fields.kursbeschreibung && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{selectedKurs.fields.kursbeschreibung}</p>
                )}
              </div>

              {/* Participants */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Users size={13} />
                    Anmeldungen
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                      {selectedKursTeilnehmer.length}
                      {selectedKurs.fields.max_teilnehmer ? `/${selectedKurs.fields.max_teilnehmer}` : ''}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setEditAnmeldung(null);
                      setPreselectedKursId(selectedKurs.record_id);
                      setAnmeldungDialogOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <Plus size={12} /> Anmelden
                  </button>
                </div>

                {/* Capacity bar */}
                {selectedKurs.fields.max_teilnehmer != null && selectedKurs.fields.max_teilnehmer > 0 && (
                  <div className="mb-2.5">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedKursTeilnehmer.length >= selectedKurs.fields.max_teilnehmer
                            ? 'bg-destructive'
                            : selectedKursTeilnehmer.length / selectedKurs.fields.max_teilnehmer > 0.8
                            ? 'bg-amber-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, (selectedKursTeilnehmer.length / selectedKurs.fields.max_teilnehmer) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedKursTeilnehmer.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">Noch keine Anmeldungen</p>
                ) : (
                  <ul className="space-y-1 max-h-56 overflow-y-auto">
                    {selectedKursTeilnehmer.map(t => (
                      <li key={t.record_id} className="flex items-center justify-between gap-2 py-1 group">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {t.fields.teilnehmer_vorname} {t.fields.teilnehmer_nachname}
                          </p>
                          {t.fields.teilnehmer_email && (
                            <p className="text-xs text-muted-foreground truncate">{t.fields.teilnehmer_email}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditAnmeldung(t); setPreselectedKursId(undefined); setAnmeldungDialogOpen(true); }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Pencil size={11} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteAnmeldungTarget(t)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={11} className="text-destructive" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kurs Dialog */}
      <KursVerwaltungDialog
        open={kursDialogOpen}
        onClose={() => { setKursDialogOpen(false); setEditKurs(null); }}
        onSubmit={editKurs ? handleUpdateKurs : handleCreateKurs}
        defaultValues={editKurs?.fields}
        kursleiter_verwaltungList={kursleiterVerwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['KursVerwaltung']}
      />

      {/* Anmeldung Dialog */}
      <TeilnehmerAnmeldungDialog
        open={anmeldungDialogOpen}
        onClose={() => { setAnmeldungDialogOpen(false); setEditAnmeldung(null); setPreselectedKursId(undefined); }}
        onSubmit={editAnmeldung ? handleUpdateAnmeldung : handleCreateAnmeldung}
        defaultValues={
          editAnmeldung
            ? editAnmeldung.fields
            : preselectedKursId
            ? { kurs: createRecordUrl(APP_IDS.KURS_VERWALTUNG, preselectedKursId) }
            : undefined
        }
        kurs_verwaltungList={kursVerwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['TeilnehmerAnmeldung']}
      />

      {/* Confirm delete kurs */}
      <ConfirmDialog
        open={!!deleteKursTarget}
        title="Kurs löschen"
        description={`Soll der Kurs "${deleteKursTarget?.fields.kursname ?? ''}" wirklich gelöscht werden?`}
        onConfirm={handleDeleteKurs}
        onClose={() => setDeleteKursTarget(null)}
      />

      {/* Confirm delete anmeldung */}
      <ConfirmDialog
        open={!!deleteAnmeldungTarget}
        title="Anmeldung löschen"
        description={`Soll die Anmeldung von ${deleteAnmeldungTarget?.fields.teilnehmer_vorname ?? ''} ${deleteAnmeldungTarget?.fields.teilnehmer_nachname ?? ''} wirklich gelöscht werden?`}
        onConfirm={handleDeleteAnmeldung}
        onClose={() => setDeleteAnmeldungTarget(null)}
      />
    </div>
  );
}

interface KursCardProps {
  kurs: EnrichedKursVerwaltung;
  teilnehmerCount: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function KursCard({ kurs, teilnehmerCount, isSelected, onClick, onEdit, onDelete }: KursCardProps) {
  const stilKey = kurs.fields.yoga_stil_kurs?.key ?? '';
  const colorClass = STIL_COLORS[stilKey] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  const capacity = kurs.fields.max_teilnehmer ?? 0;
  const isFull = capacity > 0 && teilnehmerCount >= capacity;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      {/* Color accent strip */}
      <div className={`h-1.5 w-full ${colorClass.split(' ')[0]}`} />

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{kurs.fields.kursname || 'Kurs'}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{kurs.kursleiterName || '—'}</p>
          </div>
          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <Pencil size={12} className="text-muted-foreground" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={12} className="text-destructive" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {(kurs.fields.startzeit || kurs.fields.endzeit) && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0" />
              {kurs.fields.startzeit ?? '?'}{kurs.fields.endzeit ? `–${kurs.fields.endzeit}` : ''}
            </span>
          )}
          {kurs.fields.ort && (
            <span className="flex items-center gap-1 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate max-w-[80px]">{kurs.fields.ort}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex gap-1.5 flex-wrap">
            {kurs.fields.yoga_stil_kurs && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                {kurs.fields.yoga_stil_kurs.label}
              </span>
            )}
            {kurs.fields.niveau && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${NIVEAU_COLORS[kurs.fields.niveau.key ?? ''] ?? 'bg-muted text-muted-foreground'}`}>
                {kurs.fields.niveau.label}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Users size={11} className="shrink-0" />
            {teilnehmerCount}{capacity > 0 ? `/${capacity}` : ''}
          </div>
        </div>

        {capacity > 0 && (
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isFull ? 'bg-destructive' :
                teilnehmerCount / capacity > 0.8 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, (teilnehmerCount / capacity) * 100)}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          {kurs.fields.kursgebuehr != null && (
            <span className="text-xs font-semibold text-foreground">{formatCurrency(kurs.fields.kursgebuehr)}</span>
          )}
          <span className="ml-auto text-xs text-primary flex items-center gap-0.5">
            Details <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}

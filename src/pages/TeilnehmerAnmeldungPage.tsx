import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { TeilnehmerAnmeldung, KursVerwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TeilnehmerAnmeldungDialog } from '@/components/dialogs/TeilnehmerAnmeldungDialog';
import { TeilnehmerAnmeldungViewDialog } from '@/components/dialogs/TeilnehmerAnmeldungViewDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function TeilnehmerAnmeldungPage() {
  const [records, setRecords] = useState<TeilnehmerAnmeldung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TeilnehmerAnmeldung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeilnehmerAnmeldung | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TeilnehmerAnmeldung | null>(null);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [kurs_verwaltungList, setKursVerwaltungList] = useState<KursVerwaltung[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, kurs_verwaltungData] = await Promise.all([
        LivingAppsService.getTeilnehmerAnmeldung(),
        LivingAppsService.getKursVerwaltung(),
      ]);
      setRecords(mainData);
      setKursVerwaltungList(kurs_verwaltungData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: TeilnehmerAnmeldung['fields']) {
    await LivingAppsService.createTeilnehmerAnmeldungEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: TeilnehmerAnmeldung['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateTeilnehmerAnmeldungEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTeilnehmerAnmeldungEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getKursVerwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kurs_verwaltungList.find(r => r.record_id === id)?.fields.kursname ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Teilnehmer-Anmeldung"
      subtitle={`${records.length} Teilnehmer-Anmeldung im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0 rounded-full shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Teilnehmer-Anmeldung suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-[27px] bg-card shadow-lg overflow-hidden">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('gesundheitshinweise')}>
                <span className="inline-flex items-center gap-1">
                  Gesundheitliche Hinweise / Anmerkungen
                  {sortKey === 'gesundheitshinweise' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('anmeldedatum')}>
                <span className="inline-flex items-center gap-1">
                  Anmeldedatum
                  {sortKey === 'anmeldedatum' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('einverstaendnis')}>
                <span className="inline-flex items-center gap-1">
                  Ich stimme der Teilnahme und den Kursbedingungen zu
                  {sortKey === 'einverstaendnis' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('teilnehmer_vorname')}>
                <span className="inline-flex items-center gap-1">
                  Vorname
                  {sortKey === 'teilnehmer_vorname' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('teilnehmer_nachname')}>
                <span className="inline-flex items-center gap-1">
                  Nachname
                  {sortKey === 'teilnehmer_nachname' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('teilnehmer_email')}>
                <span className="inline-flex items-center gap-1">
                  E-Mail-Adresse
                  {sortKey === 'teilnehmer_email' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('teilnehmer_telefon')}>
                <span className="inline-flex items-center gap-1">
                  Telefonnummer
                  {sortKey === 'teilnehmer_telefon' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('geburtsdatum')}>
                <span className="inline-flex items-center gap-1">
                  Geburtsdatum
                  {sortKey === 'geburtsdatum' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('kurs')}>
                <span className="inline-flex items-center gap-1">
                  Kurs
                  {sortKey === 'kurs' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('erfahrungslevel')}>
                <span className="inline-flex items-center gap-1">
                  Dein Erfahrungslevel
                  {sortKey === 'erfahrungslevel' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewingRecord(record); }}>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.gesundheitshinweise ?? '—'}</span></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.anmeldedatum)}</TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.einverstaendnis ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.einverstaendnis ? 'Ja' : 'Nein'}</span></TableCell>
                <TableCell className="font-medium">{record.fields.teilnehmer_vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.teilnehmer_nachname ?? '—'}</TableCell>
                <TableCell>{record.fields.teilnehmer_email ?? '—'}</TableCell>
                <TableCell>{record.fields.teilnehmer_telefon ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.geburtsdatum)}</TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getKursVerwaltungDisplayName(record.fields.kurs)}</span></TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{record.fields.erfahrungslevel?.label ?? '—'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Teilnehmer-Anmeldung. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TeilnehmerAnmeldungDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        kurs_verwaltungList={kurs_verwaltungList}
        enablePhotoScan={AI_PHOTO_SCAN['TeilnehmerAnmeldung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['TeilnehmerAnmeldung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Teilnehmer-Anmeldung löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />

      <TeilnehmerAnmeldungViewDialog
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        record={viewingRecord}
        onEdit={(r) => { setViewingRecord(null); setEditingRecord(r); }}
        kurs_verwaltungList={kurs_verwaltungList}
      />
    </PageShell>
  );
}
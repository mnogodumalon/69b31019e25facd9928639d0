import type { TeilnehmerAnmeldung, KursVerwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface TeilnehmerAnmeldungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: TeilnehmerAnmeldung | null;
  onEdit: (record: TeilnehmerAnmeldung) => void;
  kurs_verwaltungList: KursVerwaltung[];
}

export function TeilnehmerAnmeldungViewDialog({ open, onClose, record, onEdit, kurs_verwaltungList }: TeilnehmerAnmeldungViewDialogProps) {
  function getKursVerwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kurs_verwaltungList.find(r => r.record_id === id)?.fields.kursname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teilnehmer-Anmeldung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesundheitliche Hinweise / Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.gesundheitshinweise ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmeldedatum</Label>
            <p className="text-sm">{formatDate(record.fields.anmeldedatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ich stimme der Teilnahme und den Kursbedingungen zu</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.einverstaendnis ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.einverstaendnis ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname</Label>
            <p className="text-sm">{record.fields.teilnehmer_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname</Label>
            <p className="text-sm">{record.fields.teilnehmer_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">E-Mail-Adresse</Label>
            <p className="text-sm">{record.fields.teilnehmer_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Telefonnummer</Label>
            <p className="text-sm">{record.fields.teilnehmer_telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geburtsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.geburtsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kurs</Label>
            <p className="text-sm">{getKursVerwaltungDisplayName(record.fields.kurs)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dein Erfahrungslevel</Label>
            <Badge variant="secondary">{record.fields.erfahrungslevel?.label ?? '—'}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
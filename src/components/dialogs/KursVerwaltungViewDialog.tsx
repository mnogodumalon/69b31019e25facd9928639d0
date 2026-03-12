import type { KursVerwaltung, KursleiterVerwaltung } from '@/types/app';
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

interface KursVerwaltungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: KursVerwaltung | null;
  onEdit: (record: KursVerwaltung) => void;
  kursleiter_verwaltungList: KursleiterVerwaltung[];
}

export function KursVerwaltungViewDialog({ open, onClose, record, onEdit, kursleiter_verwaltungList }: KursVerwaltungViewDialogProps) {
  function getKursleiterVerwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kursleiter_verwaltungList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kurs-Verwaltung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursgebühr (€)</Label>
            <p className="text-sm">{record.fields.kursgebuehr ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursname</Label>
            <p className="text-sm">{record.fields.kursname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursbeschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.kursbeschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Yoga-Stil</Label>
            <Badge variant="secondary">{record.fields.yoga_stil_kurs?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursniveau</Label>
            <Badge variant="secondary">{record.fields.niveau?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursleiter</Label>
            <p className="text-sm">{getKursleiterVerwaltungDisplayName(record.fields.kursleiter)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wochentag</Label>
            <Badge variant="secondary">{record.fields.wochentag?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Startzeit</Label>
            <p className="text-sm">{record.fields.startzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Endzeit</Label>
            <p className="text-sm">{record.fields.endzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Startdatum</Label>
            <p className="text-sm">{formatDate(record.fields.startdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Enddatum</Label>
            <p className="text-sm">{formatDate(record.fields.enddatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ort / Raum</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maximale Teilnehmerzahl</Label>
            <p className="text-sm">{record.fields.max_teilnehmer ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Stethoscope, UserCheck, Users } from 'lucide-react';

interface CpptEntry {
    id: number;
    nomor_register: string;
    tanggal_waktu: string;
    profesi: 'perawat' | 'dokter' | 'apoteker' | 'ahli_gizi' | 'fisioterapis';
    catatan_tambahan?: string;
    soap_details: Array<{
        id: number;
        tipe_soap: 'subjective' | 'objective' | 'assessment' | 'plan';
        content: string;
    }>;
}

interface CpptTimelineProps {
    nomor_register: string;
    entries: CpptEntry[];
    loading?: boolean;
}

export default function CpptTimeline({ nomor_register, entries, loading = false }: CpptTimelineProps) {
    const getProfesiBadge = (profesi: string) => {
        const colors = {
            perawat: 'bg-blue-100 text-blue-800 border-blue-200',
            dokter: 'bg-green-100 text-green-800 border-green-200',
            apoteker: 'bg-purple-100 text-purple-800 border-purple-200',
            ahli_gizi: 'bg-orange-100 text-orange-800 border-orange-200',
            fisioterapis: 'bg-pink-100 text-pink-800 border-pink-200',
        };

        const labels = {
            perawat: 'Perawat',
            dokter: 'Dokter',
            apoteker: 'Apoteker',
            ahli_gizi: 'Ahli Gizi',
            fisioterapis: 'Fisioterapis',
        };

        return (
            <Badge variant="outline" className={colors[profesi as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
                {labels[profesi as keyof typeof labels] || profesi}
            </Badge>
        );
    };

    const getSoapTypeLabel = (type: string) => {
        const labels = {
            subjective: 'Subjective (Subjektif)',
            objective: 'Objective (Objektif)',
            assessment: 'Assessment (Asesmen)',
            plan: 'Plan (Rencana)',
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getSoapTypeIcon = (type: string) => {
        switch (type) {
            case 'subjective':
                return '👤';
            case 'objective':
                return '🔍';
            case 'assessment':
                return '📋';
            case 'plan':
                return '📝';
            default:
                return '📄';
        }
    };

    const getProfesiIcon = (profesi: string) => {
        switch (profesi) {
            case 'perawat':
                return <UserCheck className="h-4 w-4" />;
            case 'dokter':
                return <Stethoscope className="h-4 w-4" />;
            case 'apoteker':
                return <FileText className="h-4 w-4" />;
            case 'ahli_gizi':
                return <Users className="h-4 w-4" />;
            case 'fisioterapis':
                return <Users className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    // Group entries by date
    const groupedEntries = entries.reduce(
        (acc, entry) => {
            const date = format(new Date(entry.tanggal_waktu), 'yyyy-MM-dd');
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(entry);
            return acc;
        },
        {} as Record<string, CpptEntry[]>,
    );

    const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (loading) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p>Memuat timeline CPPT...</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Tidak ada data CPPT untuk pasien ini</p>
                <p className="text-sm">Data akan muncul setelah pemeriksaan SO Perawat atau SOAP Dokter dilakukan</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedDates.map((date) => (
                <Card key={date}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5" />
                            {format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {groupedEntries[date].map((entry) => (
                            <Card key={entry.id} className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getProfesiIcon(entry.profesi)}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {getProfesiBadge(entry.profesi)}
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(new Date(entry.tanggal_waktu), 'HH:mm', { locale: id })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {/* SOAP Details */}
                                    {entry.soap_details.length > 0 && (
                                        <div className="mb-4 space-y-3">
                                            <h4 className="text-sm font-medium text-muted-foreground">SOAP Details:</h4>
                                            {(() => {
                                                const order = ['subjective', 'objective', 'assessment', 'plan'] as const;
                                                const sorted = [...entry.soap_details].sort(
                                                    (a, b) => order.indexOf(a.tipe_soap as any) - order.indexOf(b.tipe_soap as any),
                                                );
                                                return sorted.map((detail) => (
                                                    <div key={detail.id} className="rounded-lg bg-muted/30 p-3">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <span className="text-lg">{getSoapTypeIcon(detail.tipe_soap)}</span>
                                                            <span className="text-sm font-medium">{getSoapTypeLabel(detail.tipe_soap)}</span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">{detail.content}</p>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}

                                    {/* Catatan Tambahan */}
                                    {entry.catatan_tambahan && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-muted-foreground">Catatan Tambahan:</h4>
                                            <p className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap">{entry.catatan_tambahan}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

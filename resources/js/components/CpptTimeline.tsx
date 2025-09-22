import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Stethoscope, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface CpptEntry {
    id: number | string;
    nomor_register: string;
    tanggal_waktu: string;
    profesi: 'perawat' | 'dokter' | 'apoteker' | 'ahli_gizi' | 'fisioterapis';
    aksi?: 'tambah' | 'edit' | string | null;
    nama_dokter?: string | null;
    nama_perawat?: string | null;
    nama_klinik?: string | null;
    catatan_tambahan?: string;
    soap_details: Array<{
        id?: number | string;
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
    const { props } = usePage<any>();
    const localClinicName: string | undefined = props?.web_setting?.nama;
    const currentUserName: string | undefined = props?.auth?.user?.name;
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

    const getAksiBadge = (aksi?: string | null) => {
        if (!aksi || aksi === 'tambah') return null;
        const label = aksi === 'tambah' ? 'Tambah' : aksi === 'edit' ? 'Edit' : aksi;
        const cls =
            aksi === 'tambah'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : aksi === 'edit'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-800';
        return (
            <Badge variant="outline" className={cls}>
                {label}
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

    const getPayloadFromEntry = (entry: any): any | undefined => {
        // Try entry.data
        let payload: any = (entry as any)?.data;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch {
                payload = undefined;
            }
        }
        if (payload && typeof payload === 'object') return payload;

        // Try entry.history
        let history: any = (entry as any)?.history;
        if (typeof history === 'string') {
            try {
                history = JSON.parse(history);
            } catch {
                history = undefined;
            }
        }
        if (history && typeof history === 'object') {
            let data: any = history.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch {
                    data = undefined;
                }
            }
            if (data && typeof data === 'object') return data;
        }
        // Try other common fields
        const alt = (entry as any)?.history_json || (entry as any)?.meta || (entry as any)?.extra;
        if (alt) {
            try {
                const d = typeof alt === 'string' ? JSON.parse(alt) : alt;
                if (d && typeof d === 'object') {
                    const data = d.data || d;
                    if (data && (data.assessment || data.plan_detail)) return data;
                }
            } catch {}
        }
        // Deep scan: try parse any string field that looks like JSON and has assessment/plan_detail
        for (const key of Object.keys(entry || {})) {
            const val = (entry as any)[key];
            if (typeof val === 'string' && val.includes('{') && (val.includes('assessment') || val.includes('plan_detail'))) {
                try {
                    const obj = JSON.parse(val);
                    const data = obj?.data || obj;
                    if (data && (data.assessment || data.plan_detail)) return data;
                } catch {}
            }
        }
        return undefined;
    };

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

    const [openByDate, setOpenByDate] = useState<Record<string, boolean>>({});

    const toggleDate = (date: string) => {
        setOpenByDate((prev) => ({
            ...prev,
            [date]: prev[date] === false ? true : false,
        }));
    };

    return (
        <div className="space-y-4">
            {sortedDates.map((date) => (
                <Card key={date}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <FileText className="h-5 w-5" />
                            {format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })}
                        </CardTitle>
                        <Button type="button" variant="ghost" size="sm" onClick={() => toggleDate(date)}>
                            {openByDate[date] !== false ? '▼' : '▶'}
                        </Button>
                    </CardHeader>
                    {openByDate[date] !== false && (
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
                                                        {getAksiBadge((entry as any).aksi)}
                                                        <span className="text-sm text-muted-foreground">
                                                            {format(new Date(entry.tanggal_waktu), 'HH:mm', { locale: id })}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {entry.profesi === 'perawat'
                                                            ? currentUserName || (entry as any).nama_perawat || '-'
                                                            : (entry as any).nama_dokter || '-'}
                                                        {(() => {
                                                            const klinik = (entry as any).nama_klinik as string | undefined;
                                                            const sameAsLocal = klinik && localClinicName && klinik.trim() === localClinicName.trim();
                                                            if (!klinik || sameAsLocal) return '';
                                                            const hasLeft =
                                                                entry.profesi === 'perawat'
                                                                    ? !!(currentUserName || (entry as any).nama_perawat)
                                                                    : !!(entry as any).nama_dokter;
                                                            return `${hasLeft ? ' • ' : ''}${klinik}`;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {/* SOAP Details (sembunyikan jika entry adalah Permintaan) */}
                                        {(() => {
                                            const payload: any = getPayloadFromEntry(entry);
                                            const isPermintaan = !!(payload && payload.jenis_permintaan);
                                            // Deteksi rujukan dari entry.history.type
                                            let isRujukan = false;
                                            try {
                                                let hist: any = (entry as any)?.history;
                                                if (typeof hist === 'string') {
                                                    hist = JSON.parse(hist);
                                                }
                                                isRujukan = typeof hist?.type === 'string' && hist.type.startsWith('rujukan_');
                                            } catch {}
                                            if (isPermintaan || isRujukan) return null;
                                            const order = ['subjective', 'objective', 'assessment', 'plan'] as const;
                                            return (
                                                <div className="mb-4 space-y-3">
                                                    <h4 className="text-sm font-medium text-muted-foreground">SOAP Details:</h4>
                                                    {order.map((type, idx) => {
                                                        if (payload && (type === 'assessment' || type === 'plan')) {
                                                            return null;
                                                        }
                                                        const found = entry.soap_details.find((d) => d.tipe_soap === type);
                                                        const key = (found?.id ?? `${entry.id}-${type}-${idx}`) as any;

                                                        if (payload && type === 'subjective') {
                                                            const keluhanList = payload?.tableData?.keluhanList || [];
                                                            return (
                                                                <div key={key} className="rounded-lg bg-muted/30 p-3">
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <span className="text-lg">{getSoapTypeIcon(type)}</span>
                                                                        <span className="text-sm font-medium">{getSoapTypeLabel(type)}</span>
                                                                    </div>
                                                                    {Array.isArray(keluhanList) && keluhanList.length > 0 ? (
                                                                        <div className="text-sm">
                                                                            <div className="mb-1 font-medium">Daftar Keluhan:</div>
                                                                            <ul className="list-disc pl-5">
                                                                                {keluhanList.map((k: any, i: number) => (
                                                                                    <li key={`kel-${i}`}>{`${k.keluhan} (${k.durasi})`}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm whitespace-pre-wrap">-</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        if (payload && type === 'objective') {
                                                            const p = payload || {};
                                                            const httItems = p?.tableData?.httItems || [];
                                                            const summary = `Tensi: ${p.tensi || '-'}, Suhu: ${p.suhu || '-'}°C, Nadi: ${p.nadi || '-'} /menit, RR: ${p.rr || '-'} /menit, SpO2: ${p.spo2 || '-'}%, Berat: ${p.berat || '-'} kg, Tinggi: ${p.tinggi || '-'} cm, BMI: ${p.nilai_bmi || '-'}, Alergi: ${p.alergi || '-'}`;
                                                            return (
                                                                <div key={key} className="rounded-lg bg-muted/30 p-3">
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <span className="text-lg">{getSoapTypeIcon(type)}</span>
                                                                        <span className="text-sm font-medium">{getSoapTypeLabel(type)}</span>
                                                                    </div>
                                                                    <p className="text-sm whitespace-pre-wrap">{summary}</p>
                                                                    {Array.isArray(httItems) && httItems.length > 0 ? (
                                                                        <div className="mt-2 text-sm">
                                                                            <div className="font-medium">HTT / Temuan Objektif:</div>
                                                                            <ul className="list-disc pl-5">
                                                                                {httItems.map((h: any, i: number) => (
                                                                                    <li key={`htt-${i}`}>{`${h.pemeriksaan || ''} - ${h.subPemeriksaan || ''}: ${h.detail || ''}`}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        }

                                                        const content = found?.content ?? '-';
                                                        return (
                                                            <div key={key} className="rounded-lg bg-muted/30 p-3">
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <span className="text-lg">{getSoapTypeIcon(type)}</span>
                                                                    <span className="text-sm font-medium">{getSoapTypeLabel(type)}</span>
                                                                </div>
                                                                <p className="text-sm whitespace-pre-wrap">{content}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}

                                        {/* Assessment & Plan (from patient history payload if present) */}
                                        {(() => {
                                            const payload: any = getPayloadFromEntry(entry);
                                            if (!payload) return null;
                                            const assessment = payload.assessment;
                                            const planDetail = payload.plan_detail;

                                            return (
                                                <div className="space-y-4">
                                                    {assessment ? (
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Assessment</h4>
                                                            {/* ICD10 */}
                                                            {Array.isArray(assessment.diagnosis_icd10) && assessment.diagnosis_icd10.length > 0 && (
                                                                <div className="mb-3">
                                                                    <div className="mb-1 text-sm font-medium">Diagnosa (ICD-10)</div>
                                                                    <ul className="list-disc pl-5 text-sm">
                                                                        {assessment.diagnosis_icd10.map((d: any, idx: number) => (
                                                                            <li key={`icd10-${idx}`} className="flex flex-wrap items-center gap-2">
                                                                                <span className="font-mono font-medium">{d.code}</span>
                                                                                <span>- {d.name}</span>
                                                                                {d.priority ? (
                                                                                    <span
                                                                                        className={`rounded px-2 py-0.5 text-xs ${d.priority === 'Primary' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                                                                                    >
                                                                                        {d.priority}
                                                                                    </span>
                                                                                ) : null}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {/* ICD9 */}
                                                            {Array.isArray(assessment.diagnosis_icd9) && assessment.diagnosis_icd9.length > 0 && (
                                                                <div className="mb-3">
                                                                    <div className="mb-1 text-sm font-medium">Tindakan (ICD-9)</div>
                                                                    <ul className="list-disc pl-5 text-sm">
                                                                        {assessment.diagnosis_icd9.map((d: any, idx: number) => (
                                                                            <li key={`icd9-${idx}`} className="flex flex-wrap items-center gap-2">
                                                                                <span className="font-mono font-medium">{d.code}</span>
                                                                                <span>- {d.name}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {/* Tindakan */}
                                                            {Array.isArray(assessment.tindakan) && assessment.tindakan.length > 0 && (
                                                                <div className="mb-3">
                                                                    <div className="mb-1 text-sm font-medium">Tindakan</div>
                                                                    <ul className="list-disc pl-5 text-sm">
                                                                        {assessment.tindakan.map((t: any, idx: number) => (
                                                                            <li key={`tind-${idx}`}>{t.nama || t.name || JSON.stringify(t)}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {/* Resep */}
                                                            {Array.isArray(assessment.resep_obat) && assessment.resep_obat.length > 0 && (
                                                                <div>
                                                                    <div className="mb-1 text-sm font-medium">Resep Obat</div>
                                                                    <ul className="list-disc pl-5 text-sm whitespace-pre-wrap">
                                                                        {assessment.resep_obat.map((r: any, idx: number) => (
                                                                            <li key={`rx-${idx}`}>
                                                                                {`${r.penanda ? `R:/ ${r.penanda}\n` : 'R:/\n'}${r.nama_obat || ''}${r.instruksi ? `\n${r.instruksi}` : ''}${r.signa || r.satuan_gudang || r.penggunaan ? `\nS ${r.signa || ''} ${r.satuan_gudang || ''} ${r.penggunaan || ''}` : ''}`}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    {planDetail ? (
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Plan</h4>
                                                            {planDetail.expertise ? (
                                                                <div className="mb-3">
                                                                    <div className="mb-1 text-sm font-medium">Expertise / Konsultasi</div>
                                                                    <div
                                                                        className="prose prose-sm max-w-none"
                                                                        dangerouslySetInnerHTML={{ __html: planDetail.expertise }}
                                                                    />
                                                                </div>
                                                            ) : null}
                                                            {planDetail.evaluasi ? (
                                                                <div className="mb-3">
                                                                    <div className="mb-1 text-sm font-medium">Evaluasi</div>
                                                                    <div
                                                                        className="prose prose-sm max-w-none"
                                                                        dangerouslySetInnerHTML={{ __html: planDetail.evaluasi }}
                                                                    />
                                                                </div>
                                                            ) : null}
                                                            {planDetail.rencana ? (
                                                                <div>
                                                                    <div className="mb-1 text-sm font-medium">Rencana Tindakan/Terapi</div>
                                                                    <div
                                                                        className="prose prose-sm max-w-none"
                                                                        dangerouslySetInnerHTML={{ __html: planDetail.rencana }}
                                                                    />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })()}

                                        {/* Permintaan (radiologi/laboratorium/surat*) dari history */}
                                        {(() => {
                                            const payload: any = getPayloadFromEntry(entry);
                                            if (!payload || !payload.jenis_permintaan) return null;
                                            const jenis = String(payload.jenis_permintaan);
                                            const detail = payload.detail_permintaan || {};
                                            const nr = (entry as any).nomor_register || payload.nomor_register;

                                            const handleCetak = () => {
                                                try {
                                                    const encodedNorawat = btoa(String(nr || ''));
                                                    const detailQuery = encodeURIComponent(JSON.stringify(detail));
                                                    const url = `/pelayanan/permintaan/cetak/${encodedNorawat}?jenis=${encodeURIComponent(jenis)}&judul=${encodeURIComponent(
                                                        payload.judul || '',
                                                    )}&keterangan=${encodeURIComponent(payload.keterangan || '')}&detail=${detailQuery}`;
                                                    window.open(url, '_blank');
                                                } catch {}
                                            };

                                            return (
                                                <div className="rounded-lg bg-muted/30 p-3">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-muted-foreground">Permintaan</h4>
                                                        <Badge variant="outline" className="bg-gray-50 text-gray-800">
                                                            {jenis.replace(/_/g, ' ').toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm">
                                                        {(() => {
                                                            // Ringkas isi sesuai jenis jika tersedia
                                                            // Header ringkas: Jenis Permintaan & Tanggal Periksa (diformat)
                                                            const jenisLabel = String(jenis)
                                                                .split('_')
                                                                .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
                                                                .join(' ');
                                                            const dateRaw = detail.tgl_periksa || detail.tanggal_periksa || '';
                                                            let tanggalLabel = '-';
                                                            if (dateRaw) {
                                                                try {
                                                                    const d = new Date(String(dateRaw));
                                                                    tanggalLabel = format(d, 'EEEE, dd MMMM yyyy', { locale: id });
                                                                } catch {}
                                                            }

                                                            const header = (
                                                                <div className="mb-2 space-y-1">
                                                                    <div>
                                                                        <span className="font-medium">Jenis Permintaan</span> : {jenisLabel}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Tanggal Periksa</span> : {tanggalLabel}
                                                                    </div>
                                                                </div>
                                                            );

                                                            if (jenis === 'radiologi' && Array.isArray(detail.items)) {
                                                                return (
                                                                    <div>
                                                                        {header}
                                                                        <ul className="list-disc pl-5">
                                                                            {detail.items.map((it: any, idx: number) => (
                                                                                <li key={`rad-${idx}`}>{`${it.pemeriksaan || ''} ${it.jenis_posisi ? '(' + it.jenis_posisi + ')' : ''} ${it.posisi ? it.posisi : ''} ${it.metode ? '-' + it.metode : ''}`}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                );
                                                            }
                                                            if (jenis === 'laboratorium' && Array.isArray(detail.items)) {
                                                                return (
                                                                    <div>
                                                                        {header}
                                                                        <ul className="list-disc pl-5">
                                                                            {detail.items.map((name: any, idx: number) => (
                                                                                <li key={`lab-${idx}`}>{String(name)}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                );
                                                            }
                                                            if (jenis === 'surat_sakit') {
                                                                return (
                                                                    <div>
                                                                        {header}
                                                                        <div>Diagnosa: {detail.diagnosis_utama || '-'}</div>
                                                                        <div>Lama istirahat: {detail.lama_istirahat || '-'}</div>
                                                                        <div>Mulai: {detail.terhitung_mulai || '-'}</div>
                                                                    </div>
                                                                );
                                                            }
                                                            if (jenis === 'surat_sehat') {
                                                                return <div>{header}</div>;
                                                            }
                                                            if (jenis === 'surat_kematian') {
                                                                return (
                                                                    <div>
                                                                        {header}
                                                                        <div>Waktu meninggal: {detail.tanggal_meninggal || '-'} {detail.jam_meninggal || ''}</div>
                                                                    </div>
                                                                );
                                                            }
                                                            if (jenis === 'skdp') {
                                                                return (
                                                                    <div>
                                                                        {header}
                                                                        <div>Kode Surat: {detail.kode_surat || '-'}</div>
                                                                        <div>Pada: {detail.pada || '-'}</div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                    <div className="mt-3">
                                                        <Button type="button" size="sm" onClick={handleCetak}>
                                                            Lihat / Cetak
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Rujukan dari history */}
                                        {(() => {
                                            // Ambil payload rujukan langsung dari history (rujukan_tambah/edit disimpan flat)
                                            let history: any = (entry as any)?.history;
                                            if (!history) return null;
                                            if (typeof history === 'string') {
                                                try { history = JSON.parse(history); } catch { history = undefined; }
                                            }
                                            if (!history || typeof history !== 'object') return null;
                                            const isRujukan = typeof history.type === 'string' && history.type.startsWith('rujukan_');
                                            if (!isRujukan) return null;

                                            const nr = (entry as any).nomor_register || history.nomor_register;
                                            const jenisOpt = String(history.opsi_rujukan || '').toLowerCase();
                                            const jenisLabel = jenisOpt === 'spesialis' ? 'Biasa' : 'Khusus';
                                            const tujuan = history.tujuan_rujukan_spesialis || history.tujuan_rujukan || '-';
                                            const subsp = history.sub_spesialis || history.subspesialis_khusus || '';
                                            const showSub = subsp && isNaN(Number(subsp)); // sembunyikan jika angka
                                            const tanggalRaw = history.tanggal_rujukan_khusus || history.tanggal_rujukan || '';
                                            let tanggalLabel = '-';
                                            if (tanggalRaw) {
                                                try { tanggalLabel = format(new Date(String(tanggalRaw)), 'EEEE, dd MMMM yyyy', { locale: id }); } catch {}
                                            }

                                            const handleCetak = () => {
                                                try {
                                                    const encodedNorawat = btoa(String(nr || ''));
                                                    const url = `/pelayanan/rujukan/cetak/${encodedNorawat}`;
                                                    window.open(url, '_blank');
                                                } catch {}
                                            };

                                            return (
                                                <div className="rounded-lg bg-muted/30 p-3">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-muted-foreground">Rujukan</h4>
                                                        <Badge variant="outline" className="bg-gray-50 text-gray-800">{jenisLabel.toUpperCase()}</Badge>
                                                    </div>
                                                    <div className="text-sm space-y-1">
                                                        <div><span className="font-medium">Jenis</span> : {jenisLabel}</div>
                                                        <div><span className="font-medium">Tujuan</span> : {tujuan || '-'}</div>
                                                        {showSub ? (
                                                            <div><span className="font-medium">Subspesialis</span> : {String(subsp)}</div>
                                                        ) : null}
                                                        <div><span className="font-medium">Tanggal</span> : {tanggalLabel}</div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <Button type="button" size="sm" onClick={handleCetak}>Lihat / Cetak</Button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}

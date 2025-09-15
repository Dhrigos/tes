import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Trend Pendaftaran — tampilan mirip Pendaftaran

interface LAP_Pasien {
    nomor_rm?: string;
    no_rm?: string;
    nik?: string;
    nama?: string;
    seks?: string;
}
interface LAP_PendaftaranItem {
    pasien?: LAP_Pasien;
    nomor_register?: string;
    antrian?: string;
    tanggal_kujungan?: string;
    created_at?: string;
    poli?: { nama?: string };
    penjamin?: { id?: number; nama?: string };
    dokter?: { namauser?: { name?: string } };
}

const splitDateTime = (value?: string) => {
    if (!value) return { date: '-', time: '-' };
    const raw = String(value).trim();
    const parts = raw.includes('T') ? raw.split('T') : raw.split(' ');
    const date = parts[0] || '-';
    let time = parts[1] || '';
    time = time.replace('Z', '').split('+')[0].split('.')[0];
    if (time.length >= 5) time = time.slice(0, 5);
    return { date, time: time || '-' };
};

const formatYMD = (isoDate?: string) => {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
// removed print URL
const EXPORT_URL = '/laporan/trend-pendaftaran/export';

type PageProps = { title: string; data: LAP_PendaftaranItem[] };

const TrendPendaftaran = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<LAP_PendaftaranItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    // Hanya filter tanggal awal/akhir
    const [loading, setLoading] = useState(false);
    // removed print confirm state

    // Multi-series LineChart (canvas)
    const MultiLineChart = ({ labels, series }: { labels: string[]; series: Array<{ name: string; color: string; values: number[] }> }) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);
        const [hoverIdx, setHoverIdx] = useState<number | null>(null);

        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const dpi = window.devicePixelRatio || 1;
            const width = container.clientWidth;
            const height = 220;
            canvas.width = Math.floor(width * dpi);
            canvas.height = Math.floor(height * dpi);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
            ctx.clearRect(0, 0, width, height);

            const allValues = (series || []).flatMap((s) => (s.values || []).map((v) => Number(v || 0)));
            const maxVal = Math.max(1, ...allValues, 1);
            const padding = { top: 12, right: 12, bottom: 30, left: 32 };
            const plotW = width - padding.left - padding.right;
            const plotH = height - padding.top - padding.bottom;
            const n = Math.max(1, labels?.length || 0);

            // grid lines
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (plotH * i) / 4 + 0.5;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            }

            // y labels
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('0', padding.left - 6, height - padding.bottom);
            ctx.fillText(String(Math.round(maxVal)), padding.left - 6, padding.top);

            const xFor = (i: number) => padding.left + (plotW * i) / Math.max(1, n - 1);
            const yFor = (v: number) => height - padding.bottom - (Math.min(maxVal, Math.max(0, v)) / maxVal) * plotH;

            // draw per series
            (series || []).forEach((s) => {
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                (s.values || []).forEach((val, i) => {
                    const x = xFor(i);
                    const y = yFor(Number(val || 0));
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
                // points
                ctx.fillStyle = s.color;
                (s.values || []).forEach((val, i) => {
                    const x = xFor(i);
                    const y = yFor(Number(val || 0));
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            // x labels
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            (labels || []).forEach((lab, i) => {
                const x = xFor(i);
                ctx.fillText(String(lab || ''), x, height - padding.bottom + 6);
            });

            // hover guide
            if (hoverIdx != null) {
                const i = hoverIdx;
                const x = xFor(i);
                ctx.strokeStyle = '#9ca3af';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(x + 0.5, padding.top);
                ctx.lineTo(x + 0.5, height - padding.bottom);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }, [labels, series, hoverIdx]);

        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const handler = (ev: MouseEvent) => {
                const rect = canvas.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const width = rect.width;
                const paddingLeft = 32;
                const paddingRight = 12;
                const plotW = width - paddingLeft - paddingRight;
                const n = Math.max(1, labels?.length || 0);
                const xFor = (i: number) => paddingLeft + (plotW * i) / Math.max(1, n - 1);
                let nearest = 0;
                let best = Number.POSITIVE_INFINITY;
                for (let i = 0; i < n; i++) {
                    const xi = xFor(i);
                    const dist = Math.abs(x - xi);
                    if (dist < best) {
                        best = dist;
                        nearest = i;
                    }
                }
                setHoverIdx(nearest);
                const label = labels[nearest] ?? '';
                const lines = (series || []).map((s) => `${s.name}: ${Number(s.values?.[nearest] || 0).toLocaleString('id-ID')}`);
                container.title = [label, ...lines].join('\n');
            };
            const leave = () => setHoverIdx(null);
            canvas.addEventListener('mousemove', handler);
            canvas.addEventListener('mouseleave', leave);
            return () => {
                canvas.removeEventListener('mousemove', handler);
                canvas.removeEventListener('mouseleave', leave);
            };
        }, [labels, series]);

        const tooltip = (() => {
            if (hoverIdx == null || !containerRef.current) return null;
            const i = hoverIdx;
            return (
                <div className="pointer-events-none absolute inset-x-0 -mt-6 text-center text-xs">
                    <div className="mx-auto inline-block rounded bg-black/70 px-2 py-1 text-left text-white">
                        <div className="font-medium">{labels[i] || ''}</div>
                        {(series || []).map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="inline-block size-2 rounded" style={{ background: s.color }} />
                                <span>
                                    {s.name}: {Number(s.values?.[i] || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })();

        return (
            <div ref={containerRef} className="relative w-full">
                {tooltip}
                <canvas ref={canvasRef} />
                {/* Legend */}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {(series || []).map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="inline-block size-2 rounded" style={{ background: s.color }} />
                            <span className="text-muted-foreground">{s.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.data) ? props.data : [];
        const normalized = items.map((it: any) => {
            const pasien: LAP_Pasien = it.pasien || { nomor_rm: it.nomor_rm, nama: it.nama, seks: it.seks };
            return { ...it, pasien } as LAP_PendaftaranItem;
        });
        setRawData(normalized);
        setLoading(false);
    }, [props]);

    const filteredData = useMemo(() => {
        const start = dateStart || undefined;
        const end = dateEnd || undefined;
        return rawData.filter((item) => {
            const ymd = item.tanggal_kujungan ? splitDateTime(item.tanggal_kujungan).date : formatYMD(item.created_at);
            if (start && ymd !== '-' && ymd < start) return false;
            if (end && ymd !== '-' && ymd > end) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd]);

    // (Filter poli/dokter dihapus)

    // Pagination untuk tabel ringkasan harian (dideklarasikan setelah dailyRows)

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
    };

    // removed submitPrint
    const submitExport = () => {
        const csrf = getCsrf();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = EXPORT_URL;

        const token = document.createElement('input');
        token.type = 'hidden';
        token.name = '_token';
        token.value = csrf;
        form.appendChild(token);

        const start = document.createElement('input');
        start.type = 'hidden';
        start.name = 'tanggal_awal';
        start.value = dateStart;
        form.appendChild(start);

        const end = document.createElement('input');
        end.type = 'hidden';
        end.name = 'tanggal_akhir';
        end.value = dateEnd;
        form.appendChild(end);

        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(dailyRows);
        form.appendChild(dataField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // Ringkasan harian: tanggal, kategori penjamin, total, jumlah pasien, pasien 1 kali
    const dailyRows = useMemo(() => {
        type Acc = {
            bpjs: number;
            umum: number;
            asuransiLain: number;
            total: number;
            patientCounts: Map<string, number>;
        };
        const byDate = new Map<string, Acc>();
        const toLower = (v?: string) => (v || '').toString().toLowerCase();

        filteredData.forEach((row) => {
            const tanggal = row.tanggal_kujungan ? splitDateTime(row.tanggal_kujungan).date : formatYMD(row.created_at);
            const key = tanggal || '-';
            if (!byDate.has(key)) {
                byDate.set(key, { bpjs: 0, umum: 0, asuransiLain: 0, total: 0, patientCounts: new Map() });
            }
            const acc = byDate.get(key)!;

            const penjaminId = row.penjamin?.id;
            if (penjaminId === 1) acc.bpjs += 1;
            else if (penjaminId === 2) acc.umum += 1;
            else acc.asuransiLain += 1;

            acc.total += 1;

            const noRm = String(row.pasien?.nomor_rm || row.pasien?.no_rm || '').trim();
            if (noRm) acc.patientCounts.set(noRm, (acc.patientCounts.get(noRm) || 0) + 1);
        });

        const rows = Array.from(byDate.entries()).map(([tanggal, acc]) => {
            const jumlahPasien = acc.patientCounts.size;
            let pasienSatuKali = 0;
            acc.patientCounts.forEach((n) => {
                if (n > 1) pasienSatuKali += 1; // pasien yang berkunjung lebih dari 1 kali
            });
            return {
                tanggal,
                bpjs: acc.bpjs,
                umum: acc.umum,
                asuransiLain: acc.asuransiLain,
                totalKunjungan: acc.total,
                jumlahPasien,
                pasienSatuKali,
            };
        });

        // urutkan berdasarkan tanggal asc (yang bukan tanggal valid tetap di akhir)
        rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        return rows;
    }, [filteredData]);

    const chartLabels = useMemo(() => dailyRows.map((d) => d.tanggal), [dailyRows]);
    const chartSeries = useMemo(() => {
        return [
            { name: 'BPJS', color: '#3b82f6', values: dailyRows.map((d) => d.bpjs) },
            { name: 'Umum', color: '#10b981', values: dailyRows.map((d) => d.umum) },
            { name: 'Asuransi Lain', color: '#f59e0b', values: dailyRows.map((d) => d.asuransiLain) },
            { name: 'Total Kunjungan', color: '#ef4444', values: dailyRows.map((d) => d.totalKunjungan) },
            { name: 'Jumlah Pasien', color: '#8b5cf6', values: dailyRows.map((d) => d.jumlahPasien) },
            { name: 'Pasien berkunjung lebih dari 1 kali', color: '#06b6d4', values: dailyRows.map((d) => d.pasienSatuKali) },
        ];
    }, [dailyRows]);

    // Pagination untuk tabel ringkasan harian
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const dailyTotalItems = dailyRows.length;
    const totalPages = Math.max(1, Math.ceil(dailyTotalItems / pageSize));
    const currentDailyRows = useMemo(() => {
        const startIdx = (page - 1) * pageSize;
        return dailyRows.slice(startIdx, startIdx + pageSize);
    }, [dailyRows, page]);
    useEffect(() => {
        setPage(1);
    }, [dateStart, dateEnd, dailyRows.length]);

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Trend Pendaftaran', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Grafik Tren Pendaftaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-2">
                            <MultiLineChart labels={chartLabels} series={chartSeries} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Trend Pendaftaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Awal</label>
                                <Input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Akhir</label>
                                <Input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-2">
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button variant="outline" disabled={loading}>
                                    Filter
                                </Button>
                                <Button variant="outline" onClick={submitExport} disabled={loading || filteredData.length === 0}>
                                    Export Excel
                                </Button>
                                {/* print removed */}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="border p-2 text-center text-sm font-semibold">Tanggal</th>
                                        <th className="border p-2 text-center text-sm font-semibold">BPJS</th>
                                        <th className="border p-2 text-center text-sm font-semibold">Umum</th>
                                        <th className="border p-2 text-center text-sm font-semibold">Asuransi Lain</th>
                                        <th className="border p-2 text-center text-sm font-semibold">Total Kunjungan</th>
                                        <th className="border p-2 text-center text-sm font-semibold">Jumlah Pasien</th>
                                        <th className="border p-2 text-center text-sm font-semibold">Pasien berkunjung lebih dari 1 kali</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : dailyTotalItems === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data untuk rentang tanggal ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentDailyRows.map((r, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="border p-2 text-center text-sm">{r.tanggal}</td>
                                                <td className="border p-2 text-center text-sm">{r.bpjs}</td>
                                                <td className="border p-2 text-center text-sm">{r.umum}</td>
                                                <td className="border p-2 text-center text-sm">{r.asuransiLain}</td>
                                                <td className="border p-2 text-center text-sm font-semibold">{r.totalKunjungan}</td>
                                                <td className="border p-2 text-center text-sm">{r.jumlahPasien}</td>
                                                <td className="border p-2 text-center text-sm">{r.pasienSatuKali}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <div>
                                Menampilkan {dailyTotalItems === 0 ? 0 : (page - 1) * pageSize + 1} {' - '}{' '}
                                {Math.min(page * pageSize, dailyTotalItems)} dari {dailyTotalItems} hari
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                    Prev
                                </Button>
                                <span>
                                    Halaman {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* print dialog removed */}
        </AppLayout>
    );
};

export default TrendPendaftaran;

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const EXPORT_URL = '/laporan/top-icd10/export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RowRaw {
    kode_icd10?: string;
    nama_icd10?: string;
    nomor_rm?: string;
    no_rawat?: string;
    created_at?: string;
}

type PageProps = { title: string; data: RowRaw[] };

const splitDate = (v?: string) => {
    if (!v) return '-';
    const raw = String(v);
    const t = raw.includes('T') ? raw.split('T')[0] : raw.split(' ')[0] || raw;
    return t;
};

const TopIcd10 = () => {
    const { props } = usePage<PageProps>();
    const [raw, setRaw] = useState<RowRaw[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [granularity, setGranularity] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
    // removed print confirm state

    // Simple LineChart (canvas)
    const LineChart = ({
        data,
        lineColor = '#3b82f6',
        pointColor = '#1d4ed8',
    }: {
        data: Array<{ label: string; value: number }>;
        lineColor?: string;
        pointColor?: string;
    }) => {
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

            const values = (data || []).map((d) => Number(d.value || 0));
            const maxVal = Math.max(1, ...values);
            const padding = { top: 12, right: 12, bottom: 56, left: 32 };
            const plotW = width - padding.left - padding.right;
            const plotH = height - padding.top - padding.bottom;
            const n = Math.max(1, data?.length || 0);

            // grid
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

            // line
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            (data || []).forEach((d, i) => {
                const x = xFor(i);
                const y = yFor(Number(d.value || 0));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // points
            ctx.fillStyle = pointColor;
            (data || []).forEach((d, i) => {
                const x = xFor(i);
                const y = yFor(Number(d.value || 0));
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // x labels (rotate for readability)
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            (data || []).forEach((d, i) => {
                const label = String(d.label || '');
                const lx = xFor(i);
                const ly = height - padding.bottom + 6;
                ctx.save();
                ctx.translate(lx, ly);
                ctx.rotate((-45 * Math.PI) / 180);
                ctx.fillText(label, 0, 0);
                ctx.restore();
            });

            // hover guide
            if (hoverIdx != null && data[hoverIdx]) {
                const x = xFor(hoverIdx);
                const y = yFor(Number(data[hoverIdx]?.value || 0));
                ctx.strokeStyle = '#9ca3af';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(x + 0.5, padding.top);
                ctx.lineTo(x + 0.5, height - padding.bottom);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = pointColor;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }, [data, lineColor, pointColor, hoverIdx]);

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
                const n = Math.max(1, data?.length || 0);
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
                const label = data[nearest]?.label ?? '';
                const value = data[nearest]?.value ?? 0;
                container.title = `${label}: ${Number(value).toLocaleString('id-ID')}`;
            };
            const leave = () => setHoverIdx(null);
            canvas.addEventListener('mousemove', handler);
            canvas.addEventListener('mouseleave', leave);
            return () => {
                canvas.removeEventListener('mousemove', handler);
                canvas.removeEventListener('mouseleave', leave);
            };
        }, [data]);

        const tooltip = (() => {
            if (hoverIdx == null || !containerRef.current) return null;
            const d = data[hoverIdx];
            if (!d) return null;
            return (
                <div className="pointer-events-none absolute inset-x-0 -mt-6 text-center text-xs">
                    <span className="rounded bg-black/70 px-2 py-1 text-white">
                        {d.label}: {Number(d.value || 0).toLocaleString('id-ID')}
                    </span>
                </div>
            );
        })();

        return (
            <div ref={containerRef} className="relative w-full">
                {tooltip}
                <canvas ref={canvasRef} />
            </div>
        );
    };

    // Multi-series LineChart for two metrics (kunjungan & pasien)
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
            const height = 240;
            canvas.width = Math.floor(width * dpi);
            canvas.height = Math.floor(height * dpi);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
            ctx.clearRect(0, 0, width, height);

            const allValues = (series || []).flatMap((s) => (s.values || []).map((v) => Number(v || 0)));
            const maxVal = Math.max(1, ...allValues);
            const padding = { top: 12, right: 12, bottom: 64, left: 36 };
            const plotW = width - padding.left - padding.right;
            const plotH = height - padding.top - padding.bottom;
            const n = Math.max(1, labels?.length || 0);

            // grid
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

            // series lines and points
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
                ctx.fillStyle = s.color;
                (s.values || []).forEach((val, i) => {
                    const x = xFor(i);
                    const y = yFor(Number(val || 0));
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            // x labels (rotate)
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            (labels || []).forEach((lab, i) => {
                const lx = xFor(i);
                const ly = height - padding.bottom + 8;
                ctx.save();
                ctx.translate(lx, ly);
                ctx.rotate((-45 * Math.PI) / 180);
                ctx.fillText(String(lab || ''), 0, 0);
                ctx.restore();
            });

            // hover vertical guide
            if (hoverIdx != null) {
                const x = xFor(hoverIdx);
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
                const paddingLeft = 36;
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
        setRaw(Array.isArray(props?.data) ? props.data : []);
    }, [props]);

    // Filter by date only
    const filtered = useMemo(() => {
        const s = dateStart || undefined;
        const e = dateEnd || undefined;
        return (raw || []).filter((r) => {
            const d = splitDate((r as any)?.created_at);
            if (s && d !== '-' && d < s) return false;
            if (e && d !== '-' && d > e) return false;
            return true;
        });
    }, [raw, dateStart, dateEnd]);

    // Aggregate by ICD code/name and count visits and unique patients
    const tableRows = useMemo(() => {
        const map = new Map<string, { kode: string; nama: string; visits: number; patients: Set<string> }>();
        filtered.forEach((r) => {
            const kode = r.kode_icd10 || '-';
            const nama = r.nama_icd10 || '-';
            const key = `${kode}__${nama}`;
            if (!map.has(key)) map.set(key, { kode, nama, visits: 0, patients: new Set<string>() });
            const acc = map.get(key)!;
            acc.visits += 1;
            const rm = String(r.nomor_rm || '').trim();
            if (rm) acc.patients.add(rm);
        });
        const rows = Array.from(map.values()).map((v) => ({
            kode: v.kode,
            nama: v.nama,
            visits: v.visits,
            patients: v.patients.size,
        }));
        rows.sort((a, b) => b.visits - a.visits);
        return rows;
    }, [filtered]);

    // Pagination simple
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const total = tableRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return tableRows.slice(start, start + pageSize);
    }, [tableRows, page]);
    useEffect(() => {
        setPage(1);
    }, [dateStart, dateEnd, granularity]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Top ICD-10', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {/* Chart Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Grafik Top ICD-10</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const top = tableRows.slice(0, 10);
                            const labels = top.map((r) => `${r.kode}`);
                            const series = [
                                { name: 'Jumlah Kunjungan', color: '#3b82f6', values: top.map((r) => r.visits) },
                                { name: 'Jumlah Pasien', color: '#10b981', values: top.map((r) => r.patients) },
                            ];
                            return (
                                <div>
                                    <div className="text-sm font-semibold">Top 10 Kode ICD</div>
                                    <div className="mt-2">
                                        <MultiLineChart labels={labels} series={series} />
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top ICD-10</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Periode</label>
                                <select
                                    className="h-10 w-full rounded-md border px-2 text-sm"
                                    value={granularity}
                                    onChange={(e) => setGranularity(e.target.value as any)}
                                >
                                    <option value="weekly">Mingguan</option>
                                    <option value="monthly">Bulanan</option>
                                    <option value="yearly">Tahunan</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Awal</label>
                                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Akhir</label>
                                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDateStart('');
                                        setDateEnd('');
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const csrf = getCsrf();
                                        const form = document.createElement('form');
                                        form.method = 'POST';
                                        form.action = EXPORT_URL;

                                        const token = document.createElement('input');
                                        token.type = 'hidden';
                                        token.name = '_token';
                                        token.value = csrf;
                                        form.appendChild(token);

                                        const dataField = document.createElement('input');
                                        dataField.type = 'hidden';
                                        dataField.name = 'data';
                                        dataField.value = JSON.stringify(tableRows);
                                        form.appendChild(dataField);

                                        document.body.appendChild(form);
                                        form.submit();
                                        document.body.removeChild(form);
                                    }}
                                    disabled={tableRows.length === 0}
                                >
                                    Export Excel
                                </Button>
                                {/* print removed */}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="border p-2 text-center">No</th>
                                        <th className="border p-2 text-center">Kode ICD</th>
                                        <th className="border p-2 text-left">Nama ICD</th>
                                        <th className="border p-2 text-center">Jumlah Kunjungan</th>
                                        <th className="border p-2 text-center">Jumlah Pasien</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data
                                            </td>
                                        </tr>
                                    ) : (
                                        currentRows.map((r, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="border p-2 text-center">{(page - 1) * pageSize + idx + 1}</td>
                                                <td className="border p-2 text-center">{r.kode}</td>
                                                <td className="border p-2">{r.nama}</td>
                                                <td className="border p-2 text-center">{r.visits}</td>
                                                <td className="border p-2 text-center">{r.patients}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm">
                            <div>
                                Menampilkan {total === 0 ? 0 : (page - 1) * pageSize + 1} {' - '} {Math.min(page * pageSize, total)} dari {total} ICD
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

export default TopIcd10;

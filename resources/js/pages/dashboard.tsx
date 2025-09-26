import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type StatItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Megaphone, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    stats,
    dokterAktifList,
    pendapatanBulanIni,
    revenueMonthly,
    kunjunganMonthly,
    statusBridging,
    poliFrequency,
    avgTimes,
}: any) {
    const BarChart = ({ data, barColor = '#3b82f6' }: { data: Array<{ label: string; value: number }>; barColor?: string }) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);
        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const dpi = window.devicePixelRatio || 1;
            const width = container.clientWidth;
            const height = 200;
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
            const padding = { top: 10, right: 10, bottom: 28, left: 10 };
            const plotW = width - padding.left - padding.right;
            const plotH = height - padding.top - padding.bottom;
            const n = Math.max(1, data?.length || 0);
            const gap = 8;
            const barW = Math.max(4, (plotW - gap * (n - 1)) / n);

            // baseline
            ctx.strokeStyle = '#e5e7eb';
            ctx.beginPath();
            ctx.moveTo(padding.left, height - padding.bottom + 0.5);
            ctx.lineTo(width - padding.right, height - padding.bottom + 0.5);
            ctx.stroke();

            // bars
            let x = padding.left;
            ctx.fillStyle = barColor;
            (data || []).forEach((d) => {
                const h = Math.round((Number(d.value || 0) / maxVal) * plotH || 0);
                const y = height - padding.bottom - h;
                ctx.fillRect(x, y, barW, h);
                x += barW + gap;
            });

            // labels
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            x = padding.left + barW / 2;
            (data || []).forEach((d) => {
                ctx.fillText(String(d.label || ''), x, height - padding.bottom + 6, Math.max(16, barW + 6));
                x += barW + gap;
            });
        }, [data, barColor]);

        return (
            <div ref={containerRef} className="w-full">
                <canvas ref={canvasRef} />
            </div>
        );
    };

    const DonutChart = ({
        data,
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e', '#06b6d4'],
        cutout = 0.6,
        valueSuffix = '',
    }: {
        data: Array<{ label: string; value: number }>;
        colors?: string[];
        cutout?: number; // 0..1 fraction of inner radius
        valueSuffix?: string;
    }) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);
        const segmentsRef = useRef<Array<{ start: number; end: number }>>([]);
        const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
        const total = (data || []).reduce((a, b) => a + Number(b.value || 0), 0);

        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const dpi = window.devicePixelRatio || 1;
            const width = container.clientWidth;
            const height = 260;
            canvas.width = Math.floor(width * dpi);
            canvas.height = Math.floor(height * dpi);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.min(width, height) * 0.35;
            const inner = Math.max(0, Math.min(0.9, cutout)) * radius;
            const values = (data || []).map((d) => Number(d.value || 0));
            const sum = values.reduce((a, b) => a + b, 0) || 1;

            segmentsRef.current = [];
            let start = -Math.PI / 2;
            (data || []).forEach((d, i) => {
                const val = Number(d.value || 0);
                const frac = val / sum;
                const end = start + 2 * Math.PI * frac;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.fillStyle = colors[i % colors.length];
                ctx.arc(cx, cy, radius, start, end);
                ctx.lineTo(cx, cy);
                ctx.fill();
                segmentsRef.current.push({ start, end });
                start = end;
            });

            // punch hole
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(cx, cy, inner, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            // center text only on hover - tighter layout
            if (hoveredIdx != null && data[hoveredIdx]) {
                const sel = data[hoveredIdx];
                const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
                ctx.fillStyle = isDark ? '#e5e7eb' : '#111827';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
                const name = String(sel.label || '');
                const valueText = `${Number(sel.value || 0).toLocaleString('id-ID')}${valueSuffix}`;
                ctx.fillText(name, cx, cy - 8);
                ctx.font = 'bold 16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
                ctx.fillText(valueText, cx, cy + 10);
            }
        }, [data, colors, cutout, total, valueSuffix, hoveredIdx]);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const handleMove = (ev: MouseEvent) => {
                const rect = canvas.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;
                const width = rect.width;
                const height = rect.height;
                const cx = width / 2;
                const cy = height / 2;
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const outerR = Math.min(width, height) * 0.35;
                const innerR = Math.max(0, Math.min(0.9, cutout)) * outerR;
                if (dist < innerR || dist > outerR) {
                    setHoveredIdx(null);
                    return;
                }
                let angle = Math.atan2(dy, dx);
                angle -= -Math.PI / 2;
                while (angle < 0) angle += Math.PI * 2;
                angle = angle % (Math.PI * 2);
                const segs = segmentsRef.current || [];
                for (let i = 0; i < segs.length; i++) {
                    let s = segs[i].start - -Math.PI / 2;
                    let e = segs[i].end - -Math.PI / 2;
                    while (s < 0) {
                        s += Math.PI * 2;
                        e += Math.PI * 2;
                    }
                    if (angle >= s && angle <= e) {
                        setHoveredIdx(i);
                        return;
                    }
                }
                setHoveredIdx(null);
            };
            const handleLeave = () => setHoveredIdx(null);
            canvas.addEventListener('mousemove', handleMove);
            canvas.addEventListener('mouseleave', handleLeave);
            return () => {
                canvas.removeEventListener('mousemove', handleMove);
                canvas.removeEventListener('mouseleave', handleLeave);
            };
        }, [cutout, data]);

        return (
            <div ref={containerRef} className="w-full">
                <canvas ref={canvasRef} />
                {/* Legend */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(data || []).map((d, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-start gap-2 text-xs"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            <span className="inline-block size-2 rounded" style={{ background: colors[i % colors.length] }} />
                            <span className="truncate">{d.label}</span>
                        </div>
                    ))}
                </div>
                {/* No external tooltip; info shown only in center on hover */}
            </div>
        );
    };
    const LineChart = ({
        data,
        lineColor = '#3b82f6',
        pointColor = '#1d4ed8',
        valuePrefix = '',
        valueSuffix = '',
    }: {
        data: Array<{ label: string; value: number }>;
        lineColor?: string;
        pointColor?: string;
        valuePrefix?: string;
        valueSuffix?: string;
    }) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);
        const [hover, setHover] = useState<{ x: number; y: number; idx: number } | null>(null);

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
            const padding = { top: 12, right: 12, bottom: 30, left: 32 };
            const plotW = width - padding.left - padding.right;
            const plotH = height - padding.top - padding.bottom;
            const n = Math.max(1, data?.length || 0);

            // y-axis grid lines (4)
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (plotH * i) / 4 + 0.5;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            }

            // axes labels (y min/max)
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('0', padding.left - 6, height - padding.bottom);
            ctx.fillText(String(Math.round(maxVal)), padding.left - 6, padding.top);

            // x positions
            const xFor = (i: number) => padding.left + (plotW * i) / Math.max(1, n - 1);
            const yFor = (v: number) => height - padding.bottom - (Math.min(maxVal, Math.max(0, v)) / maxVal) * plotH;

            // line path
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

            // x labels
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            (data || []).forEach((d, i) => {
                const x = xFor(i);
                ctx.fillText(String(d.label || ''), x, height - padding.bottom + 6);
            });

            // hover guide
            if (hover) {
                const i = hover.idx;
                const x = xFor(i);
                const y = yFor(Number(data[i]?.value || 0));
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
        }, [data, lineColor, pointColor, hover]);

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
                // find nearest index
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
                const label = data[nearest]?.label ?? '';
                const value = data[nearest]?.value ?? 0;
                setHover({ x: x, y: 0, idx: nearest });
                // set title for native tooltip fallback
                container.title = `${label}: ${valuePrefix}${Number(value).toLocaleString('id-ID')}${valueSuffix}`;
            };
            const leave = () => setHover(null);
            canvas.addEventListener('mousemove', handler);
            canvas.addEventListener('mouseleave', leave);
            return () => {
                canvas.removeEventListener('mousemove', handler);
                canvas.removeEventListener('mouseleave', leave);
            };
        }, [data, valuePrefix, valueSuffix]);

        const tooltip = (() => {
            if (!hover || !containerRef.current) return null;
            const i = hover.idx;
            const d = data[i];
            if (!d) return null;
            return (
                <div className="pointer-events-none absolute inset-x-0 -mt-6 text-center text-xs">
                    <span className="rounded bg-black/70 px-2 py-1 text-white">
                        {d.label}: {valuePrefix}
                        {Number(d.value || 0).toLocaleString('id-ID')}
                        {valueSuffix}
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
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string>('');
    const [modalType, setModalType] = useState<string>('');

    const handleOpenModal = (text: string, type?: string) => {
        setModalContent(text);
        setModalType(type || '');
        setOpen(true);
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Grid Section */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {stats.map((item: StatItem, idx: number) => (
                        <div key={idx} className={`rounded-lg p-4 text-white shadow-md ${item.color}`}>
                            {/* Top */}
                            <div className="flex items-start justify-between">
                                <div className="text-2xl font-bold">{item.value}</div>
                                {item.icon}
                            </div>
                            {/* Label */}
                            <div className="mt-2 text-sm font-medium">{item.label}</div>
                            {/* Footer link */}
                            {item.footer
                                ? (() => {
                                      const isDirectNav = item.label === 'Jumlah Pasien Terdaftar' || item.label === 'Kunjungan Hari Ini';
                                      const href = item.footer.href;
                                      return (
                                          <a
                                              href={href}
                                              onClick={(e) => {
                                                  if (!isDirectNav) {
                                                      e.preventDefault();
                                                      handleOpenModal(item.footer!.text, item.label);
                                                  }
                                              }}
                                              className="mt-4 flex w-full items-center justify-between text-xs hover:underline"
                                          >
                                              {item.footer.text}
                                              <span>➔</span>
                                          </a>
                                      );
                                  })()
                                : null}
                        </div>
                    ))}
                </div>

                {/* Content Section */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 md:min-h-min dark:border-sidebar-border">
                    {/* Status Bridging - full width */}
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-semibold">Status Bridging</div>
                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                            <div className="rounded border p-3">
                                <div className="flex items-center justify-between">
                                    <span>BPJS</span>
                                    <span className={`${statusBridging?.bpjs ? 'text-green-600' : 'text-red-600'}`}>
                                        {statusBridging?.bpjs ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded border p-3">
                                <div className="flex items-center justify-between">
                                    <span>SatuSehat</span>
                                    <span className={`${statusBridging?.satusehat ? 'text-green-600' : 'text-red-600'}`}>
                                        {statusBridging?.satusehat ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded border p-3">
                                <div className="flex items-center justify-between">
                                    <span>Last sync</span>
                                    <span className="text-xs text-muted-foreground">{statusBridging?.last_sync}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts row - two cards below */}
                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Revenue monthly chart (Line) */}
                        <div className="rounded-lg border p-4">
                            <div className="text-sm font-semibold">Grafik Pendapatan Bulanan</div>
                            <div className="mt-3">
                                <LineChart
                                    data={(revenueMonthly || []).map((d: any) => ({ label: d.label, value: d.value }))}
                                    lineColor="#3b82f6"
                                    pointColor="#1d4ed8"
                                    valuePrefix="Rp"
                                />
                            </div>
                        </div>

                        {/* Kunjungan monthly chart (Line) */}
                        <div className="rounded-lg border p-4">
                            <div className="text-sm font-semibold">Grafik Kunjungan Bulanan</div>
                            <div className="mt-3">
                                <LineChart
                                    data={(kunjunganMonthly || []).map((d: any) => ({ label: d.label, value: d.value }))}
                                    lineColor="#10b981"
                                    pointColor="#047857"
                                    valueSuffix=" kunjungan"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Frekuensi Pendaftaran per Poli (Donut) + Empty Card */}
                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <div className="text-sm font-semibold">Frekuensi Pendaftaran per Poli</div>
                            <div className="mt-3">
                                <div className="mb-2 text-xs text-muted-foreground">Distribusi kunjungan per poli (akumulatif)</div>
                                <DonutChart data={(poliFrequency || []).map((d: any) => ({ label: d.label, value: d.value }))} valueSuffix="" />
                            </div>
                        </div>
                        <div className="min-h-[260px] rounded-lg border p-4">
                            <div className="text-sm font-semibold">Rata-rata Waktu (Hari Ini)</div>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded border p-3">
                                    <div className="text-xs text-muted-foreground">Tunggu Perawat</div>
                                    <div className="mt-1 text-xl font-semibold">
                                        {Number(avgTimes?.wait_perawat || 0).toLocaleString('id-ID')} mnt
                                    </div>
                                </div>
                                <div className="rounded border p-3">
                                    <div className="text-xs text-muted-foreground">Tunggu Dokter</div>
                                    <div className="mt-1 text-xl font-semibold">{Number(avgTimes?.wait_dokter || 0).toLocaleString('id-ID')} mnt</div>
                                </div>
                                <div className="rounded border p-3">
                                    <div className="text-xs text-muted-foreground">Pemeriksaan Perawat</div>
                                    <div className="mt-1 text-xl font-semibold">
                                        {Number(avgTimes?.exam_perawat || 0).toLocaleString('id-ID')} mnt
                                    </div>
                                </div>
                                <div className="rounded border p-3">
                                    <div className="text-xs text-muted-foreground">Pemeriksaan Dokter</div>
                                    <div className="mt-1 text-xl font-semibold">{Number(avgTimes?.exam_dokter || 0).toLocaleString('id-ID')} mnt</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 rounded p-1 text-neutral-600 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:text-neutral-300 dark:hover:bg-neutral-800"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="mb-4 pr-8 text-lg font-semibold">{modalContent}</h2>
                        {modalType === 'Dokter Aktif' ? (
                            <div className="max-h-80 space-y-3 overflow-auto">
                                {(dokterAktifList || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tidak ada dokter aktif hari ini.</p>
                                ) : (
                                    (dokterAktifList || []).map((d: any, idx: number) => (
                                        <div key={idx} className="rounded border p-3">
                                            <div className="font-medium">{d.nama}</div>
                                            <div className="mt-1 text-xs">
                                                <span className="mr-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-200 ring-inset">
                                                    Kuota Pemeriksaan: {Number(d.kuota || 0).toLocaleString('id-ID')}
                                                </span>
                                                <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                                                    Melakukan Pemeriksaan: {Number(d.diperiksa || 0).toLocaleString('id-ID')}
                                                </span>
                                                {Number(d.diperiksa || 0) > Number(d.kuota || 0) && (
                                                    <span className="ml-2 inline-flex items-center rounded bg-green-50 px-2 py-0.5 text-green-700 ring-1 ring-green-200 ring-inset">
                                                        <Megaphone className="mr-1 h-3 w-3" />
                                                        Pekerja keras
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                {(d.jadwal || []).map((j: any, i: number) => (
                                                    <div key={i}>
                                                        {j.hari}: {j.jam_mulai} - {j.jam_selesai}
                                                        {typeof j.kuota !== 'undefined' && (
                                                            <span> (Kuota: {Number(j.kuota || 0).toLocaleString('id-ID')})</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : modalType === 'Pendapatan Hari Ini' ? (
                            <div className="space-y-4">
                                {(() => {
                                    const stat: any = (stats || []).find((s: any) => s.label === 'Pendapatan Hari Ini');
                                    const todayObat = stat?.meta?.today_obat || 0;
                                    const todayTindakan = stat?.meta?.today_tindakan || 0;
                                    return (
                                        <>
                                            {/* Top row: Obat & Tindakan */}
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="rounded border p-3">
                                                    <div className="text-xs text-muted-foreground">Pendapatan Obat (Hari Ini)</div>
                                                    <div className="mt-1 text-lg font-semibold">{`Rp${Number(todayObat).toLocaleString('id-ID')}`}</div>
                                                </div>
                                                <div className="rounded border p-3">
                                                    <div className="text-xs text-muted-foreground">Pendapatan Tindakan (Hari Ini)</div>
                                                    <div className="mt-1 text-lg font-semibold">{`Rp${Number(todayTindakan).toLocaleString('id-ID')}`}</div>
                                                </div>
                                            </div>
                                            {/* Bottom: Large Pendapatan card with daily + monthly */}
                                            <div className="rounded border p-4">
                                                <div className="text-xs text-muted-foreground">Pendapatan</div>
                                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Hari Ini</div>
                                                        <div className="mt-1 text-xl font-semibold">{String(stat?.value || 'Rp0')}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Bulan Ini</div>
                                                        <div className="mt-1 text-xl font-semibold">{`Rp${Number(pendapatanBulanIni || 0).toLocaleString('id-ID')}`}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <p className="mb-4">{modalContent}</p>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
const PRINT_URL = '/laporan/pendaftaran/print';

type PageProps = { title: string; data: LAP_PendaftaranItem[] };

const TrendPendaftaran = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<LAP_PendaftaranItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    // Hanya filter tanggal awal/akhir
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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

    const submitPrint = () => {
        const csrf = getCsrf();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = PRINT_URL;
        form.target = '_blank';

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
        dataField.value = JSON.stringify(filteredData);
        form.appendChild(dataField);

        // Tidak ada filter poli/dokter

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
                        <CardTitle>Trend Pendaftaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Awal</label>
                                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Akhir</label>
                                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-2">
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button variant="outline" disabled={loading}>
                                    Filter
                                </Button>
                                <Button onClick={() => setShowConfirm(true)} disabled={loading || filteredData.length === 0}>
                                    Save &amp; Print
                                </Button>
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
                                        <th className="border p-2 text-center text-sm font-semibold">Jumlah Pasien 1 Kali</th>
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

            <Dialog open={showConfirm} onOpenChange={(open) => setShowConfirm(open)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Cetak</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div>Apakah Anda yakin ingin mencetak data yang sudah difilter?</div>
                        <div className="rounded-md border p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-muted-foreground">Tanggal Awal</div>
                                <div className="font-medium">{dateStart || '-'}</div>
                                <div className="text-muted-foreground">Tanggal Akhir</div>
                                <div className="font-medium">{dateEnd || '-'}</div>
                                {/* Filter Poli/Dokter dihapus */}
                                <div className="text-muted-foreground">Jumlah Data</div>
                                <div className="font-medium">{filteredData.length}</div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                Batal
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowConfirm(false);
                                    submitPrint();
                                }}
                            >
                                Cetak
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default TrendPendaftaran;

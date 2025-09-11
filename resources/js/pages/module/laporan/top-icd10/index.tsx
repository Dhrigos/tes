import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
    const [showConfirm, setShowConfirm] = useState(false);

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
                                <Button onClick={() => setShowConfirm(true)} disabled={tableRows.length === 0}>
                                    Save &amp; Print
                                </Button>
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

            <Dialog open={showConfirm} onOpenChange={(open) => setShowConfirm(open)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Cetak</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div>Apakah Anda yakin ingin mencetak Top ICD-10 sesuai filter?</div>
                        <div className="rounded-md border p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-muted-foreground">Periode</div>
                                <div className="font-medium">{granularity}</div>
                                <div className="text-muted-foreground">Tanggal Awal</div>
                                <div className="font-medium">{dateStart || '-'}</div>
                                <div className="text-muted-foreground">Tanggal Akhir</div>
                                <div className="font-medium">{dateEnd || '-'}</div>
                                <div className="text-muted-foreground">Jumlah Baris</div>
                                <div className="font-medium">{tableRows.length}</div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                Batal
                            </Button>
                            <Button onClick={() => setShowConfirm(false)}>Cetak</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default TopIcd10;

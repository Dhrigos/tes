import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

// Layout imports
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface StokPenyesuaianItemRaw {
    kode_obat?: string;
    nama_obat?: string;
    qty_sebelum?: number | string;
    qty_mutasi?: number | string;
    qty_sesudah?: number | string;
    jenis_penyesuaian?: string; // e.g. "STOK OPNAME", "PENYESUAIAN MASUK", "PENYESUAIAN KELUAR"
    alasan?: string;
    tanggal?: string; // YYYY-MM-DD
    jam?: string; // HH:mm or HH:mm:ss
    user_input_name?: string;
    jenis_gudang?: string;
    tipe?: string;
    created_at?: string; // fallback source for tanggal/jam
}

interface StokPenyesuaianItem {
    kode_obat: string;
    nama_obat: string;
    qty_sebelum: number | string;
    qty_mutasi: number | string;
    qty_sesudah: number | string;
    jenis_penyesuaian: string;
    alasan: string;
    tanggal: string;
    jam: string;
    user_input_name: string;
    tipe: string;
}

const splitDateTime = (value?: string) => {
    if (!value) return { date: '', time: '' };
    const s = String(value);
    if (s.includes('T')) {
        const [d, t] = s.split('T');
        return { date: d, time: (t || '').slice(0, 5) };
    }
    if (s.includes(' ')) {
        const [d, t] = s.split(' ');
        return { date: d, time: (t || '').slice(0, 5) };
    }
    return { date: s.slice(0, 10), time: '' };
};

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const PRINT_URL = '/laporan/stok-penyesuaian/print';

type PageProps = { title: string; data: StokPenyesuaianItemRaw[] };

const LaporanStokPenyesuaian = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<StokPenyesuaianItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterObat, setFilterObat] = useState('');
    const [filterJenis, setFilterJenis] = useState('');
    const [loading, setLoading] = useState(false);
    const [filterTipe, setFilterTipe] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.data) ? props.data : [];
        const normalized: StokPenyesuaianItem[] = items.map((it: StokPenyesuaianItemRaw) => {
            const rawDateTime = it.tanggal || it.created_at || '';
            let tanggal = '';
            let jam = '';
            if (rawDateTime) {
                const s = String(rawDateTime);
                if (s.includes('T')) {
                    const [d, t] = s.split('T');
                    tanggal = d.slice(0, 10);
                    jam = (t || '').slice(0, 5);
                } else if (s.includes(' ')) {
                    const [d, t] = s.split(' ');
                    tanggal = d.slice(0, 10);
                    jam = (t || '').slice(0, 5);
                } else {
                    tanggal = s.slice(0, 10);
                    jam = '';
                }
            }
            return {
                kode_obat: it.kode_obat || '-',
                nama_obat: it.nama_obat || '-',
                qty_sebelum: it.qty_sebelum ?? '-',
                qty_mutasi: it.qty_mutasi ?? '-',
                qty_sesudah: it.qty_sesudah ?? '-',
                jenis_penyesuaian: it.jenis_penyesuaian || '-',
                alasan: it.alasan || '-',
                tanggal,
                jam: it.jam ? String(it.jam).slice(0, 5) : jam,
                user_input_name: it.user_input_name || '-',
                tipe: it.jenis_gudang || it.tipe || '-',
            };
        });
        setRawData(normalized);
        setLoading(false);
    }, [props]);

    const obatOptions = useMemo(() => Array.from(new Set(rawData.map((d) => d.nama_obat).filter(Boolean))), [rawData]);
    const jenisOptions = useMemo(() => {
        const uniques = Array.from(new Set(rawData.map((d) => d.jenis_penyesuaian).filter(Boolean)));
        if (uniques.length > 0) return uniques;
        return ['STOK OPNAME', 'PENYESUAIAN MASUK', 'PENYESUAIAN KELUAR'];
    }, [rawData]);

    const tipeOptions = useMemo(() => {
        const uniques = Array.from(new Set(rawData.map((d) => d.tipe).filter(Boolean)));
        return uniques.length > 0 ? uniques : ['klinik', 'utama'];
    }, [rawData]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const ymd = row.tanggal;
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterObat && row.nama_obat !== filterObat) return false;
            if (filterJenis && row.jenis_penyesuaian !== filterJenis) return false;
            if (filterTipe && row.tipe !== filterTipe) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterObat, filterJenis, filterTipe]);

    // Pagination 10 items per page
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const totalItems = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPageData = useMemo(() => {
        const startIdx = (page - 1) * pageSize;
        return filteredData.slice(startIdx, startIdx + pageSize);
    }, [filteredData, page]);
    useEffect(() => {
        setPage(1);
    }, [dateStart, dateEnd, filterObat, filterJenis, filterTipe]);

    const handleFilter = () => {
        // reactive via memo
    };

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
        setFilterObat('');
        setFilterJenis('');
        setFilterTipe('');
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

        const obat = document.createElement('input');
        obat.type = 'hidden';
        obat.name = 'obat';
        obat.value = filterObat;
        form.appendChild(obat);

        const jenis = document.createElement('input');
        jenis.type = 'hidden';
        jenis.name = 'jenis';
        jenis.value = filterJenis;
        form.appendChild(jenis);

        // Build payload using original backend structure to match Blade expectations
        const originalItems: any[] = Array.isArray(props?.data) ? (props.data as any[]) : [];
        const filteredOriginal = originalItems.filter((item: any) => {
            const source = item?.tanggal || item?.created_at || '';
            const s = String(source);
            const dateOnly = s.includes('T') ? s.split('T')[0] : s.includes(' ') ? s.split(' ')[0] : s.slice(0, 10);
            if (dateStart && dateOnly && dateOnly < dateStart) return false;
            if (dateEnd && dateOnly && dateOnly > dateEnd) return false;
            if (filterObat && (item?.nama_obat || '') !== filterObat) return false;
            if (filterJenis && (item?.jenis_penyesuaian || '') !== filterJenis) return false;
            if (filterTipe) {
                const tipeVal = item?.jenis_gudang || item?.tipe || '';
                if (tipeVal !== filterTipe) return false;
            }
            return true;
        });

        // Ensure each item includes tanggal and jam for PDF template
        const payload = filteredOriginal.map((item: any) => {
            const source = item?.tanggal || item?.created_at || '';
            const s = String(source || '');
            let tanggal = '';
            let jam = '';
            if (s.includes('T')) {
                const [d, t] = s.split('T');
                tanggal = d.slice(0, 10);
                jam = (t || '').slice(0, 5);
            } else if (s.includes(' ')) {
                const [d, t] = s.split(' ');
                tanggal = d.slice(0, 10);
                jam = (t || '').slice(0, 5);
            } else {
                tanggal = s.slice(0, 10);
            }
            const jamFinal = item?.jam ? String(item.jam).slice(0, 5) : jam;
            return { ...item, tanggal, jam: jamFinal };
        });

        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(payload);
        form.appendChild(dataField);

        const tipeField = document.createElement('input');
        tipeField.type = 'hidden';
        tipeField.name = 'tipe';
        tipeField.value = filterTipe;
        form.appendChild(tipeField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
    const handlePrint = () => {
        if (!filteredData.length) return;
        setShowConfirm(true);
    };

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Stok Penyesuaian', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Selisih Mutasi & Penyesuaian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-7">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Awal</label>
                                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Akhir</label>
                                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Obat</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={filterObat}
                                    onChange={(e) => setFilterObat(e.target.value)}
                                >
                                    <option value="">-- Semua Obat --</option>
                                    {obatOptions.map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Jenis Penyesuaian</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={filterJenis}
                                    onChange={(e) => setFilterJenis(e.target.value)}
                                >
                                    <option value="">-- Semua Jenis --</option>
                                    {jenisOptions.map((j) => (
                                        <option key={j} value={j}>
                                            {j}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tipe</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={filterTipe}
                                    onChange={(e) => setFilterTipe(e.target.value)}
                                >
                                    <option value="">-- Semua Tipe --</option>
                                    {tipeOptions.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-2">
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button variant="outline" onClick={handleFilter} disabled={loading}>
                                    Filter
                                </Button>
                                <Button onClick={handlePrint} disabled={loading || filteredData.length === 0}>
                                    Save &amp; Print
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="p-2 text-center text-sm font-semibold">No</th>
                                        <th className="p-2 text-center text-sm font-semibold">Kode Obat/Alkes</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nama Obat/Alkes</th>
                                        <th className="p-2 text-center text-sm font-semibold">Qty Sebelum</th>
                                        <th className="p-2 text-center text-sm font-semibold">Qty Mutasi</th>
                                        <th className="p-2 text-center text-sm font-semibold">Qty Sesudah</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jenis Penyesuaian</th>
                                        <th className="p-2 text-center text-sm font-semibold">Alasan</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jam</th>
                                        <th className="p-2 text-center text-sm font-semibold">Petugas</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tipe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={12} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data untuk pilihan ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPageData.map((row, idx) => {
                                            return (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                    <td className="p-2 text-center text-sm">{row.kode_obat || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.nama_obat || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.qty_sebelum}</td>
                                                    <td className="p-2 text-center text-sm">{row.qty_mutasi}</td>
                                                    <td className="p-2 text-center text-sm">{row.qty_sesudah}</td>
                                                    <td className="p-2 text-center text-sm">{row.jenis_penyesuaian || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.alasan || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.tanggal || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.jam || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.user_input_name || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.tipe || '-'}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <div>
                                Menampilkan {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}
                                {' - '}
                                {Math.min(page * pageSize, totalItems)} dari {totalItems} data
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
                                <div className="text-muted-foreground">Obat</div>
                                <div className="font-medium">{filterObat || '-'}</div>
                                <div className="text-muted-foreground">Jenis</div>
                                <div className="font-medium">{filterJenis || '-'}</div>
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

export default LaporanStokPenyesuaian;

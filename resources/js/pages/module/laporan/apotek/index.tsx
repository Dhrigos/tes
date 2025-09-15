import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePage } from '@inertiajs/react';
import { RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Layout imports
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// -----------------------
// Laporan Data Lunas Apotek
// -----------------------
interface ApotekLunas {
    nama_obat_tindakan?: string;
    harga_obat_tindakan?: number | string;
    qty?: number | string;
    total_sementara?: number | string;
    is_detail?: boolean;
}

interface KasirRaw {
    id?: number;
    kode_faktur?: string;
    no_rawat?: string;
    no_rm?: string;
    nama?: string;
    tanggal?: string;
    poli?: string;
    dokter?: string;
    penjamin?: string;
    user_input_name?: string;
    apotek_lunas?: ApotekLunas[];
}

interface ApotekHeaderRow {
    is_detail: false;
    no: number | string;
    kode_faktur: string;
    no_rm: string;
    no_rawat: string;
    nama: string;
    nama_obat_tindakan: string;
    harga_obat_tindakan: string | number;
    qty: string | number;
    total_sementara: string | number;
    poli: string;
    dokter: string;
    penjamin: string;
    tanggal: string;
    user_input_name: string;
}

interface ApotekDetailRow {
    is_detail: true;
    no: string;
    kode_faktur: string;
    no_rm: string;
    no_rawat: string;
    nama: string;
    nama_obat_tindakan: string;
    harga_obat_tindakan: string | number;
    qty: string | number;
    total_sementara: string | number;
    poli: string;
    dokter: string;
    penjamin: string;
    tanggal: string;
    user_input_name: string;
}

type ApotekRow = ApotekHeaderRow | ApotekDetailRow;

const formatDatePart = (raw?: string) => {
    if (!raw) return '';
    const s = String(raw).trim();
    // Support both ISO with 'T' and MySQL-like 'YYYY-MM-DD HH:MM:SS'
    const hasT = s.includes('T');
    const sep = hasT ? 'T' : ' ';
    const parts = s.split(sep);
    return (parts[0] || '').trim();
};

const formatTimePart = (raw?: string) => {
    if (!raw) return '';
    const s = String(raw).trim();
    const hasT = s.includes('T');
    const sep = hasT ? 'T' : ' ';
    const parts = s.split(sep);
    const time = (parts[1] || '').trim();
    // Expect HH:MM:SS or HH:MM
    return time.slice(0, 5);
};

const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
};

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
// removed print URL
const EXPORT_URL = '/laporan/apotek/export';

type PageProps = {
    title: string;
    header: KasirRaw[];
    obatList: string[];
};

const LaporanApotek = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<KasirRaw[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterPoli, setFilterPoli] = useState('');
    const [filterObat, setFilterObat] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [detailItem, setDetailItem] = useState<KasirRaw | null>(null);
    // removed print confirm state
    const [openObatDropdown, setOpenObatDropdown] = useState(false);

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.header) ? props.header : [];
        setRawData(items);
        setLoading(false);
    }, [props]);

    const obatOptions = useMemo(() => {
        return props?.obatList || [];
    }, [props]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const ymd = formatDatePart(row.tanggal);
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterPoli && (row.poli || '') !== filterPoli) return false;
            if (Array.isArray(filterObat) && filterObat.length > 0) {
                const list = row.apotek_lunas || [];
                const targets = new Set(filterObat.map((o) => o.trim().toLowerCase()));
                const hasObat = list.some((obat) => targets.has((obat.nama_obat_tindakan || '').trim().toLowerCase()));
                if (!hasObat) return false;
            }
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterPoli, filterObat]);

    const poliOptions = useMemo(() => {
        const list = rawData.map((d) => d.poli).filter((v): v is string => Boolean(v));
        return Array.from(new Set(list));
    }, [rawData]);

    // Susun baris header + detail seperti Blade
    const tableRows: ApotekRow[] = useMemo(() => {
        const rows: ApotekRow[] = [];
        filteredData.forEach((item, index) => {
            const detailList = item.apotek_lunas || [];
            const first = detailList[0];
            rows.push({
                is_detail: false,
                no: index + 1,
                kode_faktur: item.kode_faktur || '-',
                no_rm: item.no_rm || '-',
                no_rawat: item.no_rawat || '-',
                nama: item.nama || '-',
                nama_obat_tindakan: first?.nama_obat_tindakan || '-',
                harga_obat_tindakan: first?.harga_obat_tindakan || '-',
                qty: first?.qty ?? '-',
                total_sementara: first?.total_sementara ?? '-',
                poli: item.poli || '-',
                dokter: item.dokter || '-',
                penjamin: item.penjamin || '-',
                tanggal: item.tanggal || '-',
                user_input_name: item.user_input_name || '-',
            });
            if (detailList.length > 1) {
                detailList.slice(1).forEach((d) => {
                    rows.push({
                        is_detail: true,
                        no: '',
                        kode_faktur: '',
                        no_rm: '',
                        no_rawat: '',
                        nama: '',
                        nama_obat_tindakan: d.nama_obat_tindakan || '-',
                        harga_obat_tindakan: d.harga_obat_tindakan || '-',
                        qty: d.qty ?? '-',
                        total_sementara: d.total_sementara ?? '-',
                        poli: '',
                        dokter: '',
                        penjamin: '',
                        tanggal: '',
                        user_input_name: '',
                    });
                });
            }
        });
        return rows;
    }, [filteredData]);

    // Pagination 10 header rows per page
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const headerRows = useMemo(() => tableRows.filter((r) => !r.is_detail), [tableRows]);
    const totalItems = headerRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentHeaderRows = useMemo(() => {
        const startIdx = (page - 1) * pageSize;
        return headerRows.slice(startIdx, startIdx + pageSize);
    }, [headerRows, page]);
    useEffect(() => {
        setPage(1);
    }, [dateStart, dateEnd, filterPoli, filterObat]);

    // Filtering is reactive via filteredData

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
        setFilterPoli('');
        setFilterObat([]);
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

        const printData = tableRows;

        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(printData);
        form.appendChild(dataField);

        // also send flat rows (header+detail as is)
        const flatField = document.createElement('input');
        flatField.type = 'hidden';
        flatField.name = 'flat_rows';
        flatField.value = JSON.stringify(printData);
        form.appendChild(flatField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
    const handleExport = () => {
        if (!filteredData.length) return;
        submitExport();
    };

    // removed handlePrint

    // removed submitPrintDetail

    const kodeFakturToItem = useMemo(() => {
        const map = new Map<string, KasirRaw>();
        (rawData || []).forEach((it) => {
            if (it.kode_faktur) map.set(it.kode_faktur, it);
        });
        return map;
    }, [rawData]);

    const openDetail = (row: ApotekRow) => {
        if (row.is_detail) return;
        const item = kodeFakturToItem.get(row.kode_faktur);
        if (item) {
            setDetailItem(item);
            setShowDetail(true);
        }
    };

    const closeDetail = () => {
        setShowDetail(false);
        setDetailItem(null);
    };

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Apotek', href: '' },
    ];

    const detailTotalObat = useMemo(() => {
        const list = detailItem?.apotek_lunas || [];
        return list.reduce((sum: number, o: ApotekLunas) => sum + (Number(o.qty) || 0), 0);
    }, [detailItem]);

    const detailPendapatan = useMemo(() => {
        const list = detailItem?.apotek_lunas || [];
        return list.reduce((sum: number, o: ApotekLunas) => sum + (Number(o.total_sementara) || 0), 0);
    }, [detailItem]);

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Data Lunas Apotek</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium">Tanggal Awal</label>
                                <Input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium">Tanggal Akhir</label>
                                <Input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium">Poli</label>
                                <Select value={filterPoli || 'all'} onValueChange={(value) => setFilterPoli(value === 'all' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- Semua Poli --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">-- Semua Poli --</SelectItem>
                                        {poliOptions.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {p}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative md:col-span-4">
                                <label className="mb-1 block text-sm font-medium">Nama Obat</label>
                                <button
                                    type="button"
                                    className="w-full rounded border p-2 text-left text-sm"
                                    onClick={() => setOpenObatDropdown((v) => !v)}
                                >
                                    {(filterObat || []).length > 0 ? `${(filterObat || []).length} dipilih` : 'Pilih obat...'}
                                </button>
                                {openObatDropdown && (
                                    <div className="absolute z-50 mt-1 w-full rounded border bg-background shadow">
                                        <div className="flex items-center justify-between gap-2 border-b px-2 py-1 text-xs">
                                            <button
                                                type="button"
                                                className="rounded border px-2 py-1"
                                                onClick={() => setFilterObat(obatOptions.slice())}
                                            >
                                                Pilih semua
                                            </button>
                                            <button type="button" className="rounded border px-2 py-1" onClick={() => setFilterObat([])}>
                                                Hapus semua
                                            </button>
                                        </div>
                                        <div className="max-h-48 overflow-auto p-2 text-sm">
                                            {obatOptions.map((obat) => {
                                                const checked = (filterObat || []).includes(obat);
                                                return (
                                                    <label key={obat} className="flex cursor-pointer items-center gap-2 py-1">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4"
                                                            checked={checked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFilterObat((prev) => Array.from(new Set([...(prev || []), obat])));
                                                                } else {
                                                                    setFilterObat((prev) => (prev || []).filter((o) => o !== obat));
                                                                }
                                                            }}
                                                        />
                                                        <span>{obat}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div className="border-t p-2 text-right">
                                            <button
                                                type="button"
                                                className="rounded border px-3 py-1 text-sm"
                                                onClick={() => setOpenObatDropdown(false)}
                                            >
                                                Selesai
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-2">
                                <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" onClick={handleExport} disabled={loading || filteredData.length === 0}>
                                    Export Excel
                                </Button>
                                {/* print removed */}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="p-2 text-center text-sm font-semibold">No</th>
                                        <th className="p-2 text-center text-sm font-semibold">Kode Faktur</th>
                                        <th className="p-2 text-center text-sm font-semibold">No RM</th>
                                        <th className="p-2 text-center text-sm font-semibold">No Rawat</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nama</th>
                                        <th className="p-2 text-center text-sm font-semibold">Poli</th>
                                        <th className="p-2 text-center text-sm font-semibold">Dokter</th>
                                        <th className="p-2 text-center text-sm font-semibold">Penjamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
                                        <th className="p-2 text-center text-sm font-semibold">Pilihan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data untuk pilihan ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentHeaderRows.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).kode_faktur}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).no_rm}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).no_rawat}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).nama}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).poli}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).dokter}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).penjamin}</td>
                                                <td className="p-2 text-center text-sm">{(row as any).tanggal}</td>
                                                <td className="p-2 text-center text-sm">
                                                    {!row.is_detail && (
                                                        <Button size="sm" variant="outline" onClick={() => openDetail(row)}>
                                                            Detail
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
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

            <Dialog open={showDetail} onOpenChange={(open) => (open ? setShowDetail(true) : closeDetail())}>
                <DialogContent className="overflow-y-auto sm:max-w-5xl" style={{ maxHeight: '90vh', aspectRatio: '4 / 3' } as any}>
                    <DialogHeader>
                        <DialogTitle>Detail Data Lunas Apotek</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Header sections */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Data Pasien</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">No RM</div>
                                    <div className="font-medium">{detailItem?.no_rm || '-'}</div>
                                    <div className="text-muted-foreground">No Rawat</div>
                                    <div className="font-medium">{detailItem?.no_rawat || '-'}</div>
                                    <div className="text-muted-foreground">Nama</div>
                                    <div className="font-medium">{detailItem?.nama || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Tanggal Transaksi</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Tanggal</div>
                                    <div className="font-medium">{formatDatePart(detailItem?.tanggal) || '-'}</div>
                                    <div className="text-muted-foreground">Jam</div>
                                    <div className="font-medium">{formatTimePart(detailItem?.tanggal) || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Summary</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Total Obat</div>
                                    <div className="font-medium">{detailTotalObat}</div>
                                    <div className="text-muted-foreground">Total Pendapatan</div>
                                    <div className="font-medium">{formatRupiah(detailPendapatan)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Detail obat */}
                        <div className="rounded-md border p-3">
                            <div className="mb-2 text-xs font-semibold">Detail Obat</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="p-2 text-left">Nama Obat/Alkes</th>
                                            <th className="p-2 text-center">Qty</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(detailItem?.apotek_lunas || []).map((obat: ApotekLunas, idx: number) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2">{obat.nama_obat_tindakan || '-'}</td>
                                                <td className="p-2 text-center">{obat.qty ?? 0}</td>
                                                <td className="p-2 text-right">{formatRupiah(Number(obat.total_sementara) || 0)}</td>
                                            </tr>
                                        )) || (
                                            <tr>
                                                <td colSpan={3} className="p-2 text-center text-muted-foreground">
                                                    Tidak ada data obat
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {/* print detail removed */}
                        <Button onClick={closeDetail}>Tutup</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* print dialog removed */}
        </AppLayout>
    );
};

export default LaporanApotek;

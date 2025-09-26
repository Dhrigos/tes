import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type BreadcrumbItem = { title: string; href: string };

interface PengeluaranBarangRow {
    id?: number;
    jenis_pengeluaran?: string;
    supplier_id?: string;
    keterangan?: string;
    tanggal_return?: string;
    kode_barang_keluar?: string;
    nama_pemeriksa?: string;
    nama_approver?: string;
    pembelian_id?: string;
    created_at?: string;
    // Relasi
    items?: {
        id?: number;
        pengeluaran_id?: number;
        kode_obat_alkes?: string;
        nama_obat_alkes?: string;
        batch?: string;
        qty?: number;
    }[];
    supplier?: {
        id: string;
        kode: string;
        nama: string;
    };
}

interface Supplier {
    id: string;
    kode: string;
    nama: string;
}

type PageProps = { title: string; header: PengeluaranBarangRow[]; suppliers: Supplier[] };

const formatDatePart = (iso?: string) => {
    if (!iso) return '';
    const parts = String(iso).split('T');
    return parts[0] || '';
};

const formatJenisPengeluaran = (jenis?: string) => {
    if (!jenis) return '';
    // Mengganti underscore dengan spasi dan mengubah huruf pertama setiap kata menjadi kapital
    return jenis
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const LaporanPengeluaranBarang = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<PengeluaranBarangRow[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterJenis, setFilterJenis] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('all');
    const [filterKode, setFilterKode] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PengeluaranBarangRow | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const openDetail = (item: PengeluaranBarangRow) => {
        setSelectedItem(item);
        setIsDetailOpen(true);
    };

    const closeDetail = () => {
        setIsDetailOpen(false);
        setSelectedItem(null);
    };

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.header) ? props.header : [];
        setRawData(items);
        setLoading(false);
    }, [props]);

    const jenisOptions = useMemo(() => Array.from(new Set((rawData || []).map((d) => d.jenis_pengeluaran).filter(Boolean) as string[])), [rawData]);
    const formattedJenisOptions = useMemo(() => {
        return jenisOptions.map((jenis) => ({
            value: jenis,
            label: formatJenisPengeluaran(jenis),
        }));
    }, [jenisOptions]);
    const supplierOptions = useMemo(() => {
        // Membangun daftar supplier unik berdasarkan data dari header
        const uniqueSuppliers = Array.from(new Set((rawData || []).map((d) => d.supplier?.nama).filter(Boolean) as string[]));

        // Menambahkan opsi "Semua Supplier" di awal
        return [
            ...uniqueSuppliers.map((nama) => ({
                value: nama,
                label: nama,
            })),
        ];
    }, [rawData]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const ymd = formatDatePart(row.tanggal_return || row.created_at);
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterJenis && (row.jenis_pengeluaran || '') !== filterJenis) return false;
            if (filterSupplier && filterSupplier !== 'all' && row.supplier?.nama !== filterSupplier) return false;
            if (filterKode && row.kode_barang_keluar && !row.kode_barang_keluar.toLowerCase().includes(filterKode.toLowerCase())) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterJenis, filterSupplier, filterKode]);

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
    }, [dateStart, dateEnd, filterJenis, filterSupplier]);

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Pengeluaran Barang', href: '' },
    ];

    const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    // removed print URL
    const EXPORT_URL = '/laporan/pengeluaran-barang/export';

    // removed submitPrint

    const submitExport = () => {
        if (!filteredData.length) return;
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

        const jenis = document.createElement('input');
        jenis.type = 'hidden';
        jenis.name = 'jenis';
        jenis.value = filterJenis;
        form.appendChild(jenis);

        const supplier = document.createElement('input');
        supplier.type = 'hidden';
        supplier.name = 'supplier';
        supplier.value = filterSupplier;
        form.appendChild(supplier);

        const kode = document.createElement('input');
        kode.type = 'hidden';
        kode.name = 'kode';
        kode.value = filterKode;
        form.appendChild(kode);

        const exportData = filteredData.map((item, idx) => ({
            no: idx + 1,
            kode_barang_keluar: item.kode_barang_keluar || '-',
            jenis_pengeluaran: formatJenisPengeluaran(item.jenis_pengeluaran) || '-',
            keterangan: item.keterangan || '-',
            nama_pemeriksa: item.nama_pemeriksa || '-',
            nama_approver: item.nama_approver || '-',
            tanggal_return: formatDatePart(item.tanggal_return) || '-',
            supplier: item.supplier?.nama || '-',
            created_at: formatDatePart(item.created_at) || '-',
            items: item.items?.map(detail => ({
                kode_obat_alkes: detail.kode_obat_alkes || '-',
                nama_obat_alkes: detail.nama_obat_alkes || '-',
                batch: detail.batch || '-',
                qty: detail.qty || 0,
            })) || [],
        }));
        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(exportData);
        form.appendChild(dataField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Pengeluaran Barang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-8">
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
                            <div>
                                <label className="mb-1 block text-sm font-medium">Kode Barang Keluar</label>
                                <Input type="text" value={filterKode} onChange={(e) => setFilterKode(e.target.value)} placeholder="Cari kode..." />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Jenis</label>
                                <Select value={filterJenis || 'all'} onValueChange={(value) => setFilterJenis(value === 'all' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- Semua Jenis --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">-- Semua Jenis --</SelectItem>
                                        {formattedJenisOptions.map((j) => (
                                            <SelectItem key={j.value} value={j.value}>
                                                {j.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Supplier</label>
                                <Select value={filterSupplier || 'all'} onValueChange={(value) => setFilterSupplier(value === 'all' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Supplier</SelectItem>
                                        {supplierOptions.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDateStart('');
                                        setDateEnd('');
                                        setFilterKode('');
                                        setFilterJenis('');
                                        setFilterSupplier('all');
                                    }}
                                >
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
                                        <th className="p-2 text-center text-sm font-semibold">No</th>
                                        <th className="p-2 text-center text-sm font-semibold">Kode Barang Keluar</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jenis Pengeluaran</th>
                                        <th className="p-2 text-center text-sm font-semibold">Keterangan</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nama Pemeriksa</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nama Approver</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal Return</th>
                                        <th className="p-2 text-center text-sm font-semibold">Supplier</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
                                        <th className="p-2 text-center text-sm font-semibold">Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : totalItems === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPageData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{row.kode_barang_keluar || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatJenisPengeluaran(row.jenis_pengeluaran) || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.keterangan || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.nama_pemeriksa || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.nama_approver || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatDatePart(row.tanggal_return) || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.supplier?.nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatDatePart(row.created_at) || '-'}</td>
                                                <td className="p-2 text-center text-sm">
                                                    <Button variant="outline" size="sm" onClick={() => openDetail(row)}>
                                                        Detail
                                                    </Button>
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

            {/* Modal Detail */}
            <Dialog open={isDetailOpen} onOpenChange={(open) => (open ? setIsDetailOpen(true) : closeDetail())}>
                <DialogContent className="overflow-y-auto sm:max-w-5xl" style={{ maxHeight: '90vh' } as any}>
                    <DialogHeader>
                        <DialogTitle>Detail Pengeluaran Barang</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Informasi Umum</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Kode Barang Keluar</div>
                                    <div className="font-medium">{selectedItem?.kode_barang_keluar || '-'}</div>
                                    <div className="text-muted-foreground">Jenis Pengeluaran</div>
                                    <div className="font-medium">{formatJenisPengeluaran(selectedItem?.jenis_pengeluaran) || '-'}</div>
                                    <div className="text-muted-foreground">Supplier</div>
                                    <div className="font-medium">{selectedItem?.supplier?.nama || '-'}</div>
                                    <div className="text-muted-foreground">Tanggal</div>
                                    <div className="font-medium">{formatDatePart(selectedItem?.created_at) || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Keterangan</div>
                                <div className="text-sm">
                                    <div className="font-medium">{selectedItem?.keterangan || '-'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="rounded-md border">
                            <div className="border-b p-3">
                                <div className="text-sm font-semibold">Detail Items</div>
                            </div>
                            <div className="overflow-x-auto p-3">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="p-2 text-center text-sm font-semibold">No</th>
                                            <th className="p-2 text-center text-sm font-semibold">Kode Obat/Alkes</th>
                                            <th className="p-2 text-center text-sm font-semibold">Nama Obat/Alkes</th>
                                            <th className="p-2 text-center text-sm font-semibold">Batch</th>
                                            <th className="p-2 text-center text-sm font-semibold">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItem?.items && selectedItem.items.length > 0 ? (
                                            selectedItem.items.map((item, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-2 text-center text-sm">{idx + 1}</td>
                                                    <td className="p-2 text-center text-sm">{item.kode_obat_alkes || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{item.nama_obat_alkes || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{item.batch || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{item.qty || 0}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                                    Tidak ada detail item
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={closeDetail}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default LaporanPengeluaranBarang;

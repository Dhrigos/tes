import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

// Layout imports
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// -----------------------
// Laporan Kasir Detail (kasir_details)
// -----------------------
interface KasirDetailRow {
    kode_faktur?: string;
    no_rawat?: string;
    no_rm?: string;
    nama_obat_tindakan?: string;
    harga_obat_tindakan?: string | number;
    pelaksana?: string;
    qty?: string | number;
    subtotal?: string | number;
    nama_diskon?: string;
    harga_diskon?: string | number;
    total?: string | number;
    tanggal?: string;
    kasir?: {
        nama?: string;
        poli?: string;
        dokter?: string;
        penjamin?: string;
    };
}

const formatDatePart = (iso?: string) => {
    if (!iso) return '';
    const parts = String(iso).split('T');
    return parts[0] || '';
};

const formatTimePart = (iso?: string) => {
    if (!iso) return '';
    const parts = String(iso).split('T');
    return (parts[1] || '').slice(0, 5);
};

const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
};

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const PRINT_URL = '/laporan/kasir-detail/print';

type PageProps = { title: string; header: KasirDetailRow[] };

const LaporanApotek = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<KasirDetailRow[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterPoli, setFilterPoli] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.header) ? props.header : [];
        setRawData(items);
        setLoading(false);
    }, [props]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const ymd = formatDatePart(row.tanggal);
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterPoli && (row.kasir?.poli || '') !== filterPoli) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterPoli]);

    const poliOptions = useMemo(() => Array.from(new Set((rawData || []).map((d) => d.kasir?.poli).filter(Boolean) as string[])), [rawData]);

    // Pagination 10 header rows per page
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
    }, [dateStart, dateEnd, filterPoli]);

    const handleFilter = () => {
        // Filtering is reactive via filteredData
    };

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
        setFilterPoli('');
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

        const poli = document.createElement('input');
        poli.type = 'hidden';
        poli.name = 'poli';
        poli.value = filterPoli;
        form.appendChild(poli);

        // Tambahkan nomor urut sesuai tampilan
        const printData = filteredData.map((item, idx) => ({ no: idx + 1, ...item }));

        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(printData);
        form.appendChild(dataField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handlePrint = () => {
        if (!filteredData.length) return;
        setShowConfirm(true);
    };

    // Tidak ada print detail untuk kasir

    // No row detail popup for kasir

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Kasir', href: '' },
    ];

    // Tidak ada aggregate detail pada halaman kasir ini

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Kasir Detail</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Awal</label>
                                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tanggal Akhir</label>
                                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Poli</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={filterPoli}
                                    onChange={(e) => setFilterPoli(e.target.value)}
                                >
                                    <option value="">-- Semua Poli --</option>
                                    {poliOptions.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-3">
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
                                        <th className="p-2 text-center text-sm font-semibold">Invoice</th>
                                        <th className="p-2 text-center text-sm font-semibold">No Rawat</th>
                                        <th className="p-2 text-center text-sm font-semibold">No RM</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tindakan/Obat</th>
                                        <th className="p-2 text-center text-sm font-semibold">Harga</th>
                                        <th className="p-2 text-center text-sm font-semibold">Pelaksana</th>
                                        <th className="p-2 text-center text-sm font-semibold">Qty</th>
                                        <th className="p-2 text-center text-sm font-semibold">Subtotal</th>
                                        <th className="p-2 text-center text-sm font-semibold">Diskon</th>
                                        <th className="p-2 text-center text-sm font-semibold">Total</th>
                                        <th className="p-2 text-center text-sm font-semibold">Poli</th>
                                        <th className="p-2 text-center text-sm font-semibold">Dokter</th>
                                        <th className="p-2 text-center text-sm font-semibold">Penjamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={14} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data untuk pilihan ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPageData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{row.kode_faktur || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.no_rawat || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.no_rm || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.nama_obat_tindakan || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.harga_obat_tindakan ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pelaksana || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.qty ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.subtotal ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">
                                                    {row.nama_diskon ? `${row.nama_diskon} (${row.harga_diskon ?? 0})` : '-'}
                                                </td>
                                                <td className="p-2 text-center text-sm">{row.total ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.kasir?.poli || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.kasir?.dokter || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.kasir?.penjamin || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatDatePart(row.tanggal) || '-'}</td>
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

            {/* Tidak ada dialog detail untuk kasir */}

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
                                <div className="text-muted-foreground">Poli</div>
                                <div className="font-medium">{filterPoli || '-'}</div>
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

export default LaporanApotek;

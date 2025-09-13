import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type BreadcrumbItem = { title: string; href: string };

interface PembelianRow {
    jenis_pembelian?: string;
    nomor_faktur?: string;
    supplier?: string;
    tanggal_terima_barang?: string;
    tanggal_faktur?: string;
    tanggal_jatuh_tempo?: string;
    sub_total?: string | number;
    total_diskon?: string | number;
    ppn_total?: string | number;
    total?: string | number;
    materai?: string | number;
    koreksi?: string | number;
    penerima_barang?: string;
    tgl_pembelian?: string;
    created_at?: string;
}

type PageProps = { title: string; header: PembelianRow[] };

const formatDatePart = (iso?: string) => {
    if (!iso) return '';
    const parts = String(iso).split('T');
    return parts[0] || '';
};

const LaporanPembelian = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<PembelianRow[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterJenis, setFilterJenis] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.header) ? props.header : [];
        setRawData(items);
        setLoading(false);
    }, [props]);

    const jenisOptions = useMemo(() => Array.from(new Set((rawData || []).map((d) => d.jenis_pembelian).filter(Boolean) as string[])), [rawData]);
    const supplierOptions = useMemo(() => Array.from(new Set((rawData || []).map((d) => d.supplier).filter(Boolean) as string[])), [rawData]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const ymd = formatDatePart(row.tgl_pembelian || row.created_at);
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterJenis && (row.jenis_pembelian || '') !== filterJenis) return false;
            if (filterSupplier && (row.supplier || '') !== filterSupplier) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterJenis, filterSupplier]);

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
        { title: 'Pembelian', href: '' },
    ];

    const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    // removed print URL
    const EXPORT_URL = '/laporan/pembelian/export';

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

        const exportData = filteredData.map((item, idx) => ({ no: idx + 1, ...item }));
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
                        <CardTitle>Laporan Pembelian</CardTitle>
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
                                <label className="mb-1 block text-sm font-medium">Jenis</label>
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
                                <label className="mb-1 block text-sm font-medium">Supplier</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={filterSupplier}
                                    onChange={(e) => setFilterSupplier(e.target.value)}
                                >
                                    <option value="">-- Semua Supplier --</option>
                                    {supplierOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end justify-end gap-2 md:col-span-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDateStart('');
                                        setDateEnd('');
                                        setFilterJenis('');
                                        setFilterSupplier('');
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
                                        <th className="p-2 text-center text-sm font-semibold">Faktur</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jenis</th>
                                        <th className="p-2 text-center text-sm font-semibold">Supplier</th>
                                        <th className="p-2 text-center text-sm font-semibold">Sub Total</th>
                                        <th className="p-2 text-center text-sm font-semibold">Diskon</th>
                                        <th className="p-2 text-center text-sm font-semibold">PPN</th>
                                        <th className="p-2 text-center text-sm font-semibold">Materai</th>
                                        <th className="p-2 text-center text-sm font-semibold">Total</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
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
                                                <td className="p-2 text-center text-sm">{row.nomor_faktur || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.jenis_pembelian || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.supplier || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.sub_total ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.total_diskon ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.ppn_total ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.materai ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.total ?? '-'}</td>
                                                <td className="p-2 text-center text-sm">
                                                    {formatDatePart(row.tgl_pembelian || row.created_at) || '-'}
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
        </AppLayout>
    );
};

export default LaporanPembelian;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// removed dialog import
import { Input } from '@/components/ui/input';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

// Layout imports
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// -------------------
// Laporan Antrian Page
// -------------------
interface LAP_Pasien {
    no_rm: string;
    nik: string;
    nama: string;
    seks: string;
}
interface LAP_AntrianItem {
    pasien: LAP_Pasien;
    nomor_antrian: string;
    created_at?: string;
    tanggal?: string;
}

const formatSeks = (value?: string) => {
    const v = String(value ?? '').trim();
    if (v === '1' || v.toUpperCase() === 'L') return 'Laki-laki';
    if (v === '2' || v.toUpperCase() === 'P') return 'Perempuan';
    return '-';
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
const EXPORT_URL = '/laporan/antrian/export';

type PageProps = { title: string; data: LAP_AntrianItem[] };

const LaporanAntrian = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<LAP_AntrianItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [loading, setLoading] = useState(false);
    // removed print confirm state
    // We will render filteredData directly; no separate displayed list needed

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.data) ? props.data : [];
        // Normalize incoming data to expected shape
        const normalized = items.map((it: any) => {
            const tanggal = it.tanggal && String(it.tanggal).length >= 10 ? String(it.tanggal).slice(0, 10) : formatYMD(it.created_at);
            const nomorFormatted = typeof it.nomor === 'number' ? String(it.nomor) : it.nomor || '';
            const nomor_antrian = it.nomor_antrian || `${it.prefix || ''}${nomorFormatted}`;
            const pasien = it.pasien || it.pasien_data || { no_rm: it.no_rm || '-', nik: it.nik || '-', nama: it.nama || '-', seks: it.seks || '-' };
            return { ...it, tanggal, nomor_antrian, pasien } as LAP_AntrianItem;
        });
        setRawData(normalized);
        setLoading(false);
    }, [props]);

    const filteredData = useMemo(() => {
        const start = dateStart || undefined;
        const end = dateEnd || undefined;
        return rawData.filter((item) => {
            const ymd = item.tanggal || formatYMD(item.created_at);
            if (start && ymd !== '-' && ymd < start) return false;
            if (end && ymd !== '-' && ymd > end) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd]);

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
    }, [dateStart, dateEnd]);

    const handleFilter = () => {
        // Filtering is applied automatically via filteredData memo
    };

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
    };

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
        dataField.value = JSON.stringify(filteredData);
        form.appendChild(dataField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
    const handleExport = () => {
        if (!filteredData.length) return;
        submitExport();
    };
    // removed print handler

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Antrian', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Antrian</CardTitle>
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
                            <div className="md:col-span-1" />
                            <div className="flex items-end justify-end gap-2">
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button variant="outline" onClick={handleFilter} disabled={loading}>
                                    Filter
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
                                        <th className="p-2 text-center text-sm font-semibold">No RM</th>
                                        <th className="p-2 text-center text-sm font-semibold">NIK</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nama</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jenis Kelamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nomor Antrian</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data untuk rentang tanggal ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPageData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.no_rm || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.nik || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatSeks(row.pasien?.seks)}</td>
                                                <td className="p-2 text-center text-sm">
                                                    <Badge className="bg-blue-100 text-blue-800">{row.nomor_antrian || '-'}</Badge>
                                                </td>
                                                <td className="p-2 text-center text-sm">{row.tanggal || formatYMD(row.created_at)}</td>
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
            {/* print dialog removed */}
        </AppLayout>
    );
};

export default LaporanAntrian;

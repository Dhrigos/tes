import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
const PRINT_URL = '/laporan/antrian/print';

type PageProps = { title: string; data: LAP_AntrianItem[] };

const LaporanAntrian = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<LAP_AntrianItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
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

    const handleFilter = () => {
        // Filtering is applied automatically via filteredData memo
    };

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
                                        filteredData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.no_rm || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.nik || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.seks || '-'}</td>
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

export default LaporanAntrian;

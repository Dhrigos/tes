import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

// Layout imports
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Pasien {
    no_rm?: string;
    nama?: string;
    seks?: string;
}
interface Poli {
    nama?: string;
}
interface Penjamin {
    nama?: string;
}

interface PendaftaranPerawatRaw {
    nomor_rm?: string;
    nomor_register?: string;
    tanggal_kujungan?: string; // can be 'YYYY-MM-DD HH:MM:SS' or ISO
    pasien?: Pasien;
    poli?: Poli;
    penjamin?: Penjamin;
    so_perawat?: any;
    soap_perawat?: any;
    created_at?: string;
}

interface PendaftaranPerawatItem {
    nomor_rm: string;
    nomor_register: string;
    pasien_nama: string;
    pasien_seks: string;
    tanggal_kujungan: string;
    poli_nama: string;
    perawat_nama: string;
    penjamin_nama: string;
    so_perawat?: any;
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
// removed print URL
const EXPORT_URL = '/laporan/perawat/export';

type PageProps = { title: string; data: PendaftaranPerawatRaw[] };

const extractPerawatName = (it: any): string => {
    return it?.so_perawat?.user_input_name || it?.soap_perawat?.user_input_name || it?.perawat_nama || '';
};

const LaporanPerawat = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<PendaftaranPerawatItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterPoli, setFilterPoli] = useState('');
    const [filterPerawat, setFilterPerawat] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [detailRow, setDetailRow] = useState<PendaftaranPerawatItem | null>(null);
    // removed print confirm state

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.data) ? props.data : [];
        const normalized: PendaftaranPerawatItem[] = items.map((it: PendaftaranPerawatRaw) => {
            const nomor_rm = it.nomor_rm || it.pasien?.no_rm || '-';
            const nomor_register = it.nomor_register || '-';
            const pasien_nama = it.pasien?.nama || '-';
            const pasien_seks = it.pasien?.seks || '-';
            const tanggal_kujungan = it.tanggal_kujungan || it.created_at || '';
            const poli_nama = it.poli?.nama || '';
            const perawat_nama = extractPerawatName(it);
            const penjamin_nama = it.penjamin?.nama || '';
            return {
                nomor_rm,
                nomor_register,
                pasien_nama,
                pasien_seks,
                tanggal_kujungan,
                poli_nama,
                perawat_nama,
                penjamin_nama,
                so_perawat: (it as any)?.so_perawat || (it as any)?.soap_perawat || undefined,
            };
        });
        setRawData(normalized);
        setLoading(false);
    }, [props]);

    const poliOptions = useMemo(() => Array.from(new Set(rawData.map((d) => d.poli_nama).filter(Boolean))), [rawData]);
    const perawatOptions = useMemo(() => {
        const fromNormalized = rawData.map((d) => d.perawat_nama).filter(Boolean);
        const fromProps = (Array.isArray(props?.data) ? props.data : []).map((it: any) => extractPerawatName(it)).filter(Boolean);
        return Array.from(new Set([...fromNormalized, ...fromProps]));
    }, [rawData, props]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const { date: ymd } = splitDateTime(row.tanggal_kujungan);
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterPoli && row.poli_nama !== filterPoli) return false;
            if (filterPerawat && row.perawat_nama !== filterPerawat) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterPoli, filterPerawat]);

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
    }, [dateStart, dateEnd, filterPoli, filterPerawat]);

    const handleFilter = () => {
        // reactive via memo
    };

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
        setFilterPoli('');
        setFilterPerawat('');
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

        const poli = document.createElement('input');
        poli.type = 'hidden';
        poli.name = 'poli';
        poli.value = filterPoli;
        form.appendChild(poli);

        const perawat = document.createElement('input');
        perawat.type = 'hidden';
        perawat.name = 'perawat';
        perawat.value = filterPerawat;
        form.appendChild(perawat);

        const originalItems: any[] = Array.isArray(props?.data) ? (props.data as any[]) : [];
        const filteredOriginal = originalItems.filter((item: any) => {
            const raw = String(item?.tanggal_kujungan || item?.created_at || '');
            const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw.includes(' ') ? raw.split(' ')[0] : raw.slice(0, 10);
            if (dateStart && dateOnly && dateOnly < dateStart) return false;
            if (dateEnd && dateOnly && dateOnly > dateEnd) return false;
            if (filterPoli && (item?.poli?.nama || '') !== filterPoli) return false;
            const perawatName = item?.so_perawat?.user_input_name || item?.soap_perawat?.user_input_name || '';
            if (filterPerawat && perawatName !== filterPerawat) return false;
            return true;
        });

        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(filteredOriginal);
        form.appendChild(dataField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
    const handleExport = () => {
        if (!filteredData.length) return;
        submitExport();
    };
    // removed handlePrint

    const openDetail = (row: PendaftaranPerawatItem) => {
        setDetailRow(row);
        setShowDetail(true);
    };
    const closeDetail = () => {
        setShowDetail(false);
        setDetailRow(null);
    };

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Perawat', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Pelayanan Perawat</CardTitle>
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
                            <div>
                                <label className="mb-1 block text-sm font-medium">Perawat</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
                                    value={filterPerawat}
                                    onChange={(e) => setFilterPerawat(e.target.value)}
                                >
                                    <option value="">-- Semua Perawat --</option>
                                    {perawatOptions.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
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
                                        <th className="p-2 text-center text-sm font-semibold">Nama</th>
                                        <th className="p-2 text-center text-sm font-semibold">No Rawat</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jenis Kelamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal Kunjungan</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jam Kunjungan</th>
                                        <th className="p-2 text-center text-sm font-semibold">Poli</th>
                                        <th className="p-2 text-center text-sm font-semibold">Perawat</th>
                                        <th className="p-2 text-center text-sm font-semibold">Penjamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Pilihan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={11} className="p-6 text-center text-muted-foreground">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-6 text-center text-muted-foreground">
                                                Tidak ada data untuk pilihan ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPageData.map((row, idx) => {
                                            const { date, time } = splitDateTime(row.tanggal_kujungan);
                                            return (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                    <td className="p-2 text-center text-sm">{row.nomor_rm || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.pasien_nama || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.nomor_register || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.pasien_seks || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{date || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{time || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.poli_nama || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.perawat_nama || '-'}</td>
                                                    <td className="p-2 text-center text-sm">{row.penjamin_nama || '-'}</td>
                                                    <td className="p-2 text-center text-sm">
                                                        <Button size="sm" variant="outline" onClick={() => openDetail(row)}>
                                                            Detail
                                                        </Button>
                                                    </td>
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
            <Dialog open={showDetail} onOpenChange={(open) => (open ? setShowDetail(true) : closeDetail())}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Detail Pelayanan Perawat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Data Pasien</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">No RM</div>
                                    <div className="font-medium">{detailRow?.nomor_rm || '-'}</div>
                                    <div className="text-muted-foreground">No Rawat</div>
                                    <div className="font-medium">{detailRow?.nomor_register || '-'}</div>
                                    <div className="text-muted-foreground">Nama</div>
                                    <div className="font-medium">{detailRow?.pasien_nama || '-'}</div>
                                    <div className="text-muted-foreground">JK</div>
                                    <div className="font-medium">{detailRow?.pasien_seks || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Kunjungan</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Tanggal</div>
                                    <div className="font-medium">{splitDateTime(detailRow?.tanggal_kujungan).date || '-'}</div>
                                    <div className="text-muted-foreground">Jam</div>
                                    <div className="font-medium">{splitDateTime(detailRow?.tanggal_kujungan).time || '-'}</div>
                                    <div className="text-muted-foreground">Poli</div>
                                    <div className="font-medium">{detailRow?.poli_nama || '-'}</div>
                                    <div className="text-muted-foreground">Penjamin</div>
                                    <div className="font-medium">{detailRow?.penjamin_nama || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Perawat</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Nama</div>
                                    <div className="font-medium">{detailRow?.perawat_nama || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-md border p-3 md:col-span-3">
                                <div className="mb-2 text-xs font-semibold">Tindakan / HTT</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.so_perawat?.htt || '-'}</div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Tanda Vital</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Tensi</div>
                                    <div>{detailRow?.so_perawat?.tensi || '-'}</div>
                                    <div className="text-muted-foreground">Sistol</div>
                                    <div>{detailRow?.so_perawat?.sistol ?? '-'}</div>
                                    <div className="text-muted-foreground">Distol</div>
                                    <div>{detailRow?.so_perawat?.distol ?? '-'}</div>
                                    <div className="text-muted-foreground">Suhu</div>
                                    <div>{detailRow?.so_perawat?.suhu ?? '-'}</div>
                                    <div className="text-muted-foreground">Nadi</div>
                                    <div>{detailRow?.so_perawat?.nadi ?? '-'}</div>
                                    <div className="text-muted-foreground">RR</div>
                                    <div>{detailRow?.so_perawat?.rr ?? '-'}</div>
                                    <div className="text-muted-foreground">SpO2</div>
                                    <div>{detailRow?.so_perawat?.spo2 ?? '-'}</div>
                                    <div className="text-muted-foreground">Tinggi</div>
                                    <div>{detailRow?.so_perawat?.tinggi ?? '-'}</div>
                                    <div className="text-muted-foreground">Berat</div>
                                    <div>{detailRow?.so_perawat?.berat ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Alergi</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Jenis</div>
                                    <div>{detailRow?.so_perawat?.jenis_alergi ?? '-'}</div>
                                    <div className="text-muted-foreground">Alergi</div>
                                    <div>{detailRow?.so_perawat?.alergi ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Kesadaran & GCS</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Kesadaran</div>
                                    <div>{detailRow?.so_perawat?.kesadaran ?? '-'}</div>
                                    <div className="text-muted-foreground">GCS Eye</div>
                                    <div>{detailRow?.so_perawat?.eye ?? '-'}</div>
                                    <div className="text-muted-foreground">GCS Verbal</div>
                                    <div>{detailRow?.so_perawat?.verbal ?? '-'}</div>
                                    <div className="text-muted-foreground">GCS Motorik</div>
                                    <div>{detailRow?.so_perawat?.motorik ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3 md:col-span-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="text-xs font-semibold">Catatan</div>
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.so_perawat?.catatan || '-'}</div>
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

export default LaporanPerawat;

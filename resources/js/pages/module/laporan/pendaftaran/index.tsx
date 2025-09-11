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

// -------------------------
// Laporan Pendaftaran Page
// -------------------------
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
    penjamin?: { nama?: string };
    dokter?: { namauser?: { name?: string } };
}

const splitDateTime = (value?: string) => {
    if (!value) return { date: '-', time: '-' };
    const raw = String(value).trim();
    const parts = raw.includes('T') ? raw.split('T') : raw.split(' ');
    const date = parts[0] || '-';
    let time = parts[1] || '';
    if (!time && parts[0] && parts[0].includes(' ')) {
        const sub = parts[0].split(' ');
        time = sub[1] || '';
    }
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

const LaporanPendaftaran = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<LAP_PendaftaranItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterPoli, setFilterPoli] = useState('');
    const [filterDokter, setFilterDokter] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [detailItem, setDetailItem] = useState<LAP_PendaftaranItem | null>(null);
    // We will render filteredData directly; no separate displayed list needed

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.data) ? props.data : [];
        // Normalize minimal to ensure patient object exists
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
            if (filterPoli && (item.poli?.nama || '') !== filterPoli) return false;
            if (filterDokter && (item.dokter?.namauser?.name || '') !== filterDokter) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterPoli, filterDokter]);

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
    }, [dateStart, dateEnd, filterPoli, filterDokter]);

    const poliOptions = useMemo(() => {
        const set = new Set<string>();
        rawData.forEach((it) => {
            const nama = it.poli?.nama || '';
            if (nama) set.add(nama);
        });
        return Array.from(set).sort();
    }, [rawData]);

    const dokterOptions = useMemo(() => {
        const set = new Set<string>();
        rawData.forEach((it) => {
            const nama = it.dokter?.namauser?.name || '';
            if (nama) set.add(nama);
        });
        return Array.from(set).sort();
    }, [rawData]);

    const handleFilter = () => {
        // Filtering is applied automatically via filteredData memo
    };

    const handleReset = () => {
        setDateStart('');
        setDateEnd('');
        setFilterPoli('');
        setFilterDokter('');
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

        const poliField = document.createElement('input');
        poliField.type = 'hidden';
        poliField.name = 'poli';
        poliField.value = filterPoli;
        form.appendChild(poliField);

        const dokterField = document.createElement('input');
        dokterField.type = 'hidden';
        dokterField.name = 'dokter';
        dokterField.value = filterDokter;
        form.appendChild(dokterField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
    const handlePrint = () => {
        if (!filteredData.length) return;
        setShowConfirm(true);
    };

    const submitPrintDetail = () => {
        if (!detailItem) return;
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

        const poliField = document.createElement('input');
        poliField.type = 'hidden';
        poliField.name = 'poli';
        poliField.value = filterPoli;
        form.appendChild(poliField);

        const dokterField = document.createElement('input');
        dokterField.type = 'hidden';
        dokterField.name = 'dokter';
        dokterField.value = filterDokter;
        form.appendChild(dokterField);

        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify([detailItem]);
        form.appendChild(dataField);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const openDetail = (item: LAP_PendaftaranItem) => {
        setDetailItem(item);
        setShowDetail(true);
    };

    const closeDetail = () => {
        setShowDetail(false);
        setDetailItem(null);
    };

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Pendaftaran', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Pendaftaran</CardTitle>
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
                                    className="h-10 w-full rounded-md border px-2 text-sm"
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
                                <label className="mb-1 block text-sm font-medium">Dokter</label>
                                <select
                                    className="h-10 w-full rounded-md border px-2 text-sm"
                                    value={filterDokter}
                                    onChange={(e) => setFilterDokter(e.target.value)}
                                >
                                    <option value="">-- Semua Dokter --</option>
                                    {dokterOptions.map((d) => (
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
                                        <th className="p-2 text-center text-sm font-semibold">Nama</th>
                                        <th className="p-2 text-center text-sm font-semibold">No Rawat</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jenis Kelamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Tanggal Kunjungan</th>
                                        <th className="p-2 text-center text-sm font-semibold">Jam Kunjungan</th>
                                        <th className="p-2 text-center text-sm font-semibold">Poli</th>
                                        <th className="p-2 text-center text-sm font-semibold">Dokter</th>
                                        <th className="p-2 text-center text-sm font-semibold">Penjamin</th>
                                        <th className="p-2 text-center text-sm font-semibold">Nomor Antrian</th>
                                        <th className="p-2 text-center text-sm font-semibold">Pilihan</th>
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
                                                Tidak ada data untuk rentang tanggal ini
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPageData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{(page - 1) * pageSize + idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.nomor_rm || row.pasien?.no_rm || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.nomor_register || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien?.seks || '-'}</td>
                                                <td className="p-2 text-center text-sm">{splitDateTime(row.tanggal_kujungan).date}</td>
                                                <td className="p-2 text-center text-sm">{splitDateTime(row.tanggal_kujungan).time}</td>
                                                <td className="p-2 text-center text-sm">{row.poli?.nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">
                                                    {row.dokter?.namauser?.name ||
                                                        (row as any)?.dokter?.nama ||
                                                        (row as any)?.dokter?.name ||
                                                        (row as any)?.dokter_nama ||
                                                        '-'}
                                                </td>
                                                <td className="p-2 text-center text-sm">{row.penjamin?.nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">
                                                    <Badge className="bg-blue-100 text-blue-800">{row.antrian || '-'}</Badge>
                                                </td>
                                                <td className="p-2 text-center text-sm">
                                                    <Button size="sm" variant="outline" onClick={() => openDetail(row)}>
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
                                <div className="text-muted-foreground">Dokter</div>
                                <div className="font-medium">{filterDokter || '-'}</div>
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

            <Dialog open={showDetail} onOpenChange={(open) => (open ? setShowDetail(true) : closeDetail())}>
                <DialogContent className="overflow-y-auto sm:max-w-5xl" style={{ maxHeight: '90vh' } as any}>
                    <DialogHeader>
                        <DialogTitle>Detail Pendaftaran</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Data Pasien</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">No RM</div>
                                    <div className="font-medium">{detailItem?.pasien?.nomor_rm || detailItem?.pasien?.no_rm || '-'}</div>
                                    <div className="text-muted-foreground">Nama</div>
                                    <div className="font-medium">{detailItem?.pasien?.nama || '-'}</div>
                                    <div className="text-muted-foreground">Jenis Kelamin</div>
                                    <div className="font-medium">{detailItem?.pasien?.seks || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Kunjungan</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Tanggal</div>
                                    <div className="font-medium">{splitDateTime(detailItem?.tanggal_kujungan).date}</div>
                                    <div className="text-muted-foreground">Jam</div>
                                    <div className="font-medium">{splitDateTime(detailItem?.tanggal_kujungan).time}</div>
                                    <div className="text-muted-foreground">No Rawat</div>
                                    <div className="font-medium">{detailItem?.nomor_register || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Layanan</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Poli</div>
                                    <div className="font-medium">{detailItem?.poli?.nama || '-'}</div>
                                    <div className="text-muted-foreground">Dokter</div>
                                    <div className="font-medium">
                                        {detailItem?.dokter?.namauser?.name ||
                                            (detailItem as any)?.dokter?.nama ||
                                            (detailItem as any)?.dokter?.name ||
                                            (detailItem as any)?.dokter_nama ||
                                            '-'}
                                    </div>
                                    <div className="text-muted-foreground">Penjamin</div>
                                    <div className="font-medium">{detailItem?.penjamin?.nama || '-'}</div>
                                    <div className="text-muted-foreground">Nomor Antrian</div>
                                    <div className="font-medium">{detailItem?.antrian || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3 md:col-span-3">
                                <div className="mb-2 text-xs font-semibold">Waktu Proses</div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="text-muted-foreground">Pemeriksaan Perawat</div>

                                    {(() => {
                                        const v = (detailItem as any)?.so_perawat?.created_at || (detailItem as any)?.perawat_created_at;
                                        const dt = splitDateTime(v);

                                        if (dt.date === '-' && dt.time === '-') return '-';

                                        return (
                                            <>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">tanggal:</span> {dt.date}
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">jam:</span> {dt.time}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    <div className="text-muted-foreground">Panggil Dokter</div>
                                    {(() => {
                                        const v =
                                            (detailItem as any)?.pelayanan_statuses?.waktu_panggil_dokter ||
                                            (detailItem as any)?.waktu_panggil_dokter;
                                        const dt = splitDateTime(v);
                                        if (dt.date === '-' && dt.time === '-') return '-';
                                        return (
                                            <>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">tanggal:</span> {dt.date}
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">jam:</span> {dt.time}
                                                </div>
                                            </>
                                        );
                                    })()}
                                    <div className="text-muted-foreground">Pemeriksaan Dokter</div>
                                    {(() => {
                                        const v = (detailItem as any)?.soap_dokter?.created_at || (detailItem as any)?.dokter_created_at;
                                        const dt = splitDateTime(v);
                                        if (dt.date === '-' && dt.time === '-') return '-';
                                        return (
                                            <>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">tanggal:</span> {dt.date}
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">jam:</span> {dt.time}
                                                </div>
                                            </>
                                        );
                                    })()}
                                    <div className="text-muted-foreground">Masuk Apotek</div>
                                    {(() => {
                                        const v = (detailItem as any)?.apoteks?.[0]?.created_at || (detailItem as any)?.apotek_created_at;
                                        const dt = splitDateTime(v);
                                        if (dt.date === '-' && dt.time === '-') return '-';
                                        return (
                                            <>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">tanggal:</span> {dt.date}
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-xs font-semibold tracking-wide uppercase">jam:</span> {dt.time}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={submitPrintDetail}>
                                Print Detail
                            </Button>
                            <Button onClick={closeDetail}>Tutup</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default LaporanPendaftaran;

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
// Laporan Pelayanan Dokter
// -----------------------
interface Pasien {
    no_rm?: string;
    nama?: string;
    seks?: string;
}

interface NamaUser {
    name?: string;
}
interface Dokter {
    namauser?: NamaUser;
}
interface Poli {
    nama?: string;
}
interface Penjamin {
    nama?: string;
}

interface PendaftaranDokterRaw {
    nomor_rm?: string;
    nomor_register?: string;
    tanggal_kujungan?: string;
    pasien?: Pasien;
    dokter?: Dokter;
    poli?: Poli;
    penjamin?: Penjamin;
    created_at?: string;
}

interface PendaftaranDokterItem {
    nomor_rm: string;
    nomor_register: string;
    pasien_nama: string;
    pasien_seks: string;
    tanggal_kujungan: string; // ISO or yyyy-mm-ddTHH:MM
    poli_nama: string;
    dokter_nama: string;
    penjamin_nama: string;
    soap_dokter?: any;
}

const extractDoctorName = (it: any): string => {
    return it?.dokter?.namauser?.name || it?.dokter?.nama || it?.dokter?.name || it?.dokter_nama || it?.soap_dokter?.dokter?.namauser?.name || '';
};

const formatDatePart = (value?: string) => {
    if (!value) return '';
    const raw = String(value).trim();
    const parts = raw.includes('T') ? raw.split('T') : raw.split(' ');
    return parts[0] || '';
};

const formatTimePart = (value?: string) => {
    if (!value) return '';
    const raw = String(value).trim();
    const parts = raw.includes('T') ? raw.split('T') : raw.split(' ');
    let time = parts[1] || '';
    if (!time && parts[0] && parts[0].includes(' ')) {
        const sub = parts[0].split(' ');
        time = sub[1] || '';
    }
    time = time.replace('Z', '').split('+')[0].split('.')[0];
    return time.slice(0, 5);
};

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const PRINT_URL = '/laporan/dokter/print';

type PageProps = { title: string; data: PendaftaranDokterRaw[] };

const LaporanDokter = () => {
    const { props } = usePage<PageProps>();
    const [rawData, setRawData] = useState<PendaftaranDokterItem[]>([]);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterPoli, setFilterPoli] = useState('');
    const [filterDokter, setFilterDokter] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [detailRow, setDetailRow] = useState<PendaftaranDokterItem | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        setLoading(true);
        const items = Array.isArray(props?.data) ? props.data : [];
        console.log(items);
        const normalized: PendaftaranDokterItem[] = items.map((it: PendaftaranDokterRaw) => {
            const nomor_rm = it.nomor_rm || it.pasien?.no_rm || '-';
            const nomor_register = it.nomor_register || '-';
            const pasien_nama = it.pasien?.nama || '-';
            const pasien_seks = it.pasien?.seks || '-';
            const tanggal_kujungan = it.tanggal_kujungan || it.created_at || '';
            const poli_nama = it.poli?.nama || '';
            const dokter_nama = extractDoctorName(it);
            const penjamin_nama = it.penjamin?.nama || '';
            return {
                nomor_rm,
                nomor_register,
                pasien_nama,
                pasien_seks,
                tanggal_kujungan,
                poli_nama,
                dokter_nama,
                penjamin_nama,
                soap_dokter: (it as any)?.soap_dokter || undefined,
            };
        });
        setRawData(normalized);
        setLoading(false);
    }, [props]);

    const poliOptions = useMemo(() => {
        return Array.from(new Set(rawData.map((d) => d.poli_nama).filter(Boolean)));
    }, [rawData]);

    const dokterOptions = useMemo(() => {
        const fromNormalized = rawData.map((d) => d.dokter_nama).filter(Boolean);
        const fromProps = (Array.isArray(props?.data) ? props.data : []).map((it: any) => extractDoctorName(it)).filter(Boolean);
        return Array.from(new Set([...fromNormalized, ...fromProps]));
    }, [rawData, props]);

    const filteredData = useMemo(() => {
        return rawData.filter((row) => {
            const ymd = formatDatePart(row.tanggal_kujungan);
            if (dateStart && ymd && ymd < dateStart) return false;
            if (dateEnd && ymd && ymd > dateEnd) return false;
            if (filterPoli && row.poli_nama !== filterPoli) return false;
            if (filterDokter && row.dokter_nama !== filterDokter) return false;
            return true;
        });
    }, [rawData, dateStart, dateEnd, filterPoli, filterDokter]);

    const handleFilter = () => {
        // Filtering is reactive via filteredData
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

        const poli = document.createElement('input');
        poli.type = 'hidden';
        poli.name = 'poli';
        poli.value = filterPoli;
        form.appendChild(poli);

        const dokter = document.createElement('input');
        dokter.type = 'hidden';
        dokter.name = 'dokter';
        dokter.value = filterDokter;
        form.appendChild(dokter);

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

    const openDetail = (row: PendaftaranDokterItem) => {
        setDetailRow(row);
        setShowDetail(true);
    };
    const closeDetail = () => {
        setShowDetail(false);
        setDetailRow(null);
    };

    const breadcrumbsLap: BreadcrumbItem[] = [
        { title: 'Laporan', href: '' },
        { title: 'Dokter', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsLap}>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Pelayanan Dokter</CardTitle>
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
                                <label className="mb-1 block text-sm font-medium">Dokter</label>
                                <select
                                    className="w-full rounded border p-2 text-sm"
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
                                        filteredData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 text-center text-sm">{idx + 1}</td>
                                                <td className="p-2 text-center text-sm">{row.nomor_rm || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien_nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.nomor_register || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.pasien_seks || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatDatePart(row.tanggal_kujungan) || '-'}</td>
                                                <td className="p-2 text-center text-sm">{formatTimePart(row.tanggal_kujungan) || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.poli_nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.dokter_nama || '-'}</td>
                                                <td className="p-2 text-center text-sm">{row.penjamin_nama || '-'}</td>
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
                    </CardContent>
                </Card>
            </div>
            <Dialog open={showDetail} onOpenChange={(open) => (open ? setShowDetail(true) : closeDetail())}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto sm:max-w-7xl">
                    <DialogHeader>
                        <DialogTitle>Detail Pelayanan Dokter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Header sections */}
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
                                    <div className="font-medium">{formatDatePart(detailRow?.tanggal_kujungan) || '-'}</div>
                                    <div className="text-muted-foreground">Jam</div>
                                    <div className="font-medium">{formatTimePart(detailRow?.tanggal_kujungan) || '-'}</div>
                                    <div className="text-muted-foreground">Poli</div>
                                    <div className="font-medium">{detailRow?.poli_nama || '-'}</div>
                                    <div className="text-muted-foreground">Penjamin</div>
                                    <div className="font-medium">{detailRow?.penjamin_nama || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Tenaga Medis</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Dokter</div>
                                    <div className="font-medium">{detailRow?.dokter_nama || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* SOAP sections */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-md border p-3 md:col-span-3">
                                <div className="mb-2 text-xs font-semibold">Subjective (Anamnesa)</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.soap_dokter?.anamnesa || '-'}</div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Objective - Tanda Vital</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Tensi</div>
                                    <div>{detailRow?.soap_dokter?.tensi || '-'}</div>
                                    <div className="text-muted-foreground">Sistol</div>
                                    <div>{detailRow?.soap_dokter?.sistol ?? '-'}</div>
                                    <div className="text-muted-foreground">Distol</div>
                                    <div>{detailRow?.soap_dokter?.distol ?? '-'}</div>
                                    <div className="text-muted-foreground">Suhu</div>
                                    <div>{detailRow?.soap_dokter?.suhu ?? '-'}</div>
                                    <div className="text-muted-foreground">Nadi</div>
                                    <div>{detailRow?.soap_dokter?.nadi ?? '-'}</div>
                                    <div className="text-muted-foreground">RR</div>
                                    <div>{detailRow?.soap_dokter?.rr ?? '-'}</div>
                                    <div className="text-muted-foreground">SpO2</div>
                                    <div>{detailRow?.soap_dokter?.spo2 ?? '-'}</div>
                                    <div className="text-muted-foreground">Tinggi</div>
                                    <div>{detailRow?.soap_dokter?.tinggi ?? '-'}</div>
                                    <div className="text-muted-foreground">Berat</div>
                                    <div>{detailRow?.soap_dokter?.berat ?? '-'}</div>
                                    <div className="text-muted-foreground">Lingkar Perut</div>
                                    <div>{detailRow?.soap_dokter?.lingkar_perut ?? '-'}</div>
                                    <div className="text-muted-foreground">BMI</div>
                                    <div>{detailRow?.soap_dokter?.nilai_bmi ?? '-'}</div>
                                    <div className="text-muted-foreground">Status BMI</div>
                                    <div>{detailRow?.soap_dokter?.status_bmi ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Kesadaran & GCS</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Kesadaran</div>
                                    <div>{detailRow?.soap_dokter?.kesadaran ?? '-'}</div>
                                    <div className="text-muted-foreground">GCS Eye</div>
                                    <div>{detailRow?.soap_dokter?.eye ?? '-'}</div>
                                    <div className="text-muted-foreground">GCS Verbal</div>
                                    <div>{detailRow?.soap_dokter?.verbal ?? '-'}</div>
                                    <div className="text-muted-foreground">GCS Motorik</div>
                                    <div>{detailRow?.soap_dokter?.motorik ?? '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">HTT / Temuan Objektif</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.soap_dokter?.htt || '-'}</div>
                            </div>
                            <div className="rounded-md border p-3 md:col-span-2">
                                <div className="mb-2 text-xs font-semibold">Assessment</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.soap_dokter?.assesmen || '-'}</div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Plan</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.soap_dokter?.plan || '-'}</div>
                            </div>
                            <div className="rounded-md border p-3 md:col-span-2">
                                <div className="mb-2 text-xs font-semibold">Expertise</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.soap_dokter?.expertise || '-'}</div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="mb-2 text-xs font-semibold">Evaluasi</div>
                                <div className="text-sm whitespace-pre-wrap">{detailRow?.soap_dokter?.evaluasi || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                if (!detailRow) return;
                                const csrf = getCsrf();
                                const form = document.createElement('form');
                                form.method = 'POST';
                                form.action = '/laporan/dokter/print-detail';
                                form.target = '_blank';
                                const token = document.createElement('input');
                                token.type = 'hidden';
                                token.name = '_token';
                                token.value = csrf;
                                form.appendChild(token);
                                const itemField = document.createElement('input');
                                itemField.type = 'hidden';
                                itemField.name = 'item';
                                itemField.value = JSON.stringify(detailRow);
                                form.appendChild(itemField);
                                document.body.appendChild(form);
                                form.submit();
                                document.body.removeChild(form);
                            }}
                        >
                            Print Detail
                        </Button>
                        <Button onClick={closeDetail}>Tutup</Button>
                    </div>
                </DialogContent>
            </Dialog>
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
        </AppLayout>
    );
};

export default LaporanDokter;

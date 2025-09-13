import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import React from 'react';

type AnyRecord = Record<string, any>;

interface Props {
    title: string;
    // Detail konteks (salah satu terisi)
    apotek?: AnyRecord | null;
    tindakan?: AnyRecord | null;
    // Data dropdown & referensi
    penjamin?: AnyRecord[];
    bank?: AnyRecord[];
    asuransi?: AnyRecord[];
    // Tabel detail
    apotekTabel?: AnyRecord[];
    tindakanTabel?: AnyRecord[];
    // Identitas
    kode_faktur?: string;
    no_rawat?: string;
    // Kategori dan daftar tindakan tambahan (opsional)
    tindakanTambahan?: AnyRecord;
}

const formatCurrency = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n || 0) : Number(n || 0);
    return `Rp ${num.toLocaleString('id-ID')}`;
};

export default function KasirIndex({
    title,
    apotek = null,
    tindakan = null,
    penjamin = [],
    bank = [],
    asuransi = [],
    apotekTabel = [],
    tindakanTabel = [],
    kode_faktur = '',
    no_rawat = '',
    tindakanTambahan = {},
}: Props) {
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const computeAgeString = (dateStr?: string): string => {
        if (!dateStr) return '';
        const dob = new Date(dateStr);
        if (isNaN(dob.getTime())) return '';
        const today = new Date();

        let years = today.getFullYear() - dob.getFullYear();
        let months = today.getMonth() - dob.getMonth();
        let days = today.getDate() - dob.getDate();

        if (days < 0) {
            // Pinjam hari dari bulan sebelumnya
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0); // last day of previous month
            days += prevMonth.getDate();
            months -= 1;
        }

        if (months < 0) {
            months += 12;
            years -= 1;
        }

        if (years < 0) return '';

        return `${years} tahun ${months} bulan ${days} hari`;
    };

    // Data Pasien (ambil dari apotek jika ada, jika tidak dari tindakan.data_soap)
    const pasienNoRm = apotek?.no_rm || tindakan?.nomor_rm || '';
    const pasienNama = apotek?.nama || tindakan?.nama || '';
    const pasienSex =
        apotek?.data_soap?.sex ||
        apotek?.data_soap?.seks ||
        tindakan?.sex ||
        tindakan?.seks ||
        tindakan?.data_soap?.sex ||
        tindakan?.data_soap?.seks ||
        '';
    const normalizeSex = (val: any): string => {
        const raw = String(val ?? '')
            .trim()
            .toLowerCase();
        if (raw === '' || raw === '-') return '';
        if (raw === '1' || raw === 'l' || raw === 'laki' || raw === 'laki-laki' || raw === 'male') return 'Laki-laki';
        if (raw === '0' || raw === 'p' || raw === 'perempuan' || raw === 'female') return 'Perempuan';
        // fallback: if numeric other than 0, treat as male; else return uppercased
        if (!isNaN(Number(raw))) return Number(raw) === 0 ? 'Perempuan' : 'Laki-laki';
        return raw.toUpperCase();
    };
    const pasienSexDisplay = normalizeSex(pasienSex);
    const pasienTanggalLahir = tindakan?.data_soap?.tanggal_lahir || tindakan?.tanggal_lahir || apotek?.data_soap?.tanggal_lahir || '';
    const pasienUmur = computeAgeString(pasienTanggalLahir) || apotek?.data_soap?.umur || tindakan?.data_soap?.umur || '';
    const pasienAlamat = apotek?.alamat || tindakan?.data_soap?.pasien?.alamat || '';
    const pasienPoli = apotek?.poli || tindakan?.data_soap?.pendaftaran?.poli?.nama || '';
    const pasienDokter = apotek?.dokter || tindakan?.data_soap?.pendaftaran?.dokter?.namauser?.name || '';
    const defaultPenjamin = apotek?.penjamin || tindakan?.data_soap?.penjamin || '';

    // State pembayaran & perhitungan
    const [penjaminValue, setPenjaminValue] = React.useState<string>(defaultPenjamin || '');
    const [administrasi, setAdministrasi] = React.useState<string>('0');

    // Helper function untuk format currency input: hanya angka, auto titik ribuan, tanpa koma
    const formatCurrencyInput = (value: string): string => {
        if (!value) return '';
        // Ambil hanya digit
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly === '') return '';
        // Format dengan pemisah ribuan (id-ID akan memberi titik untuk ribuan)
        const num = Number(digitsOnly);
        return Number.isNaN(num) ? '' : num.toLocaleString('id-ID');
    };

    // Helper function untuk parse currency value: hanya angka, abaikan titik, tanpa desimal
    const parseCurrencyValue = (value: string): number => {
        if (!value) return 0;
        const digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return 0;
        return parseInt(digitsOnly, 10) || 0;
    };

    const [materai, setMaterai] = React.useState<string>('0');
    const [potongan, setPotongan] = React.useState<number>(0);
    const [rows, setRows] = React.useState<
        Array<{ jenis: 'tindakan' | 'apotek' | 'diskon'; nama: string; harga: number; qtyLabel: string; total: number; tanggal: string }>
    >([]);

    // Multi payment
    const [multi, setMulti] = React.useState(false);
    const [pay1Method, setPay1Method] = React.useState('');
    const [pay1Type, setPay1Type] = React.useState('');
    const [pay1Nom, setPay1Nom] = React.useState('');
    const [pay1Ref, setPay1Ref] = React.useState('');
    const [pay2Method, setPay2Method] = React.useState('');
    const [pay2Type, setPay2Type] = React.useState('');
    const [pay2Nom, setPay2Nom] = React.useState('');
    const [pay2Ref, setPay2Ref] = React.useState('');
    const [pay3Method, setPay3Method] = React.useState('');
    const [pay3Type, setPay3Type] = React.useState('');
    const [pay3Nom, setPay3Nom] = React.useState('');
    const [pay3Ref, setPay3Ref] = React.useState('');
    const [showInfoModal, setShowInfoModal] = React.useState(false);
    const [showTambahTindakan, setShowTambahTindakan] = React.useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
    const [showPotonganModal, setShowPotonganModal] = React.useState(false);
    const [potonganJenis, setPotonganJenis] = React.useState<'discount' | 'voucher' | 'cashback' | 'promo'>('discount');
    const [potonganNominal, setPotonganNominal] = React.useState<string>('');
    const [potonganUraian, setPotonganUraian] = React.useState<string>('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [tindakanNama, setTindakanNama] = React.useState('');
    const [tindakanPetugas, setTindakanPetugas] = React.useState('');
    const [tarifPerawat, setTarifPerawat] = React.useState('');
    const [tarifDokter, setTarifDokter] = React.useState('');
    const [selectedKategoriId, setSelectedKategoriId] = React.useState<string>('');

    React.useEffect(() => {
        // Isi tabel awal dari props tindakanTabel dan apotekTabel
        const r: Array<{ jenis: 'tindakan' | 'apotek' | 'diskon'; nama: string; harga: number; qtyLabel: string; total: number; tanggal: string }> =
            [];
        for (const t of tindakanTabel || []) {
            const hargaStr = String(t.harga || '0');
            const hargaList = hargaStr.includes(',') ? hargaStr.split(',').map((h: string) => parseInt(h.trim(), 10)) : [parseInt(hargaStr, 10)];
            const totalHarga = hargaList.reduce((s: number, v: number) => s + (Number.isFinite(v) ? v : 0), 0);
            r.push({
                jenis: 'tindakan',
                nama: t.Jenis_tindakan || t.jenis_tindakan || '-',
                harga: totalHarga,
                qtyLabel: t.jenis_pelaksana || '-',
                total: totalHarga,
                tanggal: (t.created_at || '').slice(0, 10),
            });
        }
        for (const a of apotekTabel || []) {
            const harga = Number(a.harga || 0);
            const qty = Number(a.qty || 1);
            const total = Number(a.total || harga * qty);
            r.push({ jenis: 'apotek', nama: a.nama_obat_alkes || '-', harga, qtyLabel: String(qty), total, tanggal: (a.tanggal || '').slice(0, 10) });
        }
        setRows(r);
    }, [apotekTabel, tindakanTabel]);

    // Detail modal dihapus pada versi detail; fungsi tak dibutuhkan lagi

    const subTotal = rows.reduce((s, r) => s + (r.jenis === 'diskon' ? 0 : r.total), 0);
    const totalPotonganFromRows = rows.filter((r) => r.jenis === 'diskon').reduce((s, r) => s + Math.abs(Number(r.total || 0)), 0);
    const effectivePotongan = totalPotonganFromRows || potongan;
    const tagihan = subTotal - effectivePotongan + parseCurrencyValue(administrasi) + Number(materai || 0);
    const total = tagihan;

    const sisaDibayar = Math.max(0, total - (parseCurrencyValue(pay1Nom) + parseCurrencyValue(pay2Nom) + parseCurrencyValue(pay3Nom)));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const totalPembayaran = parseCurrencyValue(pay1Nom) + parseCurrencyValue(pay2Nom) + parseCurrencyValue(pay3Nom);
            const kurangDibayar = Math.round((total - totalPembayaran) * 100) / 100;

            const payload = {
                // Field yang dibutuhkan backend
                kode_faktur_hidden: kode_faktur || apotek?.kode_faktur || 'TEMP-' + Date.now(),
                no_rawat_hidden: no_rawat || tindakan?.no_rawat || apotek?.no_rawat || '',
                no_rm: pasienNoRm || 'TEMP-RM',
                nama: pasienNama || 'TEMP-NAMA',
                sex: pasienSexDisplay || 'Laki-laki',
                usia: pasienUmur || '0 tahun',
                alamat: pasienAlamat || 'TEMP-ALAMAT',
                poli: pasienPoli || 'TEMP-POLI',
                dokter: pasienDokter || 'TEMP-DOKTER',
                jenis_perawatan: 'RAWAT JALAN',
                penjamin: penjaminValue || 'UMUM',
                sub_total: String(subTotal),
                potongan_harga: String(effectivePotongan),
                administrasi: administrasi,
                materai: materai,
                total: String(total),
                tagihan: String(tagihan),
                kurang_dibayar: String(kurangDibayar),

                // Payment fields
                payment_method_1: pay1Method || 'cash',
                payment_nominal_1: pay1Nom || '0',
                payment_type_1: pay1Type || null,
                payment_ref_1: pay1Ref || null,

                payment_method_2: pay2Method || null,
                payment_nominal_2: pay2Nom || null,
                payment_type_2: pay2Type || null,
                payment_ref_2: pay2Ref || null,

                payment_method_3: pay3Method || null,
                payment_nominal_3: pay3Nom || null,
                payment_type_3: pay3Type || null,
                payment_ref_3: pay3Ref || null,

                // Data hidden untuk detail
                data_hidden: JSON.stringify({
                    tindakan: rows
                        .filter((r) => r.jenis === 'tindakan')
                        .map((r) => ({ jenis_tindakan: r.nama, harga: r.harga, jenis_pelaksana: r.qtyLabel, total: r.total, tanggal: r.tanggal })),
                    apotek: rows
                        .filter((r) => r.jenis === 'apotek')
                        .map((r) => ({ nama_obat_alkes: r.nama, harga: r.harga, qty: Number(r.qtyLabel) || 1, total: r.total, tanggal: r.tanggal })),
                    diskon: rows
                        .filter((r) => r.jenis === 'diskon')
                        .map((r) => ({ nama: r.nama, harga: r.harga, jenis: 'discount', nilai: r.total, tanggal: r.tanggal })),
                }),
            };

            const response = await fetch('/kasir/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                setShowSuccessDialog(true);
                // Cetak PDF otomatis
                try {
                    const faktur =
                        (result && result.data && (result.data.kode_faktur || result.data.kodeFaktur)) ||
                        kode_faktur ||
                        (apotek as AnyRecord | null)?.kode_faktur ||
                        (tindakan as AnyRecord | null)?.kode_faktur ||
                        payload.kode_faktur_hidden;
                    if (faktur) {
                        window.open(`/api/kasir/pdf/${encodeURIComponent(String(faktur))}`);
                    }
                } catch (_) {}
                // Redirect setelah 2 detik
                setTimeout(() => {
                    window.location.href = '/kasir';
                }, 2000);
            } else {
                alert('Terjadi kesalahan: ' + (result.message || 'Gagal menyimpan data'));
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
            alert('Terjadi kesalahan: ' + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kasir', href: '/kasir' },
                { title: 'Detail', href: '#' },
            ]}
        >
            <Head title={title || 'Detail Pembayaran Kasir'} />
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    {/* Kanan - Detail Tagihan & Pembayaran */}
                    <div className="space-y-3 md:col-span-12">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Detail Tagihan</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" size="sm" variant="success" onClick={() => setShowTambahTindakan(true)}>
                                            Tambah Tindakan
                                        </Button>
                                        <Button type="button" size="sm" variant="success" onClick={() => setShowInfoModal(true)}>
                                            Info Pasien
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-56 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">No</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead className="text-center">Harga</TableHead>
                                                <TableHead className="text-center">Qty / Pelaksana</TableHead>
                                                <TableHead className="text-center">Total</TableHead>
                                                <TableHead className="text-center">Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.length ? (
                                                rows.map((r, idx) => (
                                                    <TableRow key={idx} data-jenis={r.jenis}>
                                                        <TableCell className="text-center">{idx + 1}</TableCell>
                                                        <TableCell>{r.nama}</TableCell>
                                                        <TableCell className="text-center">{Number(r.harga).toLocaleString('id-ID')}</TableCell>
                                                        <TableCell className="text-center">{r.qtyLabel}</TableCell>
                                                        <TableCell className="text-center">{Number(r.total).toLocaleString('id-ID')}</TableCell>
                                                        <TableCell className="text-center">{r.tanggal || '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                        Belum ada data
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-muted/20 py-2">
                                <CardTitle>Tagihan dan Metode Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Perhitungan Tagihan */}
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-5">Sub Total</Label>
                                            <div className="col-span-7">
                                                <Input value={Number(subTotal).toLocaleString('id-ID')} readOnly />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-5 text-red-600">Total</Label>
                                            <div className="col-span-7">
                                                <Input className="font-semibold" value={Number(total).toLocaleString('id-ID')} readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-5">Potongan</Label>
                                            <div className="col-span-5">
                                                <Input value={Number(effectivePotongan).toLocaleString('id-ID')} readOnly />
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <Button type="button" size="sm" variant="secondary" onClick={() => setShowPotonganModal(true)}>
                                                    Tambah
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-5">Tagihan</Label>
                                            <div className="col-span-7">
                                                <Input value={Number(tagihan).toLocaleString('id-ID')} readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-5">Administrasi</Label>
                                            <div className="col-span-7">
                                                <Input value={administrasi} onChange={(e) => setAdministrasi(formatCurrencyInput(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-5">Materai</Label>
                                            <div className="col-span-7">
                                                <Select value={materai} onValueChange={setMaterai}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {['0', '3000', '6000', '12000', '18000', '24000', '10000', '20000', '30000', '40000'].map(
                                                            (v) => (
                                                                <SelectItem key={v} value={v}>
                                                                    {Number(v).toLocaleString('id-ID')}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr />

                                {/* Multi Payment */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="multi_payment" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
                                        <Label htmlFor="multi_payment">Multi Payment</Label>
                                    </div>

                                    {/* Bayar 1 */}
                                    <div className="grid grid-cols-12 items-center gap-2">
                                        <Label className="col-span-2">Bayar (1)</Label>
                                        <div className="col-span-2">
                                            <Select value={pay1Method} onValueChange={setPay1Method}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="-- Pilih --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['cash', 'debit', 'credit', 'transfer', 'penjaminan_bpjs', 'penjaminan_asuransi'].map((v) => (
                                                        <SelectItem key={v} value={v}>
                                                            {v}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="relative">
                                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                                    Rp
                                                </span>
                                                <Input
                                                    placeholder="Nominal Rupiah"
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="pl-9"
                                                    value={pay1Nom}
                                                    onChange={(e) => setPay1Nom(formatCurrencyInput(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <Select value={pay1Type} onValueChange={setPay1Type} disabled={pay1Method === 'cash'}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="-- Pilih --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(pay1Method === 'penjaminan_bpjs' || pay1Method === 'penjaminan_asuransi'
                                                        ? asuransi
                                                        : bank || []
                                                    ).map((b: AnyRecord) => (
                                                        <SelectItem key={b.nama} value={String(b.nama)}>
                                                            {b.nama}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Ref"
                                                value={pay1Ref}
                                                onChange={(e) => setPay1Ref(e.target.value)}
                                                disabled={pay1Method === 'cash'}
                                            />
                                        </div>
                                    </div>

                                    {/* Bayar 2 */}
                                    {multi && (
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-2">Bayar (2)</Label>
                                            <div className="col-span-2">
                                                <Select value={pay2Method} onValueChange={setPay2Method}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {['cash', 'debit', 'credit', 'transfer', 'penjaminan_asuransi'].map((v) => (
                                                            <SelectItem key={v} value={v}>
                                                                {v}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                                        Rp
                                                    </span>
                                                    <Input
                                                        placeholder="Nominal Rupiah"
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="pl-9"
                                                        value={pay2Nom}
                                                        onChange={(e) => setPay2Nom(formatCurrencyInput(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <Select value={pay2Type} onValueChange={setPay2Type} disabled={pay2Method === 'cash'}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(pay2Method === 'penjaminan_asuransi' ? asuransi : bank || []).map((b: AnyRecord) => (
                                                            <SelectItem key={b.nama} value={String(b.nama)}>
                                                                {b.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="Ref"
                                                    value={pay2Ref}
                                                    onChange={(e) => setPay2Ref(e.target.value)}
                                                    disabled={pay2Method === 'cash'}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bayar 3 */}
                                    {multi && (
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-2">Bayar (3)</Label>
                                            <div className="col-span-2">
                                                <Select value={pay3Method} onValueChange={setPay3Method}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {['cash', 'debit', 'credit', 'transfer', 'penjaminan_asuransi'].map((v) => (
                                                            <SelectItem key={v} value={v}>
                                                                {v}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                                        Rp
                                                    </span>
                                                    <Input
                                                        placeholder="Nominal Rupiah"
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="pl-9"
                                                        value={pay3Nom}
                                                        onChange={(e) => setPay3Nom(formatCurrencyInput(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <Select value={pay3Type} onValueChange={setPay3Type} disabled={pay3Method === 'cash'}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(pay3Method === 'penjaminan_asuransi' ? asuransi : bank || []).map((b: AnyRecord) => (
                                                            <SelectItem key={b.nama} value={String(b.nama)}>
                                                                {b.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="Ref"
                                                    value={pay3Ref}
                                                    onChange={(e) => setPay3Ref(e.target.value)}
                                                    disabled={pay3Method === 'cash'}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Sisa Dibayar/Kembalian */}
                                    <div className="mt-4">
                                        <div className="grid grid-cols-12 items-center gap-2">
                                            <Label className="col-span-3 font-semibold">Status Pembayaran</Label>
                                            <div className="col-span-9">
                                                {(() => {
                                                    const totalPembayaran =
                                                        parseCurrencyValue(pay1Nom) + parseCurrencyValue(pay2Nom) + parseCurrencyValue(pay3Nom);
                                                    const sisa = Math.round((total - totalPembayaran) * 100) / 100; // Round to 2 decimal places

                                                    if (Math.abs(sisa) < 0.01) {
                                                        // Consider as 0 if difference is less than 1 cent
                                                        return (
                                                            <div className="rounded-md bg-green-100 p-2 text-center font-semibold text-green-800">
                                                                Lunas
                                                            </div>
                                                        );
                                                    } else if (sisa < 0) {
                                                        return (
                                                            <div className="rounded-md bg-blue-100 p-2 text-center font-semibold text-blue-800">
                                                                Kembalian Rp {Math.abs(sisa).toLocaleString('id-ID')}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div className="rounded-md bg-red-100 p-2 text-center font-semibold text-red-800">
                                                                Kurang Dibayar Rp {sisa.toLocaleString('id-ID')}
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Button type="button" variant="secondary" onClick={() => (window.location.href = '/kasir')}>
                                            Kembali
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Button type="submit" variant="success" disabled={isSubmitting}>
                                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {/* Modal Info Pasien */}
                <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
                    <DialogContent className="max-w-3xl sm:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>Informasi Pasien</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">No. RM</Label>
                                    <div className="col-span-8">
                                        <Input value={pasienNoRm} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Nama</Label>
                                    <div className="col-span-8">
                                        <Input value={pasienNama} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Jenis Kelamin</Label>
                                    <div className="col-span-8">
                                        <Input value={pasienSexDisplay} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Usia</Label>
                                    <div className="col-span-8">
                                        <Input value={pasienUmur} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 items-start gap-2">
                                    <Label className="col-span-4">Alamat</Label>
                                    <div className="col-span-8">
                                        <textarea className="w-full rounded-md border bg-muted/20 p-2" rows={3} value={pasienAlamat} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Poli</Label>
                                    <div className="col-span-8">
                                        <Input value={pasienPoli} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Dokter</Label>
                                    <div className="col-span-8">
                                        <Input value={pasienDokter} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Jenis</Label>
                                    <div className="col-span-8">
                                        <Input value="RAWAT JALAN" readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 items-center gap-2">
                                    <Label className="col-span-4">Penjamin</Label>
                                    <div className="col-span-8">
                                        <Select value={penjaminValue} onValueChange={setPenjaminValue}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="-- Pilih --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(penjamin || []).map((p: AnyRecord) => (
                                                    <SelectItem key={p.id || p.nama} value={String(p.nama || '')}>
                                                        {p.nama || p.kode || '-'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                {/* Modal Tambah Tindakan */}
                <Dialog open={showTambahTindakan} onOpenChange={setShowTambahTindakan}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Tindakan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            {/* Kategori Tindakan */}
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Kategori</Label>
                                <div className="col-span-8">
                                    <Select
                                        value={selectedKategoriId}
                                        onValueChange={(v) => {
                                            setSelectedKategoriId(v);
                                            setTindakanNama('');
                                            setTarifPerawat('');
                                            setTarifDokter('');
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Pilih --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const kategoriList: Array<{ id: string; nama: string }> = [];

                                                // Try different possible data structures
                                                const pk = (tindakanTambahan?.perawatan_kategori ||
                                                    tindakanTambahan?.kategori_tindakan ||
                                                    []) as AnyRecord[];
                                                if (Array.isArray(pk) && pk.length) {
                                                    for (const k of pk) {
                                                        kategoriList.push({
                                                            id: String(k.id),
                                                            nama: String(k.nama || k.nama_kategori || `Kategori ${k.id}`),
                                                        });
                                                    }
                                                } else {
                                                    // Fallback: try to extract from tindakan data
                                                    const pt = (tindakanTambahan?.perawatan_tindakan ||
                                                        tindakanTambahan?.tindakan ||
                                                        []) as AnyRecord[];
                                                    const seen: Record<string, boolean> = {};
                                                    for (const t of pt || []) {
                                                        const kategoriId = String(
                                                            t.kategori_id || t.perawatan_kategori_id || t.kategori_tindakan_id || '',
                                                        );
                                                        const kategoriNama = String(t.kategori_nama || t.kategori || t.nama_kategori || '');
                                                        if (kategoriId && !seen[kategoriId]) {
                                                            seen[kategoriId] = true;
                                                            kategoriList.push({
                                                                id: kategoriId,
                                                                nama: kategoriNama || `Kategori ${kategoriId}`,
                                                            });
                                                        }
                                                    }
                                                }

                                                return kategoriList.map((k) => (
                                                    <SelectItem key={k.id} value={k.id}>
                                                        {k.nama}
                                                    </SelectItem>
                                                ));
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Nama Tindakan</Label>
                                <div className="col-span-8">
                                    <Select
                                        value={tindakanNama}
                                        onValueChange={(v) => {
                                            setTindakanNama(v);
                                            const pt = (tindakanTambahan?.perawatan_tindakan || tindakanTambahan?.tindakan || []) as AnyRecord[];
                                            const found = (pt || []).find((t: AnyRecord) => String(t.nama) === v);
                                            if (found) {
                                                setTarifPerawat(String(found.tarif_perawat || ''));
                                                setTarifDokter(String(found.tarif_dokter || ''));
                                            }
                                        }}
                                        disabled={!selectedKategoriId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Pilih --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const pt = (tindakanTambahan?.perawatan_tindakan || tindakanTambahan?.tindakan || []) as AnyRecord[];

                                                const filtered = (pt || []).filter((t: AnyRecord) => {
                                                    const tindakanKategoriId = String(
                                                        t.kategori_id || t.perawatan_kategori_id || t.kategori_tindakan_id || '',
                                                    );
                                                    return tindakanKategoriId === String(selectedKategoriId);
                                                });

                                                return filtered.map((t: AnyRecord, idx: number) => (
                                                    <SelectItem key={`${t.id || idx}-${t.nama}`} value={String(t.nama)}>
                                                        {t.nama}
                                                    </SelectItem>
                                                ));
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Petugas</Label>
                                <div className="col-span-8">
                                    <Select value={tindakanPetugas} onValueChange={setTindakanPetugas}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Pilih --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['Perawat', 'Dokter', 'Perawat & Dokter'].map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Tarif Perawat</Label>
                                <div className="col-span-8">
                                    <Input
                                        value={tarifPerawat}
                                        onChange={(e) => setTarifPerawat(formatCurrencyInput(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Tarif Dokter</Label>
                                <div className="col-span-8">
                                    <Input
                                        value={tarifDokter}
                                        onChange={(e) => setTarifDokter(formatCurrencyInput(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setShowTambahTindakan(false)}>
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const perawat = parseCurrencyValue(tarifPerawat);
                                        const dokter = parseCurrencyValue(tarifDokter);
                                        const now = new Date().toISOString().slice(0, 10);
                                        let tampilHarga = 0;
                                        if (tindakanPetugas === 'Perawat') tampilHarga = perawat;
                                        else if (tindakanPetugas === 'Dokter') tampilHarga = dokter;
                                        else if (tindakanPetugas === 'Perawat & Dokter') tampilHarga = perawat + dokter;
                                        if (!tindakanNama || !tindakanPetugas || tampilHarga <= 0) return;
                                        setRows((prev) => [
                                            ...prev,
                                            {
                                                jenis: 'tindakan',
                                                nama: tindakanNama,
                                                harga: tampilHarga,
                                                qtyLabel: tindakanPetugas,
                                                total: tampilHarga,
                                                tanggal: now,
                                            },
                                        ]);
                                        setShowTambahTindakan(false);
                                        setTindakanNama('');
                                        setTindakanPetugas('');
                                        setTarifPerawat('');
                                        setTarifDokter('');
                                    }}
                                >
                                    Simpan Tindakan
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal Potongan */}
                <Dialog open={showPotonganModal} onOpenChange={setShowPotonganModal}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Tambah Potongan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Jenis Potongan</Label>
                                <div className="col-span-8">
                                    <Select value={potonganJenis} onValueChange={(v) => setPotonganJenis(v as any)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="discount">Discount</SelectItem>
                                            <SelectItem value="voucher">Voucher</SelectItem>
                                            <SelectItem value="cashback">Cashback</SelectItem>
                                            <SelectItem value="promo">Promo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Besar Potongan</Label>
                                <div className="col-span-8">
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                            Rp
                                        </span>
                                        <Input
                                            placeholder="0"
                                            type="text"
                                            inputMode="numeric"
                                            className="pl-9"
                                            value={potonganNominal}
                                            onChange={(e) => setPotonganNominal(formatCurrencyInput(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <Label className="col-span-4">Uraian Potongan</Label>
                                <div className="col-span-8">
                                    <Input
                                        placeholder="Masukkan uraian potongan"
                                        value={potonganUraian}
                                        onChange={(e) => setPotonganUraian(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setShowPotonganModal(false)}>
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const nominal = parseCurrencyValue(potonganNominal);
                                        if (!nominal) return;
                                        const now = new Date().toISOString().slice(0, 10);
                                        const nama = `${potonganUraian || 'Potongan'} (${potonganJenis})`;
                                        setRows((prev) => [
                                            ...prev,
                                            {
                                                jenis: 'diskon',
                                                nama,
                                                harga: -nominal,
                                                qtyLabel: '1',
                                                total: -nominal,
                                                tanggal: now,
                                            },
                                        ]);
                                        // Clear and close
                                        setPotonganNominal('');
                                        setPotonganUraian('');
                                        setPotonganJenis('discount');
                                        setShowPotonganModal(false);
                                    }}
                                >
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Dialog */}
                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-center text-green-600">Berhasil!</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="mb-4 text-gray-600">Data pembayaran kasir berhasil disimpan!</p>
                            <p className="text-sm text-gray-500">Anda akan diarahkan ke halaman kasir dalam beberapa detik...</p>
                        </div>
                        <div className="flex justify-center">
                            <Button onClick={() => (window.location.href = '/kasir')} className="bg-green-600 hover:bg-green-700">
                                Kembali ke Kasir
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </form>
        </AppLayout>
    );
}

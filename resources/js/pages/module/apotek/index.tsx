import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import React from 'react';

type AnyRecord = Record<string, any>;

interface Props {
    title: string;
    data_soap: AnyRecord[];
    dokter: AnyRecord[];
    poli: AnyRecord[];
    penjamin: AnyRecord[];
    embalase: number | null;
    stok: AnyRecord[];
    obat: AnyRecord[];
    satuan: AnyRecord[];
}

const formatCurrency = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function ApotekIndex({ title, data_soap, dokter, poli, penjamin, embalase, stok, obat, satuan }: Props) {
    const [step, setStep] = React.useState<1 | 2>(1);
    const [showCariPasien, setShowCariPasien] = React.useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);

    // Step 1 form state
    const [noRawat, setNoRawat] = React.useState('');
    const [noRm, setNoRm] = React.useState('');
    const [nama, setNama] = React.useState('');
    const [alamat, setAlamat] = React.useState('');
    const [resep, setResep] = React.useState<'RESEP' | 'BELI BEBAS' | ''>('');
    const [fakturApotek, setFakturApotek] = React.useState('');
    const [dokterValue, setDokterValue] = React.useState('');
    const [poliValue, setPoliValue] = React.useState('');
    const [penjaminValue, setPenjaminValue] = React.useState('');

    // Step 2 state
    const [barangTambahan, setBarangTambahan] = React.useState('');
    const [barangTambahanNama, setBarangTambahanNama] = React.useState('');
    const [qtyTambahan, setQtyTambahan] = React.useState<number | ''>('');
    const [hargaTambahan, setHargaTambahan] = React.useState<number | ''>('');
    const [nilaiEmbis, setNilaiEmbis] = React.useState<number | ''>('');
    const [items, setItems] = React.useState<Array<{ nama: string; kode: string; harga: number; qty: number; total: number }>>([]);
    const [resepData, setResepData] = React.useState<
        Array<{ nama_obat: string; jumlah: number; satuan_gudang: string; instruksi: string; signa: string; penggunaan: string }>
    >([]);
    const [selectedResepItems, setSelectedResepItems] = React.useState<number[]>([]);
    const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(null);

    const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
    const embalaseTotal = Number(embalase || 0) * Number(nilaiEmbis || 0);
    const total = subtotal + embalaseTotal;

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Apotek', href: '/apotek' },
    ];

    const handlePilihPasien = async (row: AnyRecord) => {
        setNoRawat(row?.no_rawat || '');
        setNoRm(row?.nomor_rm || '');
        setNama(row?.nama || '');
        setAlamat(row?.pasien?.alamat || '');
        setDokterValue(String(row?.pendaftaran?.dokter?.id || row?.pendaftaran?.dokter_id || ''));
        setPoliValue(row?.pendaftaran?.poli?.nama || '');
        const pj = row?.penjamin || '';
        setPenjaminValue(pj);
        setResep('RESEP');
        // auto-generate faktur untuk resep
        generateFaktur();

        try {
            const resepArray = Array.isArray(row?.resep_items) ? row.resep_items : row?.resep ? [row.resep] : [];

            const cleaned = (resepArray || [])
                .filter((r: AnyRecord) => r && r.nama_obat && Number(r.jumlah || 0) > 0)
                .map((r: AnyRecord) => ({
                    nama_obat: r?.nama_obat || '',
                    jumlah: Number(r?.jumlah || 0),
                    satuan_gudang: r?.satuan_gudang || '',
                    instruksi: r?.instruksi || '',
                    signa: r?.signa || '',
                    penggunaan: r?.penggunaan || '',
                }));

            setResepData(cleaned);

            // Clear form resep items - user needs to manually move from Informasi Resep
            setItems([]);
        } catch {
            setResepData([]);
            setItems([]);
        }

        // Reset selected resep items
        setSelectedResepItems([]);

        setShowCariPasien(false);
    };

    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const generateFaktur = async () => {
        try {
            const res = await fetch('/api/apotek/kodeFaktur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            console.log(data);
            if (data?.kode) setFakturApotek(data.kode);
        } catch {}
    };

    const handleAuto = async () => {
        setNama('Beli Bebas / APS');
        setResep('BELI BEBAS');
        setPoliValue('APS');
        setPenjaminValue('UMUM');
        try {
            const [noRmRes, fakturRes] = await Promise.all([fetch('/api/apotek/BeliBebas'), fetch('/api/apotek/KodeFakturBeliBebas')]);
            const noRmJson = await noRmRes.json();
            const fakturJson = await fakturRes.json();
            if (noRmJson?.no_rm) setNoRm(noRmJson.no_rm);
            if (fakturJson?.kode_faktur) setFakturApotek(fakturJson.kode_faktur);
        } catch {}
    };

    const onChangeBarangTambahan = async (value: string) => {
        setBarangTambahan(value);
        const found = (stok || []).find((s: AnyRecord) => String(s.kode_obat_alkes || s.kode_barang || s.id) === value);
        setBarangTambahanNama(found?.nama_obat_alkes || found?.nama_barang || '');
        const kode = found?.kode_obat_alkes || found?.kode_barang;
        if (!kode || !penjaminValue) return;
        try {
            const res = await fetch('/api/apotek/hargaBebas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ kode, penjamin: penjaminValue }),
            });
            const data = await res.json();
            if (data?.harga != null) setHargaTambahan(Number(data.harga));
        } catch {}
    };

    const handleTambahItem = async () => {
        const kode = barangTambahan;
        const nama = barangTambahanNama;
        const qty = Number(qtyTambahan || 0);
        const harga = Number(hargaTambahan || 0);
        if (!kode || !nama || qty <= 0 || harga <= 0) return;

        let finalKode = kode;
        if (!finalKode && nama) {
            try {
                const res = await fetch('/api/apotek/kodeObat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify({ nama, penjamin: penjaminValue }),
                });
                const data = await res.json();
                if (data?.kode) finalKode = data.kode;
                if (data?.harga && !hargaTambahan) setHargaTambahan(Number(data.harga));
            } catch {}
        }

        setItems((prev) => {
            const existingItemIndex = prev.findIndex((item) => item.kode === finalKode);
            if (existingItemIndex !== -1) {
                // If item exists, add quantities and recalculate total
                const existingItem = prev[existingItemIndex];
                const newQty = existingItem.qty + qty;
                const newTotal = newQty * harga;
                const updatedItems = [...prev];
                updatedItems[existingItemIndex] = {
                    ...existingItem,
                    qty: newQty,
                    total: newTotal,
                };
                return updatedItems;
            } else {
                // If item doesn't exist, add new item
                const totalItem = qty * harga;
                return [...prev, { nama, kode: finalKode, harga, qty, total: totalItem }];
            }
        });

        setBarangTambahan('');
        setBarangTambahanNama('');
        setQtyTambahan('');
    };

    const handleHapusItem = () => {
        if (selectedRowIndex == null) return;
        setItems((prev) => prev.filter((_, idx) => idx !== selectedRowIndex));
        setSelectedRowIndex(null);
    };

    const handleResepItemSelect = (index: number, checked: boolean) => {
        if (checked) {
            setSelectedResepItems((prev) => [...prev, index]);
        } else {
            setSelectedResepItems((prev) => prev.filter((i) => i !== index));
        }
    };

    const handlePindahkanResep = async () => {
        if (selectedResepItems.length === 0) return;

        const selectedResep = selectedResepItems.map((index) => resepData[index]);
        const newItems: Array<{ nama: string; kode: string; harga: number; qty: number; total: number }> = [];

        for (const resep of selectedResep) {
            try {
                const res = await fetch('/api/apotek/kodeObat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify({ nama: resep.nama_obat, penjamin: penjaminValue }),
                });
                const data = await res.json();
                const kode = data?.kode || '';
                const harga = Number(data?.harga || 0);
                if (kode && harga > 0) {
                    const totalItem = resep.jumlah * harga;
                    newItems.push({
                        nama: resep.nama_obat,
                        kode,
                        harga,
                        qty: resep.jumlah,
                        total: totalItem,
                    });
                }
            } catch {}
        }

        setItems((prev) => {
            let updatedItems = [...prev];

            for (const newItem of newItems) {
                const existingItemIndex = updatedItems.findIndex((item) => item.kode === newItem.kode);
                if (existingItemIndex !== -1) {
                    // If item exists, add quantities and recalculate total
                    const existingItem = updatedItems[existingItemIndex];
                    const newQty = existingItem.qty + newItem.qty;
                    const newTotal = newQty * newItem.harga;
                    updatedItems[existingItemIndex] = {
                        ...existingItem,
                        qty: newQty,
                        total: newTotal,
                    };
                } else {
                    // If item doesn't exist, add new item
                    updatedItems.push(newItem);
                }
            }

            return updatedItems;
        });

        setSelectedResepItems([]);
    };

    const handleSelesai = async () => {
        if (!penjaminValue || !fakturApotek || items.length === 0 || !nama || !noRm || !resep) return;
        const selectedDoctor = (dokter || []).find((d: AnyRecord) => String(d.id) === String(dokterValue));
        const payload = {
            no_rawat: noRawat,
            no_rm: noRm,
            nama,
            alamat,
            resep,
            faktur_apotek: fakturApotek,
            dokter: selectedDoctor?.namauser?.name || selectedDoctor?.nama || '',
            poli: poliValue,
            penjamin: penjaminValue,
            nilai_embis_input: String(nilaiEmbis || 0),
            sub_total_hidden: String(subtotal),
            embalase_total_hidden: String(embalaseTotal),
            total_hidden: String(total),
            note_apotek: '',
            tabel_apotek_harga_hidden: JSON.stringify(items),
        };
        try {
            const res = await fetch('/apotek/add', {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data?.status === 'success') {
                setShowSuccessDialog(true);
                setStep(1);
                // Reset all form fields
                setNoRawat('');
                setNoRm('');
                setNama('');
                setAlamat('');
                setResep('');
                setFakturApotek('');
                setDokterValue('');
                setPoliValue('');
                setPenjaminValue('');
                setNilaiEmbis('');
                setItems([]);
                setResepData([]);
                setSelectedResepItems([]);
                setHargaTambahan('');
                setQtyTambahan('');
                setBarangTambahan('');
                setBarangTambahanNama('');
                setSelectedRowIndex(null);
            }
        } catch {}
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title || 'Apotek'} />
            <div className="space-y-6 p-6">
                {/* Step 1: Data Pasien */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Data Pasien</CardTitle>
                                <Button onClick={() => setShowCariPasien(true)}>Cari Pasien</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-12 items-center gap-3">
                                <Label className="col-span-12 md:col-span-2">No. Rawat</Label>
                                <div className="col-span-12 md:col-span-10">
                                    <Input value={noRawat} onChange={(e) => setNoRawat(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3">
                                <Label className="col-span-12 md:col-span-2">No. RM</Label>
                                <div className="col-span-6 md:col-span-4">
                                    <Input value={noRm} onChange={(e) => setNoRm(e.target.value)} />
                                </div>
                                <div className="col-span-6 flex items-center gap-2 md:col-span-6">
                                    <Button variant="secondary" onClick={handleAuto}>
                                        Auto
                                    </Button>
                                    <span className="text-sm text-muted-foreground">Opsi Auto untuk penjualan obat langsung</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3">
                                <Label className="col-span-12 md:col-span-2">Nama</Label>
                                <div className="col-span-12 md:col-span-10">
                                    <Input value={nama} onChange={(e) => setNama(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3">
                                <Label className="col-span-12 md:col-span-2">Alamat</Label>
                                <div className="col-span-12 md:col-span-10">
                                    <Input value={alamat} onChange={(e) => setAlamat(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3">
                                <Label className="col-span-12 md:col-span-2">Resep</Label>
                                <div className="col-span-6 md:col-span-2">
                                    <Select
                                        value={resep}
                                        onValueChange={(v: any) => {
                                            setResep(v);
                                            if (v === 'RESEP') {
                                                generateFaktur();
                                            } else {
                                                setFakturApotek('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Pilih --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RESEP">RESEP</SelectItem>
                                            <SelectItem value="BELI BEBAS">BELI BEBAS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Input placeholder="Faktur" value={fakturApotek} readOnly />
                                </div>
                                <Label className="col-span-12 md:col-span-1">Dokter</Label>
                                <div className="col-span-12 md:col-span-5">
                                    <Select value={dokterValue} onValueChange={setDokterValue}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Dokter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(dokter || []).map((d: AnyRecord) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.namauser?.name || d.nama || `Dokter ${d.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3">
                                <Label className="col-span-12 md:col-span-2">Rawat</Label>
                                <div className="col-span-6 md:col-span-2">
                                    <Button variant="secondary" className="w-full">
                                        RAWAT JALAN
                                    </Button>
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Select value={poliValue} onValueChange={setPoliValue}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Poli" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APS">APS</SelectItem>
                                            {(poli || []).map((p: AnyRecord) => (
                                                <SelectItem key={p.id} value={String(p.nama || p.id)}>
                                                    {p.nama || p.kode || `Poli ${p.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Label className="col-span-12 md:col-span-1">Penjamin</Label>
                                <div className="col-span-12 md:col-span-5">
                                    <Select value={penjaminValue} onValueChange={setPenjaminValue}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Pilih --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(penjamin || []).map((pj: AnyRecord) => (
                                                <SelectItem key={pj.id} value={String(pj.nama || pj.id)}>
                                                    {pj.nama || pj.kode || `Penjamin ${pj.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={() => setStep(2)}>Lanjut</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Transaksi Obat */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaksi Obat</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                {/* Kiri */}
                                <div className="space-y-3 md:col-span-8">
                                    <div className="min-h-[300px] border-2 p-3">
                                        <div className="max-h-72 overflow-auto">
                                            <h4 className="text-lg">Form Resep</h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>No</TableHead>
                                                        <TableHead>Nama Item</TableHead>
                                                        <TableHead>Kode Item</TableHead>
                                                        <TableHead>Harga</TableHead>
                                                        <TableHead>Kuantitas</TableHead>
                                                        <TableHead>Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.length ? (
                                                        items.map((it, idx) => (
                                                            <TableRow
                                                                key={idx}
                                                                onClick={() => setSelectedRowIndex(idx)}
                                                                className={selectedRowIndex === idx ? 'bg-blue-100' : ''}
                                                            >
                                                                <TableCell>{idx + 1}</TableCell>
                                                                <TableCell>{it.nama}</TableCell>
                                                                <TableCell>{it.kode}</TableCell>
                                                                <TableCell>{formatCurrency(it.harga)}</TableCell>
                                                                <TableCell>{it.qty}</TableCell>
                                                                <TableCell>{formatCurrency(it.total)}</TableCell>
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
                                    </div>

                                    <div className="space-y-3 rounded-md border bg-muted/10 p-3">
                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <div className="col-span-12 md:col-span-1">
                                                <Button variant="secondary" size="sm">
                                                    R:/
                                                </Button>
                                            </div>
                                            <Label className="col-span-12 md:col-span-2">Barang :</Label>
                                            <div className="col-span-12 md:col-span-9">
                                                <Select value={barangTambahan} onValueChange={onChangeBarangTambahan}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Obat / Alkes" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(stok || []).map((s: AnyRecord) => (
                                                            <SelectItem key={s.id} value={String(s.kode_obat_alkes || s.kode_barang || s.id)}>
                                                                {s.nama_obat_alkes || s.nama_barang}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <div className="col-span-12 md:col-span-1" />
                                            <Label className="col-span-12 md:col-span-2">Qty :</Label>
                                            <div className="col-span-12 md:col-span-9">
                                                <Input
                                                    type="number"
                                                    value={qtyTambahan}
                                                    onChange={(e) => setQtyTambahan(e.target.value === '' ? '' : Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <div className="col-span-12 md:col-span-1" />
                                            <Label className="col-span-12 md:col-span-2">Harga :</Label>
                                            <div className="col-span-12 md:col-span-9">
                                                <Input
                                                    type="number"
                                                    value={hargaTambahan}
                                                    onChange={(e) => setHargaTambahan(e.target.value === '' ? '' : Number(e.target.value))}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <div className="col-span-12 md:col-span-3" />
                                            <div className="col-span-12 flex gap-2 md:col-span-9">
                                                <Button variant="secondary" onClick={handleTambahItem}>
                                                    Tambah
                                                </Button>
                                                <Button variant="secondary" onClick={handleHapusItem}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Kanan */}
                                <div className="space-y-3 md:col-span-4">
                                    <div className="min-h-[300px] border-2 p-3">
                                        <div className="max-h-72 overflow-auto">
                                            <h4 className="text-lg">Informasi Resep</h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12">
                                                            <Checkbox
                                                                checked={selectedResepItems.length === resepData.length && resepData.length > 0}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedResepItems(resepData.map((_, idx) => idx));
                                                                    } else {
                                                                        setSelectedResepItems([]);
                                                                    }
                                                                }}
                                                            />
                                                        </TableHead>
                                                        <TableHead>Resep</TableHead>
                                                        <TableHead>Jumlah</TableHead>
                                                        <TableHead>Satuan</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {resepData.length ? (
                                                        resepData.map((resep, idx) => (
                                                            <TableRow
                                                                key={idx}
                                                                onClick={() => setSelectedRowIndex(idx)}
                                                                className={selectedRowIndex === idx ? 'bg-muted/40' : ''}
                                                            >
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={selectedResepItems.includes(idx)}
                                                                        onCheckedChange={(checked) => handleResepItemSelect(idx, checked as boolean)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    {resep.nama_obat.length > 30
                                                                        ? `${resep.nama_obat.substring(0, 30)}...`
                                                                        : resep.nama_obat}
                                                                </TableCell>
                                                                <TableCell>{resep.jumlah}</TableCell>
                                                                <TableCell>{resep.satuan_gudang}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                                Belum ada data
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    <div className="space-y-3 rounded-md border bg-muted/10 p-3">
                                        <div className="mb-3 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handlePindahkanResep}
                                                disabled={selectedResepItems.length === 0}
                                            >
                                                Pindahkan ke Form ({selectedResepItems.length})
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <Label className="col-span-12 md:col-span-3">Barang</Label>
                                            <div className="col-span-12 flex items-center gap-2 md:col-span-9">
                                                <Input
                                                    placeholder="Masukan nilai embis poin"
                                                    value={nilaiEmbis as any}
                                                    onChange={(e) => setNilaiEmbis(e.target.value === '' ? '' : Number(e.target.value))}
                                                />
                                                <span className="text-sm text-muted-foreground">(Poin)</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <Label className="col-span-12 md:col-span-3">Sub Total</Label>
                                            <div className="col-span-12 font-medium md:col-span-9">{formatCurrency(subtotal)}</div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <Label className="col-span-12 text-red-600 md:col-span-3">Embis</Label>
                                            <div className="col-span-12 font-medium text-red-600 md:col-span-9">{formatCurrency(embalaseTotal)}</div>
                                        </div>

                                        <Separator />

                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <Label className="col-span-12 md:col-span-3">Total</Label>
                                            <div className="col-span-12 font-semibold md:col-span-9">{formatCurrency(total)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between gap-2">
                                <Button variant="secondary" onClick={() => setStep(1)}>
                                    Kembali
                                </Button>
                                <Button variant="success" onClick={handleSelesai}>
                                    Selesai
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Modal Cari Pasien */}
                <Dialog open={showCariPasien} onOpenChange={setShowCariPasien}>
                    <DialogContent className="max-h-[90vh] w-[95vw] max-w-none overflow-y-auto sm:max-w-[80vw]">
                        <DialogHeader>
                            <DialogTitle>Cari Pasien</DialogTitle>
                        </DialogHeader>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">No</TableHead>
                                    <TableHead className="text-center">No RM</TableHead>
                                    <TableHead className="text-center">No Rawat</TableHead>
                                    <TableHead className="text-center">Nama</TableHead>
                                    <TableHead className="text-center">J. Kelamin</TableHead>
                                    <TableHead className="text-center">Penjamin</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(data_soap || []).map((row: AnyRecord, idx: number) => (
                                    <TableRow key={row.id || idx}>
                                        <TableCell className="text-center">{idx + 1}</TableCell>
                                        <TableCell className="text-center">{row?.nomor_rm}</TableCell>
                                        <TableCell className="text-center">{row?.no_rawat}</TableCell>
                                        <TableCell className="text-center">{row?.nama}</TableCell>
                                        <TableCell className="text-center">{row?.seks}</TableCell>
                                        <TableCell className="text-center">{row?.penjamin}</TableCell>
                                        <TableCell className="text-center">
                                            <Button size="sm" onClick={() => handlePilihPasien(row)}>
                                                Pilih
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data_soap?.length && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DialogContent>
                </Dialog>

                {/* Success Dialog */}
                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-green-600">Berhasil!</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-center text-gray-700">
                                Data apotek berhasil disimpan. Silakan verifikasi di kasir sebelum pengambilan obat.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setShowSuccessDialog(false)}>OK</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

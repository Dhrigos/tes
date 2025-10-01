import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, RefreshCw, XCircle } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import StokTerbukaModal from './stok-terbuka-modal';

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
    stok_terbuka: AnyRecord[];
}

const formatCurrency = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const formatGender = (v: any) => {
    const val = String(v ?? '').trim();
    if (val === '1') return 'Laki-laki';
    if (val === '2') return 'Perempuan';
    return val || '-';
};

export default function ApotekIndex({ title, data_soap, dokter, poli, penjamin, embalase, stok, obat, satuan, stok_terbuka }: Props) {
    const [step, setStep] = React.useState<1 | 2>(1);
    const [showCariPasien, setShowCariPasien] = React.useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
    
    // Stok Terbuka state
    const [showStokTerbukaModal, setShowStokTerbukaModal] = React.useState(false);
    const [stokTerbukaMode, setStokTerbukaMode] = React.useState<'create' | 'edit'>('create');
    const [selectedStokTerbuka, setSelectedStokTerbuka] = React.useState<any>(null);
    const [showIsiUlangDialog, setShowIsiUlangDialog] = React.useState(false);
    const [showHabisDialog, setShowHabisDialog] = React.useState(false);
    const [itemToProcess, setItemToProcess] = React.useState<any>(null);

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

    const parseQuantity = (value: any): number => {
        if (value == null) return 0;
        if (typeof value === 'number') return isFinite(value) ? value : 0;
        const str = String(value).trim();
        // Replace comma decimal separators and extract first number
        const normalized = str.replace(/,/g, '.');
        const match = normalized.match(/\d+(?:\.\d+)?/);
        if (!match) return 0;
        const num = Number(match[0]);
        return isNaN(num) ? 0 : num;
    };

    const getJumlahFromResep = (r: AnyRecord): number => {
        const raw = r?.jumlah ?? r?.jumlah_diberikan ?? r?.qty ?? r?.jumlah_obat ?? r?.jumlahResep ?? r?.jml ?? r?.quantity;
        const parsed = parseQuantity(raw);
        return parsed > 0 ? parsed : 1;
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Apotek', href: '/apotek' },
    ];

    // Handler untuk isi ulang stok terbuka
    const handleIsiUlang = async () => {
        if (!itemToProcess) return;
        
        try {
            const response = await fetch(`/apotek/stok-terbuka/${itemToProcess.id}/isi-ulang`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({}), // Tidak perlu kirim volume, backend akan gunakan ukuran
            });
            const data = await response.json();
            if (data.status === 'success') {
                toast.success(data.message);
                router.reload();
            } else if (data.status === 'warning') {
                toast.warning(data.message);
                router.reload();
            } else {
                toast.error(data.message || 'Gagal isi ulang');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setShowIsiUlangDialog(false);
            setItemToProcess(null);
        }
    };

    // Handler untuk tandai habis
    const handleTandaiHabis = async () => {
        if (!itemToProcess) return;
        
        try {
            const response = await fetch(`/apotek/stok-terbuka/${itemToProcess.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    volume: 0,
                    ukuran: itemToProcess.ukuran, // Tambahkan ukuran
                    satuan: itemToProcess.satuan,
                    tanggal_kadaluarsa: itemToProcess.tanggal_kadaluarsa,
                }),
            });
            const data = await response.json();
            if (data.status === 'success') {
                toast.success('Stok terbuka ditandai sebagai habis');
                router.reload();
            } else {
                toast.error(data.message || 'Gagal mengupdate');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setShowHabisDialog(false);
            setItemToProcess(null);
        }
    };

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
        generateFaktur();

        try {
            const resepArray = Array.isArray(row?.resep_items) ? row.resep_items : row?.resep ? [row.resep] : [];

            const cleaned = (resepArray || [])
                .filter((r: AnyRecord) => r && r.nama_obat)
                .map((r: AnyRecord) => {
                    const jumlah = getJumlahFromResep(r);
                    const satuan = r?.satuan_gudang || r?.satuan || '';
                    const mapped = {
                        nama_obat: r?.nama_obat || '',
                        jumlah,
                        satuan_gudang: satuan,
                        instruksi: r?.instruksi || '',
                        signa: r?.signa || '',
                        penggunaan: r?.penggunaan || '',
                    };
                    return mapped;
                });

            setResepData(cleaned);

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

        // Validate stock availability
        const stokItem = (stok || []).find((s: AnyRecord) => 
            (s.kode_obat_alkes || s.kode_barang) === finalKode
        );
        
        if (stokItem) {
            const stockTotal = Number(stokItem.stock_total ?? stokItem.qty ?? 0);
            const stokMinimal = Number(stokItem.stok_minimal ?? 0);
            const stokTersedia = Number(stokItem.stok_tersedia ?? (stockTotal - stokMinimal));
            
            // Calculate total qty including existing items
            const existingQty = items.reduce((sum, item) => {
                if (item.kode === finalKode) {
                    return sum + Number(item.qty || 0);
                }
                return sum;
            }, 0);
            
            const totalQtyNeeded = existingQty + qty;
            
            if (stokTersedia < totalQtyNeeded) {
                if (stockTotal === stokMinimal) {
                    toast.error(`Stok tidak mencukupi untuk ${nama}. Stok saat ini sama dengan stok minimal (${stokMinimal})`);
                } else {
                    toast.error(`Stok tidak mencukupi untuk ${nama}. Dibutuhkan: ${totalQtyNeeded}, Tersedia: ${stokTersedia}`);
                }
                return;
            }
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
            setSelectedResepItems((prev) => Array.from(new Set([...prev, index])));
        } else {
            setSelectedResepItems((prev) => prev.filter((i) => i !== index));
        }
    };

    const handlePindahkanResep = async () => {
        if (selectedResepItems.length === 0) return;

        const selectedResep = selectedResepItems
            .slice()
            .sort((a, b) => a - b)
            .map((index) => resepData[index])
            .filter((r) => !!r);

        const sequentialItems: Array<{
            nama: string;
            kode: string;
            harga: number;
            qty: number;
            total: number;
        }> = [];

        for (const resep of selectedResep) {
            try {
                const normalizedPenjamin = String(penjaminValue || '')
                    .trim()
                    .toUpperCase();
                const res = await fetch('/api/apotek/kodeObat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify({ nama: resep.nama_obat, penjamin: normalizedPenjamin }),
                });
                const data = await res.json();
                let kode = data?.kode || '';
                let harga = Number(data?.harga ?? 0);
                if (!kode) {
                    const namaLower = String(resep.nama_obat || '')
                        .trim()
                        .toLowerCase();
                    const found = (stok || []).find((s: AnyRecord) => {
                        const nm = String(s?.nama_obat_alkes || s?.nama_barang || '')
                            .trim()
                            .toLowerCase();
                        return nm === namaLower;
                    });
                    if (found) {
                        kode = String(found?.kode_obat_alkes || found?.kode_barang || '');
                    } else {
                        console.warn('[Apotek] skip add: missing kode and no stok match for', { nama_obat: resep.nama_obat, data });
                        continue;
                    }
                }
                if (!(harga > 0)) {
                    try {
                        const hargaRes = await fetch('/api/apotek/hargaBebas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                            body: JSON.stringify({ kode, penjamin: normalizedPenjamin }),
                        });
                        const hargaJson = await hargaRes.json();
                        if (hargaJson?.harga != null) {
                            harga = Number(hargaJson.harga);
                        }
                    } catch (err) {
                        console.warn('[Apotek] hargaBebas fetch failed', err);
                    }
                }
                const qty = getJumlahFromResep(resep as AnyRecord);
                const totalItem = qty * harga;
                sequentialItems.push({
                    nama: resep.nama_obat,
                    kode,
                    harga,
                    qty,
                    total: totalItem,
                });
            } catch (err) {
                console.warn('[Apotek] kodeObat fetch failed', err);
            }
        }

        if (!sequentialItems.length) {
            return;
        }

        setItems((prev) => {
            const next = [...prev, ...sequentialItems];
            return next;
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
                                                                className={selectedRowIndex === idx ? 'bg-blue-200' : ''}
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
                                                Pindahkan Resep ({selectedResepItems.length})
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
                                        <TableCell className="text-center">{formatGender(row?.seks)}</TableCell>
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

                {/* Stok Terbuka Modal */}
                <StokTerbukaModal
                    open={showStokTerbukaModal}
                    onClose={() => {
                        setShowStokTerbukaModal(false);
                        setSelectedStokTerbuka(null);
                    }}
                    mode={stokTerbukaMode}
                    stokTerbuka={selectedStokTerbuka}
                    obatList={obat}
                />

                {/* Stok Terbuka Section */}
                <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Stok Terbuka (BHP)</CardTitle>
                        <Button
                            onClick={() => {
                                setStokTerbukaMode('create');
                                setSelectedStokTerbuka(null);
                                setShowStokTerbukaModal(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Stok Terbuka
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Kode Obat</TableHead>
                                    <TableHead>Nama Obat</TableHead>
                                    <TableHead>Volume/Sisa</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead>Tanggal Kadaluarsa</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stok_terbuka && stok_terbuka.length > 0 ? (
                                    stok_terbuka.map((item: AnyRecord, idx: number) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell className="font-medium">{item.kode_obat}</TableCell>
                                            <TableCell>{item.nama_obat}</TableCell>
                                            <TableCell>{item.volume}</TableCell>
                                            <TableCell>{item.satuan}</TableCell>
                                            <TableCell>{item.tanggal_kadaluarsa}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setStokTerbukaMode('edit');
                                                            setSelectedStokTerbuka(item);
                                                            setShowStokTerbukaModal(true);
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setItemToProcess(item);
                                                            setShowIsiUlangDialog(true);
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                        title="Isi Ulang"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setItemToProcess(item);
                                                            setShowHabisDialog(true);
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                        title="Tandai Habis"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            Belum ada stok terbuka
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                            </CardContent>
                        </Card>

                        {/* Dialog Konfirmasi Isi Ulang */}
                <Dialog open={showIsiUlangDialog} onOpenChange={setShowIsiUlangDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Isi Ulang</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {itemToProcess && (
                                <div className="rounded-md bg-blue-50 p-3 text-sm space-y-1">
                                    <p className="font-medium text-blue-900">{itemToProcess.nama_obat}</p>
                                    <p className="text-blue-700">Volume saat ini: {itemToProcess.volume} {itemToProcess.satuan}</p>
                                    <p className="text-blue-700">Ukuran penuh: {itemToProcess.ukuran} {itemToProcess.satuan}</p>
                                </div>
                            )}
                            
                            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                                <p className="font-medium">Isi Ulang Otomatis:</p>
                                <p className="mt-1">Volume akan diisi ulang ke <strong>{itemToProcess?.ukuran} {itemToProcess?.satuan}</strong> (kapasitas penuh)</p>
                            </div>
                            
                            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                                <p className="font-medium">Perhatian:</p>
                                <ul className="mt-1 list-inside list-disc space-y-1">
                                    <li>Stok akan dikurangi 1 unit dari gudang</li>
                                </ul>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowIsiUlangDialog(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleIsiUlang}>
                                Ya, Isi Ulang
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                        {/* Dialog Konfirmasi Tandai Habis */}
                <Dialog open={showHabisDialog} onOpenChange={setShowHabisDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Tandai Habis</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-gray-700">
                                Yakin ingin menandai stok ini sebagai HABIS?
                            </p>
                            {itemToProcess && (
                                <div className="rounded-md bg-blue-50 p-3 text-sm">
                                    <p className="font-medium text-blue-900">{itemToProcess.nama_obat}</p>
                                    <p className="text-blue-700">Volume saat ini: {itemToProcess.volume} {itemToProcess.satuan}</p>
                                </div>
                            )}
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                                <p className="font-medium">Perhatian:</p>
                                <ul className="mt-1 list-inside list-disc space-y-1">
                                    <li>Volume akan diset ke 0</li>
                                    <li>Data stok terbuka tetap tersimpan</li>
                                    <li>Tidak mengurangi stok gudang</li>
                                </ul>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowHabisDialog(false)}>
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={handleTandaiHabis}>
                                Ya, Tandai Habis
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                    </div>
        </AppLayout>
    );
}

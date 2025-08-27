import { Head } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, FileText, Package, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import AppLayout from '../../../layouts/app-layout';
import type { BreadcrumbItem } from '../../../types';

interface PembelianData {
    jenis_pembelian: 'obat' | 'inventaris' | '';
    nomor_faktur: string;
    supplier: string;
    no_po_sp: string;
    no_faktur_supplier: string;
    tanggal_terima_barang: string;
    tanggal_faktur: string;
    tanggal_jatuh_tempo: string;
    pajak_ppn: string;
    metode_hna: string;
    sub_total: string;
    total_diskon: string;
    ppn_total: string;
    total: string;
    materai: string;
    koreksi: string;
    penerima_barang: string;
    tgl_pembelian: string;
}

interface PembelianDetail {
    id: string;
    nama_obat_alkes: string;
    kode_obat_alkes: string;
    qty: string;
    harga_satuan: string;
    diskon: string;
    exp: string;
    batch: string;
    sub_total: string;
    // Tambahan untuk obat
    nilai_konversi?: number;
    kemasan_besar?: boolean;
    nilai_satuan_besar?: string;
    nilai_satuan_kecil?: string;
    harga_satuan_besar?: string;
    harga_satuan_kecil?: string;
    diskon_persen?: boolean; // true = persen, false = rupiah
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Modul Pembelian', href: '' },
    { title: 'Tambah Pembelian', href: '' },
];

export default function PembelianIndex() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isGeneratingFaktur, setIsGeneratingFaktur] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PembelianDetail | null>(null);
    const [modalData, setModalData] = useState<PembelianDetail>({
        id: '',
        nama_obat_alkes: '',
        kode_obat_alkes: '',
        qty: '0',
        harga_satuan: '0',
        diskon: '0',
        exp: '',
        batch: '',
        sub_total: '0',
        nilai_konversi: 1,
        kemasan_besar: false,
        nilai_satuan_besar: '0',
        nilai_satuan_kecil: '0',
        harga_satuan_besar: '0',
        harga_satuan_kecil: '0',
        diskon_persen: true,
    });
    const [pembelianData, setPembelianData] = useState<PembelianData>({
        jenis_pembelian: '',
        nomor_faktur: '',
        supplier: '',
        no_po_sp: '',
        no_faktur_supplier: '',
        tanggal_terima_barang: '',
        tanggal_faktur: '',
        tanggal_jatuh_tempo: '',
        pajak_ppn: '0',
        metode_hna: '',
        sub_total: '0',
        total_diskon: '0',
        ppn_total: '0',
        total: '0',
        materai: '0',
        koreksi: '0',
        penerima_barang: '',
        tgl_pembelian: new Date().toISOString().split('T')[0],
    });

    const [pembelianDetails, setPembelianDetails] = useState<PembelianDetail[]>([]);

    const steps = [
        { number: 1, title: 'Jenis Pembelian', icon: Package },
        { number: 2, title: 'Data Awal', icon: FileText },
        { number: 3, title: 'Detail Pembelian', icon: ShoppingCart },
    ];

    // Generate nomor faktur otomatis
    const generateNomorFaktur = async (jenis: 'obat' | 'inventaris') => {
        setIsGeneratingFaktur(true);
        try {
            const response = await axios.post('/api/pembelian/generate-faktur', {
                jenis_pembelian: jenis,
            });

            if (response.data && response.data.success && response.data.nomor_faktur) {
                setPembelianData((prev) => ({
                    ...prev,
                    nomor_faktur: response.data.nomor_faktur,
                }));

                // Toast success dengan nomor faktur yang berbeda berdasarkan jenis
                const jenisText = response.data.jenis_pembelian === 'inventaris' ? 'inventaris' : 'obat';
            } else {
                toast.error('Gagal generate nomor faktur. Response tidak valid.');
            }
        } catch (error: any) {
            console.error('Error generating nomor faktur:', error);

            // Lebih detail error handling
            if (error.response?.data?.message) {
                toast.error(`Error: ${error.response.data.message}`);
            } else if (error.response?.data?.error) {
                toast.error(`Error: ${error.response.data.error}`);
            } else if (error.response?.status) {
                toast.error(`HTTP Error ${error.response.status}: ${error.response.statusText}`);
            } else {
                toast.error('Gagal generate nomor faktur. Silakan coba lagi.');
            }
        } finally {
            setIsGeneratingFaktur(false);
        }
    };

    // Step 1: Jenis Pembelian
    const handleJenisPembelianChange = (value: 'obat' | 'inventaris') => {
        setPembelianData((prev) => ({ ...prev, jenis_pembelian: value }));
        // Auto-generate nomor faktur saat jenis pembelian dipilih
        generateNomorFaktur(value);
    };

    // Step 2: Data Awal
    const handleDataAwalChange = (field: keyof PembelianData, value: string) => {
        setPembelianData((prev) => ({ ...prev, [field]: value }));
    };

    // Modal Functions
    const openAddModal = () => {
        setEditingItem(null);
        setModalData({
            id: Date.now().toString(),
            nama_obat_alkes: '',
            kode_obat_alkes: '',
            qty: '0',
            harga_satuan: '0',
            diskon: '0',
            exp: '',
            batch: '',
            sub_total: '0',
            nilai_konversi: 1,
            kemasan_besar: false,
            nilai_satuan_besar: '0',
            nilai_satuan_kecil: '0',
            harga_satuan_besar: '0',
            harga_satuan_kecil: '0',
            diskon_persen: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: PembelianDetail) => {
        setEditingItem(item);
        setModalData(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const updateModalData = (field: keyof PembelianDetail, value: string | boolean | number) => {
        setModalData((prev) => {
            const updatedItem = { ...prev, [field]: value };

            // Apply same calculation logic as before
            if (pembelianData.jenis_pembelian === 'obat') {
                if (field === 'nilai_satuan_besar') {
                    const nilaiBesar = parseInt(value as string) || 0;
                    const nilaiKonversi = prev.nilai_konversi || 1;
                    updatedItem.nilai_satuan_kecil = (nilaiBesar * nilaiKonversi).toString();
                }

                if (field === 'nilai_satuan_kecil' && !prev.kemasan_besar) {
                    const nilaiKecil = parseInt(value as string) || 0;
                    const nilaiKonversi = prev.nilai_konversi || 1;
                    updatedItem.nilai_satuan_besar = Math.round(nilaiKecil / nilaiKonversi).toString();
                }

                if (field === 'kemasan_besar') {
                    if (value) {
                        updatedItem.qty = prev.nilai_satuan_besar || '0';
                    } else {
                        updatedItem.qty = prev.nilai_satuan_kecil || '0';
                    }
                }

                if (field === 'nilai_satuan_besar' || field === 'nilai_satuan_kecil') {
                    if (prev.kemasan_besar) {
                        updatedItem.qty = updatedItem.nilai_satuan_besar || '0';
                    } else {
                        updatedItem.qty = updatedItem.nilai_satuan_kecil || '0';
                    }
                }
            }

            // Calculate sub_total
            if (field === 'qty' || field === 'harga_satuan' || field === 'diskon' || field === 'kemasan_besar' || field === 'diskon_persen') {
                const qty = parseFloat(field === 'qty' ? (value as string) : updatedItem.qty) || 0;
                const harga = parseFloat(field === 'harga_satuan' ? (value as string) : updatedItem.harga_satuan) || 0;
                let diskon = 0;

                if (updatedItem.diskon_persen) {
                    const diskonPersen = parseFloat(field === 'diskon' ? (value as string) : updatedItem.diskon) || 0;
                    diskon = qty * harga * (diskonPersen / 100);
                } else {
                    diskon = parseFloat(field === 'diskon' ? (value as string) : updatedItem.diskon) || 0;
                }

                const subtotal = qty * harga - diskon;
                updatedItem.sub_total = subtotal.toString();
            }

            return updatedItem;
        });
    };

    const saveModalData = () => {
        if (editingItem) {
            // Update existing item
            setPembelianDetails((prev) => prev.map((item) => (item.id === editingItem.id ? modalData : item)));
        } else {
            // Add new item
            setPembelianDetails((prev) => [...prev, modalData]);
        }
        closeModal();
    };

    const removeDetailItem = (id: string) => {
        setPembelianDetails((prev) => prev.filter((item) => item.id !== id));
    };

    // Calculate totals - Mengikuti logika hitungTotalKeseluruhan()
    const calculateTotals = () => {
        const subTotal = pembelianDetails.reduce((sum, item) => sum + (parseFloat(item.sub_total) || 0), 0);
        const totalDiskon = pembelianDetails.reduce((sum, item) => {
            const diskon = parseFloat(item.diskon) || 0;
            if (item.diskon_persen) {
                // Jika diskon dalam persen, hitung dari qty * harga
                const qty = parseFloat(item.qty) || 0;
                const harga = parseFloat(item.harga_satuan) || 0;
                return sum + qty * harga * (diskon / 100);
            } else {
                // Jika diskon dalam rupiah
                return sum + diskon;
            }
        }, 0);

        const ppn = subTotal * (parseFloat(pembelianData.pajak_ppn) / 100 || 0);
        const materai = parseInt(pembelianData.materai) || 0;
        const koreksi = parseInt(pembelianData.koreksi.replace(/[^\d]/g, '')) || 0;

        // Total = subtotal - diskon + ppn + materai + koreksi (sesuai logic JavaScript)
        const total = subTotal - totalDiskon + ppn + materai + koreksi;

        setPembelianData((prev) => ({
            ...prev,
            sub_total: subTotal.toString(),
            total_diskon: totalDiskon.toString(),
            ppn_total: ppn.toString(),
            total: total.toString(),
        }));
    };

    React.useEffect(() => {
        calculateTotals();
    }, [pembelianDetails, pembelianData.pajak_ppn, pembelianData.materai, pembelianData.koreksi]);

    // Navigation
    const nextStep = () => {
        if (currentStep < 3) {
            if (currentStep === 1 && !pembelianData.jenis_pembelian) {
                toast.error('Pilih jenis pembelian terlebih dahulu');
                return;
            }
            if (currentStep === 2) {
                if (!pembelianData.nomor_faktur) {
                    toast.error('Lengkapi nomor faktur terlebih dahulu');
                    return;
                }
            }
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    // Submit
    const handleSubmit = async () => {
        try {
            // Validasi sebelum submit
            if (!pembelianData.penerima_barang) {
                toast.error('Penerima barang wajib diisi');
                return;
            }

            if (pembelianDetails.length === 0) {
                toast.error('Minimal harus ada 1 item pembelian');
                return;
            }

            // Validasi setiap detail item
            for (const detail of pembelianDetails) {
                if (!detail.nama_obat_alkes || !detail.kode_obat_alkes || !detail.qty || !detail.harga_satuan) {
                    toast.error('Semua field item wajib diisi (nama, kode, qty, harga)');
                    return;
                }
            }

            const formData = {
                ...pembelianData,
                details: pembelianDetails.map((detail) => ({
                    ...detail,
                    // Hapus id yang hanya untuk frontend
                    id: undefined,
                })),
            };

            const response = await axios.post('/api/pembelian/store', formData);

            if (response.data.success) {
                toast.success(response.data.message);

                // Reset form setelah berhasil
                setPembelianData({
                    jenis_pembelian: '',
                    nomor_faktur: '',
                    supplier: '',
                    no_po_sp: '',
                    no_faktur_supplier: '',
                    tanggal_terima_barang: '',
                    tanggal_faktur: '',
                    tanggal_jatuh_tempo: '',
                    pajak_ppn: '0',
                    metode_hna: '',
                    sub_total: '0',
                    total_diskon: '0',
                    ppn_total: '0',
                    total: '0',
                    materai: '0',
                    koreksi: '0',
                    penerima_barang: '',
                    tgl_pembelian: new Date().toISOString().split('T')[0],
                });
                setPembelianDetails([]);
                setCurrentStep(1);
            }
        } catch (error: any) {
            console.error('Error submitting pembelian:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                // Tampilkan error validasi
                const errors = Object.values(error.response.data.errors).flat();
                toast.error(errors[0] as string);
            } else {
                toast.error('Gagal menyimpan data pembelian');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pembelian - Modul Pembelian" />
            <div className="space-y-6 p-6">
                {/* Header */}

                {/* Stepper */}
                <Card className="rounded-2xl shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.number;
                                const isCompleted = currentStep > step.number;

                                return (
                                    <div key={step.number} className="flex items-center">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                                                isCompleted
                                                    ? 'border-green-500 bg-green-500 text-white'
                                                    : isActive
                                                      ? 'border-blue-500 bg-blue-500 text-white'
                                                      : 'border-gray-300 bg-gray-100 text-gray-400'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p
                                                className={`text-sm font-medium ${
                                                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                                }`}
                                            >
                                                Step {step.number}
                                            </p>
                                            <p className={`text-sm ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                                {step.title}
                                            </p>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`mx-4 h-0.5 flex-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content */}
                <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {React.createElement(steps[currentStep - 1].icon, { className: 'w-5 h-5' })}
                            {steps[currentStep - 1].title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {/* Step 1: Jenis Pembelian */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="py-8 text-center">
                                    <h3 className="mb-4 text-xl font-semibold">Pilih Jenis Pembelian</h3>
                                    <div className="mx-auto grid max-w-md grid-cols-1 gap-6 md:grid-cols-2">
                                        <Button
                                            variant={pembelianData.jenis_pembelian === 'obat' ? 'default' : 'outline'}
                                            className="flex h-24 flex-col gap-2"
                                            onClick={() => handleJenisPembelianChange('obat')}
                                        >
                                            <Package className="h-8 w-8" />
                                            <span>Obat</span>
                                        </Button>
                                        <Button
                                            variant={pembelianData.jenis_pembelian === 'inventaris' ? 'default' : 'outline'}
                                            className="flex h-24 flex-col gap-2"
                                            onClick={() => handleJenisPembelianChange('inventaris')}
                                        >
                                            <ShoppingCart className="h-8 w-8" />
                                            <span>Inventaris</span>
                                        </Button>
                                    </div>
                                    {pembelianData.jenis_pembelian && (
                                        <Badge variant="secondary" className="mt-4">
                                            Terpilih: {pembelianData.jenis_pembelian === 'obat' ? 'Obat' : 'Inventaris'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Data Awal */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="nomor_faktur">Nomor Faktur *</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="nomor_faktur"
                                                value={pembelianData.nomor_faktur}
                                                onChange={(e) => handleDataAwalChange('nomor_faktur', e.target.value)}
                                                placeholder="Nomor faktur akan di-generate otomatis"
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => pembelianData.jenis_pembelian && generateNomorFaktur(pembelianData.jenis_pembelian)}
                                                disabled={!pembelianData.jenis_pembelian || isGeneratingFaktur}
                                                title="Generate ulang nomor faktur"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isGeneratingFaktur ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                        {isGeneratingFaktur && <p className="text-xs text-blue-600">Generating nomor faktur...</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier">Supplier</Label>
                                        <Input
                                            id="supplier"
                                            value={pembelianData.supplier}
                                            onChange={(e) => handleDataAwalChange('supplier', e.target.value)}
                                            placeholder="Nama supplier"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="no_po_sp">No PO/SP</Label>
                                        <Input
                                            id="no_po_sp"
                                            value={pembelianData.no_po_sp}
                                            onChange={(e) => handleDataAwalChange('no_po_sp', e.target.value)}
                                            placeholder="Nomor PO/SP"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="no_faktur_supplier">No Faktur Supplier</Label>
                                        <Input
                                            id="no_faktur_supplier"
                                            value={pembelianData.no_faktur_supplier}
                                            onChange={(e) => handleDataAwalChange('no_faktur_supplier', e.target.value)}
                                            placeholder="Nomor faktur supplier"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tanggal_terima_barang">Tanggal Terima Barang</Label>
                                        <Input
                                            id="tanggal_terima_barang"
                                            type="date"
                                            value={pembelianData.tanggal_terima_barang}
                                            onChange={(e) => handleDataAwalChange('tanggal_terima_barang', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tanggal_faktur">Tanggal Faktur</Label>
                                        <Input
                                            id="tanggal_faktur"
                                            type="date"
                                            value={pembelianData.tanggal_faktur}
                                            onChange={(e) => handleDataAwalChange('tanggal_faktur', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tanggal_jatuh_tempo">Tanggal Jatuh Tempo Pembayaran</Label>
                                        <Input
                                            id="tanggal_jatuh_tempo"
                                            type="date"
                                            value={pembelianData.tanggal_jatuh_tempo}
                                            onChange={(e) => handleDataAwalChange('tanggal_jatuh_tempo', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pajak_ppn">Pajak/PPN (%)</Label>
                                        <Input
                                            id="pajak_ppn"
                                            type="number"
                                            value={pembelianData.pajak_ppn}
                                            onChange={(e) => handleDataAwalChange('pajak_ppn', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="metode_hna">Metode HNA</Label>
                                        <Select value={pembelianData.metode_hna} onValueChange={(value) => handleDataAwalChange('metode_hna', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Metode HNA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Tanpa PPN Dan Diskon</SelectItem>
                                                <SelectItem value="2">Dengan PPN</SelectItem>
                                                <SelectItem value="3">Dengan Diskon</SelectItem>
                                                <SelectItem value="4">Dengan PPN Dan Diskon</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Detail Pembelian */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {/* Data Pelengkap */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Data Pelengkap</h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="penerima_barang">Penerima Barang *</Label>
                                            <Input
                                                id="penerima_barang"
                                                value={pembelianData.penerima_barang}
                                                onChange={(e) => handleDataAwalChange('penerima_barang', e.target.value)}
                                                placeholder="Nama penerima barang"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="materai">Materai</Label>
                                            <Select value={pembelianData.materai} onValueChange={(value) => handleDataAwalChange('materai', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih :" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0</SelectItem>
                                                    <SelectItem value="3000">3.000</SelectItem>
                                                    <SelectItem value="6000">6.000</SelectItem>
                                                    <SelectItem value="10000">10.000</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="koreksi">Koreksi</Label>
                                            <Input
                                                id="koreksi"
                                                type="number"
                                                value={pembelianData.koreksi}
                                                onChange={(e) => handleDataAwalChange('koreksi', e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Detail Item Pembelian</h3>
                                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button onClick={openAddModal} className="flex items-center gap-2">
                                                <Plus className="h-4 w-4" />
                                                Tambah Item
                                            </Button>
                                        </DialogTrigger>
                                    </Dialog>
                                </div>

                                {/* Table View */}
                                {pembelianDetails.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                        <p>Belum ada item pembelian</p>
                                        <p className="text-sm">Klik "Tambah Item" untuk menambah item</p>
                                    </div>
                                ) : (
                                    <Card>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">No</TableHead>
                                                    <TableHead>Nama {pembelianData.jenis_pembelian === 'obat' ? 'Obat' : 'Alkes'}</TableHead>
                                                    {pembelianData.jenis_pembelian === 'obat' && <TableHead>Kemasan</TableHead>}
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Harga Satuan</TableHead>
                                                    <TableHead>Diskon</TableHead>
                                                    <TableHead>Sub Total</TableHead>
                                                    <TableHead className="w-20">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pembelianDetails.map((detail, index) => (
                                                    <TableRow key={detail.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{detail.nama_obat_alkes || '-'}</div>
                                                                {detail.exp && <div className="text-sm text-gray-500">Exp: {detail.exp}</div>}
                                                            </div>
                                                        </TableCell>
                                                        {pembelianData.jenis_pembelian === 'obat' && (
                                                            <TableCell>
                                                                <Badge variant={detail.kemasan_besar ? 'default' : 'secondary'}>
                                                                    {detail.kemasan_besar ? 'Besar' : 'Kecil'}
                                                                </Badge>
                                                            </TableCell>
                                                        )}
                                                        <TableCell>{detail.qty}</TableCell>
                                                        <TableCell>Rp {parseFloat(detail.harga_satuan || '0').toLocaleString('id-ID')}</TableCell>
                                                        <TableCell>{detail.diskon_persen ? `${detail.diskon}%` : `Rp ${detail.diskon}`}</TableCell>
                                                        <TableCell className="font-medium">
                                                            Rp {parseFloat(detail.sub_total || '0').toLocaleString('id-ID')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openEditModal(detail)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => removeDetailItem(detail.id)}
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                )}

                                {/* Modal for Add/Edit Item */}
                                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                    <DialogContent className="max-h-[85vh] w-[98vw] max-w-7xl overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingItem ? 'Edit Item' : 'Tambah Item'}{' '}
                                                {pembelianData.jenis_pembelian === 'obat' ? 'Obat' : 'Inventaris'}
                                            </DialogTitle>
                                        </DialogHeader>

                                        <div className="space-y-8 p-2">
                                            {pembelianData.jenis_pembelian === 'obat' ? (
                                                // Modal UI untuk Obat
                                                <div className="space-y-6">
                                                    {/* Baris 1: Nama Obat dan Kemasan */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Nama Obat/Alkes</Label>
                                                            <Select
                                                                value={modalData.nama_obat_alkes}
                                                                onValueChange={(value) => {
                                                                    updateModalData('nama_obat_alkes', value);
                                                                    updateModalData('nilai_konversi', 10); // contoh nilai konversi
                                                                }}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih dari Daftar Obat" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="paracetamol">Paracetamol</SelectItem>
                                                                    <SelectItem value="amoxicillin">Amoxicillin</SelectItem>
                                                                    <SelectItem value="ibuprofen">Ibuprofen</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Jenis Kemasan</Label>
                                                            <div className="flex items-center space-x-6">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="kemasan-kecil-modal"
                                                                        checked={!modalData.kemasan_besar}
                                                                        onCheckedChange={() => updateModalData('kemasan_besar', false)}
                                                                    />
                                                                    <Label htmlFor="kemasan-kecil-modal">Kemasan Kecil</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="kemasan-besar-modal"
                                                                        checked={modalData.kemasan_besar}
                                                                        onCheckedChange={() => updateModalData('kemasan_besar', true)}
                                                                    />
                                                                    <Label htmlFor="kemasan-besar-modal">Kemasan Besar</Label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Tanggal Expired</Label>
                                                            <Input
                                                                type="date"
                                                                value={modalData.exp}
                                                                onChange={(e) => updateModalData('exp', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Baris 2: Satuan dan Harga */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Nilai Satuan ({modalData.kemasan_besar ? 'Besar' : 'Kecil'})</Label>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    modalData.kemasan_besar
                                                                        ? modalData.nilai_satuan_besar
                                                                        : modalData.nilai_satuan_kecil
                                                                }
                                                                onChange={(e) => {
                                                                    if (modalData.kemasan_besar) {
                                                                        updateModalData('nilai_satuan_besar', e.target.value);
                                                                    } else {
                                                                        updateModalData('nilai_satuan_kecil', e.target.value);
                                                                    }
                                                                }}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Harga Satuan</Label>
                                                            <Input
                                                                type="number"
                                                                value={modalData.harga_satuan}
                                                                onChange={(e) => updateModalData('harga_satuan', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Baris 3: Diskon dan Batch */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Jenis Diskon</Label>
                                                            <div className="flex items-center space-x-6">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="diskon-persen-modal"
                                                                        checked={modalData.diskon_persen}
                                                                        onCheckedChange={() => updateModalData('diskon_persen', true)}
                                                                    />
                                                                    <Label htmlFor="diskon-persen-modal">%</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="diskon-rupiah-modal"
                                                                        checked={!modalData.diskon_persen}
                                                                        onCheckedChange={() => updateModalData('diskon_persen', false)}
                                                                    />
                                                                    <Label htmlFor="diskon-rupiah-modal">Rp</Label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Diskon ({modalData.diskon_persen ? '%' : 'Rp'})</Label>
                                                            <Input
                                                                type="number"
                                                                value={modalData.diskon}
                                                                onChange={(e) => updateModalData('diskon', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Batch</Label>
                                                            <Input
                                                                value={modalData.batch}
                                                                onChange={(e) => updateModalData('batch', e.target.value)}
                                                                placeholder="Batch"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Info readonly */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Qty Aktual</Label>
                                                            <Input type="number" value={modalData.qty} readOnly className="bg-gray-50" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Sub Total</Label>
                                                            <Input type="number" value={modalData.sub_total} readOnly className="bg-gray-50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Modal UI untuk Inventaris
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Nama Alkes</Label>
                                                        <Input
                                                            value={modalData.nama_obat_alkes}
                                                            onChange={(e) => updateModalData('nama_obat_alkes', e.target.value)}
                                                            placeholder="Nama item"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Kode</Label>
                                                        <Input
                                                            value={modalData.kode_obat_alkes}
                                                            onChange={(e) => updateModalData('kode_obat_alkes', e.target.value)}
                                                            placeholder="Kode item"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Qty</Label>
                                                        <Input
                                                            type="number"
                                                            value={modalData.qty}
                                                            onChange={(e) => updateModalData('qty', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Harga Satuan</Label>
                                                        <Input
                                                            type="number"
                                                            value={modalData.harga_satuan}
                                                            onChange={(e) => updateModalData('harga_satuan', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Diskon</Label>
                                                        <Input
                                                            type="number"
                                                            value={modalData.diskon}
                                                            onChange={(e) => updateModalData('diskon', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Exp</Label>
                                                        <Input
                                                            type="date"
                                                            value={modalData.exp}
                                                            onChange={(e) => updateModalData('exp', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Batch</Label>
                                                        <Input
                                                            value={modalData.batch}
                                                            onChange={(e) => updateModalData('batch', e.target.value)}
                                                            placeholder="Batch"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Sub Total</Label>
                                                        <Input type="number" value={modalData.sub_total} readOnly className="bg-gray-50" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Modal Actions */}
                                            <div className="flex justify-end gap-4 pt-4">
                                                <Button variant="outline" onClick={closeModal}>
                                                    Batal
                                                </Button>
                                                <Button onClick={saveModalData}>{editingItem ? 'Update' : 'Tambah'} Item</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                {/* Summary */}
                                {pembelianDetails.length > 0 && (
                                    <>
                                        <Separator />
                                        <Card className="bg-gray-50">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Ringkasan Pembelian</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span>Sub Total:</span>
                                                        <span className="font-medium" id="sub_total_keseluruhan">
                                                            Rp {parseFloat(pembelianData.sub_total || '0').toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Total Diskon:</span>
                                                        <span className="font-medium text-red-600" id="diskon_total_keseluruhan">
                                                            Rp {parseFloat(pembelianData.total_diskon || '0').toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>PPN ({pembelianData.pajak_ppn}%):</span>
                                                        <span className="font-medium" id="ppn_total_keseluruhan">
                                                            Rp {parseFloat(pembelianData.ppn_total || '0').toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Materai:</span>
                                                        <span className="font-medium">
                                                            Rp {parseInt(pembelianData.materai || '0').toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Koreksi:</span>
                                                        <span className="font-medium">
                                                            Rp {parseInt(pembelianData.koreksi || '0').toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-lg font-bold">
                                                        <span>Total Keseluruhan:</span>
                                                        <span id="total_keseluruhan" className="text-blue-600">
                                                            Rp {parseFloat(pembelianData.total || '0').toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between">
                    <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Sebelumnya
                    </Button>

                    {currentStep < 3 ? (
                        <Button onClick={nextStep} className="flex items-center gap-2">
                            Selanjutnya
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Simpan Pembelian
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { RotateCcw, AlertTriangle, FileText, Search } from 'lucide-react';

interface BarangItem {
    id: number | string;
    kode?: string;
    nama: string;
    jenis_barang?: 'obat' | 'alkes' | 'inventaris' | string;
}

interface SatuanItem {
    id: number | string;
    nama: string;
}

interface SupplierItem {
    id: number | string;
    kode?: string;
    nama: string;
}

interface Batch {
    id: number | string;
    nomor_faktur?: string;
    kode_obat_alkes?: string;
    nama_obat_alkes?: string;
    qty?: number | string;
    exp?: string | null;
    batch?: string | null;
    // Fields from pembelian_inventaris_detail
    kode?: string;
    kode_barang?: string;
    nama_barang?: string;
    qty_barang?: string | number;
    harga_barang?: string | number;
    lokasi?: string;
    kondisi?: string;
    masa_akhir_penggunaan?: string;
    tanggal_pembelian?: string;
    detail_barang?: string;
    jenis_barang?: string;
    kategori_barang?: string;
}

interface PageProps {
    title?: string;
    barangs?: BarangItem[];
    suppliers?: SupplierItem[];
    satuan?: SatuanItem[];
    batch?: Batch[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PengeluaranBarangIndex() {
    const { title, barangs = [], suppliers = [], satuan = [], batch = [], flash } = (usePage().props as unknown as PageProps) || {};
    const [barangsOptions, setBarangsOptions] = useState<BarangItem[]>(barangs || []);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);

    }, [flash]);

    // Fetch pembelians and pembelian_details on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pembeliansRes, pembelianDetailsRes] = await Promise.all([
                    axios.get('/api/pembelians'),
                    axios.get('/api/pembelian-details')
                ]);

                if (pembeliansRes.data?.success) {
                    setPembelians(pembeliansRes.data.data || []);
                }

                if (pembelianDetailsRes.data?.success) {
                    setPembelian_details(pembelianDetailsRes.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching pembelians data:', error);
            }
        };

        fetchData();
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gudang', href: '/gudang' },
        { title: 'Pengeluaran Barang', href: '/gudang/pengeluaran-barang' },
    ];

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [jenisPengeluaran, setJenisPengeluaran] = useState<'return' | 'tidak_terduga' | 'return_utama' | 'tidak_terduga_utama' | ''>('');
    const [kodeBarangKeluar, setKodeBarangKeluar] = useState<string>('');
    const [supplier, setSupplier] = useState<string>('');
    const [keterangan, setKeterangan] = useState<string>('');
    const [tanggalReturn, setTanggalReturn] = useState<string>('');
    // Removed: kondisiBarang per request
    const [namaMemeriksa, setNamaMemeriksa] = useState<string>('');
    const [namaApprove, setNamaApprove] = useState<string>('');
    const [kodeFaktur, setKodeFaktur] = useState<string>('');
    const [pembelianOptions, setPembelianOptions] = useState<Array<{ id: string | number; kode: string; supplier?: string; tanggal?: string }>>([]);
    const [selectedPembelianId, setSelectedPembelianId] = useState<string>('');
    const [isSearchingFaktur, setIsSearchingFaktur] = useState<boolean>(false);
    const [searchFaktur, setSearchFaktur] = useState<string>('');
    const [returnItems, setReturnItems] = useState<Array<{ kode: string; nama: string; batch?: string | null; qtyMax: number; qty: string }>>([]);
    const [pembelians, setPembelians] = useState<Array<{ id: number | string; nomor_faktur?: string; supplier?: string; tanggal_faktur?: string }>>([]);
    const [pembelian_details, setPembelian_details] = useState<Array<{ nomor_faktur: string; kode_obat_alkes: string; nama_obat_alkes: string; qty: number | string; exp?: string | null; batch?: string | null }>>([]);
    const [searchBarang, setSearchBarang] = useState<string>('');
    const [selectedBarangItems, setSelectedBarangItems] = useState<Array<{ id: string; kode: string; nama: string; qty: string; satuan_id: string }>>([]);
    const [batchData, setBatchData] = useState<Batch[]>([]);

    // Get faktur code from selected pembelian
    const fakturCode = useMemo(() => {
        if (kodeFaktur) return kodeFaktur;
        if (selectedPembelianId) {
            // Find from pembelians directly instead of pembelianOptions to avoid circular dependency
            const found = (pembelians || []).find((x: any) => String(x.id) === String(selectedPembelianId));
            return found?.nomor_faktur || '';
        }
        return '';
    }, [kodeFaktur, selectedPembelianId, pembelians]);

    // Sinkronkan daftar item untuk step 3 saat faktur dipilih
    useEffect(() => {
        try {
            // Calculate fakturCode directly from dependencies
            let currentFakturCode = kodeFaktur;
            if (!currentFakturCode && selectedPembelianId) {
                const found = (pembelians || []).find((x: any) => String(x.id) === String(selectedPembelianId));
                currentFakturCode = found?.nomor_faktur || '';
            }

            if (!currentFakturCode) {
                setReturnItems([]);
                return;
            }
            const items = (pembelian_details || []).filter((d) => String(d.nomor_faktur) === String(currentFakturCode));
            const mapped = items.map((d) => {
                // Handle both obat and inventaris data structures
                const kode = d.kode_obat_alkes ? String(d.kode_obat_alkes) :
                    (d as any).kode_barang ? String((d as any).kode_barang) :
                        '';

                const nama = d.nama_obat_alkes ? String(d.nama_obat_alkes) :
                    (d as any).nama_barang ? String((d as any).nama_barang) : '';

                const qty = d.qty ? parseInt(String(d.qty), 10) :
                    (d as any).qty_barang ? parseInt(String((d as any).qty_barang), 10) : 0;

                return {
                    kode,
                    nama,
                    batch: (d as any).batch ?? null,
                    qtyMax: qty || 0,
                    qty: '',
                };
            });
            setReturnItems(mapped);
        } catch (e) {
            setReturnItems([]);
        }
    }, [selectedPembelianId, kodeFaktur, pembelian_details, pembelians]);

    // Ambil kode otomatis saat masuk Step 2
    useEffect(() => {
        const fetchKode = async () => {
            try {
                if (currentStep === 2 && jenisPengeluaran) {
                    const res = await axios.post('/api/pengeluaran-barang/generate-kode', {
                        jenis_pengeluaran: jenisPengeluaran,
                    });
                    if (res.data?.success && res.data?.kode) {
                        setKodeBarangKeluar(res.data.kode);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchKode();
    }, [currentStep, jenisPengeluaran]);

    // Removed: barang mapping per request

    // Filter daftar batch sesuai pencarian (maks 10)
    const filteredBatches = useMemo(() => {
        return (batch || [])
            .filter((b) => {
                const q = (searchBarang || '').toLowerCase();
                if (!q) return true;

                // Handle both obat and inventaris data structures
                const nama = b.nama_obat_alkes ? b.nama_obat_alkes.toLowerCase() :
                    b.nama_barang ? b.nama_barang.toLowerCase() : '';

                const kode = b.kode_obat_alkes ? b.kode_obat_alkes.toLowerCase() :
                    b.kode_barang ? b.kode_barang.toLowerCase() :
                        b.kode ? b.kode.toLowerCase() : '';

                const batchNumber = (b.batch || '').toLowerCase();
                const fakturNumber = (b.nomor_faktur || '').toLowerCase();
                const lokasi = (b.lokasi || '').toLowerCase();
                const kondisi = (b.kondisi || '').toLowerCase();

                return nama.includes(q) || kode.includes(q) || batchNumber.includes(q) ||
                    fakturNumber.includes(q) || lokasi.includes(q) || kondisi.includes(q);
            })
            .slice(0, 10);
    }, [batch, searchBarang]);

    // Removed filteredBarangs as we're now using filteredBatches

    // Add barang to selected items
    const addBarangToSelection = useCallback((barang: BarangItem | Batch) => {
        setSelectedBarangItems(prev => {
            const exists = prev.find(item => item.id === String(barang.id));
            if (!exists) {
                // Determine the kode and nama based on the data structure
                let kodeValue = '';
                let namaValue = '';

                if ('kode_obat_alkes' in barang && barang.kode_obat_alkes) {
                    kodeValue = barang.kode_obat_alkes;
                } else if ('kode_barang' in barang && barang.kode_barang) {
                    kodeValue = barang.kode_barang;
                } else if ('kode' in barang && barang.kode) {
                    kodeValue = barang.kode;
                }

                if ('nama_obat_alkes' in barang && barang.nama_obat_alkes) {
                    namaValue = barang.nama_obat_alkes;
                } else if ('nama_barang' in barang && barang.nama_barang) {
                    namaValue = barang.nama_barang;
                } else if ('nama' in barang) {
                    namaValue = barang.nama;
                }

                return [...prev, {
                    id: String(barang.id),
                    kode: kodeValue,
                    nama: namaValue,
                    qty: '1',
                    satuan_id: ''
                }];
            }
            return prev;
        });
    }, []);

    // Remove barang from selection
    const removeBarangFromSelection = useCallback((id: string) => {
        setSelectedBarangItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Update qty for selected item
    const updateSelectedItemQty = useCallback((id: string, qty: string) => {
        setSelectedBarangItems(prev => prev.map(item =>
            item.id === id ? { ...item, qty } : item
        ));
    }, []);

    // Update satuan for selected item
    const updateSelectedItemSatuan = useCallback((id: string, satuan_id: string) => {
        setSelectedBarangItems(prev => prev.map(item =>
            item.id === id ? { ...item, satuan_id } : item
        ));
    }, []);

    // Update return item quantity
    const updateReturnItemQty = useCallback((idx: number, qty: string) => {
        setReturnItems(prev => prev.map((p, i) => i === idx ? { ...p, qty } : p));
    }, []);

    // Handle pembelian selection
    const handlePembelianSelection = useCallback((v: string) => {
        setSelectedPembelianId(v);
        // Find from pembelians directly to avoid dependency on pembelianOptions
        const found = (pembelians || []).find((p: any) => String(p.id) === String(v));
        setKodeFaktur(found?.nomor_faktur || '');
        // Auto-select supplier by name (trim + lowercase)
        if (found?.supplier && Array.isArray(suppliers)) {
            const target = String(found.supplier || '').trim().toLowerCase();
            const match = suppliers.find((s: any) => String(s.nama || '').trim().toLowerCase() === target);
            if (match && match.id !== undefined && match.id !== null) {
                setSupplier(String(match.id));
            }
        }
    }, [pembelians, suppliers]);

    // Cari faktur pembelian saat user mengetik (debounce sederhana)
    useEffect(() => {
        let handle: any;
        const q = (searchFaktur || '').trim().toLowerCase();
        handle = setTimeout(() => {
            try {
                setIsSearchingFaktur(true);
                const items = Array.isArray(pembelians) ? pembelians : [];
                const mapped = items
                    .map((it: any) => ({
                        id: String(it.id ?? ''),
                        kode: String(it.nomor_faktur ?? ''),
                        supplier: it.supplier ? String(it.supplier) : undefined,
                        tanggal: it.tanggal_faktur ? String(it.tanggal_faktur) : undefined,
                    }))
                    .filter((x) => !q || (x.kode.toLowerCase().includes(q) || (x.supplier || '').toLowerCase().includes(q)))
                    .slice(0, 10);
                setPembelianOptions(mapped);
            } catch (e) {
                setPembelianOptions([]);
            } finally {
                setIsSearchingFaktur(false);
            }
        }, 250);
        return () => clearTimeout(handle);
    }, [searchFaktur, pembelians]);

    const steps = useMemo(() => [
        { number: 1, title: 'Jenis Pengeluaran', icon: RotateCcw },
        { number: 2, title: 'Detail Pengeluaran', icon: FileText },
        { number: 3, title: 'Konfirmasi', icon: FileText },
    ], []);

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };
    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jenisPengeluaran) {
            toast.error('Pilih jenis pengeluaran terlebih dahulu');
            return;
        }
        if ((jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama') && !supplier) {
            toast.error('Pilih supplier untuk retur');
            return;
        }
        if (!tanggalReturn) {
            toast.error('Tanggal return wajib diisi');
            return;
        }
        if (!kodeBarangKeluar.trim()) {
            toast.error('Kode barang keluar wajib diisi');
            return;
        }
        if (!namaMemeriksa.trim()) {
            toast.error('Nama yang memeriksa wajib diisi');
            return;
        }
        if (!namaApprove.trim()) {
            toast.error('Nama yang approve wajib diisi');
            return;
        }
        if ((jenisPengeluaran === 'tidak_terduga' || jenisPengeluaran === 'tidak_terduga_utama') && selectedBarangItems.length === 0) {
            toast.error('Pilih minimal satu barang untuk keluar');
            return;
        }
        if (jenisPengeluaran === 'tidak_terduga' || jenisPengeluaran === 'tidak_terduga_utama') {
            const invalidItem = selectedBarangItems.find(item => !item.qty || parseInt(item.qty) <= 0);
            if (invalidItem) {
                toast.error('Semua barang harus memiliki jumlah yang valid');
                return;
            }
        }
        try {
            const payload = {
                jenis_pengeluaran: jenisPengeluaran,
                supplier_id: (jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama') ? supplier : undefined,
                keterangan,
                tanggal_return: tanggalReturn,
                kode_barang_keluar: kodeBarangKeluar,
                nama_pemeriksa: namaMemeriksa,
                nama_approver: namaApprove,
                pembelian_id: (jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama') ? selectedPembelianId : undefined,
                retur_items: (jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama') ? (returnItems || [])
                    .map((x) => ({ kode: x.kode, nama: x.nama, batch: x.batch ?? null, qty: x.qty === '' ? 0 : parseInt(x.qty, 10) }))
                    .filter((x) => x.qty > 0) : undefined,
                barang_items: (jenisPengeluaran === 'tidak_terduga' || jenisPengeluaran === 'tidak_terduga_utama') ? selectedBarangItems.map(item => ({
                    barang_id: item.id,
                    qty: parseInt(item.qty),
                    satuan_id: item.satuan_id || null
                })) : undefined,
            } as any;
            const res = await axios.post('/gudang/pengeluaran-barang', payload);
            toast.success('Pengeluaran barang berhasil disimpan');
            // reset simple fields
            setCurrentStep(1);
            setJenisPengeluaran('');
            // Removed resets for jenisBarang/barang
            setSupplier('');
            // Removed resets for satuanId/jumlah
            setKeterangan('');
            setTanggalReturn('');
            setKodeBarangKeluar('');
            // Removed reset for kondisiBarang
            setNamaMemeriksa('');
            setNamaApprove('');
            setSelectedBarangItems([]);
            setSearchBarang('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan');
        }
    };

    const filteredBatchData = useMemo(() => {
        return batchData.filter((batch) => {
            const q = (searchBarang || '').toLowerCase();
            if (!q) return true;
            return (
                // Cek untuk data obat
                (batch.nama_obat_alkes?.toLowerCase().includes(q) || false) ||
                (batch.kode_obat_alkes?.toLowerCase().includes(q) || false) ||
                // Cek untuk data inventaris
                (batch.nama_barang?.toLowerCase().includes(q) || false) ||
                (batch.kode_barang?.toLowerCase().includes(q) || false) ||
                // Cek untuk kode generik
                (batch.kode?.toLowerCase().includes(q) || false)
            );
        });
    }, [batchData, searchBarang]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title || 'Pengeluaran Barang'} />
            <div className="space-y-6 p-6">
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
                                            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${isCompleted
                                                ? 'border-green-500 bg-green-500 text-white'
                                                : isActive
                                                    ? 'border-blue-500 bg-blue-500 text-white'
                                                    : 'border-gray-300 bg-gray-100 '
                                                }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p
                                                className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : ''
                                                    }`}
                                            >
                                                Step {step.number}
                                            </p>
                                            <p className={`text-sm ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : ''}`}>
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

                <Card>
                    <CardHeader>
                        <CardTitle>{title || 'Pengeluaran Barang'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="bs-stepper mb-4">
                                <div className="bs-stepper-content">
                                    {currentStep === 1 && (
                                        <div id="step1" className="content" role="tabpanel" aria-labelledby="step1-trigger">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <Button
                                                        variant={jenisPengeluaran === 'return' ? 'default' : 'outline'}
                                                        className="flex h-36 flex-1 flex-col items-center justify-center gap-2"
                                                        onClick={() => setJenisPengeluaran('return')}
                                                        type="button"
                                                    >
                                                        <RotateCcw className="h-8 w-8" />
                                                        <span>Return Pembelian</span>
                                                    </Button>
                                                    <Button
                                                        variant={jenisPengeluaran === 'tidak_terduga' ? 'default' : 'outline'}
                                                        className="flex h-36 flex-1 flex-col items-center justify-center gap-2"
                                                        onClick={() => setJenisPengeluaran('tidak_terduga')}
                                                        type="button"
                                                    >
                                                        <AlertTriangle className="h-8 w-8" />
                                                        <span>Pengeluaran Lain Lain</span>
                                                    </Button>
                                                    <Button
                                                        variant={jenisPengeluaran === 'return_utama' ? 'default' : 'outline'}
                                                        className="flex h-36 flex-1 flex-col items-center justify-center gap-2"
                                                        onClick={() => setJenisPengeluaran('return_utama')}
                                                        type="button"
                                                    >
                                                        <RotateCcw className="h-8 w-8" />
                                                        <span>Return Pembelian (Gudang Utama)</span>
                                                    </Button>
                                                    <Button
                                                        variant={jenisPengeluaran === 'tidak_terduga_utama' ? 'default' : 'outline'}
                                                        className="flex h-36 flex-1 flex-col items-center justify-center gap-2"
                                                        onClick={() => setJenisPengeluaran('tidak_terduga_utama')}
                                                        type="button"
                                                    >
                                                        <AlertTriangle className="h-8 w-8" />
                                                        <span>Pengeluaran Lain Lain (Gudang Utama)</span>
                                                    </Button>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <Button type="button" onClick={nextStep} disabled={!jenisPengeluaran}>
                                                    Selanjutnya
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div id="step2" className="content" role="tabpanel" aria-labelledby="step2-trigger">
                                            {jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama' ? (
                                                <>
                                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <div>
                                                            <Label className="mb-2 block text-xs font-medium ">Kode Barang Keluar</Label>
                                                            <Input
                                                                placeholder="Masukkan kode barang keluar"
                                                                value={kodeBarangKeluar}
                                                                onChange={(e) => setKodeBarangKeluar(e.target.value)}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-xs font-medium ">Kode Faktur Pembelian</Label>
                                                            <Select
                                                                value={selectedPembelianId}
                                                                onValueChange={handlePembelianSelection}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={isSearchingFaktur ? 'Mencari...' : 'Ketik lalu pilih faktur'} />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-60 overflow-y-auto">
                                                                    <div className="p-2">
                                                                        <div className="relative">
                                                                            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                                            <Input
                                                                                placeholder="Cari faktur berdasarkan nomor/supplier"
                                                                                value={searchFaktur}
                                                                                onChange={(e) => setSearchFaktur(e.target.value)}
                                                                                className="mb-2 pl-8"
                                                                            />
                                                                        </div>
                                                                        {searchFaktur && (
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <p className="text-xs text-muted-foreground">Ditemukan {pembelianOptions.length} faktur</p>
                                                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSearchFaktur('')} className="h-6 px-2 text-xs">Reset</Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {pembelianOptions.length > 0 ? (
                                                                        pembelianOptions.map((p) => {
                                                                            const tanggalLabel = p.tanggal ? (() => {
                                                                                const d = new Date(p.tanggal as any);
                                                                                return isNaN(d.getTime()) ? String(p.tanggal) : d.toLocaleDateString('id-ID');
                                                                            })() : '';
                                                                            return (
                                                                                <SelectItem key={String(p.id)} value={String(p.id)}>
                                                                                    <div className="flex flex-col py-1">
                                                                                        <span className="font-medium leading-tight">{p.kode}</span>
                                                                                        <span className="text-xs text-muted-foreground leading-tight">{p.supplier ? String(p.supplier) : ''}{tanggalLabel ? ` • ${tanggalLabel}` : ''}</span>
                                                                                    </div>
                                                                                </SelectItem>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <div className="p-2 text-center text-muted-foreground">{searchFaktur ? 'Tidak ada faktur ditemukan' : 'Ketik untuk mencari faktur'}</div>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                        {(jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama') && (
                                                            <div className="md:col-span-1">
                                                                <Label className="mb-2 block text-xs font-medium ">Supplier</Label>
                                                                <Select value={supplier} onValueChange={(v) => setSupplier(v)}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih supplier" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {(suppliers || []).map((s) => (
                                                                            <SelectItem key={String(s.id)} value={String(s.id)}>
                                                                                {s.nama}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                        <div className="md:col-span-1">
                                                            <Label className="mb-2 block text-xs font-medium ">Tanggal Return</Label>
                                                            <Input type="date" value={tanggalReturn} onChange={(e) => setTanggalReturn(e.target.value)} className="dark:[&::-webkit-calendar-picker-indicator]:invert" />
                                                        </div>

                                                        <div className="md:col-span-1">
                                                            <Label className="mb-2 block text-xs font-medium ">Nama yang Memeriksa</Label>
                                                            <Input
                                                                placeholder="Nama pemeriksa"
                                                                value={namaMemeriksa}
                                                                onChange={(e) => setNamaMemeriksa(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="md:col-span-1">
                                                            <Label className="mb-2 block text-xs font-medium ">Nama yang Approve</Label>
                                                            <Input
                                                                placeholder="Nama approver"
                                                                value={namaApprove}
                                                                onChange={(e) => setNamaApprove(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="md:col-span-4">
                                                            <Label className="mb-2 block text-xs font-medium ">Keterangan</Label>
                                                            <textarea
                                                                placeholder="Tambahkan keterangan (opsional)"
                                                                value={keterangan}
                                                                onChange={(e) => setKeterangan(e.target.value)}
                                                                rows={2}
                                                                className="w-full rounded border px-3 py-2"
                                                            ></textarea>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex justify-between">
                                                        <Button type="button" variant="outline" onClick={prevStep}>
                                                            Sebelumnya
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!fakturCode) {
                                                                    toast.error('Pilih kode faktur pembelian terlebih dahulu');
                                                                    return;
                                                                }
                                                                setCurrentStep(3);
                                                            }}
                                                        >
                                                            Selanjutnya
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                // Step 2 untuk tidak_terduga dan tidak_terduga_utama
                                                <>
                                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <div>
                                                            <Label className="mb-2 block text-xs font-medium ">Kode Keluar</Label>
                                                            <Input
                                                                placeholder="Masukkan kode keluar"
                                                                value={kodeBarangKeluar}
                                                                onChange={(e) => setKodeBarangKeluar(e.target.value)}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-xs font-medium ">Tanggal Keluar</Label>
                                                            <Input type="date" value={tanggalReturn} onChange={(e) => setTanggalReturn(e.target.value)} className="dark:[&::-webkit-calendar-picker-indicator]:invert" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <div>
                                                            <Label className="mb-2 block text-xs font-medium ">Nama yang Memeriksa</Label>
                                                            <Input
                                                                placeholder="Nama pemeriksa"
                                                                value={namaMemeriksa}
                                                                onChange={(e) => setNamaMemeriksa(e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-xs font-medium ">Nama yang Approve</Label>
                                                            <Input
                                                                placeholder="Nama approver"
                                                                value={namaApprove}
                                                                onChange={(e) => setNamaApprove(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Label className="mb-2 block text-xs font-medium ">Keterangan</Label>
                                                        <textarea
                                                            placeholder="Tambahkan keterangan (opsional)"
                                                            value={keterangan}
                                                            onChange={(e) => setKeterangan(e.target.value)}
                                                            rows={2}
                                                            className="w-full rounded border px-3 py-2"
                                                        ></textarea>
                                                    </div>
                                                    <div className="mt-4 flex justify-between">
                                                        <Button type="button" variant="outline" onClick={prevStep}>
                                                            Sebelumnya
                                                        </Button>
                                                        <Button type="button" onClick={nextStep}>
                                                            Selanjutnya
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div id="step3" className="content" role="tabpanel" aria-labelledby="step3-trigger">
                                            {jenisPengeluaran === 'return' || jenisPengeluaran === 'return_utama' ? (
                                                // Step 3 untuk return
                                                <>
                                                    <div className="mb-4 rounded border p-4 text-sm">
                                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                            <div>
                                                                <p className="text-muted-foreground">Jenis Pengeluaran</p>
                                                                <p className="font-medium capitalize">{jenisPengeluaran === 'return_utama' ? 'Return Gudang Utama' : jenisPengeluaran === 'return' ? 'Return Barang' : jenisPengeluaran || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Kode Faktur Pembelian</p>
                                                                <p className="font-medium">{fakturCode || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Supplier</p>
                                                                <p className="font-medium">{(() => {
                                                                    const s = (suppliers || []).find((x) => String(x.id) === String(supplier));
                                                                    return s?.nama || '-';
                                                                })()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Tanggal Return</p>
                                                                <p className="font-medium">{tanggalReturn || '-'}</p>
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <p className="text-muted-foreground">Keterangan</p>
                                                                <p className="whitespace-pre-line font-medium">{keterangan || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="rounded border">
                                                        <div className="border-b p-3 font-medium">Daftar Barang dari Faktur</div>
                                                        <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 px-2 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                                                            <div className="col-span-1 text-center">No</div>
                                                            <div className="col-span-6">Barang</div>
                                                            <div className="col-span-2">Batch</div>
                                                            <div className="col-span-1 text-right">Qty Faktur</div>
                                                            <div className="col-span-2 text-right">Qty Retur</div>
                                                        </div>
                                                        <div className={`${returnItems.length > 3 ? 'max-h-40 overflow-y-auto' : ''} p-2`}>
                                                            {returnItems.length > 0 ? (
                                                                <div>
                                                                    <div className="divide-y">
                                                                        {returnItems.map((it, idx) => (
                                                                            <div key={`${it.kode}-${idx}`} className="grid grid-cols-12 items-center gap-2 px-2 py-2">
                                                                                <div className="col-span-1 text-center text-sm">{idx + 1}</div>
                                                                                <div className="col-span-6">
                                                                                    <div className="font-medium leading-tight" title={it.nama}>{it.nama}</div>
                                                                                    <div className="text-xs text-muted-foreground leading-tight">{it.kode}</div>
                                                                                </div>
                                                                                <div className="col-span-2 text-sm text-muted-foreground">{it.batch || '-'}</div>
                                                                                <div className="col-span-1 text-right text-sm text-muted-foreground">{it.qtyMax}</div>
                                                                                <div className="col-span-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={it.qtyMax}
                                                                                        placeholder="0"
                                                                                        value={it.qty}
                                                                                        onChange={(e) => {
                                                                                            const raw = e.target.value;
                                                                                            const parsed = raw === '' ? '' : Math.max(0, Math.min(it.qtyMax, parseInt(raw, 10) || 0));
                                                                                            updateReturnItemQty(idx, String(parsed));
                                                                                        }}
                                                                                        onBlur={(e) => {
                                                                                            const raw = e.target.value;
                                                                                            if (raw === '') return;
                                                                                            const parsed = Math.max(0, Math.min(it.qtyMax, parseInt(raw, 10) || 0));
                                                                                            updateReturnItemQty(idx, String(parsed));
                                                                                        }}
                                                                                        className="h-8 w-full text-right"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-3 px-2 text-right text-sm text-muted-foreground">
                                                                        Total item: {returnItems.length} • Dipilih retur: {returnItems.filter((x) => (x.qty !== '' && parseInt(x.qty, 10) > 0)).length}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center text-sm text-muted-foreground">Pilih kode faktur untuk menampilkan item</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex justify-between">
                                                        <Button type="button" variant="outline" onClick={prevStep}>
                                                            Sebelumnya
                                                        </Button>
                                                        <Button type="submit">Simpan</Button>
                                                    </div>
                                                </>
                                            ) : (
                                                // Step 3 untuk tidak_terduga - Pilih Barang
                                                <>
                                                    <div className="mb-4">
                                                        <Label className="mb-2 block text-xs font-medium">Pilih Barang</Label>
                                                        <div className="relative">
                                                            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                            <Input
                                                                placeholder="Cari barang berdasarkan kode, nama, atau nomor batch..."
                                                                value={searchBarang}
                                                                onChange={(e) => setSearchBarang(e.target.value)}
                                                                className="pl-8"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Daftar batch yang bisa dipilih */}
                                                    <div className="mb-4 rounded border">
                                                        <div className="border-b p-3 font-medium">Daftar Batch Tersedia</div>
                                                        <div className="max-h-60 overflow-y-auto p-2">
                                                            {filteredBatches.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {filteredBatches.map((item) => {
                                                                        const isSelected = selectedBarangItems.some(b => b.id === String(item.id));

                                                                        // Menentukan apakah item adalah obat atau inventaris
                                                                        const isObat = !!item.nama_obat_alkes;
                                                                        const isInventaris = !!item.nama_barang;

                                                                        return (
                                                                            <div key={String(item.id)} className="flex items-center justify-between rounded border p-3">
                                                                                <div className="flex-1">
                                                                                    {/* Tampilkan nama berdasarkan jenis item */}
                                                                                    <div className="font-medium">
                                                                                        {isObat ? item.nama_obat_alkes : (isInventaris ? item.nama_barang : 'Nama tidak tersedia')}
                                                                                    </div>

                                                                                    {/* Tampilkan kode berdasarkan jenis item */}
                                                                                    <div className="text-sm text-muted-foreground">
                                                                                        {isObat ? item.kode_obat_alkes : (isInventaris ? item.kode_barang || item.kode : 'Kode tidak tersedia')}
                                                                                    </div>

                                                                                    {/* Tampilkan batch dan faktur */}
                                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                                        Batch: {item.batch || 'N/A'} | Faktur: {item.nomor_faktur || item.kode || 'N/A'}
                                                                                    </div>

                                                                                    {/* Tampilkan qty dan exp untuk obat, atau qty dan lokasi untuk inventaris */}
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        {isObat ? (
                                                                                            <>Qty: {item.qty} | Exp: {item.exp || 'N/A'}</>
                                                                                        ) : (
                                                                                            <>Qty: {item.qty_barang} | Lokasi: {item.lokasi || 'N/A'} | Kondisi: {item.kondisi || 'N/A'}</>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant={isSelected ? "default" : "outline"}
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            removeBarangFromSelection(String(item.id));
                                                                                        } else {
                                                                                            // Handle both obat and inventaris data structures
                                                                                            const kodeValue = item.kode_obat_alkes || item.kode_barang || item.kode || '';
                                                                                            const namaValue = item.nama_obat_alkes || item.nama_barang || '';
                                                                                            addBarangToSelection({
                                                                                                id: item.id,
                                                                                                kode: kodeValue,
                                                                                                nama: namaValue
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {isSelected ? 'Dipilih' : 'Pilih'}
                                                                                </Button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center text-sm text-muted-foreground py-4">
                                                                    {searchBarang ? 'Tidak ada batch ditemukan' : 'Ketik untuk mencari batch'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Daftar barang yang sudah dipilih */}
                                                    {selectedBarangItems.length > 0 && (
                                                        <div className="mb-4 rounded border">
                                                            <div className="border-b p-3 font-medium">Barang yang Dipilih ({selectedBarangItems.length})</div>
                                                            <div className="p-2">
                                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                                                    {selectedBarangItems.map((item, idx) => (
                                                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center rounded border p-3">
                                                                            <div className="col-span-1 text-center text-sm">{idx + 1}</div>
                                                                            <div className="col-span-4">
                                                                                <div className="font-medium text-sm">{item.nama}</div>
                                                                                <div className="text-xs text-muted-foreground">{item.kode}</div>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <Label className="text-xs">Jumlah</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    value={item.qty}
                                                                                    onChange={(e) => updateSelectedItemQty(item.id, e.target.value)}
                                                                                    className="h-8"
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-5 text-right">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                    onClick={() => removeBarangFromSelection(item.id)}
                                                                                    className="h-8"
                                                                                >
                                                                                    Hapus
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-4 flex justify-between">
                                                        <Button type="button" variant="outline" onClick={prevStep}>
                                                            Sebelumnya
                                                        </Button>
                                                        <Button type="submit">Simpan</Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}



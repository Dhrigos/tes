import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, FileText, Package, Plus, RefreshCw, Search, ShoppingCart, Trash2 } from 'lucide-react';
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
import { Switch } from '../../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import AppLayout from '../../../layouts/app-layout';
import type { BreadcrumbItem } from '../../../types';

interface PembelianData {
    jenis_pembelian: 'obat' | 'inventaris' | 'obat_klinik' | 'inventaris_klinik' | '';
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
    qty_aktual?: string; // qty dalam satuan kecil (hasil konversi jika kemasan besar)
    harga_satuan: string;
    diskon: string;
    exp: string;
    batch: string;
    sub_total: string;
    // Tambahan untuk obat
    nilai_konversi?: number; // total konversi besar -> kecil (legacy)
    nilai_konversi_bs?: number; // konversi besar -> sedang
    nilai_konversi_sk?: number; // konversi sedang -> kecil
    kemasan_besar?: boolean;
    nilai_satuan_besar?: string;
    nilai_satuan_sedang?: string;
    nilai_satuan_kecil?: string;
    harga_satuan_besar?: string;
    harga_satuan_sedang?: string;
    harga_satuan_kecil?: string;
    diskon_persen?: boolean; // true = persen, false = rupiah
    // Tambahan untuk inventaris
    lokasi?: string;
    kondisi?: 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat';
    tanggal_pembelian?: string;
    deskripsi_barang?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Modul Pembelian', href: '' },
    { title: 'Tambah Pembelian', href: '' },
];

export default function PembelianIndex() {
    const { suppliers: suppliersProp } = (usePage().props as any) || {};
    const [currentStep, setCurrentStep] = useState(1);
    const [isGeneratingFaktur, setIsGeneratingFaktur] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PembelianDetail | null>(null);
    const [modalData, setModalData] = useState<PembelianDetail>({
        id: '',
        nama_obat_alkes: '',
        kode_obat_alkes: '',
        qty: '0',
        qty_aktual: '0',
        harga_satuan: '0',
        diskon: '0',
        exp: '',
        batch: '',
        sub_total: '0',
        nilai_konversi: 1,
        nilai_konversi_bs: 1,
        nilai_konversi_sk: 1,
        kemasan_besar: false,
        nilai_satuan_besar: '0',
        nilai_satuan_sedang: '0',
        nilai_satuan_kecil: '0',
        harga_satuan_besar: '0',
        harga_satuan_sedang: '0',
        harga_satuan_kecil: '0',
        diskon_persen: true,
    });
    const [searchObat, setSearchObat] = useState("");
    const [searchInventaris, setSearchInventaris] = useState("");
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
    const [inventarisOptions, setInventarisOptions] = useState<Array<{ id: number; kode_barang?: string; nama_barang: string }>>([]);
    const [obatOptions, setObatOptions] = useState<
        Array<{
            id: number;
            kode: string;
            nama: string;
            nama_dagang?: string;
            satuan_kecil?: string;
            nilai_satuan_kecil?: number;
            satuan_sedang?: string;
            nilai_satuan_sedang?: number;
            satuan_besar?: string;
            nilai_satuan_besar?: number;
        }>
    >([]);

    const isObatType = pembelianData.jenis_pembelian === 'obat' || pembelianData.jenis_pembelian === 'obat_klinik';
    const isInventarisType = pembelianData.jenis_pembelian === 'inventaris' || pembelianData.jenis_pembelian === 'inventaris_klinik';

    // Supplier options from Inertia props (tanpa API)
    const [supplierOptions, setSupplierOptions] = useState<
        Array<{ id: number; kode: string; nama: string; nama_pic?: string; telepon_pic?: string }>
    >(() => (Array.isArray(suppliersProp) ? suppliersProp : []));
    const [searchSupplier, setSearchSupplier] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

    // Sync supplier options when props change
    React.useEffect(() => {
        if (Array.isArray(suppliersProp)) {
            setSupplierOptions(suppliersProp);
        }
    }, [suppliersProp]);

    // Sync selected supplier id if supplier name already set
    React.useEffect(() => {
        if (pembelianData.supplier && !selectedSupplierId && supplierOptions.length > 0) {
            const found = supplierOptions.find((s) => s.nama === pembelianData.supplier);
            if (found) setSelectedSupplierId(String(found.id));
        }
    }, [pembelianData.supplier, selectedSupplierId, supplierOptions]);

    const selectedSupplier = React.useMemo(() => {
        return supplierOptions.find((s) => String(s.id) === selectedSupplierId);
    }, [selectedSupplierId, supplierOptions]);

    const fetchDaftarInventaris = async () => {
        try {
            const res = await axios.get('/api/barang/list');
            if (res.data?.success) {
                const items = res.data.data || [];
                setInventarisOptions(
                    items.map((item: any) => ({
                        id: item.id,
                        kode_barang: item.kode,
                        nama_barang: item.nama_dagang || item.nama,
                    }))
                );
            }
        } catch (e) {
            // silently ignore
        }
    };

    const fetchDaftarObat = async () => {
        try {
            const res = await axios.get('/api/barang/list');
            if (res.data?.success) {
                setObatOptions(res.data.data || []);
            }
        } catch (e) {
            // silently ignore
        }
    };

    const fetchSuppliers = () => {
        // No API: ensure options reflect props
        if (Array.isArray(suppliersProp)) {
            setSupplierOptions(suppliersProp);
        }
    };

    // Debounce not needed when using props only

    // Filter dabar based on search term
    const filteredDabar = obatOptions?.filter((barang) => {
        const q = searchObat.toLowerCase();
        return (
            barang.nama?.toLowerCase().includes(q) 
        );
    }).slice(0, 5) || [];

    // Filter inventaris based on search term
    const filteredInventaris = inventarisOptions?.filter((item) => {
        const q = searchInventaris.toLowerCase();
        return (
            item.nama_barang?.toLowerCase().includes(q)
        );
    }).slice(0, 5) || [];

    // Filter suppliers (client-side) for display; server already supports q param
    const filteredSuppliers = (supplierOptions || [])
        .filter((s) => {
            const q = searchSupplier.toLowerCase();
            return (
                s.nama?.toLowerCase().includes(q) ||
                s.kode?.toLowerCase().includes(q) ||
                (s.nama_pic || '')?.toLowerCase().includes(q)
            );
        })
        .slice(0, 50);

    const steps = [
        { number: 1, title: 'Jenis Pembelian', icon: Package },
        { number: 2, title: 'Data Awal', icon: FileText },
        { number: 3, title: 'Detail Pembelian', icon: ShoppingCart },
    ];

    // Generate nomor faktur otomatis
    const generateNomorFaktur = async (jenis: 'obat' | 'inventaris' | 'obat_klinik' | 'inventaris_klinik') => {
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
    const handleJenisPembelianChange = (value: 'obat' | 'inventaris' | 'obat_klinik' | 'inventaris_klinik') => {
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
            qty_aktual: '0',
            harga_satuan: '0',
            diskon: '0',
            // exp dipakai untuk inventaris sebagai masa akhir penggunaan
            exp:
                isInventarisType
                    ? new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]
                    : '',
            batch: '',
            sub_total: '0',
            nilai_konversi: 1,
            nilai_konversi_bs: 1,
            nilai_konversi_sk: 1,
            kemasan_besar: false,
            nilai_satuan_besar: '0',
            nilai_satuan_sedang: '0',
            nilai_satuan_kecil: '0',
            harga_satuan_besar: '0',
            harga_satuan_sedang: '0',
            harga_satuan_kecil: '0',
            diskon_persen: true,
            lokasi: 'Gudang',
            kondisi: 'Baik',
            tanggal_pembelian: pembelianData.tgl_pembelian,
            deskripsi_barang: '',
        });
        if (isInventarisType && inventarisOptions.length === 0) {
            fetchDaftarInventaris();
        }
        setIsModalOpen(true);
    };

    const openEditModal = (item: PembelianDetail) => {
        setEditingItem(item);
        // Normalize modal data based on kemasan and konversi so editing shows correct values
        const konversi = item.nilai_konversi || 1;
        const konversiBs = item.nilai_konversi_bs || 1;
        const konversiSk = item.nilai_konversi_sk || (item.nilai_konversi ? item.nilai_konversi / Math.max(1, konversiBs) : 1);
        const totalKonversi = Math.max(1, konversiBs) * Math.max(1, konversiSk);
        const kemasanBesar = !!item.kemasan_besar;

        let hargaBesar = parseFloat(item.harga_satuan_besar || '0') || 0;
        let hargaSedang = parseFloat(item.harga_satuan_sedang || '0') || 0;
        let hargaKecil = parseFloat(item.harga_satuan_kecil || '0') || 0;
        if (!hargaBesar && hargaKecil) {
            hargaBesar = hargaKecil * totalKonversi;
        }
        if (!hargaSedang && hargaBesar) {
            hargaSedang = hargaBesar / Math.max(1, konversiBs);
        }
        if (!hargaKecil && hargaSedang) {
            hargaKecil = hargaSedang / Math.max(1, konversiSk);
        }

        let nilaiBesar = parseInt(item.nilai_satuan_besar || '0') || 0;
        let nilaiSedang = parseInt(item.nilai_satuan_sedang || '0') || 0;
        let nilaiKecil = parseInt(item.nilai_satuan_kecil || '0') || 0;
        if (!nilaiBesar && nilaiKecil) {
            // derive via chain
            const approxSedang = Math.round(nilaiKecil / Math.max(1, konversiSk));
            nilaiBesar = Math.round(approxSedang / Math.max(1, konversiBs));
        }
        if (!nilaiSedang && nilaiBesar) {
            nilaiSedang = nilaiBesar * Math.max(1, konversiBs);
        }
        if (!nilaiKecil && nilaiBesar) {
            nilaiSedang = nilaiSedang || (nilaiBesar * Math.max(1, konversiBs));
            nilaiKecil = (nilaiSedang) * Math.max(1, konversiSk);
        }

        const hargaAktif = kemasanBesar ? hargaBesar : hargaKecil;

        // Gunakan qty pembelian apa adanya (tidak diturunkan dari nilai_satuan_*)
        const qtyPembelian = parseFloat(item.qty || '0') || 0;
        const qtyAktual = kemasanBesar ? (qtyPembelian * totalKonversi) : qtyPembelian;

        const diskonPersen = item.diskon_persen ?? true;
        const diskonValue = parseFloat(item.diskon || '0') || 0;
        const diskonNominal = diskonPersen ? qtyPembelian * hargaAktif * (diskonValue / 100) : diskonValue;
        const subTotal = qtyPembelian * hargaAktif - diskonNominal;

        setModalData({
            ...item,
            nilai_konversi: totalKonversi,
            nilai_konversi_bs: konversiBs,
            nilai_konversi_sk: konversiSk,
            kemasan_besar: kemasanBesar,
            harga_satuan_besar: hargaBesar.toString(),
            harga_satuan_sedang: hargaSedang.toString(),
            harga_satuan_kecil: hargaKecil.toString(),
            nilai_satuan_besar: nilaiBesar.toString(),
            nilai_satuan_sedang: nilaiSedang.toString(),
            nilai_satuan_kecil: nilaiKecil.toString(),
            qty: (item.qty || '0').toString(),
            qty_aktual: qtyAktual.toString(),
            harga_satuan: hargaAktif.toString(),
            sub_total: subTotal.toString(),
        });
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
            if (isObatType) {
                // Sync harga satuan besar/kecil saat input harga berubah
                if (field === 'harga_satuan') {
                    const konvBs = prev.nilai_konversi_bs || 1;
                    const konvSk = prev.nilai_konversi_sk || (prev.nilai_konversi ? prev.nilai_konversi / Math.max(1, konvBs) : 1);
                    const totalKonv = Math.max(1, konvBs) * Math.max(1, konvSk);
                    const hargaInput = parseFloat(value as string) || 0;
                    if (prev.kemasan_besar) {
                        updatedItem.harga_satuan_besar = hargaInput.toString();
                        updatedItem.harga_satuan_sedang = (hargaInput / Math.max(1, konvBs)).toString();
                        updatedItem.harga_satuan_kecil = (hargaInput / totalKonv).toString();
                    } else {
                        updatedItem.harga_satuan_kecil = hargaInput.toString();
                        updatedItem.harga_satuan_sedang = (hargaInput * Math.max(1, konvSk)).toString();
                        updatedItem.harga_satuan_besar = (hargaInput * totalKonv).toString();
                    }
                }

                if (field === 'nilai_satuan_besar') {
                    const nilaiBesar = parseInt(value as string) || 0;
                    const konvBs = prev.nilai_konversi_bs || 1;
                    const konvSk = prev.nilai_konversi_sk || (prev.nilai_konversi ? prev.nilai_konversi / Math.max(1, konvBs) : 1);
                    updatedItem.nilai_satuan_sedang = (nilaiBesar * Math.max(1, konvBs)).toString();
                    updatedItem.nilai_satuan_kecil = (nilaiBesar * Math.max(1, konvBs) * Math.max(1, konvSk)).toString();
                }

                if (field === 'nilai_satuan_sedang') {
                    const nilaiSedang = parseInt(value as string) || 0;
                    const konvBs = prev.nilai_konversi_bs || 1;
                    const konvSk = prev.nilai_konversi_sk || (prev.nilai_konversi ? prev.nilai_konversi / Math.max(1, konvBs) : 1);
                    updatedItem.nilai_satuan_besar = Math.round(nilaiSedang / Math.max(1, konvBs)).toString();
                    updatedItem.nilai_satuan_kecil = (nilaiSedang * Math.max(1, konvSk)).toString();
                }

                if (field === 'nilai_satuan_kecil') {
                    const nilaiKecil = parseInt(value as string) || 0;
                    const konvBs = prev.nilai_konversi_bs || 1;
                    const konvSk = prev.nilai_konversi_sk || (prev.nilai_konversi ? prev.nilai_konversi / Math.max(1, konvBs) : 1);
                    const nilaiSedang = Math.round(nilaiKecil / Math.max(1, konvSk));
                    updatedItem.nilai_satuan_sedang = nilaiSedang.toString();
                    updatedItem.nilai_satuan_besar = Math.round(nilaiSedang / Math.max(1, konvBs)).toString();
                }

                if (field === 'kemasan_besar') {
                    if (value) {
                        // Saat beralih ke kemasan besar, konversi harga dari kecil->besar bila perlu (qty tidak diubah)
                        const konvBs = prev.nilai_konversi_bs || 1;
                        const konvSk = prev.nilai_konversi_sk || (prev.nilai_konversi ? prev.nilai_konversi / Math.max(1, konvBs) : 1);
                        const totalKonv = Math.max(1, konvBs) * Math.max(1, konvSk);
                        const hargaBesar = parseFloat(prev.harga_satuan_besar || '0');
                        const hargaKecil = parseFloat(prev.harga_satuan_kecil || '0');
                        const hargaTerpakai = hargaBesar || hargaKecil * totalKonv;
                        updatedItem.harga_satuan_besar = (hargaTerpakai || 0).toString();
                        updatedItem.harga_satuan_sedang = ((hargaTerpakai || 0) / Math.max(1, konvBs)).toString();
                        updatedItem.harga_satuan_kecil = ((hargaTerpakai || 0) / totalKonv).toString();
                        updatedItem.harga_satuan = (hargaTerpakai || 0).toString();
                    } else {
                        // Saat beralih ke kemasan kecil, konversi harga dari besar->kecil bila perlu (qty tidak diubah)
                        const konvBs = prev.nilai_konversi_bs || 1;
                        const konvSk = prev.nilai_konversi_sk || (prev.nilai_konversi ? prev.nilai_konversi / Math.max(1, konvBs) : 1);
                        const totalKonv = Math.max(1, konvBs) * Math.max(1, konvSk);
                        const hargaBesar = parseFloat(prev.harga_satuan_besar || '0');
                        const hargaKecil = parseFloat(prev.harga_satuan_kecil || '0');
                        const hargaTerpakai = hargaKecil || hargaBesar / totalKonv;
                        updatedItem.harga_satuan_kecil = (hargaTerpakai || 0).toString();
                        updatedItem.harga_satuan_sedang = ((hargaTerpakai || 0) * Math.max(1, konvSk)).toString();
                        updatedItem.harga_satuan_besar = ((hargaTerpakai || 0) * totalKonv).toString();
                        updatedItem.harga_satuan = (hargaTerpakai || 0).toString();
                    }
                }

                // Jangan override qty saat nilai_satuan_* berubah; qty adalah input pembelian terpisah.

                // Jika nilai konversi berubah, sinkronkan harga besar/kecil yang saling terkait
                if (field === 'nilai_konversi') {
                    const newKonversi = (value as number) || parseFloat(value as string) || 1;
                    const konvBs = updatedItem.nilai_konversi_bs || prev.nilai_konversi_bs || 1;
                    const konvSk = Math.max(1, Math.round(newKonversi / Math.max(1, konvBs)));
                    updatedItem.nilai_konversi_sk = konvSk;

                    const hargaBesar = parseFloat(updatedItem.harga_satuan_besar || prev.harga_satuan_besar || '0');
                    const hargaKecil = parseFloat(updatedItem.harga_satuan_kecil || prev.harga_satuan_kecil || '0');

                    if (hargaBesar && !hargaKecil) {
                        updatedItem.harga_satuan_kecil = (hargaBesar / Math.max(1, newKonversi)).toString();
                        updatedItem.harga_satuan_sedang = (hargaBesar / Math.max(1, konvBs)).toString();
                    } else if (!hargaBesar && hargaKecil) {
                        updatedItem.harga_satuan_besar = (hargaKecil * Math.max(1, newKonversi)).toString();
                        updatedItem.harga_satuan_sedang = (hargaKecil * Math.max(1, konvSk)).toString();
                    } else if (hargaBesar && hargaKecil) {
                        // Prioritaskan konsistensi dengan kemasan aktif
                        if (updatedItem.kemasan_besar) {
                            updatedItem.harga_satuan_kecil = (hargaBesar / Math.max(1, newKonversi)).toString();
                            updatedItem.harga_satuan_sedang = (hargaBesar / Math.max(1, konvBs)).toString();
                        } else {
                            updatedItem.harga_satuan_besar = (hargaKecil * Math.max(1, newKonversi)).toString();
                            updatedItem.harga_satuan_sedang = (hargaKecil * Math.max(1, konvSk)).toString();
                        }
                    }

                    // Set harga_satuan sesuai kemasan aktif
                    updatedItem.harga_satuan = updatedItem.kemasan_besar
                        ? updatedItem.harga_satuan_besar || '0'
                        : updatedItem.harga_satuan_kecil || '0';
                }
            }

            // Recompute qty_aktual (satuan kecil) dari qty & kemasan
            {
                const konvBs = (updatedItem.nilai_konversi_bs || prev.nilai_konversi_bs || 1) as number;
                const derivedSk = (updatedItem.nilai_konversi || prev.nilai_konversi)
                    ? ((updatedItem.nilai_konversi as number) || (prev.nilai_konversi as number) || 1) / Math.max(1, konvBs)
                    : 1;
                const konvSk = (updatedItem.nilai_konversi_sk || prev.nilai_konversi_sk || derivedSk) as number;
                const totalKonv = Math.max(1, konvBs) * Math.max(1, konvSk);
                const qtyNum = parseFloat(updatedItem.qty || '0') || 0;
                const qtyAktual = updatedItem.kemasan_besar ? qtyNum * totalKonv : qtyNum;
                updatedItem.qty_aktual = qtyAktual.toString();
            }

            // Calculate sub_total
            if (
                field === 'qty' ||
                field === 'harga_satuan' ||
                field === 'diskon' ||
                field === 'kemasan_besar' ||
                field === 'diskon_persen' ||
                field === 'nilai_satuan_besar' ||
                field === 'nilai_satuan_kecil' ||
                field === 'nilai_konversi'
            ) {
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
        // Compute values synchronously to avoid saving stale modal state
        const current = { ...modalData };
        const qty = parseFloat(current.qty || '0') || 0;
        const konvBs = current.nilai_konversi_bs || 1;
        const konvSk = current.nilai_konversi_sk || (current.nilai_konversi ? current.nilai_konversi / Math.max(1, konvBs) : 1);
        const totalKonv = Math.max(1, konvBs) * Math.max(1, konvSk);
        const qtyAktualNum = current.kemasan_besar ? qty * totalKonv : qty;
        const harga = parseFloat(current.harga_satuan || '0') || 0;
        const diskonValue = parseFloat(current.diskon || '0') || 0;
        const diskonNominal = current.diskon_persen ? qty * harga * (diskonValue / 100) : diskonValue;
        const subtotal = qty * harga - diskonNominal;
        const itemToSave: PembelianDetail = { ...current, qty_aktual: qtyAktualNum.toString(), sub_total: subtotal.toString() };

        if (editingItem) {
            // Update existing item
            setPembelianDetails((prev) => prev.map((item) => (item.id === editingItem.id ? itemToSave : item)));
        } else {
            // Add new item
            setPembelianDetails((prev) => [...prev, itemToSave]);
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
                console.log('Validating item:', {
                    nama: detail.nama_obat_alkes,
                    kode: detail.kode_obat_alkes,
                    qty: detail.qty,
                    qty_number: Number(detail.qty),
                    harga: detail.harga_satuan,
                    harga_number: Number(detail.harga_satuan),
                });

                if (
                    !detail.nama_obat_alkes?.trim() ||
                    !detail.kode_obat_alkes?.trim() ||
                    !detail.qty ||
                    isNaN(Number(detail.qty)) ||
                    Number(detail.qty) <= 0 ||
                    !detail.harga_satuan ||
                    isNaN(Number(detail.harga_satuan)) ||
                    Number(detail.harga_satuan) <= 0
                ) {
                    console.log('Validation failed:', {
                        nama_empty: !detail.nama_obat_alkes?.trim(),
                        kode_empty: !detail.kode_obat_alkes?.trim(),
                        qty_invalid: !detail.qty || isNaN(Number(detail.qty)) || Number(detail.qty) <= 0,
                        harga_invalid: !detail.harga_satuan || isNaN(Number(detail.harga_satuan)) || Number(detail.harga_satuan) <= 0,
                    });
                    toast.error('Semua field item wajib diisi dengan benar (nama dan kode tidak boleh kosong, qty dan harga harus lebih dari 0)');
                    return;
                }
            }
            // Konversi qty ke satuan kecil sebelum dikirim ke backend
            const formData = {
                ...pembelianData,
                details: pembelianDetails.map((detail) => {
                    // Untuk obat, pastikan qty dalam satuan kecil
                    let qtyToSend = detail.qty;

                    if (isObatType) {
                        // kirim qty dalam satuan kecil menggunakan qty_aktual yang sudah disimpan
                        qtyToSend = (detail.qty_aktual || '0');
                    }

                    return {
                        ...detail,
                        qty: qtyToSend,
                        // Hapus id yang hanya untuk frontend
                        id: undefined,
                    };
                }),
            };

            const response = await axios.post('/pembelian/add', formData);

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
                // Reset supplier select state
                setSelectedSupplierId('');
                setSearchSupplier('');
                setSupplierOptions([]);
                setCurrentStep(1);
            }
        } catch (error: any) {
            console.error('Error submitting pembelian:', error);

            if (error.response?.data?.message) {
                toast.error('Gagal menyimpan data pembelian');
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
                                            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${isCompleted
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
                                                className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
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
                                        <Button
                                            variant={pembelianData.jenis_pembelian === 'obat_klinik' ? 'default' : 'outline'}
                                            className="flex h-24 flex-col gap-2"
                                            onClick={() => handleJenisPembelianChange('obat_klinik')}
                                        >
                                            <Package className="h-8 w-8" />
                                            <span>Obat Klinik</span>
                                        </Button>
                                        <Button
                                            variant={pembelianData.jenis_pembelian === 'inventaris_klinik' ? 'default' : 'outline'}
                                            className="flex h-24 flex-col gap-2"
                                            onClick={() => handleJenisPembelianChange('inventaris_klinik')}
                                        >
                                            <ShoppingCart className="h-8 w-8" />
                                            <span>Inventaris Klinik</span>
                                        </Button>
                                    </div>
                                    {pembelianData.jenis_pembelian && (
                                        <Badge variant="secondary" className="mt-4">
                                            Terpilih: {
                                                pembelianData.jenis_pembelian === 'obat'
                                                    ? 'Obat'
                                                    : pembelianData.jenis_pembelian === 'inventaris'
                                                        ? 'Inventaris'
                                                        : pembelianData.jenis_pembelian === 'obat_klinik'
                                                            ? 'Obat Klinik'
                                                            : 'Inventaris Klinik'
                                            }
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
                                        <Select
                                            value={selectedSupplierId}
                                            onOpenChange={(open) => {
                                                if (open && supplierOptions.length === 0) {
                                                    fetchSuppliers();
                                                }
                                                if (!open) {
                                                    setSearchSupplier('');
                                                }
                                            }}
                                            onValueChange={(value) => {
                                                setSelectedSupplierId(value);
                                                const item = supplierOptions.find((s) => String(s.id) === value);
                                                handleDataAwalChange('supplier', item?.nama || '');
                                                setSearchSupplier('');
                                            }}
                                        >
                                            <SelectTrigger id="supplier">
                                                <SelectValue placeholder="Pilih Supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <div className="relative">
                                                        <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                        <Input
                                                            placeholder="Cari supplier berdasarkan nama/kode..."
                                                            value={searchSupplier}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setSearchSupplier(val);
                                                            }}
                                                            className="mb-2 pl-8"
                                                        />
                                                    </div>
                                                    {/* No loading state when using props */}
                                                </div>
                                                {filteredSuppliers.length > 0 ? (
                                                    filteredSuppliers.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            <div className="flex flex-col">
                                                                <div className="font-medium" title={s.nama}>
                                                                    {s.kode ? `${s.kode} - ${s.nama}` : s.nama}
                                                                </div>                                                                
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-muted-foreground">
                                                        {searchSupplier ? 'Supplier tidak ditemukan' : 'Tidak ada data supplier'}
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>                                        
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="no_po_sp">No PO/SP</Label>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="no_po_sp_konsinyasi"
                                                    checked={pembelianData.no_po_sp === 'KONSINYASI'}
                                                    onCheckedChange={(checked) => handleDataAwalChange('no_po_sp', checked ? 'KONSINYASI' : '')}
                                                    aria-label="Tandai sebagai konsinyasi"
                                                />
                                                <span className="text-sm text-muted-foreground">Konsinyasi</span>
                                            </div>
                                        </div>
                                        <Input
                                            id="no_po_sp"
                                            value={pembelianData.no_po_sp}
                                            onChange={(e) => handleDataAwalChange('no_po_sp', e.target.value)}
                                            placeholder="Nomor PO/SP"
                                            disabled={pembelianData.no_po_sp === 'KONSINYASI'}
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
                                                    <TableHead>Nama {isObatType ? 'Obat' : 'Barang'}</TableHead>
                                                    {isObatType && <TableHead>Kemasan</TableHead>}
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
                                                        {isObatType && (
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
                                    <DialogContent className="max-h-[85vh] w-[98vw] max-w-7xl overflow-y-auto sm:max-w-5xl">
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingItem ? 'Edit Item' : 'Tambah Item'}{' '}
                                                {isObatType ? 'Obat' : 'Inventaris'}
                                            </DialogTitle>
                                        </DialogHeader>

                                        <div className="space-y-8 p-2">
                                            {isObatType ? (
                                                // Modal UI untuk Obat
                                                <div className="space-y-6">
                                                    {/* Baris 1: Nama Obat dan Kemasan */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Nama Obat/Alkes</Label>
                                                            <Select
                                                                value={modalData.kode_obat_alkes}
                                                                onOpenChange={(open) => {
                                                                    if (open && obatOptions.length === 0) fetchDaftarObat();
                                                                }}
                                                                onValueChange={(value) => {
                                                                    const item = obatOptions.find((i) => i.kode === value);
                                                                    updateModalData('kode_obat_alkes', value);
                                                                    updateModalData('nama_obat_alkes', item?.nama_dagang || item?.nama || '');
                                                                    // Set konversi hirarkis dan default nilai sesuai kemasan (besar -> sedang -> kecil)
                                                                    const nilaiBesar = Number(item?.nilai_satuan_besar || 0);
                                                                    const nilaiSedang = Number(item?.nilai_satuan_sedang || 0);
                                                                    const nilaiKecil = Number(item?.nilai_satuan_kecil || 0);

                                                                    // Hitung konversi besar->sedang dan sedang->kecil
                                                                    const konvBs = nilaiBesar && nilaiSedang
                                                                        ? Math.max(1, Math.round(nilaiSedang / Math.max(1, nilaiBesar)))
                                                                        : 1;
                                                                    const totalKonvApprox = nilaiBesar && nilaiKecil
                                                                        ? Math.max(1, Math.round(nilaiKecil / Math.max(1, nilaiBesar)))
                                                                        : (modalData.nilai_konversi || 1);
                                                                    const konvSk = nilaiSedang && nilaiKecil
                                                                        ? Math.max(1, Math.round(nilaiKecil / Math.max(1, nilaiSedang)))
                                                                        : Math.max(1, Math.round(totalKonvApprox / Math.max(1, konvBs)));
                                                                    const totalKonv = Math.max(1, konvBs) * Math.max(1, konvSk);

                                                                    // Simpan faktor konversi (set nilai_konversi_bs dahulu agar dipakai saat set nilai_konversi)
                                                                    updateModalData('nilai_konversi_bs', konvBs);
                                                                    updateModalData('nilai_konversi', totalKonv);

                                                                    // Set nilai satuan di semua level bila tersedia / dapat diturunkan
                                                                    const nilaiSedangFinal = nilaiSedang || (nilaiBesar ? nilaiBesar * Math.max(1, konvBs) : 0);
                                                                    const nilaiKecilFinal = nilaiKecil
                                                                        || (nilaiSedang ? nilaiSedang * Math.max(1, konvSk)
                                                                        : (nilaiBesar ? nilaiBesar * totalKonv : 0));

                                                                    updateModalData('nilai_satuan_besar', String(nilaiBesar || 0));
                                                                    updateModalData('nilai_satuan_sedang', String(nilaiSedangFinal || 0));
                                                                    updateModalData('nilai_satuan_kecil', String(nilaiKecilFinal || 0));

                                                                    // Set default qty pembelian (bukan dari nilai_satuan_*). Default ke 1 jika kosong.
                                                                    if (!modalData.qty || modalData.qty === '0') {
                                                                        updateModalData('qty', '1');
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih dari Daftar Obat">
                                                                        {obatOptions.find(opt => opt.kode === modalData.kode_obat_alkes)?.nama_dagang || obatOptions.find(opt => opt.kode === modalData.kode_obat_alkes)?.nama || ''}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <div className="p-2">
                                                                        <div className="relative">
                                                                            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                                            <Input
                                                                                placeholder="Cari obat/alkes berdasarkan kode atau nama..."
                                                                                value={searchObat}
                                                                                onChange={(e) => setSearchObat(e.target.value)}
                                                                                className="mb-2 pl-8"
                                                                            />
                                                                        </div>
                                                                        {searchObat && (
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Ditemukan {filteredDabar.length} obat/alkes
                                                                                </p>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => setSearchObat('')}
                                                                                    className="h-6 px-2 text-xs"
                                                                                >
                                                                                    Reset
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {filteredDabar.length > 0 ? (
                                                                        filteredDabar.map((barang) => (
                                                                            <SelectItem key={barang.id} value={barang.kode}>
                                                                                <div className="flex flex-col">
                                                                                    <div className="font-medium" title={barang.nama}>{barang.nama.length > 40 ? `${barang.nama.substring(0, 40)}...` : barang.nama}</div>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        <div className="p-2 text-center text-muted-foreground">
                                                                            {searchObat
                                                                                ? 'Tidak ada obat/alkes ditemukan'
                                                                                : 'Tidak ada data obat/alkes'}
                                                                        </div>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                Total: {obatOptions.length} obat/alkes
                                                                {searchObat && (
                                                                    <span className="ml-1">
                                                                        (Ditemukan {filteredDabar.length} obat/alkes)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Kode Obat/Alkes</Label>
                                                            <Input
                                                                type="text"
                                                                value={modalData.kode_obat_alkes}
                                                                onChange={(e) => updateModalData('kode_obat_alkes', e.target.value)}
                                                                placeholder="Masukkan kode obat"
                                                            />
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
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Jenis Kemasan</Label>
                                                            <div className="flex items-center space-x-4 justify-center">
                                                                <span className={modalData.kemasan_besar ? 'text-gray-500' : 'font-medium'}>Kemasan Kecil</span>
                                                                <Switch
                                                                    checked={modalData.kemasan_besar}
                                                                    onCheckedChange={(checked) => updateModalData('kemasan_besar', checked)}
                                                                />
                                                                <span className={modalData.kemasan_besar ? 'font-medium' : 'text-gray-500'}>Kemasan Besar</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Qty Pembelian ({modalData.kemasan_besar ? 'Kemasan Besar' : 'Kemasan Kecil'})</Label>
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
                                                    </div>

                                                    {/* Baris 3: Diskon dan Batch */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        <div className="space-y-2 ">
                                                            <Label>Jenis Diskon</Label>
                                                            <div className="flex items-center space-x-4 justify-center">
                                                                <span className={modalData.diskon_persen ? 'text-gray-500' : 'font-medium'}>Rupiah (Rp)</span>
                                                                <Switch
                                                                    checked={modalData.diskon_persen}
                                                                    onCheckedChange={(checked) => updateModalData('diskon_persen', checked)}
                                                                />
                                                                <span className={modalData.diskon_persen ? 'font-medium' : 'text-gray-500'}>Persen (%)</span>
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
                                                            <Label>Qty Aktual (Satuan Kecil)</Label>
                                                            <Input
                                                                type="number"
                                                                value={modalData.qty_aktual || '0'}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Sub Total</Label>
                                                            <Input type="number" value={modalData.sub_total} readOnly />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Modal UI untuk Inventaris
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <Label>Barang Inventaris</Label>
                                                        <Select
                                                            value={modalData.kode_obat_alkes}
                                                            onOpenChange={(open) => {
                                                                if (open && inventarisOptions.length === 0) fetchDaftarInventaris();
                                                            }}
                                                            onValueChange={(value) => {
                                                                const item = inventarisOptions.find((i) => (i.kode_barang || String(i.id)) === value);
                                                                const kodeValue = value || '';
                                                                updateModalData('kode_obat_alkes', kodeValue);
                                                                updateModalData('nama_obat_alkes', item?.nama_barang || '');
                                                                // Set default qty to 1 for inventaris
                                                                updateModalData('qty', '1');
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih barang dari Daftar Inventaris" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                        <Search className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                    <Input
                                                                        placeholder="Cari barang..."
                                                                        className="pl-10 pr-10 py-2 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 border-x-0 border-t-0"
                                                                        value={searchInventaris}
                                                                        onChange={(e) => setSearchInventaris(e.target.value)}
                                                                    />
                                                                    {searchInventaris && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="absolute inset-y-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                setSearchInventaris('');
                                                                            }}
                                                                        >
                                                                            <RefreshCw className="h-4 w-4 text-gray-400" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <div className="px-2 py-1 text-xs text-muted-foreground border-b">
                                                                    Menampilkan {filteredInventaris.length} dari {inventarisOptions?.length || 0} barang
                                                                </div>
                                                                {filteredInventaris.length > 0 ? (
                                                                    filteredInventaris.map((opt) => {
                                                                        const displayText = (opt.kode_barang ? opt.kode_barang + ' - ' : '') + opt.nama_barang;
                                                                        const isTruncated = displayText.length > 50;
                                                                        const truncatedText = isTruncated ? displayText.substring(0, 50) + '...' : displayText;
                                                                        return (
                                                                            <SelectItem 
                                                                                key={opt.id} 
                                                                                value={opt.kode_barang || String(opt.id)}
                                                                                title={isTruncated ? displayText : undefined}
                                                                            >
                                                                                {truncatedText}
                                                                            </SelectItem>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                                                        {searchInventaris ? 'Tidak ada barang yang cocok' : 'Tidak ada data barang'}
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Qty Pembelian (pcs)</Label>
                                                        <Input
                                                            type="number"
                                                            value={modalData.qty}
                                                            onChange={(e) => updateModalData('qty', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Harga Pembelian (Rp)</Label>
                                                        <Input
                                                            type="number"
                                                            value={modalData.harga_satuan}
                                                            onChange={(e) => updateModalData('harga_satuan', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Lokasi Barang</Label>
                                                        <Input
                                                            value={modalData.lokasi || ''}
                                                            onChange={(e) => updateModalData('lokasi', e.target.value)}
                                                            placeholder="Contoh: Gudang A / Ruang 101"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Kondisi Barang</Label>
                                                        <Select
                                                            value={modalData.kondisi || 'Baik'}
                                                            onValueChange={(value) => updateModalData('kondisi', value as any)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih kondisi" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Baik">Baik</SelectItem>
                                                                <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                                                                <SelectItem value="Rusak Sedang">Rusak Sedang</SelectItem>
                                                                <SelectItem value="Rusak Berat">Rusak Berat</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Tanggal Akhir Penggunaan</Label>
                                                        <Input
                                                            type="date"
                                                            value={modalData.exp}
                                                            onChange={(e) => updateModalData('exp', e.target.value)}
                                                        />
                                                        <p className="text-xs text-muted-foreground">Default 5 tahun dari hari ini</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Tanggal Pembelian</Label>
                                                        <Input
                                                            type="date"
                                                            value={modalData.tanggal_pembelian || pembelianData.tgl_pembelian}
                                                            onChange={(e) => updateModalData('tanggal_pembelian', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Deskripsi Barang</Label>
                                                        <Textarea
                                                            value={modalData.deskripsi_barang || ''}
                                                            onChange={(e) => updateModalData('deskripsi_barang', e.target.value)}
                                                            placeholder="Deskripsi atau catatan barang"
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

                                <Separator />
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
                                {/* Summary */}
                                {pembelianDetails.length > 0 && (
                                    <>
                                        <Card>
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

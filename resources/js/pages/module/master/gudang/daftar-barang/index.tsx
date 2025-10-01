'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner'; // ✅ pakai sonner

interface DaftarBarang {
    id: number;
    nama: string;
    jenis_barang: 'farmasi' | 'alkes' | 'inventaris';
    kode?: string;
    kfa_kode?: string;
    jenis_formularium?: string;
    nama_dagang?: string;
    merek?: string;
    nama_industri?: string;
    jenis_generik?: string;
    jenis_obat?: string;
    satuan_kecil?: string;
    nilai_satuan_kecil?: number;
    satuan_sedang?: string;
    nilai_satuan_sedang?: number;
    satuan_besar?: string;
    nilai_satuan_besar?: number;
    penyimpanan?: string;
    barcode?: string;
    gudang_kategori?: number;
    bentuk_obat?: string;
    deskripsi?: string;
    jenis_inventaris?: string;
    satuan?: string;
    // BHP (Barang Habis Pakai) - 1 = Ya, 0 = Tidak
    bhp?: boolean;
    stok_minimal?: number | null;
}

interface PageProps {
    daftarBarang: DaftarBarang[];
    satuanBarangs: Array<{ id: number; nama: string }>;
    kategoriBarangs: Array<{ id: number; nama: string }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Gudang', href: '' },
    { title: 'Daftar Barang', href: '' },
];

export default function Index() {
    const { daftarBarang = [], satuanBarangs = [], kategoriBarangs = [], flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        // Handle validation errors
        if (errors) {
            Object.keys(errors).forEach((key) => {
                if (errors[key]) {
                    toast.error(`${key}: ${errors[key]}`);
                }
            });
        }
    }, [flash, errors]);

    // State modal Tambah/Edit
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [nama, setNama] = useState('');
    const [kfaType, setKfaType] = useState<'farmasi' | 'alkes' | 'inventaris' | ''>('');

    const isInventaris = kfaType === 'inventaris';
    const [namaDagang, setNamaDagang] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    // Stepper
    const [step, setStep] = useState<number>(1);
    const steps = [
        { id: 1, label: 'Data Dasar' },
        { id: 2, label: 'Satuan' },
        { id: 3, label: 'Info Gudang' },
    ];
    const inventarisSteps = [
        { id: 1, label: 'Data Inventaris' },
        { id: 2, label: 'Info Gudang' },
    ];
    // Step 1
    const [kfaKode, setKfaKode] = useState('');
    const [jenisFormularium, setJenisFormularium] = useState('');
    const [namaIndustri, setNamaIndustri] = useState('');
    const [jenisGenerik, setJenisGenerik] = useState('');
    const [tingkatPenggunaan, setTingkatPenggunaan] = useState('');
    const [merek, setMerek] = useState('');
    const [jenisBarang, setJenisBarang] = useState('');
    // Step 2
    const [satuanKecil, setSatuanKecil] = useState('');
    const [nilaiSatuanKecil, setNilaiSatuanKecil] = useState<number | ''>('');
    const [satuanSedang, setSatuanSedang] = useState('');
    const [nilaiSatuanSedang, setNilaiSatuanSedang] = useState<number | ''>('');
    const [satuanBesar, setSatuanBesar] = useState('');
    const [nilaiSatuanBesar, setNilaiSatuanBesar] = useState<number | ''>('');
    const [bhp, setBhp] = useState(false);
    const [aktifSatuanBesar, setAktifSatuanBesar] = useState(true);
    const [aktifSatuanSedang, setAktifSatuanSedang] = useState(true);
    const [aktifSatuanKecil, setAktifSatuanKecil] = useState(true);
    const [stokMinimal, setStokMinimal] = useState<number | ''>('');
    // Step 3
    const [penyimpanan, setPenyimpanan] = useState('');
    const [barcode, setBarcode] = useState('');
    const [gudangKategori, setGudangKategori] = useState<number | ''>('');
    const [bentukobat, setBentukObat] = useState('');
    // KFA lookup
    const [isLoadingKfa, setIsLoadingKfa] = useState(false);
    const [kfaOptions, setKfaOptions] = useState<Array<{ name: string; kfa_code: string; manufacturer: string }>>([]);
    const [showKfaList, setShowKfaList] = useState(false);

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Modal Sinkron
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [clearSyncModalOpen, setClearSyncModalOpen] = useState(false);

    // Sync Status
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [isLoadingSync, setIsLoadingSync] = useState(false);

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredDaftarBarang = daftarBarang.filter((a) => a.nama.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that jenis is selected
        if (!kfaType) {
            toast.error('Pilih jenis barang terlebih dahulu');
            return;
        }

        const baseData = {
            nama,
            jenis_barang: kfaType,
            gudang_kategori: gudangKategori === '' ? null : Number(gudangKategori),
            penyimpanan,
            stok_minimal: stokMinimal === '' ? null : Number(stokMinimal),
        };

        // Normalize satuan values based on active checkboxes
        const normalizedSatuanKecil = aktifSatuanKecil ? satuanKecil || null : null;
        const normalizedNilaiSatuanKecil = aktifSatuanKecil ? (nilaiSatuanKecil === '' ? null : Number(nilaiSatuanKecil)) : null;
        const normalizedSatuanSedang = aktifSatuanSedang ? satuanSedang || null : null;
        const normalizedNilaiSatuanSedang = aktifSatuanSedang ? (nilaiSatuanSedang === '' ? null : Number(nilaiSatuanSedang)) : null;
        const normalizedSatuanBesar = aktifSatuanBesar ? satuanBesar || null : null;
        const normalizedNilaiSatuanBesar = aktifSatuanBesar ? (nilaiSatuanBesar === '' ? null : Number(nilaiSatuanBesar)) : null;

        const data = isInventaris
            ? {
                  ...baseData,
                  deskripsi,
                  jenis_inventaris: jenisBarang,
                  satuan: satuanKecil,
                  bentuk_obat: bentukobat,
              }
            : {
                  ...baseData,
                  kfa_kode: kfaKode,
                  jenis_formularium: jenisFormularium,
                  nama_dagang: namaDagang,
                  nama_industri: namaIndustri,
                  jenis_generik: jenisGenerik,
                  jenis_obat: tingkatPenggunaan,
                  merek,
                  satuan_kecil: normalizedSatuanKecil,
                  nilai_satuan_kecil: normalizedNilaiSatuanKecil,
                  satuan_sedang: normalizedSatuanSedang,
                  nilai_satuan_sedang: normalizedNilaiSatuanSedang,
                  satuan_besar: normalizedSatuanBesar,
                  nilai_satuan_besar: normalizedNilaiSatuanBesar,
                  barcode,
                  bentuk_obat: bentukobat,
                  bhp: !!bhp,
              };

        if (editId) {
            router.put(`/datamaster/gudang/daftar-barang/${editId}`, data, {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setNama('');
                    setEditId(null);
                    setStep(1);
                    resetForm();
                },
            });
        } else {
            router.post('/datamaster/gudang/daftar-barang', data, {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setNama('');
                    setEditId(null);
                    setStep(1);
                    resetForm();
                },
                onError: () => {
                    // modal tetap terbuka
                },
            });
        }
    };

    const handleOpenEdit = (barang: DaftarBarang) => {
        setEditId(barang.id);
        setNama(barang.nama);
        setKfaType(barang.jenis_barang || '');

        if (barang.jenis_barang === 'inventaris') {
            setDeskripsi(barang.deskripsi ?? '');
            setJenisBarang(barang.jenis_inventaris ?? '');
            setSatuanKecil(barang.satuan ?? '');
        } else {
            setNamaDagang(barang.nama_dagang ?? barang.merek ?? '');
            setKfaKode(barang.kfa_kode ?? '');
            setJenisFormularium(barang.jenis_formularium ?? '');
            setNamaIndustri(barang.nama_industri ?? '');
            setJenisGenerik(barang.jenis_generik ?? '');
            setTingkatPenggunaan(barang.jenis_obat ?? '');
            setMerek(barang.merek ?? barang.nama_dagang ?? '');
            setJenisBarang(barang.jenis_barang ?? '');
            setSatuanKecil(barang.satuan_kecil ?? '');
            setNilaiSatuanKecil(barang.nilai_satuan_kecil ?? '');
            setSatuanSedang(barang.satuan_sedang ?? '');
            setNilaiSatuanSedang(barang.nilai_satuan_sedang ?? '');
            setSatuanBesar(barang.satuan_besar ?? '');
            setNilaiSatuanBesar(barang.nilai_satuan_besar ?? '');
            setBarcode(barang.barcode ?? '');
            setBentukObat(barang.bentuk_obat ?? '');
        }

        setPenyimpanan(barang.penyimpanan ?? '');
        setGudangKategori(barang.gudang_kategori ?? '');
        setStokMinimal(barang.stok_minimal ?? '');
        // Initialize BHP state
        setBhp(!!barang.bhp);
        // Initialize active toggles based on whether values exist
        setAktifSatuanKecil(!!(barang.satuan_kecil || barang.nilai_satuan_kecil));
        setAktifSatuanSedang(!!(barang.satuan_sedang || barang.nilai_satuan_sedang));
        setAktifSatuanBesar(!!(barang.satuan_besar || barang.nilai_satuan_besar));
        setStep(1);
        setOpen(true);
    };

    const handleOpenDelete = (barang: DaftarBarang) => {
        setDeleteId(barang.id);
        setDeleteNama(barang.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/datamaster/gudang/daftar-barang/${deleteId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteOpen(false);
                    setDeleteId(null);
                    setDeleteNama('');
                },
            });
        }
    };

    const resetForm = () => {
        setKfaType('');
        setNama('');
        setNamaDagang('');
        setDeskripsi('');
        setKfaKode('');
        setJenisFormularium('');
        setNamaIndustri('');
        setJenisGenerik('');
        setTingkatPenggunaan('');
        setMerek('');
        setJenisBarang('');
        setSatuanKecil('');
        setNilaiSatuanKecil('');
        setSatuanSedang('');
        setNilaiSatuanSedang('');
        setSatuanBesar('');
        setNilaiSatuanBesar('');
        setPenyimpanan('');
        setBarcode('');
        setGudangKategori('');
        setBentukObat('');
        setKfaOptions([]);
        setShowKfaList(false);
        setBhp(false);
        setStokMinimal('');
        setAktifSatuanBesar(true);
        setAktifSatuanSedang(true);
        setAktifSatuanKecil(true);
    };

    const handleSearchKfa = async () => {
        const q = (nama || '').trim();
        if (!q) return;
        if (!kfaType) {
            toast.error('Pilih jenis barang terlebih dahulu');
            return;
        }
        if (kfaType !== 'farmasi' && kfaType !== 'alkes') {
            toast.error('Pencarian KFA hanya untuk farmasi atau alkes');
            return;
        }
        try {
            setIsLoadingKfa(true);
            const typeParam = kfaType === 'farmasi' ? 'farmasi' : 'alkes';
            const res = await fetch(`/api/get_kfa_obat/${encodeURIComponent(typeParam)}/${encodeURIComponent(q)}`);
            const json = await res.json();
            const rawRoot = json?.data ?? json?.items ?? json?.result ?? json?.obat ?? json?.alkes ?? (Array.isArray(json) ? json : []);
            const rawArray = Array.isArray(rawRoot)
                ? rawRoot
                : rawRoot && typeof rawRoot === 'object'
                  ? Object.values(rawRoot as Record<string, any>)
                  : [];
            const items = rawArray
                .map((it: any) => ({
                    name: it?.name ?? it?.nama ?? '',
                    name_dagang: it?.name_dagang ?? it?.nama_dagang ?? '',
                    kfa_code: it?.kfa_code ?? it?.kode ?? '',
                    manufacturer: it?.manufacturer ?? it?.pabrikan ?? it?.manufacture ?? '',
                }))
                .filter((it: any) => it.name);
            setKfaOptions(items as Array<{ name: string; name_dagang?: string; kfa_code: string; manufacturer: string }>);
            if (items.length === 0) {
                toast.warning('Data KFA tidak ditemukan');
                setShowKfaList(false);
            } else {
                setShowKfaList(true);
            }
        } catch (e) {
            setKfaOptions([]);
            setShowKfaList(false);
        } finally {
            setIsLoadingKfa(false);
        }
    };

    const selectKfa = (item: { name: string; name_dagang?: string; kfa_code: string; manufacturer: string }) => {
        setNama(item.name || '');
        setNamaDagang(item.name_dagang || '');
        setMerek(item.name_dagang || '');
        setKfaKode(item.kfa_code || '');
        setNamaIndustri(item.manufacturer || '');
        setShowKfaList(false);
    };

    // Sync Functions
    const fetchSyncStatus = async () => {
        try {
            setIsLoadingSync(true);
            const response = await fetch('/api/daftar-barang-sync/status');
            const data = await response.json();
            if (data.success) {
                setSyncStatus(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch sync status:', error);
        } finally {
            setIsLoadingSync(false);
        }
    };

    const applySync = async () => {
        try {
            setIsLoadingSync(true);
            const response = await fetch('/api/daftar-barang-sync/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
                fetchSyncStatus(); // Refresh status
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to apply sync');
        } finally {
            setIsLoadingSync(false);
        }
    };

    const syncAllToRedis = async () => {
        try {
            setIsLoadingSync(true);
            const response = await fetch('/api/daftar-barang-sync/sync-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
                fetchSyncStatus(); // Refresh status
                setSyncModalOpen(false); // Close modal
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Gagal sinkronisasi data ke Redis');
        } finally {
            setIsLoadingSync(false);
        }
    };

    const clearSync = async () => {
        try {
            setIsLoadingSync(true);
            const response = await fetch('/api/daftar-barang-sync/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
                fetchSyncStatus(); // Refresh status
                setClearSyncModalOpen(false); // Close modal
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Gagal menghapus data sinkronisasi');
        } finally {
            setIsLoadingSync(false);
        }
    };

    // Load sync status on component mount
    useEffect(() => {
        fetchSyncStatus();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Daftar barang" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Daftar barang</CardTitle>
                        <div className="flex items-center gap-2">
                            {/* Sync Status & Button */}
                            {syncStatus && (
                                <div className="mr-4 flex items-center gap-3">
                                    {/* Sinkron Button */}
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={syncStatus.is_master ? () => setSyncModalOpen(true) : applySync}
                                        disabled={isLoadingSync}
                                        className="h-8 bg-green-600 text-white hover:bg-green-700"
                                    >
                                        {isLoadingSync ? 'Sinkronisasi...' : 'Sinkron'}
                                    </Button>

                                    {/* Clear Button for Master */}
                                    {syncStatus.is_master && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setClearSyncModalOpen(true)}
                                            disabled={isLoadingSync}
                                            className="h-8 border-red-600 text-red-600 hover:bg-red-50"
                                        >
                                            Clear
                                        </Button>
                                    )}

                                    {/* Additional Info */}
                                    <div className="text-xs text-gray-500">
                                        {syncStatus.records_count} records, {syncStatus.actions_count} actions
                                        {syncStatus.validation && !syncStatus.validation.valid && (
                                            <div className="mt-1 text-red-500">⚠️ {syncStatus.validation.message}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Cari obat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 pl-8" />
                            </div>
                            <Button
                                onClick={() => {
                                    setEditId(null);
                                    setNama('');
                                    setOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <TooltipProvider>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">#</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Nama Dagang/Deskripsi</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Satuan</TableHead>
                                        <TableHead className="w-40 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDaftarBarang.length > 0 ? (
                                        filteredDaftarBarang.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="max-w-[200px] cursor-help truncate">{item.nama}</div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{item.nama}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="max-w-[200px] cursor-help truncate">
                                                                {item.jenis_barang === 'inventaris'
                                                                    ? item.deskripsi || '-'
                                                                    : item.nama_dagang || item.merek || '-'}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                {item.jenis_barang === 'inventaris'
                                                                    ? item.deskripsi || '-'
                                                                    : item.nama_dagang || item.merek || '-'}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            item.jenis_barang === 'farmasi'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                                : item.jenis_barang === 'alkes'
                                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {item.jenis_barang === 'farmasi'
                                                            ? 'Obat'
                                                            : item.jenis_barang === 'alkes'
                                                              ? 'Alkes'
                                                              : item.jenis_barang === 'inventaris'
                                                                ? 'Inventaris'
                                                                : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="max-w-[150px] cursor-help truncate">
                                                                {kategoriBarangs.find((k) => k.id === item.gudang_kategori)?.nama || '-'}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{kategoriBarangs.find((k) => k.id === item.gudang_kategori)?.nama || '-'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                <div className="max-w-[180px] cursor-help truncate">
                                                    {item.jenis_barang === 'inventaris'
                                                        ? (item.satuan || '-')
                                                        : (item.satuan_kecil || item.satuan_sedang || item.satuan_besar || '-')}
                                                    {item.bhp ? (
                                                        <span className="ml-2 text-xs text-green-600 font-medium">• BHP</span>
                                                    ) : null}
                                                </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                {item.jenis_barang === 'inventaris'
                                                                    ? (item.satuan || '-')
                                                                    : (item.satuan_kecil || item.satuan_sedang || item.satuan_besar || '-')}
                                                                {item.bhp ? (
                                                                    <span className="ml-2 text-xs text-green-600 font-medium">• BHP</span>
                                                                ) : null}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleOpenDelete(item)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-8 text-center">
                                                <div className="text-gray-500 dark:text-gray-400">Tidak ada data obat/alkes/inventaris.</div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah/Edit */}
            <Dialog
                open={open}
                onOpenChange={(v) => {
                    setOpen(v);
                    if (!v) {
                        setStep(1);
                    }
                }}
            >
                <DialogContent
                    className="flex max-h-[90vh] w-[95vw] !max-w-5xl flex-col rounded-lg md:w-[85vw] lg:w-[75vw]"
                    aria-describedby={undefined}
                >
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Edit Obat' : 'Tambah Obat'}</DialogTitle>
                    </DialogHeader>
                    {/* Stepper */}
                    <div className="overflow-x-auto px-2 py-1">
                        <div className="flex items-center justify-center">
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                {(kfaType === 'inventaris' ? inventarisSteps : steps).map((s, idx, arr) => (
                                    <div key={s.id} className="flex items-center">
                                        <div
                                            className={`flex items-center transition-colors ${
                                                step >= s.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                                                    step >= s.id
                                                        ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                                                        : 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                                                }`}
                                            >
                                                {s.id}
                                            </div>
                                            <span className="ml-2 text-sm font-medium">{s.label}</span>
                                        </div>
                                        {idx < arr.length - 1 && (
                                            <div
                                                className={`mx-3 h-0.5 w-12 transition-colors ${
                                                    step > s.id ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <form id="obatForm" onSubmit={handleSubmit} className="space-y-4">
                        {kfaType === 'inventaris' ? (
                            <>
                                {step === 1 && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={kfaType || ''}
                                                    onValueChange={(v) => setKfaType(v as 'farmasi' | 'alkes' | 'inventaris')}
                                                >
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue placeholder="Jenis" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="farmasi">Obat</SelectItem>
                                                        <SelectItem value="alkes">Alkes</SelectItem>
                                                        <SelectItem value="inventaris">Inventaris</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input placeholder="Nama Barang" value={nama} onChange={(e) => setNama(e.target.value)} required />
                                            </div>
                                        </div>
                                        <Textarea placeholder="Deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
                                        <div>
                                            <Select value={jenisBarang} onValueChange={setJenisBarang}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Jenis Inventaris" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Elektronik">Elektronik</SelectItem>
                                                    <SelectItem value="Non-Elektronik">Non-Elektronik</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                                {step === 2 && (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Select
                                            value={gudangKategori !== '' ? String(gudangKategori) : ''}
                                            onValueChange={(v) => setGudangKategori(v ? Number(v) : '')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kategoriBarangs.map((k) => (
                                                    <SelectItem key={k.id} value={String(k.id)}>
                                                        {k.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={satuanKecil} onValueChange={setSatuanKecil}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Satuan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {satuanBarangs.map((s) => (
                                                    <SelectItem key={s.id} value={s.nama}>
                                                        {s.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="Tempat penyimpanan"
                                            value={penyimpanan}
                                            onChange={(e) => setPenyimpanan(e.target.value)}
                                            className="md:col-span-2"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Stok Minimal"
                                            value={stokMinimal}
                                            onChange={(e) => setStokMinimal(e.target.value === '' ? '' : Number(e.target.value))}
                                            min={0}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {step === 1 && (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={kfaType || ''}
                                                        onValueChange={(v) => setKfaType(v as 'farmasi' | 'alkes' | 'inventaris')}
                                                    >
                                                        <SelectTrigger className="w-36">
                                                            <SelectValue placeholder="Jenis" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="farmasi">Obat</SelectItem>
                                                            <SelectItem value="alkes">Alkes</SelectItem>
                                                            <SelectItem value="inventaris">Inventaris</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="Nama (untuk cari)"
                                                        value={nama}
                                                        onChange={(e) => setNama(e.target.value)}
                                                        required
                                                    />
                                                    {!isInventaris && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={handleSearchKfa}
                                                            disabled={!nama || isLoadingKfa}
                                                        >
                                                            {isLoadingKfa ? 'Cari...' : 'Cari KFA'}
                                                        </Button>
                                                    )}
                                                </div>
                                                <div>
                                                    <Input
                                                        placeholder="Nama Dagang"
                                                        value={namaDagang}
                                                        onChange={(e) => setNamaDagang(e.target.value)}
                                                    />
                                                </div>
                                                {showKfaList && kfaOptions.length > 0 && !isInventaris && (
                                                    <div className="max-h-60 w-full overflow-auto rounded-md border bg-zinc-50/95 shadow backdrop-blur dark:bg-zinc-800/95">
                                                        {kfaOptions.slice(0, 1000).map((it, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-zinc-100 focus:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700 dark:active:bg-zinc-600"
                                                                onClick={() => selectKfa(it)}
                                                            >
                                                                <div className="font-medium text-zinc-800 dark:text-zinc-100">{it.name}</div>
                                                                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                                                                    KFA: {it.kfa_code} • {it.manufacturer}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!isInventaris && (
                                            <>
                                                <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-2">
                                                    <Input
                                                        placeholder="Kode KFA"
                                                        value={kfaKode}
                                                        disabled
                                                        onChange={(e) => setKfaKode(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Industri obat"
                                                        value={namaIndustri}
                                                        disabled
                                                        onChange={(e) => setNamaIndustri(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-3">
                                                    <div>
                                                        <Select value={jenisFormularium} onValueChange={setJenisFormularium}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Formularium" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Formularium">Formularium</SelectItem>
                                                                <SelectItem value="Non-Formularium">Non-Formularium</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Select value={jenisGenerik} onValueChange={setJenisGenerik}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Generik / Non-Generik" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Non-Generic">Non-Generic</SelectItem>
                                                                <SelectItem value="Generic Polos">Generic Polos</SelectItem>
                                                                <SelectItem value="Branded Generic">Branded Generic</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Select value={tingkatPenggunaan} onValueChange={setTingkatPenggunaan}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Tingkat Penggunaan" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Reguler">Reguler</SelectItem>
                                                                <SelectItem value="Khusus">Khusus</SelectItem>
                                                                <SelectItem value="Darurat">Darurat</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                {(jenisGenerik === 'Branded Generic' || jenisGenerik === 'Generic Polos') && (
                                                    <div className="md:col-span-2">
                                                        <Input
                                                            placeholder="Merek (untuk generic/branded)"
                                                            value={merek}
                                                            onChange={(e) => setMerek(e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {step === 2 && !isInventaris && (
                                    <div className="space-y-6">
                                        {/* Toggle BHP (Barang Habis Pakai) */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium">BHP (Barang Habis Pakai)</div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-muted-foreground">{bhp ? 'Ya' : 'Tidak'}</span>
                                                    <Switch checked={bhp} onCheckedChange={setBhp} />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Satuan Besar */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h6 className="text-sm font-semibold">Satuan Besar <Checkbox className="ml-2" checked={aktifSatuanBesar} onCheckedChange={(v) => setAktifSatuanBesar(!!v)} /></h6>                                                
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Nama: contoh "Dus". Jumlah isi: berapa Satuan Sedang di dalam 1 Satuan Besar.
                                            </p>
                                            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                                                <div className="text-sm text-muted-foreground">Jumlah per 1</div>
                                                <Select value={satuanBesar} onValueChange={setSatuanBesar} disabled={!aktifSatuanBesar}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nama Satuan Besar (mis. Dus)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {satuanBarangs.map((s) => (
                                                            <SelectItem key={s.id} value={s.nama}>
                                                                {s.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">adalah</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="Jumlah"
                                                        value={nilaiSatuanBesar}
                                                        onChange={(e) => setNilaiSatuanBesar(e.target.value === '' ? '' : Number(e.target.value))}
                                                        disabled={!aktifSatuanBesar}
                                                    />
                                                    <span className="text-sm text-muted-foreground">{satuanSedang || 'Satuan Sedang'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Satuan Sedang */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h6 className="text-sm font-semibold">Satuan Sedang <Checkbox className="ml-2" checked={aktifSatuanSedang} onCheckedChange={(v) => setAktifSatuanSedang(!!v)} /></h6>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Nama: contoh "Strip". Jumlah isi: berapa Satuan Kecil di dalam 1 Satuan Sedang.
                                            </p>
                                            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                                                <div className="text-sm text-muted-foreground">Jumlah per 1</div>
                                                <Select value={satuanSedang} onValueChange={setSatuanSedang} disabled={!aktifSatuanSedang}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nama Satuan Sedang (mis. Strip)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {satuanBarangs.map((s) => (
                                                            <SelectItem key={s.id} value={s.nama}>
                                                                {s.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">adalah</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="Jumlah"
                                                        value={nilaiSatuanSedang}
                                                        onChange={(e) => setNilaiSatuanSedang(e.target.value === '' ? '' : Number(e.target.value))}
                                                        disabled={!aktifSatuanSedang}
                                                    />
                                                    <span className="text-sm text-muted-foreground">{satuanKecil || 'Satuan Kecil'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Satuan Kecil */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h6 className="text-sm font-semibold">Satuan Kecil <Checkbox className="ml-2" checked={aktifSatuanKecil} onCheckedChange={(v) => setAktifSatuanKecil(!!v)} /></h6>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Nama: contoh "Tablet". Jumlah per unit biasanya 1 sebagai dasar perhitungan.
                                            </p>
                                            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                                                <div className="text-sm text-muted-foreground">Jumlah per 1</div>
                                                <Select value={satuanKecil} onValueChange={setSatuanKecil} disabled={!aktifSatuanKecil}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nama Satuan Kecil (mis. Tablet)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {satuanBarangs.map((s) => (
                                                            <SelectItem key={s.id} value={s.nama}>
                                                                {s.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">adalah</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        value={nilaiSatuanKecil}
                                                        onChange={(e) => setNilaiSatuanKecil(e.target.value === '' ? '' : Number(e.target.value))}
                                                        disabled={!aktifSatuanKecil}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && !isInventaris && (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Input
                                            placeholder="Tempat penyimpanan"
                                            value={penyimpanan}
                                            onChange={(e) => setPenyimpanan(e.target.value)}
                                        />
                                        <Input placeholder="Barcode obat" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                                        <Select
                                            value={gudangKategori !== '' ? String(gudangKategori) : ''}
                                            onValueChange={(v) => setGudangKategori(v ? Number(v) : '')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Kategori Obat" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kategoriBarangs.map((k) => (
                                                    <SelectItem key={k.id} value={String(k.id)}>
                                                        {k.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={bentukobat} onValueChange={setBentukObat}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bentuk Obat" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="padat">Padat</SelectItem>
                                                <SelectItem value="cair">Cair</SelectItem>
                                                <SelectItem value="gas">Gas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            placeholder="Stok Minimal"
                                            value={stokMinimal}
                                            onChange={(e) => setStokMinimal(e.target.value === '' ? '' : Number(e.target.value))}
                                            min={0}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : setOpen(false))}>
                            Kembali
                        </Button>
                        {step < (kfaType === 'inventaris' ? inventarisSteps : steps).length && (
                            <Button type="button" onClick={() => setStep(step + 1)}>
                                Lanjut
                            </Button>
                        )}
                        {step === (kfaType === 'inventaris' ? inventarisSteps : steps).length && (
                            <Button type="submit" form="obatForm">
                                Simpan
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>
                    <p>
                        Apakah Anda yakin ingin menghapus obat <span className="font-semibold">{deleteNama}</span>?
                    </p>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                            Batal
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Sinkron */}
            <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Sinkronisasi</DialogTitle>
                    </DialogHeader>
                    <p>
                        Apakah Anda yakin ingin sinkronisasi semua data ke Redis?
                        <br />
                        <span className="text-sm text-gray-600">
                            Tindakan ini akan mengirim semua data daftar obat ke Redis untuk sinkronisasi dengan sistem lain.
                        </span>
                    </p>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSyncModalOpen(false)} disabled={isLoadingSync}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={syncAllToRedis}
                            disabled={isLoadingSync}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {isLoadingSync ? 'Sinkronisasi...' : 'Ya, Sinkronisasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Clear Sinkron */}
            <Dialog open={clearSyncModalOpen} onOpenChange={setClearSyncModalOpen}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Data Sinkronisasi</DialogTitle>
                    </DialogHeader>
                    <p>
                        Apakah Anda yakin ingin menghapus semua data sinkronisasi Redis?
                        <br />
                        <span className="text-sm text-red-600">
                            ⚠️ Tindakan ini akan menghapus semua data sinkronisasi dan tidak dapat dibatalkan.
                        </span>
                    </p>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setClearSyncModalOpen(false)} disabled={isLoadingSync}>
                            Batal
                        </Button>
                        <Button type="button" variant="destructive" onClick={clearSync} disabled={isLoadingSync}>
                            {isLoadingSync ? 'Menghapus...' : 'Ya, Hapus Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

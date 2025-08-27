'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner'; // ✅ pakai sonner

interface DaftarObat {
    id: number;
    nama: string;
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
}

interface PageProps {
    daftarObat: DaftarObat[];
    satuanObats: Array<{ id: number; nama: string }>;
    kategoriObats: Array<{ id: number; nama: string }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Gudang', href: '' },
    { title: 'Daftar Obat', href: '' },
];

export default function Index() {
    const { daftarObat = [], satuanObats = [], kategoriObats = [], flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (errors?.nama) {
            toast.error(errors.nama);
        }
    }, [flash, errors]);

    // State modal Tambah/Edit
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [nama, setNama] = useState('');
    const [kfaType, setKfaType] = useState<'farmasi' | 'alkes'>('farmasi');
    const [namaDagang, setNamaDagang] = useState('');
    // Stepper
    const [step, setStep] = useState<number>(1);
    const steps = [
        { id: 1, label: 'Data Dasar' },
        { id: 2, label: 'Satuan' },
        { id: 3, label: 'Info Gudang' },
    ];
    // Step 1
    const [kfaKode, setKfaKode] = useState('');
    const [jenisFormularium, setJenisFormularium] = useState('');
    const [namaIndustri, setNamaIndustri] = useState('');
    const [jenisGenerik, setJenisGenerik] = useState('');
    const [merek, setMerek] = useState('');
    const [jenisObat, setJenisObat] = useState('');
    // Step 2
    const [satuanKecil, setSatuanKecil] = useState('');
    const [nilaiSatuanKecil, setNilaiSatuanKecil] = useState<number | ''>(1);
    const [satuanSedang, setSatuanSedang] = useState('');
    const [nilaiSatuanSedang, setNilaiSatuanSedang] = useState<number | ''>('');
    const [satuanBesar, setSatuanBesar] = useState('');
    const [nilaiSatuanBesar, setNilaiSatuanBesar] = useState<number | ''>('');
    // Step 3
    const [penyimpanan, setPenyimpanan] = useState('');
    const [barcode, setBarcode] = useState('');
    const [gudangKategori, setGudangKategori] = useState<number | ''>('');
    const [bentukObat, setBentukObat] = useState('');
    // KFA lookup
    const [isLoadingKfa, setIsLoadingKfa] = useState(false);
    const [kfaOptions, setKfaOptions] = useState<Array<{ name: string; kfa_code: string; manufacturer: string }>>([]);
    const [showKfaList, setShowKfaList] = useState(false);

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredDaftarObat = daftarObat.filter((a) => a.nama.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/gudang/daftar-obat/${editId}`,
                {
                    nama,
                    kfa_kode: kfaKode,
                    jenis_formularium: jenisFormularium,
                    nama_dagang: namaDagang,
                    nama_industri: namaIndustri,
                    jenis_generik: jenisGenerik,
                    jenis_obat: jenisObat,
                    merek,
                    satuan_kecil: satuanKecil,
                    nilai_satuan_kecil: 1,
                    satuan_sedang: satuanSedang,
                    nilai_satuan_sedang: nilaiSatuanSedang === '' ? null : Number(nilaiSatuanSedang),
                    satuan_besar: satuanBesar,
                    nilai_satuan_besar: nilaiSatuanBesar === '' ? null : Number(nilaiSatuanBesar),
                    penyimpanan,
                    barcode,
                    gudang_kategori: gudangKategori === '' ? null : Number(gudangKategori),
                    bentuk_obat: bentukObat,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setEditId(null);
                        setStep(1);
                        resetForm();
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/gudang/daftar-obat',
                {
                    nama,
                    kfa_kode: kfaKode,
                    jenis_formularium: jenisFormularium,
                    nama_dagang: namaDagang,
                    nama_industri: namaIndustri,
                    jenis_generik: jenisGenerik,
                    jenis_obat: jenisObat,
                    merek,
                    satuan_kecil: satuanKecil,
                    nilai_satuan_kecil: 1,
                    satuan_sedang: satuanSedang,
                    nilai_satuan_sedang: nilaiSatuanSedang === '' ? null : Number(nilaiSatuanSedang),
                    satuan_besar: satuanBesar,
                    nilai_satuan_besar: nilaiSatuanBesar === '' ? null : Number(nilaiSatuanBesar),
                    penyimpanan,
                    barcode,
                    gudang_kategori: gudangKategori === '' ? null : Number(gudangKategori),
                    bentuk_obat: bentukObat,
                },
                {
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
                },
            );
        }
    };

    const handleOpenEdit = (obat: DaftarObat) => {
        setEditId(obat.id);
        setNama(obat.nama);
        setNamaDagang(obat.nama_dagang ?? obat.merek ?? '');
        setKfaKode(obat.kfa_kode ?? '');
        setJenisFormularium(obat.jenis_formularium ?? '');
        setNamaIndustri(obat.nama_industri ?? '');
        setJenisGenerik(obat.jenis_generik ?? '');
        setMerek(obat.merek ?? obat.nama_dagang ?? '');
        setJenisObat(obat.jenis_obat ?? '');
        setSatuanKecil(obat.satuan_kecil ?? '');
        setNilaiSatuanKecil(obat.nilai_satuan_kecil ?? 1);
        setSatuanSedang(obat.satuan_sedang ?? '');
        setNilaiSatuanSedang(obat.nilai_satuan_sedang ?? '');
        setSatuanBesar(obat.satuan_besar ?? '');
        setNilaiSatuanBesar(obat.nilai_satuan_besar ?? '');
        setPenyimpanan(obat.penyimpanan ?? '');
        setBarcode(obat.barcode ?? '');
        setGudangKategori(obat.gudang_kategori ?? '');
        setBentukObat(obat.bentuk_obat ?? '');
        setStep(1);
        setOpen(true);
    };

    const handleOpenDelete = (obat: DaftarObat) => {
        setDeleteId(obat.id);
        setDeleteNama(obat.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/datamaster/gudang/daftar-obat/${deleteId}`, {
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
        setKfaKode('');
        setJenisFormularium('');
        setNamaIndustri('');
        setJenisGenerik('');
        setMerek('');
        setJenisObat('');
        setSatuanKecil('');
        setNilaiSatuanKecil(1);
        setSatuanSedang('');
        setNilaiSatuanSedang('');
        setSatuanBesar('');
        setNilaiSatuanBesar('');
        setPenyimpanan('');
        setBarcode('');
        setGudangKategori('');
        setBentukObat('');
        setNamaDagang('');
        setKfaOptions([]);
        setShowKfaList(false);
    };

    const handleSearchKfa = async () => {
        const q = (nama || '').trim();
        if (!q) return;
        try {
            setIsLoadingKfa(true);
            const res = await fetch(`/api/get_kfa_obat/${encodeURIComponent(kfaType)}/${encodeURIComponent(q)}`);
            const json = await res.json();
            const items = Array.isArray(json?.data) ? (json.data as Array<{ name: string; kfa_code: string; manufacturer: string }>) : [];
            setKfaOptions(items);
            if (items.length === 1) {
                selectKfa(items[0]);
                return;
            }
            setShowKfaList(true);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Daftar Obat" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Daftar Obat</CardTitle>
                        <div className="flex items-center gap-2">
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
                            <Button
                                variant="outline"
                                onClick={() => {
                                    router.post(
                                        '/datamaster/gudang/daftar-obat/sync-pull',
                                        {},
                                        {
                                            preserveScroll: true,
                                            onStart: () => toast.loading('Sinkronisasi berjalan...', { id: 'sync' }),
                                            onFinish: () => toast.dismiss('sync'),
                                            onSuccess: () => toast.success('Sinkronisasi selesai'),
                                            onError: () => toast.error('Sinkronisasi gagal'),
                                        },
                                    );
                                }}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Sinkron
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Nama Dagang</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDaftarObat.length > 0 ? (
                                    filteredDaftarObat.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell>{item.nama_dagang || '-'}</TableCell>
                                            <TableCell className="space-x-2 text-right">
                                                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleOpenDelete(item)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            Tidak ada data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
                                {steps.map((s, idx, arr) => (
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
                        {step === 1 && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Select value={kfaType} onValueChange={(v) => setKfaType(v as 'farmasi' | 'alkes')}>
                                                <SelectTrigger className="w-36">
                                                    <SelectValue placeholder="Jenis" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="farmasi">Obat</SelectItem>
                                                    <SelectItem value="alkes">Alkes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input placeholder="Nama (untuk cari)" value={nama} onChange={(e) => setNama(e.target.value)} required />
                                            <Button type="button" variant="outline" onClick={handleSearchKfa} disabled={!nama || isLoadingKfa}>
                                                {isLoadingKfa ? 'Cari...' : 'Cari KFA'}
                                            </Button>
                                        </div>
                                        <div>
                                            <Input placeholder="Nama Dagang" value={namaDagang} onChange={(e) => setNamaDagang(e.target.value)} />
                                        </div>
                                        {showKfaList && kfaOptions.length > 0 && (
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
                                <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-2">
                                    <Input placeholder="Kode KFA" value={kfaKode} disabled onChange={(e) => setKfaKode(e.target.value)} />
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
                                        <Select value={jenisObat} onValueChange={setJenisObat}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tingkat Penggunaan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Rendah">Reguler</SelectItem>
                                                <SelectItem value="Sedang">Khusus</SelectItem>
                                                <SelectItem value="Tinggi">Darurat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {(jenisGenerik === 'Branded Generic' || jenisGenerik === 'Generic Polos') && (
                                    <div className="md:col-span-2">
                                        <Input placeholder="Merek (untuk generic/branded)" value={merek} onChange={(e) => setMerek(e.target.value)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                {/* Satuan Besar */}
                                <div className="space-y-2">
                                    <h6 className="text-sm font-semibold">Satuan Besar</h6>
                                    <p className="text-xs text-muted-foreground">
                                        Nama: contoh "Dus". Jumlah isi: berapa Satuan Sedang di dalam 1 Satuan Besar.
                                    </p>
                                    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                                        <div className="text-sm text-muted-foreground">Jumlah per 1</div>
                                        <Select value={satuanBesar} onValueChange={setSatuanBesar}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Nama Satuan Besar (mis. Dus)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {satuanObats.map((s) => (
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
                                            />
                                            <span className="text-sm text-muted-foreground">{satuanSedang || 'Satuan Sedang'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Satuan Sedang */}
                                <div className="space-y-2">
                                    <h6 className="text-sm font-semibold">Satuan Sedang</h6>
                                    <p className="text-xs text-muted-foreground">
                                        Nama: contoh "Strip". Jumlah isi: berapa Satuan Kecil di dalam 1 Satuan Sedang.
                                    </p>
                                    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                                        <div className="text-sm text-muted-foreground">Jumlah per 1</div>
                                        <Select value={satuanSedang} onValueChange={setSatuanSedang}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Nama Satuan Sedang (mis. Strip)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {satuanObats.map((s) => (
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
                                            />
                                            <span className="text-sm text-muted-foreground">{satuanKecil || 'Satuan Kecil'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Satuan Kecil */}
                                <div className="space-y-2">
                                    <h6 className="text-sm font-semibold">Satuan Kecil</h6>
                                    <p className="text-xs text-muted-foreground">
                                        Nama: contoh "Tablet". Jumlah per unit biasanya 1 sebagai dasar perhitungan.
                                    </p>
                                    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                                        <div className="text-sm text-muted-foreground">Jumlah per 1</div>
                                        <Select value={satuanKecil} onValueChange={setSatuanKecil}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Nama Satuan Kecil (mis. Tablet)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {satuanObats.map((s) => (
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
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Input placeholder="Tempat penyimpanan" value={penyimpanan} onChange={(e) => setPenyimpanan(e.target.value)} />
                                <Input placeholder="Barcode obat" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                                <Select
                                    value={gudangKategori === '' ? '' : String(gudangKategori)}
                                    onValueChange={(v) => setGudangKategori(v === '' ? '' : Number(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategori Obat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kategoriObats.map((k) => (
                                            <SelectItem key={k.id} value={String(k.id)}>
                                                {k.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={bentukObat} onValueChange={setBentukObat}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Bentuk Obat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="padat">Padat</SelectItem>
                                        <SelectItem value="cair">Cair</SelectItem>
                                        <SelectItem value="gas">Gas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : setOpen(false))}>
                            Kembali
                        </Button>
                        {step < steps.length && (
                            <Button type="button" onClick={() => setStep(step + 1)}>
                                Lanjut
                            </Button>
                        )}
                        {step === steps.length && (
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
        </AppLayout>
    );
}

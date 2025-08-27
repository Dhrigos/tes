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
import { toast } from 'sonner';

interface DaftarInventaris {
    id: number;
    kode_barang?: string;
    nama_barang: string;
    kategori_barang?: string;
    satuan_barang?: string;
    jenis_barang?: string;
    masa_pakai_barang?: string;
    masa_pakai_waktu_barang?: string;
    deskripsi_barang?: string;
}

interface PageProps {
    daftarInventaris: DaftarInventaris[];
    satuanInventaris: Array<{ id: number; nama: string }>;
    kategoriInventaris: Array<{ id: number; nama: string }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Gudang', href: '' },
    { title: 'Daftar Inventaris', href: '' },
];

export default function Index() {
    const {
        daftarInventaris = [],
        satuanInventaris = [],
        kategoriInventaris = [],
        flash,
        errors,
    } = usePage().props as unknown as PageProps & { errors?: any };

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
    const [kodeBarang, setKodeBarang] = useState('');
    const [namaBarang, setNamaBarang] = useState('');
    const [kategoriBarang, setKategoriBarang] = useState('');
    const [satuanBarang, setSatuanBarang] = useState('');
    const [jenisBarang, setJenisBarang] = useState('');
    const [masaPakaiBarang, setMasaPakaiBarang] = useState('');
    const [masaPakaiWaktuBarang, setMasaPakaiWaktuBarang] = useState('');
    const [deskripsiBarang, setDeskripsiBarang] = useState('');

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredDaftarInventaris = daftarInventaris.filter((a) => (a?.nama_barang ?? '').toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/gudang/daftar-inventaris/${editId}`,
                {
                    kode: kodeBarang,
                    nama: namaBarang,
                    kategori_barang: kategoriBarang,
                    nama_dagang: namaBarang,
                    satuan_kecil: satuanBarang,
                    jenis_obat: jenisBarang,
                    penyimpanan: masaPakaiBarang,
                    barcode: masaPakaiWaktuBarang,
                    deskripsi_barang: deskripsiBarang,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        resetForm();
                        setEditId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/gudang/daftar-inventaris',
                {
                    kode: kodeBarang,
                    nama: namaBarang,
                    kategori_barang: kategoriBarang,
                    nama_dagang: namaBarang,
                    satuan_kecil: satuanBarang,
                    jenis_obat: jenisBarang,
                    penyimpanan: masaPakaiBarang,
                    barcode: masaPakaiWaktuBarang,
                    deskripsi_barang: deskripsiBarang,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        resetForm();
                        setEditId(null);
                    },
                    onError: () => {
                        // modal tetap terbuka
                        console.log(errors);
                    },
                },
            );
        }
    };

    const handleOpenEdit = (inventaris: DaftarInventaris) => {
        setEditId(inventaris.id);
        setKodeBarang(inventaris.kode_barang || '');
        setNamaBarang(inventaris.nama_barang || '');
        setKategoriBarang(inventaris.kategori_barang || '');
        setSatuanBarang(inventaris.satuan_barang || '');
        setJenisBarang(inventaris.jenis_barang || '');
        setMasaPakaiBarang(inventaris.masa_pakai_barang || '');
        setMasaPakaiWaktuBarang(inventaris.masa_pakai_waktu_barang || '');
        setDeskripsiBarang(inventaris.deskripsi_barang || '');
        setOpen(true);
    };

    const handleOpenDelete = (inventaris: DaftarInventaris) => {
        setDeleteId(inventaris.id);
        setDeleteNama(inventaris.nama_barang);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/datamaster/gudang/daftar-inventaris/${deleteId}`, {
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
        setKodeBarang('');
        setNamaBarang('');
        setKategoriBarang('');
        setSatuanBarang('');
        setJenisBarang('');
        setMasaPakaiBarang('');
        setMasaPakaiWaktuBarang('');
        setDeskripsiBarang('');
    };

    const generateKodeInventaris = async () => {
        try {
            const response = await fetch('/api/generate-kode-inventaris', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setKodeBarang(data.kode || '');
            } else {
                toast.error('Gagal generate kode inventaris');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat generate kode inventaris');
        }
    };

    const openModal = async () => {
        setEditId(null);
        resetForm();
        setOpen(true);
        // Auto generate kode saat modal terbuka
        await generateKodeInventaris();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Daftar Inventaris" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Daftar Inventaris</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari inventaris..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                            <Button onClick={openModal}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    router.post(
                                        '/datamaster/gudang/daftar-inventaris/sync-pull',
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
                                    <TableHead>Kode Barang</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDaftarInventaris.length > 0 ? (
                                    filteredDaftarInventaris.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.kode_barang || '-'}</TableCell>
                                            <TableCell>{item.nama_barang}</TableCell>
                                            <TableCell>{item.kategori_barang || '-'}</TableCell>
                                            <TableCell>{item.satuan_barang || '-'}</TableCell>
                                            <TableCell>{item.jenis_barang || '-'}</TableCell>
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
                                        <TableCell colSpan={7} className="text-center">
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
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-8xl max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Edit Inventaris' : 'Tambah Inventaris'}</DialogTitle>
                    </DialogHeader>
                    <form id="inventarisForm" onSubmit={handleSubmit} className="space-y-4">
                        {/* Baris 1: Kode, Nama, Kategori */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium">Kode Barang</label>
                                <Input
                                    placeholder={'Kode akan digenerate otomatis'}
                                    value={kodeBarang}
                                    onChange={(e) => setKodeBarang(e.target.value)}
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Nama Barang *</label>
                                <Input
                                    placeholder="Masukkan nama barang"
                                    value={namaBarang}
                                    onChange={(e) => setNamaBarang(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Kategori Barang</label>
                                <Select value={kategoriBarang} onValueChange={setKategoriBarang}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kategoriInventaris.map((kategori) => (
                                            <SelectItem key={kategori.id} value={kategori.nama}>
                                                {kategori.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Baris 2: Satuan, Jenis, Masa Pakai, Masa Pakai Waktu */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium">Satuan Barang</label>
                                <Select value={satuanBarang} onValueChange={setSatuanBarang}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {satuanInventaris.map((satuan) => (
                                            <SelectItem key={satuan.id} value={satuan.nama}>
                                                {satuan.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Jenis Barang</label>
                                <Select value={jenisBarang} onValueChange={setJenisBarang}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- Pilih Data --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Inventaris">Inventaris</SelectItem>
                                        <SelectItem value="Barang Habis Pakai">Barang Habis Pakai</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Masa Pakai Barang</label>
                                <Input
                                    type="number"
                                    placeholder="Contoh: 2"
                                    value={masaPakaiBarang}
                                    onChange={(e) => setMasaPakaiBarang(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Masa Pakai Waktu Barang</label>
                                <Select value={masaPakaiWaktuBarang} onValueChange={setMasaPakaiWaktuBarang}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- Masa Pakai --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tahun">Tahun</SelectItem>
                                        <SelectItem value="Bulan">Bulan</SelectItem>
                                        <SelectItem value="Minggu">Minggu</SelectItem>
                                        <SelectItem value="Hari">Hari</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Baris 3: Deskripsi Barang */}
                        <div>
                            <label className="text-sm font-medium">Deskripsi Barang</label>
                            <textarea
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Masukkan deskripsi barang"
                                value={deskripsiBarang}
                                onChange={(e) => setDeskripsiBarang(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" form="inventarisForm">
                            {editId ? 'Update' : 'Simpan'}
                        </Button>
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
                        Apakah Anda yakin ingin menghapus inventaris <span className="font-semibold">{deleteNama}</span>?
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

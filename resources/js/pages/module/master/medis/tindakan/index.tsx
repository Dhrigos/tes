'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Interface Tindakan sesuai Tindakan.php
interface Tindakan {
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    tarif_dokter: number;
    tarif_perawat: number;
    tarif_total: number;
}

interface PageProps {
    tindakans: Tindakan[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Medis', href: '' },
    { title: 'Tindakan', href: '' },
];

export default function Index() {
    const { tindakans, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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

    // Form fields
    const [kode, setKode] = useState('');
    const [nama, setNama] = useState('');
    const [kategori, setKategori] = useState('');
    const [tarifDokter, setTarifDokter] = useState('');
    const [tarifPerawat, setTarifPerawat] = useState('');
    const [tarifTotal, setTarifTotal] = useState('');

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredTindakans = tindakans.filter((t) =>
        t.nama.toLowerCase().includes(search.toLowerCase()) ||
        t.kode.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            kode,
            nama,
            kategori,
            tarif_dokter: tarifDokter ? Number(tarifDokter) : 0,
            tarif_perawat: tarifPerawat ? Number(tarifPerawat) : 0,
            tarif_total: tarifTotal ? Number(tarifTotal) : 0,
        };

        if (editId) {
            router.put(
                `/datamaster/medis/tindakan/${editId}`,
                payload,
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
                '/datamaster/medis/tindakan',
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        resetForm();
                        setEditId(null);
                    },
                    onError: () => {
                        // modal tetap terbuka
                    },
                },
            );
        }
    };

    const resetForm = () => {
        setKode('');
        setNama('');
        setKategori('');
        setTarifDokter('');
        setTarifPerawat('');
        setTarifTotal('');
    };

    const handleOpenEdit = (tindakan: Tindakan) => {
        setEditId(tindakan.id);
        setKode(tindakan.kode);
        setNama(tindakan.nama);
        setKategori(tindakan.kategori);
        setTarifDokter(tindakan.tarif_dokter ? tindakan.tarif_dokter.toString() : '');
        setTarifPerawat(tindakan.tarif_perawat ? tindakan.tarif_perawat.toString() : '');
        setTarifTotal(tindakan.tarif_total ? tindakan.tarif_total.toString() : '');
        setOpen(true);
    };

    const handleOpenDelete = (tindakan: Tindakan) => {
        setDeleteId(tindakan.id);
        setDeleteNama(tindakan.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/datamaster/medis/tindakan/${deleteId}`, { preserveScroll: true });
        setDeleteOpen(false);
        setDeleteId(null);
    };

    // Hitung total tarif otomatis
    useEffect(() => {
        const dokter = tarifDokter ? Number(tarifDokter) : 0;
        const perawat = tarifPerawat ? Number(tarifPerawat) : 0;
        setTarifTotal((dokter + perawat).toString());
    }, [tarifDokter, tarifPerawat]);

    // Generate kode otomatis
    const generateKode = () => {
        if (tindakans.length === 0) {
            return 'TDK-0001';
        }
        
        const lastTindakan = tindakans[tindakans.length - 1];
        if (lastTindakan && lastTindakan.kode) {
            const parts = lastTindakan.kode.split('-');
            if (parts.length === 2) {
                const lastNumber = parseInt(parts[1]);
                if (!isNaN(lastNumber)) {
                    const nextNumber = lastNumber + 1;
                    return `TDK-${nextNumber.toString().padStart(4, '0')}`;
                }
            }
        }
        return 'TDK-0001';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Tindakan" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="text-xl">Data Tindakan</CardTitle>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                                    <Input
                                        placeholder="Cari tindakan..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full sm:w-64 pl-10 pr-4"
                                    />
                                </div>
                                <Button
                                    onClick={() => {
                                        setEditId(null);
                                        resetForm();
                                        setKode(generateKode());
                                        setOpen(true);
                                    }}
                                    className="w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Tambah
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6 py-4">
                                            Kode
                                        </TableHead>
                                        <TableHead className="px-6 py-4">
                                            Nama
                                        </TableHead>
                                        <TableHead className="px-6 py-4">
                                            Kategori
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-center">
                                            Tarif Dokter
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-center">
                                            Tarif Perawat
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-center">
                                            Total Tarif
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-center">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                            <TableBody>
                                {filteredTindakans.length > 0 ? (
                                    filteredTindakans.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium px-6 py-4">{item.kode}</TableCell>
                                            <TableCell className="px-6 py-4">{item.nama}</TableCell>
                                            <TableCell className="px-6 py-4">{item.kategori}</TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="inline-block min-w-[70px]">
                                                    <span className="align-middle">Rp</span>
                                                    <span className="align-middle">{item.tarif_dokter.toLocaleString('id-ID')}</span>
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="inline-block min-w-[70px]">
                                                    <span className="align-middle">Rp</span>
                                                    <span className="align-middle">{item.tarif_perawat.toLocaleString('id-ID')}</span>
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="inline-block min-w-[70px]">
                                                    <span className="align-middle">Rp</span>
                                                    <span className="align-middle">{item.tarif_total.toLocaleString('id-ID')}</span>
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex justify-center space-x-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive" 
                                                        onClick={() => handleOpenDelete(item)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah/Edit */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl">
                            {editId ? 'Edit Tindakan' : 'Tambah Tindakan Baru'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input type="hidden" value={kode} />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Nama Tindakan</label>
                                <Input
                                    placeholder="Masukkan nama tindakan"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Kategori</label>
                                <Input
                                    placeholder="Pilih kategori"
                                    value={kategori}
                                    onChange={(e) => setKategori(e.target.value)}
                                    className="w-full"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Tarif Dokter</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Rp</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={tarifDokter}
                                        onChange={(e) => setTarifDokter(e.target.value)}
                                        min={0}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Tarif Perawat</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Rp</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={tarifPerawat}
                                        onChange={(e) => setTarifPerawat(e.target.value)}
                                        min={0}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Total Tarif</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Rp</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={tarifTotal}
                                        disabled
                                        className="pl-10 bg-muted text-muted-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" className="min-w-[100px]">
                                {editId ? 'Update' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-lg">Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">
                            Apakah Anda yakin ingin menghapus tindakan{' '}
                            <span className="font-medium">{deleteNama}</span>?
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Tindakan ini tidak dapat dibatalkan setelah dihapus.
                        </p>
                    </div>
                    <DialogFooter className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                            Batal
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete} className="min-w-[100px]">
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

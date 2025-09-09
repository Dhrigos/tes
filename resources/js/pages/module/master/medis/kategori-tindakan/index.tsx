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
import { toast } from 'sonner'; // ✅ pakai sonner

interface KategoriTindakan {
    id: number;
    nama: string;
}

interface PageProps {
    kategori_tindakan: KategoriTindakan[];
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Medis', href: '' },
    { title: 'Kategori Tindakan', href: '' },
];

export default function Index() {
    const { kategori_tindakan, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

    useEffect(() => {
        if (flash?.message) {
            toast.success(flash.message);
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

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredKategoriTindakan = kategori_tindakan.filter((a) => a.nama.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/medis/kategori-tindakan/${editId}`,
                { nama },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setEditId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/kategori-tindakan',
                { nama },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setEditId(null);
                    },
                },
            );
        }
    };

    const handleOpenEdit = (kategoriTindakan: KategoriTindakan) => {
        setEditId(kategoriTindakan.id);
        setNama(kategoriTindakan.nama);
        setOpen(true);
    };

    const handleOpenDelete = (kategoriTindakan: KategoriTindakan) => {
        setDeleteId(kategoriTindakan.id);
        setDeleteNama(kategoriTindakan.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/datamaster/medis/kategori-tindakan/${deleteId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeleteId(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Pemeriksaan & Tindakan" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Kategori Pemeriksaan & Tindakan</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari kategori tindakan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">Nama Kategori</TableHead>
                                    <TableHead className="w-40 text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredKategoriTindakan.length > 0 ? (
                                    filteredKategoriTindakan.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center">{item.nama}</TableCell>
                                            <TableCell className="space-x-2 text-center">
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
                                        <TableCell colSpan={2} className="text-center">
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Edit Kategori Tindakan' : 'Tambah Kategori Tindakan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Nama Kategori Tindakan" value={nama} onChange={(e) => setNama(e.target.value)} required />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit">{editId ? 'Perbarui' : 'Tambah'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori Tindakan</DialogTitle>
                    </DialogHeader>
                    <p>
                        Apa Anda yakin ingin menghapus data kategori tindakan <span className="font-semibold">{deleteNama}</span>?
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

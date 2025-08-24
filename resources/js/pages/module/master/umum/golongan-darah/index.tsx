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
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface GolonganDarah {
    id: number;
    nama: string;
    rhesus: string;
}

interface PageProps {
    goldars: GolonganDarah[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Umum', href: '' },
    { title: 'Golongan Darah', href: '' },
];

export default function Index() {
    const { goldars, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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

    // State untuk modal
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [nama, setNama] = useState('');
    const [rhesus, setRhesus] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    const filteredGoldars = goldars.filter((g) => `${g.nama} ${g.rhesus}`.toLowerCase().includes(search.toLowerCase()));

    const handleOpenDelete = (golonganDarah: GolonganDarah) => {
        setDeleteId(golonganDarah.id);
        setDeleteNama(golonganDarah.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/datamaster/umum/golongan-darah/${deleteId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeleteId(null);
                setDeleteNama('');
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rhesus) {
            toast.error('Pilih rhesus terlebih dahulu');
            return;
        }
        if (editId) {
            // Update
            router.put(
                `/datamaster/umum/golongan-darah/${editId}`,
                { nama, rhesus },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setRhesus('');
                        setEditId(null);
                    },
                },
            );
        } else {
            // Tambah
            router.post(
                '/datamaster/umum/golongan-darah',
                { nama, rhesus },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setRhesus('');
                    },
                },
            );
        }
    };

    const handleOpenEdit = (golonganDarah: GolonganDarah) => {
        setEditId(golonganDarah.id);
        setNama(golonganDarah.nama);
        setRhesus(golonganDarah.rhesus);
        setOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Golongan Darah" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Golongan Darah</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari golongan darah..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    setEditId(null);
                                    setNama('');
                                    setRhesus('');
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
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Rhesus</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGoldars && filteredGoldars.length > 0 ? (
                                    filteredGoldars.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell>{item.rhesus}</TableCell>
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
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Edit Golongan Darah' : 'Tambah Golongan Darah'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Nama Golongan Darah" value={nama} onChange={(e) => setNama(e.target.value)} required />
                        <Select value={rhesus} onValueChange={setRhesus} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih rhesus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="+">+</SelectItem>
                                <SelectItem value="-">-</SelectItem>
                                <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                            </SelectContent>
                        </Select>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>
                    <p>
                        Apakah Anda yakin ingin menghapus golongan darah {''}
                        <span className="font-semibold">{deleteNama}</span>?
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

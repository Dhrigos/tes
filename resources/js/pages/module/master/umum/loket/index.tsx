'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Poli {
    id: number;
    nama: string;
}

interface Loket {
    id: number;
    nama: string;
    poli_id: string;
    poli?: Poli;
}

interface PageProps {
    title: string;
    loket: Loket[];
    poli: Poli[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Umum', href: '' },
    { title: 'Loket', href: '' },
];

export default function Index() {
    const { title, loket, poli, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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
    const [poliId, setPoliId] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    const filteredLokets = loket.filter(
        (item: Loket) =>
            `${item.nama}`.toLowerCase().includes(search.toLowerCase()) || `${item.poli?.nama || ''}`.toLowerCase().includes(search.toLowerCase()),
    );

    const handleOpenDelete = (loket: Loket) => {
        setDeleteId(loket.id);
        setDeleteNama(loket.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/datamaster/umum/loket/${deleteId}`, {
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
        if (editId) {
            // Update
            router.put(
                `/datamaster/umum/loket/${editId}`,
                {
                    nama_edit: nama,
                    poli_edit: poliId,
                    loketid_edit: editId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setPoliId('');
                        setEditId(null);
                    },
                },
            );
        } else {
            // Tambah
            router.post(
                '/datamaster/umum/loket',
                {
                    nama,
                    poli_id: poliId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setPoliId('');
                    },
                },
            );
        }
    };

    const handleOpenEdit = (loket: Loket) => {
        setEditId(loket.id);
        setNama(loket.nama);
        setPoliId(loket.poli_id);
        setOpen(true);
    };

    const handleOpenAdd = () => {
        setEditId(null);
        setNama('');
        setPoliId('');
        setOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Loket" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Loket</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Cari loket..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 pl-8" />
                            </div>
                            <Button onClick={handleOpenAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead>Nama Loket</TableHead>
                                    <TableHead>Poli</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLokets && filteredLokets.length > 0 ? (
                                    filteredLokets.map((item: Loket, index: number) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell>{item.poli?.nama || '-'}</TableCell>
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
                        <DialogTitle>{editId ? 'Edit Loket' : 'Tambah Loket'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="nama">Nama Loket</Label>
                            <Input id="nama" placeholder="Nama Loket" value={nama} onChange={(e) => setNama(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="poli">Poli</Label>
                            <Select value={poliId} onValueChange={setPoliId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="--- Pilih Poli ---" />
                                </SelectTrigger>
                                <SelectContent>
                                    {poli.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                        Apakah Anda yakin ingin menghapus loket <span className="font-semibold">{deleteNama}</span>?
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

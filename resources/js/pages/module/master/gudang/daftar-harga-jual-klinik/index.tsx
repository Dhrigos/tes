'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface daftarHargaJualKliniks {
    id: number;
    nama_obat_alkes: string;
    harga_dasar: string;
    harga_jual_1: string;
    harga_jual_2: string;
    harga_jual_3: string;
    diskon: string;
    ppn: string;
}

interface PageProps {
    daftarHargaJualKliniks: daftarHargaJualKliniks[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Gudang', href: '' },
    { title: 'Daftar Harga Jual Klinik', href: '' },
];

export default function Index() {
    const { daftarHargaJualKliniks, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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
    const [hargaDasar, setHargaDasar] = useState('');
    const [hargaJual1, setHargaJual1] = useState('');
    const [hargaJual2, setHargaJual2] = useState('');
    const [hargaJual3, setHargaJual3] = useState('');
    const [diskon, setDiskon] = useState('');
    const [ppn, setPpn] = useState('');

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filtereddaftarHargaJualKliniks = daftarHargaJualKliniks.filter((a) => {
        const q = search.toLowerCase();
        return (
            a.nama_obat_alkes.toLowerCase().includes(q) ||
            a.harga_dasar.toLowerCase().includes(q) ||
            a.harga_jual_1.toLowerCase().includes(q) ||
            a.harga_jual_2.toLowerCase().includes(q) ||
            a.harga_jual_3.toLowerCase().includes(q) ||
            a.diskon.toLowerCase().includes(q) ||
            a.ppn.toLowerCase().includes(q)
        );
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/gudang/daftar-harga-jual-klinik/${editId}`,
                {
                    nama_obat_alkes: nama,
                    harga_dasar: hargaDasar,
                    harga_jual_1: hargaJual1,
                    harga_jual_2: hargaJual2,
                    harga_jual_3: hargaJual3,
                    diskon: diskon,
                    ppn: ppn,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNama('');
                        setHargaDasar('');
                        setHargaJual1('');
                        setHargaJual2('');
                        setHargaJual3('');
                        setDiskon('');
                        setPpn('');
                        setEditId(null);
                    },
                },
            );
        }
    };

    const handleOpenEdit = (daftarHargaJualKliniks: daftarHargaJualKliniks) => {
        setEditId(daftarHargaJualKliniks.id);

        setNama(daftarHargaJualKliniks.nama_obat_alkes || '');
        setHargaDasar(daftarHargaJualKliniks.harga_dasar || '');
        setHargaJual1(daftarHargaJualKliniks.harga_jual_1 || '');
        setHargaJual2(daftarHargaJualKliniks.harga_jual_2 || '');
        setHargaJual3(daftarHargaJualKliniks.harga_jual_3 || '');
        setDiskon(daftarHargaJualKliniks.diskon || '');
        setPpn(daftarHargaJualKliniks.ppn || '');
        setOpen(true);
    };

    const handleOpenDelete = (daftarHargaJualKliniks: daftarHargaJualKliniks) => {
        setDeleteId(daftarHargaJualKliniks.id);
        setDeleteNama(daftarHargaJualKliniks.nama_obat_alkes);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/datamaster/gudang/daftar-harga-jual-klinik/${deleteId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteOpen(false);
                    setDeleteId(null);
                    setDeleteNama('');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Daftar Harga Jual Klinik" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Daftar Harga Jual Klinik</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari Daftar Harga Jual Klinik..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead className="text-center">Nama Obat / Alkes</TableHead>
                                    <TableHead className="text-center">Harga Dasar</TableHead>
                                    <TableHead className="text-center">HJ Rawat Jalan</TableHead>
                                    <TableHead className="text-center">HJ Asuransi</TableHead>
                                    <TableHead className="text-center">HJ Umum</TableHead>
                                    <TableHead className="text-center">Diskon</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtereddaftarHargaJualKliniks.length > 0 ? (
                                    filtereddaftarHargaJualKliniks.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.nama_obat_alkes}</TableCell>
                                            <TableCell>{item.harga_dasar}</TableCell>
                                            <TableCell>{item.harga_jual_1}</TableCell>
                                            <TableCell>{item.harga_jual_2}</TableCell>
                                            <TableCell>{item.harga_jual_3}</TableCell>
                                            <TableCell>{item.diskon}</TableCell>
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
                                        <TableCell colSpan={8} className="text-center">
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
                        <DialogTitle>Edit Daftar Harga Jual Klinik</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Nama Obat/Alkes" value={nama} onChange={(e) => setNama(e.target.value)} required />
                        <Input placeholder="Harga Dasar" value={hargaDasar} onChange={(e) => setHargaDasar(e.target.value)} required />
                        <Input placeholder="Harga Jual 1" value={hargaJual1} onChange={(e) => setHargaJual1(e.target.value)} required />
                        <Input placeholder="Harga Jual 2" value={hargaJual2} onChange={(e) => setHargaJual2(e.target.value)} required />
                        <Input placeholder="Harga Jual 3" value={hargaJual3} onChange={(e) => setHargaJual3(e.target.value)} required />
                        <Input placeholder="Diskon (%)" value={diskon} onChange={(e) => setDiskon(e.target.value)} required />
                        <Input placeholder="PPN (%)" value={ppn} onChange={(e) => setPpn(e.target.value)} required />
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
                        Apakah Anda yakin ingin menghapus Daftar Harga Jual Klinik <span className="font-semibold">{deleteNama}</span>?
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

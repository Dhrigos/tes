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

interface RoleItem {
    id: number;
    name: string;
}
interface Posker {
    id: number;
    nama: string;
    roles?: RoleItem[];
}

interface PageProps {
    poskers: Posker[];
    roles: RoleItem[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Manajemen', href: '' },
    { title: 'Posker', href: '' },
];

export default function Index() {
    const { poskers, roles, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredPoskers = poskers.filter((a) => a.nama.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = { nama, role_ids: selectedRoleIds };

        if (editId) {
            router.put(`/datamaster/manajemen/posker/${editId}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setNama('');
                    setEditId(null);
                    setSelectedRoleIds([]);
                },
            });
        } else {
            router.post('/datamaster/manajemen/posker', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setNama('');
                    setEditId(null);
                    setSelectedRoleIds([]);
                },
                onError: () => {
                    // modal tetap terbuka
                },
            });
        }
    };

    const handleOpenEdit = (posker: Posker) => {
        setEditId(posker.id);
        setNama(posker.nama);
        setSelectedRoleIds((posker.roles || []).map((r) => r.id));
        setOpen(true);
    };

    const handleOpenDelete = (posker: Posker) => {
        setDeleteId(posker.id);
        setDeleteNama(posker.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/datamaster/manajemen/posker/${deleteId}`, { preserveScroll: true });
        setDeleteOpen(false);
        setDeleteId(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Posker" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Posisi Kerja</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari posker..."
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
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPoskers.length > 0 ? (
                                    filteredPoskers.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell>{(item.roles || []).map((r) => r.name).join(', ') || '-'}</TableCell>
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
                                        <TableCell colSpan={3} className="text-center">
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
                        <DialogTitle>{editId ? 'Edit Posisi Kerja' : 'Tambah Posisi Kerja'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Nama Posisi Kerja" value={nama} onChange={(e) => setNama(e.target.value)} required />
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Roles</div>
                            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-auto rounded border p-2">
                                {roles.map((role) => {
                                    const checked = selectedRoleIds.includes(role.id);
                                    return (
                                        <label key={role.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked;
                                                    setSelectedRoleIds((prev) =>
                                                        isChecked ? [...prev, role.id] : prev.filter((id) => id !== role.id),
                                                    );
                                                }}
                                            />
                                            <span>{role.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
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
                        Apakah Anda yakin ingin menghapus posisi kerja <span className="font-semibold">{deleteNama}</span>?
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

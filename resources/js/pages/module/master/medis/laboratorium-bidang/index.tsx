'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { ChevronDown, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';

// Layouts & Types
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// Interfaces
interface Laboratorium_Sub_Bidang {
    id: number;
    nama: string;
    id_laboratorium_bidang: number;
}

interface Laboratorium_Bidang {
    id: number;
    nama: string;
    laboratorium_sub_bidangs: Laboratorium_Sub_Bidang[];
}

interface PageProps {
    laboratorium_bidangs: Laboratorium_Bidang[];
    flash?: {
        success?: string;
        error?: string;
    };
}

// Constants
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Medis', href: '' },
    { title: 'Laboratorium Bidang', href: '' },
];

export default function Index() {
    const { laboratorium_bidangs, flash } = usePage().props as unknown as PageProps;

    // State Management
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Modal State - Bidang
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [namaBidang, setNamaBidang] = useState('');

    // Modal State - Sub Bidang
    const [subOpen, setSubOpen] = useState(false);
    const [subEditId, setSubEditId] = useState<number | null>(null);
    const [subNama, setSubNama] = useState('');
    const [selectedBidangId, setSelectedBidangId] = useState<number | null>(null);

    // Modal State - Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');
    const [deleteType, setDeleteType] = useState<'bidang' | 'subbidang'>('bidang');

    // Computed Values
    const filteredLaboratorium_bidangs = laboratorium_bidangs.filter((a) => a.nama.toLowerCase().includes(search.toLowerCase()));

    // Effects
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Event Handlers - Bidang
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/medis/laboratorium-bidang/${editId}`,
                { nama: namaBidang },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNamaBidang('');
                        setEditId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/laboratorium-bidang',
                { nama: namaBidang },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNamaBidang('');
                        setEditId(null);
                    },
                },
            );
        }
    };

    const handleOpenEdit = (laboratorium_bidang: Laboratorium_Bidang) => {
        setEditId(laboratorium_bidang.id);
        setNamaBidang(laboratorium_bidang.nama);
        setOpen(true);
    };

    // Event Handlers - Sub Bidang
    const handleSubSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBidangId) {
            toast.error('Pilih bidang terlebih dahulu');
            return;
        }

        if (subEditId) {
            router.put(
                `/datamaster/medis/laboratorium-sub-bidang/${subEditId}`,
                {
                    nama: subNama,
                    id_laboratorium_bidang: selectedBidangId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSubOpen(false);
                        setSubNama('');
                        setSubEditId(null);
                        setSelectedBidangId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/laboratorium-sub-bidang',
                {
                    nama: subNama,
                    id_laboratorium_bidang: selectedBidangId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSubOpen(false);
                        setSubNama('');
                        setSubEditId(null);
                        setSelectedBidangId(null);
                    },
                },
            );
        }
    };

    const handleOpenSubEdit = (subbidang: Laboratorium_Sub_Bidang) => {
        setSubEditId(subbidang.id);
        setSubNama(subbidang.nama);
        setSelectedBidangId(subbidang.id_laboratorium_bidang);
        setSubOpen(true);
    };

    // Event Handlers - Delete
    const handleOpenDelete = (item: Laboratorium_Bidang | Laboratorium_Sub_Bidang, type: 'bidang' | 'subbidang') => {
        setDeleteId(item.id);
        setDeleteType(type);
        if (type === 'bidang') {
            setDeleteNama((item as Laboratorium_Bidang).nama);
        } else {
            setDeleteNama((item as Laboratorium_Sub_Bidang).nama);
        }
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;

        if (deleteType === 'bidang') {
            router.delete(`/datamaster/medis/laboratorium-bidang/${deleteId}`, { preserveScroll: true });
        } else {
            router.delete(`/datamaster/medis/laboratorium-sub-bidang/${deleteId}`, { preserveScroll: true });
        }

        setDeleteOpen(false);
        setDeleteId(null);
    };

    // Event Handlers - UI
    const toggleExpanded = (bidangId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(bidangId)) {
            newExpanded.delete(bidangId);
        } else {
            newExpanded.add(bidangId);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Laboratorium Bidang" />

            <div className="p-6">
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Laboratorium Bidang</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari bidang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    setEditId(null);
                                    setNamaBidang('');
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
                                    <TableHead className="w-16 pl-8">#</TableHead>
                                    <TableHead>Nama Bidang</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredLaboratorium_bidangs.length > 0 ? (
                                    filteredLaboratorium_bidangs.map((item, index) => (
                                        <>
                                            {/* Baris Bidang Utama */}
                                            <TableRow key={item.id} className="border-border bg-muted/20 hover:bg-muted/40">
                                                <TableCell className="text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleExpanded(item.id)}
                                                            className="h-auto p-0 text-foreground hover:bg-transparent hover:text-primary"
                                                        >
                                                            {expandedRows.has(item.id) ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="font-medium text-foreground">{item.nama}</TableCell>

                                                <TableCell className="space-x-2 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="border-border text-foreground hover:bg-muted"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedBidangId(item.id);
                                                            setSubNama('');
                                                            setSubEditId(null);
                                                            setSubOpen(true);
                                                        }}
                                                        className="border-border text-foreground hover:bg-muted"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleOpenDelete(item, 'bidang')}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Label Sub-bidang */}
                                            {expandedRows.has(item.id) && (
                                                <TableRow key={`label-${item.id}`} className="bg-muted/10">
                                                    <TableCell colSpan={3} className="pl-8 text-sm font-medium text-muted-foreground">
                                                        Sub-bidang:
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Baris Sub-bidang */}
                                            {expandedRows.has(item.id) &&
                                                item.laboratorium_sub_bidangs &&
                                                item.laboratorium_sub_bidangs.length > 0 &&
                                                item.laboratorium_sub_bidangs.map((sub, subIndex) => (
                                                    <TableRow key={`sub-${sub.id}`} className="border-border bg-card hover:bg-muted/20">
                                                        <TableCell className="text-foreground">
                                                            <div className="flex items-center gap-2 pl-8">{subIndex + 1}</div>
                                                        </TableCell>

                                                        <TableCell className="text-muted-foreground">{sub.nama}</TableCell>

                                                        <TableCell className="space-x-2 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenSubEdit(sub)}
                                                                className="border-border text-foreground hover:bg-muted"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleOpenDelete(sub, 'subbidang')}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                            {/* Empty state untuk sub-bidang */}
                                            {expandedRows.has(item.id) &&
                                                (!item.laboratorium_sub_bidangs || item.laboratorium_sub_bidangs.length === 0) && (
                                                    <TableRow key={`empty-${item.id}`} className="bg-card">
                                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                            Belum ada sub-bidang
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                        </>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Tidak ada data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah/Edit Bidang */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{editId ? 'Edit Bidang Laboratorium' : 'Tambah Bidang Laboratorium'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Nama Bidang"
                            value={namaBidang}
                            onChange={(e) => setNamaBidang(e.target.value)}
                            required
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-border text-foreground hover:bg-muted"
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Tambah/Edit Sub-bidang */}
            <Dialog open={subOpen} onOpenChange={setSubOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{subEditId ? 'Edit Sub Bidang' : 'Tambah Sub Bidang'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubSubmit} className="space-y-4">
                        <Select
                            value={selectedBidangId?.toString() || ''}
                            onValueChange={(value) => setSelectedBidangId(parseInt(value))}
                            disabled={!!subEditId}
                        >
                            <SelectTrigger className="border-border bg-background text-foreground">
                                <SelectValue placeholder="Pilih Bidang" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-background">
                                {laboratorium_bidangs.map((bidang) => (
                                    <SelectItem key={bidang.id} value={bidang.id.toString()} className="text-foreground hover:bg-muted">
                                        {bidang.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Nama Sub Bidang"
                            value={subNama}
                            onChange={(e) => setSubNama(e.target.value)}
                            required
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSubOpen(false)}
                                className="border-border text-foreground hover:bg-muted"
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>

                    <p className="text-foreground">
                        Apakah Anda yakin ingin menghapus {deleteType === 'bidang' ? 'Bidang' : 'Sub Bidang'}{' '}
                        <span className="font-semibold">{deleteNama}</span>?
                        {deleteType === 'bidang' && ' Semua sub-bidang terkait juga akan dihapus.'}
                    </p>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

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
interface Htt_Subpemeriksaan {
    id: number;
    nama: string;
    id_htt_pemeriksaan: number;
}

interface Htt_Pemeriksaan {
    id: number;
    nama_pemeriksaan: string;
    htt_subpemeriksaans: Htt_Subpemeriksaan[];
}

interface PageProps {
    htt_pemeriksaans: Htt_Pemeriksaan[];
    flash?: {
        success?: string;
        error?: string;
    };
}

// Constants
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Medis', href: '' },
    { title: 'Head To Toe Pemeriksaan', href: '' },
];

export default function Index() {
    const { htt_pemeriksaans, flash } = usePage().props as unknown as PageProps;

    // State Management
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Modal State - Pemeriksaan
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [namaPemeriksaan, setNamaPemeriksaan] = useState('');

    // Modal State - Sub Pemeriksaan
    const [subOpen, setSubOpen] = useState(false);
    const [subEditId, setSubEditId] = useState<number | null>(null);
    const [subNama, setSubNama] = useState('');
    const [selectedPemeriksaanId, setSelectedPemeriksaanId] = useState<number | null>(null);

    // Modal State - Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');
    const [deleteType, setDeleteType] = useState<'pemeriksaan' | 'subpemeriksaan'>('pemeriksaan');

    // Computed Values
    const filteredHtt_pemeriksaans = htt_pemeriksaans.filter((a) => a.nama_pemeriksaan.toLowerCase().includes(search.toLowerCase()));

    // Effects
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Event Handlers - Pemeriksaan
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/medis/htt-pemeriksaan/${editId}`,
                { nama_pemeriksaan: namaPemeriksaan },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNamaPemeriksaan('');
                        setEditId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/htt-pemeriksaan',
                { nama_pemeriksaan: namaPemeriksaan },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNamaPemeriksaan('');
                        setEditId(null);
                    },
                },
            );
        }
    };

    const handleOpenEdit = (htt_pemeriksaan: Htt_Pemeriksaan) => {
        setEditId(htt_pemeriksaan.id);
        setNamaPemeriksaan(htt_pemeriksaan.nama_pemeriksaan);
        setOpen(true);
    };

    // Event Handlers - Sub Pemeriksaan
    const handleSubSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPemeriksaanId) {
            toast.error('Pilih pemeriksaan terlebih dahulu');
            return;
        }

        if (subEditId) {
            router.put(
                `/datamaster/medis/htt-subpemeriksaan/${subEditId}`,
                {
                    nama: subNama,
                    id_htt_pemeriksaan: selectedPemeriksaanId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSubOpen(false);
                        setSubNama('');
                        setSubEditId(null);
                        setSelectedPemeriksaanId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/htt-subpemeriksaan',
                {
                    nama: subNama,
                    id_htt_pemeriksaan: selectedPemeriksaanId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSubOpen(false);
                        setSubNama('');
                        setSubEditId(null);
                        setSelectedPemeriksaanId(null);
                    },
                },
            );
        }
    };

    const handleOpenSubEdit = (subpemeriksaan: Htt_Subpemeriksaan) => {
        setSubEditId(subpemeriksaan.id);
        setSubNama(subpemeriksaan.nama);
        setSelectedPemeriksaanId(subpemeriksaan.id_htt_pemeriksaan);
        setSubOpen(true);
    };

    // Event Handlers - Delete
    const handleOpenDelete = (item: Htt_Pemeriksaan | Htt_Subpemeriksaan, type: 'pemeriksaan' | 'subpemeriksaan') => {
        setDeleteId(item.id);
        setDeleteType(type);
        if (type === 'pemeriksaan') {
            setDeleteNama((item as Htt_Pemeriksaan).nama_pemeriksaan);
        } else {
            setDeleteNama((item as Htt_Subpemeriksaan).nama);
        }
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;

        if (deleteType === 'pemeriksaan') {
            router.delete(`/datamaster/medis/htt-pemeriksaan/${deleteId}`, { preserveScroll: true });
        } else {
            router.delete(`/datamaster/medis/htt-subpemeriksaan/${deleteId}`, { preserveScroll: true });
        }

        setDeleteOpen(false);
        setDeleteId(null);
    };

    // Event Handlers - UI
    const toggleExpanded = (pemeriksaanId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(pemeriksaanId)) {
            newExpanded.delete(pemeriksaanId);
        } else {
            newExpanded.add(pemeriksaanId);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data HTT Pemeriksaan" />

            <div className="p-6">
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Head To Toe Pemeriksaan</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari pemeriksaan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    setEditId(null);
                                    setNamaPemeriksaan('');
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
                                    <TableHead>Nama Pemeriksaan</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredHtt_pemeriksaans.length > 0 ? (
                                    filteredHtt_pemeriksaans.map((item, index) => (
                                        <>
                                            {/* Baris Pemeriksaan Utama */}
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

                                                <TableCell className="font-medium text-foreground">{item.nama_pemeriksaan}</TableCell>

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
                                                            setSelectedPemeriksaanId(item.id);
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
                                                        onClick={() => handleOpenDelete(item, 'pemeriksaan')}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Label Sub-pemeriksaan */}
                                            {expandedRows.has(item.id) && (
                                                <TableRow key={`label-${item.id}`} className="bg-muted/10">
                                                    <TableCell colSpan={3} className="pl-8 text-sm font-medium text-muted-foreground">
                                                        Sub-pemeriksaan:
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Baris Sub-pemeriksaan */}
                                            {expandedRows.has(item.id) &&
                                                item.htt_subpemeriksaans &&
                                                item.htt_subpemeriksaans.length > 0 &&
                                                item.htt_subpemeriksaans.map((sub, subIndex) => (
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
                                                                onClick={() => handleOpenDelete(sub, 'subpemeriksaan')}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                            {/* Empty state untuk sub-pemeriksaan */}
                                            {expandedRows.has(item.id) && (!item.htt_subpemeriksaans || item.htt_subpemeriksaans.length === 0) && (
                                                <TableRow key={`empty-${item.id}`} className="bg-card">
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                        Belum ada sub-pemeriksaan
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

            {/* Modal Tambah/Edit Pemeriksaan */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            {editId ? 'Edit Pemeriksaan Head To Toe' : 'Tambah Pemeriksaan Head To Toe'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Nama Pemeriksaan"
                            value={namaPemeriksaan}
                            onChange={(e) => setNamaPemeriksaan(e.target.value)}
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

            {/* Modal Tambah/Edit Sub-pemeriksaan */}
            <Dialog open={subOpen} onOpenChange={setSubOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{subEditId ? 'Edit Sub Pemeriksaan' : 'Tambah Sub Pemeriksaan'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubSubmit} className="space-y-4">
                        <Select
                            value={selectedPemeriksaanId?.toString() || ''}
                            onValueChange={(value) => setSelectedPemeriksaanId(parseInt(value))}
                            disabled={!!subEditId}
                        >
                            <SelectTrigger className="border-border bg-background text-foreground">
                                <SelectValue placeholder="Pilih Pemeriksaan" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-background">
                                {htt_pemeriksaans.map((pemeriksaan) => (
                                    <SelectItem key={pemeriksaan.id} value={pemeriksaan.id.toString()} className="text-foreground hover:bg-muted">
                                        {pemeriksaan.nama_pemeriksaan}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Nama Sub Pemeriksaan"
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
                        Apakah Anda yakin ingin menghapus {deleteType === 'pemeriksaan' ? 'Pemeriksaan' : 'Sub Pemeriksaan'}{' '}
                        <span className="font-semibold">{deleteNama}</span>?
                        {deleteType === 'pemeriksaan' && ' Semua sub-pemeriksaan terkait juga akan dihapus.'}
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

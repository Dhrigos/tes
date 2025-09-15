'use client';

import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { ChevronDown, ChevronRight, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

// Layouts & Types
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// Interfaces
interface Subspesialis {
    id: number;
    nama: string;
    kode: string;
    kode_rujukan: string;
    id_spesialis: number;
}

interface Spesialis {
    id: number;
    nama: string;
    kode: string;
    subspesialis: Subspesialis[];
}

interface PageProps {
    spesialis: Spesialis[];
    flash?: {
        success?: string;
        error?: string;
    };
}

// Constants
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Medis', href: '' },
    { title: 'Spesialis', href: '' },
];

export default function Index() {
    const { spesialis, flash } = usePage().props as unknown as PageProps;

    // State Management
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Modal State - Spesialis
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [namaSpesialis, setNamaSpesialis] = useState('');
    const [kodeSpesialis, setKodeSpesialis] = useState('');
    const [mode, setMode] = useState<'add' | 'edit' | 'sync'>('add');
    // Modal State - Sub Spesialis
    const [subOpen, setSubOpen] = useState(false);
    const [subEditId, setSubEditId] = useState<number | null>(null);
    const [subNama, setSubNama] = useState('');
    const [subKode, setSubKode] = useState('');
    const [subKodeRujukan, setSubKodeRujukan] = useState('');
    const [selectedSpesialisId, setSelectedSpesialisId] = useState<number | null>(null);

    // Modal State - Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');
    const [deleteType, setDeleteType] = useState<'spesialis' | 'subspesialis'>('spesialis');

    // Modal State - Sync Spesialis
    const [syncSpesialisOpen, setSyncSpesialisOpen] = useState(false);
    const [syncSpesialisLoading, setSyncSpesialisLoading] = useState(false);

    // Modal State - Sync Subspesialis
    const [syncSubspesialisOpen, setSyncSubspesialisOpen] = useState(false);
    const [syncSubspesialisLoading, setSyncSubspesialisLoading] = useState(false);
    const [syncingSubId, setSyncingSubId] = useState<string | null>(null);

    // Computed Values
    const filteredSpesialis = spesialis.filter(
        (a) => a.nama.toLowerCase().includes(search.toLowerCase()) || a.kode.toLowerCase().includes(search.toLowerCase()),
    );

    // Effects
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Event Handlers - Spesialis
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            router.put(
                `/datamaster/medis/spesialis/${editId}`,
                { nama: namaSpesialis, kode: kodeSpesialis },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNamaSpesialis('');
                        setKodeSpesialis('');
                        setEditId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/spesialis',
                { nama: namaSpesialis, kode: kodeSpesialis },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        setNamaSpesialis('');
                        setKodeSpesialis('');
                        setEditId(null);
                    },
                },
            );
        }
    };

    const handleOpenEdit = (spesialisItem: Spesialis) => {
        setEditId(spesialisItem.id);
        setNamaSpesialis(spesialisItem.nama);
        setKodeSpesialis(spesialisItem.kode);
        setOpen(true);
    };

    // Event Handlers - Sub Spesialis
    const handleSubSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSpesialisId) {
            toast.error('Pilih spesialis terlebih dahulu');
            return;
        }

        if (subEditId) {
            router.put(
                `/datamaster/medis/subspesialis/${subEditId}`,
                {
                    nama: subNama,
                    kode: subKode,
                    kode_rujukan: subKodeRujukan,
                    id_spesialis: selectedSpesialisId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSubOpen(false);
                        setSubNama('');
                        setSubKode('');
                        setSubKodeRujukan('');
                        setSubEditId(null);
                        setSelectedSpesialisId(null);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/medis/subspesialis',
                {
                    nama: subNama,
                    kode: subKode,
                    kode_rujukan: subKodeRujukan,
                    id_spesialis: selectedSpesialisId,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSubOpen(false);
                        setSubNama('');
                        setSubKode('');
                        setSubKodeRujukan('');
                        setSubEditId(null);
                        setSelectedSpesialisId(null);
                    },
                },
            );
        }
    };

    const handleOpenSubEdit = (subspesialis: Subspesialis) => {
        setSubEditId(subspesialis.id);
        setSubNama(subspesialis.nama);
        setSubKode(subspesialis.kode);
        setSubKodeRujukan(subspesialis.kode_rujukan);
        setSelectedSpesialisId(subspesialis.id_spesialis);
        setSubOpen(true);
    };

    // Event Handlers - Delete
    const handleOpenDelete = (item: Spesialis | Subspesialis, type: 'spesialis' | 'subspesialis') => {
        setDeleteId(item.id);
        setDeleteType(type);
        if (type === 'spesialis') {
            setDeleteNama((item as Spesialis).nama);
        } else {
            setDeleteNama((item as Subspesialis).nama);
        }
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;

        if (deleteType === 'spesialis') {
            router.delete(`/datamaster/medis/spesialis/${deleteId}`, { preserveScroll: true });
        } else {
            router.delete(`/datamaster/medis/subspesialis/${deleteId}`, { preserveScroll: true });
        }

        setDeleteOpen(false);
        setDeleteId(null);
    };

    // Event Handlers - Sync Spesialis
    const handleSyncSpesialis = () => {
        setSyncSpesialisLoading(true);
        router.post(
            '/datamaster/medis/spesialis/sync',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSyncSpesialisOpen(false);
                    setSyncSpesialisLoading(false);
                    toast.success('Data spesialis berhasil disinkronkan.');
                },
                onError: () => {
                    setSyncSpesialisLoading(false);
                    toast.error('Gagal sinkronisasi data spesialis.');
                },
            },
        );
    };

    // Event Handlers - Sync Subspesialis
    const handleSyncSubspesialis = (spesialisId: string) => {
        setSyncingSubId(spesialisId);

        router.post(
            '/datamaster/medis/subspesialis/sync/' + spesialisId,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSyncingSubId(null);
                    toast.success('Data subspesialis berhasil disinkronkan.');
                },
                onError: () => {
                    setSyncingSubId(null);
                    toast.error('Gagal sinkronisasi data subspesialis.');
                },
            },
        );
    };

    // Event Handlers - UI
    const toggleExpanded = (spesialisId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(spesialisId)) {
            newExpanded.delete(spesialisId);
        } else {
            newExpanded.add(spesialisId);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Spesialis" />

            <div className="p-6">
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Spesialis</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari spesialis..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    setEditId(null);
                                    setNamaSpesialis('');
                                    setKodeSpesialis('');
                                    setOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSyncSpesialisOpen(true)}
                                className="border-border text-foreground hover:bg-muted"
                                disabled={syncSpesialisLoading}
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${syncSpesialisLoading ? 'animate-spin' : ''}`} />
                                Sinkron Spesialis
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 pl-8">#</TableHead>
                                    <TableHead>Nama Spesialis</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredSpesialis.length > 0 ? (
                                    filteredSpesialis.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            {/* Baris Spesialis Utama */}
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

                                                <TableCell className="text-foreground">{item.kode}</TableCell>

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
                                                            setSelectedSpesialisId(item.id);
                                                            setSubNama('');
                                                            setSubKode('');
                                                            setSubKodeRujukan('');
                                                            setSubEditId(null);
                                                            setSubOpen(true);
                                                        }}
                                                        className="border-border text-foreground hover:bg-muted"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSyncSubspesialis(item.kode)}
                                                        className="border-border text-foreground hover:bg-muted"
                                                        disabled={syncingSubId === item.kode}
                                                        title="Sinkron Subspesialis"
                                                    >
                                                        <RefreshCw className={`h-4 w-4 ${syncingSubId === item.kode ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleOpenDelete(item, 'spesialis')}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Label Sub-spesialis */}
                                            {expandedRows.has(item.id) && (
                                                <TableRow key={`label-${item.id}`} className="bg-muted/10">
                                                    <TableCell colSpan={4} className="pl-8 text-sm font-medium text-muted-foreground">
                                                        Sub-spesialis:
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Baris Sub-spesialis */}
                                            {expandedRows.has(item.id) &&
                                                item.subspesialis &&
                                                item.subspesialis.length > 0 &&
                                                item.subspesialis.map((sub, subIndex) => (
                                                    <TableRow key={`sub-${sub.id}`} className="border-border bg-card hover:bg-muted/20">
                                                        <TableCell className="text-foreground">
                                                            <div className="flex items-center gap-2 pl-8">{subIndex + 1}</div>
                                                        </TableCell>

                                                        <TableCell className="text-muted-foreground">{sub.nama}</TableCell>

                                                        <TableCell className="text-muted-foreground">{sub.kode}</TableCell>

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
                                                                onClick={() => handleOpenDelete(sub, 'subspesialis')}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                            {/* Empty state untuk sub-spesialis */}
                                            {expandedRows.has(item.id) && (!item.subspesialis || item.subspesialis.length === 0) && (
                                                <TableRow key={`empty-${item.id}`} className="bg-card">
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                        Belum ada subspesialis
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            Tidak ada data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah/Edit Spesialis */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{editId ? 'Edit Spesialis' : 'Tambah Spesialis'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Nama Spesialis"
                            value={namaSpesialis}
                            onChange={(e) => setNamaSpesialis(e.target.value)}
                            required
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />

                        <Input
                            placeholder="Kode Spesialis"
                            value={kodeSpesialis}
                            onChange={(e) => setKodeSpesialis(e.target.value)}
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

            {/* Modal Tambah/Edit Sub-spesialis */}
            <Dialog open={subOpen} onOpenChange={setSubOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{subEditId ? 'Edit Sub Spesialis' : 'Tambah Sub Spesialis'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubSubmit} className="space-y-4">
                        <Select
                            value={selectedSpesialisId?.toString() || ''}
                            onValueChange={(value) => setSelectedSpesialisId(parseInt(value))}
                            disabled={!!subEditId}
                        >
                            <SelectTrigger className="border-border bg-background text-foreground">
                                <SelectValue placeholder="Pilih Spesialis" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-background">
                                {spesialis.map((spesialisItem) => (
                                    <SelectItem key={spesialisItem.id} value={spesialisItem.id.toString()} className="text-foreground hover:bg-muted">
                                        {spesialisItem.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Nama Sub Spesialis"
                            value={subNama}
                            onChange={(e) => setSubNama(e.target.value)}
                            required
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />

                        <Input
                            placeholder="Kode Sub Spesialis"
                            value={subKode}
                            onChange={(e) => setSubKode(e.target.value)}
                            required
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />

                        <Input
                            placeholder="Kode Rujukan"
                            value={subKodeRujukan}
                            onChange={(e) => setSubKodeRujukan(e.target.value)}
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

            {/* Modal Konfirmasi Sinkron Spesialis */}
            <Dialog open={syncSpesialisOpen} onOpenChange={setSyncSpesialisOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Konfirmasi Sinkronisasi Spesialis</DialogTitle>
                    </DialogHeader>
                    <p className="text-foreground">Apakah Anda yakin ingin melakukan sinkronisasi data spesialis dari sumber eksternal?</p>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSyncSpesialisOpen(false)}
                            className="border-border text-foreground hover:bg-muted"
                            disabled={syncSpesialisLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSyncSpesialis}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={syncSpesialisLoading}
                        >
                            {syncSpesialisLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Sinkronkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Sinkron Subspesialis */}
            <Dialog open={syncSubspesialisOpen} onOpenChange={setSyncSubspesialisOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Konfirmasi Sinkronisasi Subspesialis</DialogTitle>
                    </DialogHeader>
                    <p className="text-foreground">Apakah Anda yakin ingin melakukan sinkronisasi data subspesialis dari sumber eksternal?</p>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSyncSubspesialisOpen(false)}
                            className="border-border text-foreground hover:bg-muted"
                            disabled={syncSubspesialisLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (selectedSpesialisId) handleSyncSubspesialis(selectedSpesialisId.toString());
                            }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={syncSubspesialisLoading || !selectedSpesialisId}
                        >
                            {syncSubspesialisLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Sinkronkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>

                    <p className="text-foreground">
                        Apakah Anda yakin ingin menghapus {deleteType === 'spesialis' ? 'Spesialis' : 'Sub Spesialis'}{' '}
                        <span className="font-semibold">{deleteNama}</span>?
                        {deleteType === 'spesialis' && ' Semua subspesialis terkait juga akan dihapus.'}
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

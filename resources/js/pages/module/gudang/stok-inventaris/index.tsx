'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { Edit, Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface StokInventarisItem {
    id: number;
    kode: string;
    nama: string;
    nama_pic?: string;
    telepon_pic?: string;
    total_stok: number;
}

interface StokInventarisDetail {
    id: number;
    kode_pembelian: string;
    kode_barang: string;
    nama_barang: string;
    kategori_barang: string;
    jenis_barang: string;
    qty_barang: number;
    harga_barang: number;
    masa_akhir_penggunaan: string;
    tanggal_pembelian: string;
    detail_barang: string;
    lokasi: string;
    penanggung_jawab: string;
    kondisi: string;
    no_seri: string;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    stok_inventaris: StokInventarisItem[];
    all_stok_inventaris: StokInventarisDetail[];
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: {
        nama?: string;
    };
    [key: string]: any; // Index signature untuk memenuhi constraint Inertia
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Gudang', href: '' },
    { title: 'Stok Inventaris', href: '' },
];

export default function Index() {
    const pageProps = usePage().props as unknown as PageProps & { errors?: any };
    const { stok_inventaris, all_stok_inventaris, flash, errors } = pageProps;

    // State untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ kode: string; nama: string } | null>(null);
    const [detailData, setDetailData] = useState<StokInventarisDetail[]>([]);

    // Modal penyesuaian
    const [isAdjOpen, setIsAdjOpen] = useState(false);
    const [aktifitas, setAktifitas] = useState('');
    const [keteranganQty, setKeteranganQty] = useState('');
    const [qty, setQty] = useState<string>('');
    const [alasan, setAlasan] = useState('');

    // Logging untuk debugging
    useEffect(() => {}, [pageProps, stok_inventaris, all_stok_inventaris]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (errors) {
            Object.values(errors).forEach((error: any) => {
                toast.error(error);
            });
        }
    }, [flash, errors]);

    // State untuk pencarian
    const [search, setSearch] = useState('');

    // Filter data berdasarkan pencarian
    const filteredStokInventaris =
        stok_inventaris?.filter((item) => {
            const q = search.toLowerCase();
            return item.kode?.toLowerCase().includes(q) || item.nama?.toLowerCase().includes(q);
        }) || [];

    // Fungsi untuk membuka detail batch
    const handleOpenDetail = (kode: string, nama: string) => {
        // Pastikan all_stok_inventaris terdefinisi
        if (!all_stok_inventaris) {
            console.error('Data all_stok_inventaris tidak tersedia');
            toast.error('Data detail tidak tersedia');
            return;
        }

        // Pastikan all_stok_inventaris adalah array
        if (!Array.isArray(all_stok_inventaris)) {
            toast.error('Data detail tidak valid');
            return;
        }

        // Filter data berdasarkan kode
        const filteredItems = all_stok_inventaris.filter((item) => item.kode_barang === kode);

        // Set state untuk modal
        setSelectedItem({ kode, nama });
        setDetailData(filteredItems);
        setIsModalOpen(true);
    };

    const openAdj = (kode: string, nama: string) => {
        setSelectedItem({ kode, nama });
        setAktifitas('');
        setKeteranganQty('');
        setQty('');
        setAlasan('');
        setIsAdjOpen(true);
    };

    useEffect(() => {
        if (aktifitas === 'stok_opname') {
            setKeteranganQty('');
            setAlasan('Penyesuaian stok opname');
        }
    }, [aktifitas]);

    const submitAdj = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        const payload = {
            kode_barang: selectedItem.kode,
            aktifitas_penyesuaian: aktifitas,
            nama_barang: selectedItem.nama,
            keterangan_qty_penyesuaian: keteranganQty,
            qty_penyesuaian: qty === '' ? undefined : parseInt(qty, 10),
            alasan_penyesuaian: alasan,
        } as Record<string, unknown>;

        try {
            const res = await fetch('/gudang/stok-inventaris/penyesuaian', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success) {
                toast.success(data.message || 'Penyesuaian berhasil');
                window.location.reload();
            } else {
                toast.error(data?.message || 'Gagal menyimpan penyesuaian');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan dalam menyimpan data!');
        }
    };

    // Fungsi untuk menutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setDetailData([]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Stok Inventaris</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari inventaris..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table id="stoktabel">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead className="text-right">Total Stok</TableHead>
                                    <TableHead className="w-48 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStokInventaris.length > 0 ? (
                                    filteredStokInventaris.map((item, index) => (
                                        <TableRow key={item.kode}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.kode}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell className="text-right">{item.total_stok}</TableCell>
                                            <TableCell className="space-x-2 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="detail-btn"
                                                    data-kode={item.kode}
                                                    data-nama={item.nama}
                                                    onClick={() => handleOpenDetail(item.kode, item.nama)}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" /> Detail
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => openAdj(item.kode, item.nama)}>
                                                    <Edit className="mr-1 h-4 w-4" /> Penyesuaian
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            Tidak ada data stok inventaris.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Detail Batch */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">
                            {selectedItem ? `${selectedItem.kode} - ${selectedItem.nama}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mb-4">
                        <p className="text-lg font-semibold">
                            Total Stok:{' '}
                            <span className="text-blue-600">
                                {detailData.reduce((total, item) => total + parseInt(item.qty_barang?.toString() || '0'), 0)}
                            </span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">No</TableHead>
                                    <TableHead className="text-center">ID Pembelian</TableHead>
                                    <TableHead className="text-center">Tanggal Pembelian</TableHead>
                                    <TableHead className="text-center">Masa Akhir</TableHead>
                                    <TableHead className="text-center">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailData.map((item, index) => {
                                    const tanggalPembelian = item.tanggal_pembelian
                                        ? new Date(item.tanggal_pembelian).toLocaleDateString('id-ID')
                                        : '-';
                                    const masaAkhir = item.masa_akhir_penggunaan
                                        ? new Date(item.masa_akhir_penggunaan).toLocaleDateString('id-ID')
                                        : '-';

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell className="text-center">{item.kode_pembelian || '-'}</TableCell>
                                            <TableCell className="text-center">{tanggalPembelian}</TableCell>
                                            <TableCell className="text-center">{masaAkhir}</TableCell>
                                            <TableCell className="text-center">{item.qty_barang || 0}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Penyesuaian */}
            <Dialog open={isAdjOpen} onOpenChange={setIsAdjOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto text-sm sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">
                            {selectedItem ? `Penyesuaian: ${selectedItem.kode} - ${selectedItem.nama}` : 'Penyesuaian'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdj} id="adjFormInventarisUtama">
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-4">Aktivitas</label>
                                <div className="col-span-8">
                                    <select
                                        className="w-full rounded border px-3 py-2 dark:bg-background"
                                        value={aktifitas}
                                        onChange={(e) => setAktifitas(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            -- Pilih Aktivitas --
                                        </option>
                                        <option value="stok_opname">Stok Opname</option>
                                        <option value="koreksi_manual">Koreksi Manual</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-4">Jumlah</label>
                                <div className="col-span-5">
                                    <select
                                        className="w-full rounded border px-3 py-2 dark:bg-background"
                                        value={keteranganQty}
                                        onChange={(e) => setKeteranganQty(e.target.value)}
                                        required
                                        disabled={aktifitas === 'stok_opname'}
                                    >
                                        <option value="" disabled>
                                            -- Ubah Sebanyak --
                                        </option>
                                        <option value="tambahkan">Tambahkan Sebanyak</option>
                                        <option value="kurangi">Kurangi Sebanyak</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        className="w-full rounded border px-3 py-2"
                                        min={0}
                                        value={qty}
                                        onChange={(e) => setQty(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-4">Alasan</label>
                                <div className="col-span-8">
                                    <input
                                        type="text"
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="Tulis alasan penyesuaian"
                                        value={alasan}
                                        onChange={(e) => setAlasan(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 text-right">
                            <button type="submit" className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                Simpan
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

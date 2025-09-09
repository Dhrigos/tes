'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface StokObat {
    kode_obat_alkes: string;
    nama_obat_alkes: string;
    total_stok: number;
}

interface StokBarang {
    id: number;
    kode_obat_alkes: string;
    nama_obat_alkes: string;
    qty: number;
    tanggal_terima_obat: string;
    expired: string;
}

interface PageProps {
    stok_obat: StokObat[];
    all_stok_barang: StokBarang[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Gudang', href: '' },
    { title: 'Stok Obat', href: '' },
];

export default function Index() {
    const pageProps = usePage().props as unknown as PageProps & { errors?: any };
    const { stok_obat, all_stok_barang, flash, errors } = pageProps;

    // State untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ kode: string; nama: string } | null>(null);
    const [detailData, setDetailData] = useState<StokBarang[]>([]);

    // Logging untuk debugging
    useEffect(() => {}, [pageProps, stok_obat, all_stok_barang]);

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
    const filteredStokObat =
        stok_obat?.filter((item) => {
            const q = search.toLowerCase();
            return item.kode_obat_alkes?.toLowerCase().includes(q) || item.nama_obat_alkes?.toLowerCase().includes(q);
        }) || [];

    // Fungsi untuk membuka detail batch
    const handleOpenDetail = (kode: string, nama: string) => {
        // Pastikan all_stok_barang terdefinisi
        if (!all_stok_barang) {
            console.error('Data all_stok_barang tidak tersedia');
            toast.error('Data detail tidak tersedia');
            return;
        }

        // Pastikan all_stok_barang adalah array
        if (!Array.isArray(all_stok_barang)) {
            toast.error('Data detail tidak valid');
            return;
        }

        // Filter data berdasarkan kode
        const filteredItems = all_stok_barang.filter((item) => item.kode_obat_alkes === kode);

        // Set state untuk modal
        setSelectedItem({ kode, nama });
        setDetailData(filteredItems);
        setIsModalOpen(true);
    };

    // Fungsi untuk menutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setDetailData([]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stok Obat" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Stok Obat</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Cari obat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-8" />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table id="stoktabel">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Obat/Alkes</TableHead>
                                    <TableHead className="text-right">Total Stok</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStokObat.length > 0 ? (
                                    filteredStokObat.map((item, index) => (
                                        <TableRow key={item.kode_obat_alkes}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.kode_obat_alkes}</TableCell>
                                            <TableCell>{item.nama_obat_alkes}</TableCell>
                                            <TableCell className="text-right">{item.total_stok}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="detail-btn"
                                                    data-kode={item.kode_obat_alkes}
                                                    data-nama={item.nama_obat_alkes}
                                                    onClick={() => handleOpenDetail(item.kode_obat_alkes, item.nama_obat_alkes)}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" /> Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            Tidak ada data stok obat.
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
                        <DialogTitle className="text-xl font-bold text-gray-800">
                            {selectedItem ? `${selectedItem.kode} - ${selectedItem.nama}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mb-4">
                        <p className="text-lg font-semibold">
                            Total Stok:{' '}
                            <span className="text-blue-600">
                                {detailData.reduce((total, item) => total + parseInt(item.qty?.toString() || '0'), 0)}
                            </span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">No</TableHead>
                                    <TableHead className="text-center">ID</TableHead>
                                    <TableHead className="text-center">Tanggal Masuk</TableHead>
                                    <TableHead className="text-center">Tanggal Expired</TableHead>
                                    <TableHead className="text-center">Stok</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailData.map((item, index) => {
                                    const tanggalMasuk = item.tanggal_terima_obat
                                        ? new Date(item.tanggal_terima_obat).toLocaleDateString('id-ID')
                                        : '-';
                                    const tanggalExpired = item.expired ? new Date(item.expired).toLocaleDateString('id-ID') : '-';

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell className="text-center">{item.id || '-'}</TableCell>
                                            <TableCell className="text-center">{tanggalMasuk}</TableCell>
                                            <TableCell className="text-center">{tanggalExpired}</TableCell>
                                            <TableCell className="text-center">{item.qty || 0}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

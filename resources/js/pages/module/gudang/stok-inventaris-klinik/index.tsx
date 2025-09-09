'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface StokInventarisAgg {
    kode: string;
    nama: string;
    total_stok: number;
}

interface StokInventarisKlinikDetail {
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
    stok_inventaris: StokInventarisAgg[];
    all_stok_inventaris_klinik: StokInventarisKlinikDetail[];
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Gudang', href: '' },
    { title: 'Stok Inventaris Klinik', href: '' },
];

export default function Index() {
    const pageProps = usePage().props as unknown as PageProps & { errors?: any };
    const { stok_inventaris, all_stok_inventaris_klinik, flash, errors } = pageProps;

    // State untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ kode: string; nama: string } | null>(null);
    const [detailData, setDetailData] = useState<StokInventarisKlinikDetail[]>([]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (errors) Object.values(errors).forEach((e: any) => toast.error(e));
    }, [flash, errors]);

    const [search, setSearch] = useState('');

    const filtered =
        stok_inventaris?.filter((item) => {
            const q = search.toLowerCase();
            return item.kode?.toLowerCase().includes(q) || item.nama?.toLowerCase().includes(q);
        }) || [];

    const handleOpenDetail = (kode: string, nama: string) => {
        if (!Array.isArray(all_stok_inventaris_klinik)) {
            toast.error('Data detail tidak tersedia');
            return;
        }

        const filteredItems = all_stok_inventaris_klinik.filter((item) => item.kode_barang === kode);

        // Set state untuk modal
        setSelectedItem({ kode, nama });
        setDetailData(filteredItems);
        setIsModalOpen(true);
    };

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
                        <CardTitle>Stok Inventaris Klinik</CardTitle>
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
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((item, index) => (
                                        <TableRow key={item.kode}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.kode}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell className="text-right">{item.total_stok}</TableCell>
                                            <TableCell className="text-right">
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
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            Tidak ada data stok inventaris klinik.
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
        </AppLayout>
    );
}

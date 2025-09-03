"use client"

import { useState, useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { type BreadcrumbItem } from "@/types";

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
    { title: "Gudang", href: "" },
    { title: "Stok Inventaris Klinik", href: "" },
];

export default function Index() {
    const pageProps = usePage().props as unknown as PageProps & { errors?: any };
    const { stok_inventaris, all_stok_inventaris_klinik, flash, errors } = pageProps;
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (errors) Object.values(errors).forEach((e: any) => toast.error(e));
    }, [flash, errors]);

    const [search, setSearch] = useState("");

    const filtered = stok_inventaris?.filter((item) => {
        const q = search.toLowerCase();
        return (
            item.kode?.toLowerCase().includes(q) ||
            item.nama?.toLowerCase().includes(q)
        );
    }) || [];

    const handleOpenDetail = (kode: string, nama: string) => {
        if (!Array.isArray(all_stok_inventaris_klinik)) {
            toast.error('Data detail tidak tersedia');
            return;
        }

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = `${kode} - ${nama}`;

        const filteredItems = all_stok_inventaris_klinik.filter(item => item.kode_barang === kode);

        let totalStok = 0;
        filteredItems.forEach(item => {
            totalStok += parseInt(item.qty_barang?.toString() || '0');
        });

        let tableHtml = '';
        filteredItems.forEach((item, index) => {
            const tanggalPembelian = item.tanggal_pembelian ? new Date(item.tanggal_pembelian).toLocaleDateString('id-ID') : '-';
            const masaAkhir = item.masa_akhir_penggunaan ? new Date(item.masa_akhir_penggunaan).toLocaleDateString('id-ID') : '-';

            tableHtml += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center">${item.kode_pembelian || '-'}</td>
                    <td class="text-center">${tanggalPembelian}</td>
                    <td class="text-center">${masaAkhir}</td>
                    <td class="text-center">${item.qty_barang || 0}</td>
                </tr>
            `;
        });

        const detailTableBody = document.getElementById('detailTableBody');
        if (detailTableBody) detailTableBody.innerHTML = tableHtml;

        const totalStokElement = document.getElementById('totalStok');
        if (totalStokElement) totalStokElement.textContent = totalStok.toString();

        const modal = document.getElementById('detailModal');
        if (modal) modal.classList.remove('hidden');
    };

    const handleCloseModal = () => {
        const modal = document.getElementById('detailModal');
        if (modal) modal.classList.add('hidden');
    };

    useEffect(() => {
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', handleCloseModal);
        });
        return () => {
            closeButtons.forEach(button => {
                button.removeEventListener('click', handleCloseModal);
            });
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Stok Inventaris Klinik</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Cari inventaris..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 w-64"
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
                                                    <Eye className="w-4 h-4 mr-1" /> Detail
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

            <div id="detailModal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 id="modalTitle" className="text-xl font-bold text-gray-800"></h3>
                            <button className="modal-close text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-lg font-semibold">Total Stok: <span id="totalStok" className="text-blue-600">0</span></p>
                        </div>

                        <div className="overflow-x-auto">
                            <table id="detailTable" className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">ID Pembelian</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Tanggal Pembelian</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Masa Akhir</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody id="detailTableBody" className="bg-white divide-y divide-gray-200">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

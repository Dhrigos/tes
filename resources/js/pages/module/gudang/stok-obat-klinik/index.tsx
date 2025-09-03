"use client"

import { useState, useEffect, useRef } from "react";
import { usePage, Head } from "@inertiajs/react";
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

interface StokObatAgg {
    kode_obat_alkes: string;
    nama_obat_alkes: string;
    total_stok: number;
}

interface StokObatKlinikItem {
    id: number;
    kode_obat_alkes: string;
    nama_obat_alkes: string;
    qty: number;
    tanggal_terima_obat: string;
    expired: string;
}

interface PageProps {
    stok_obat: StokObatAgg[];
    all_stok_obat_klinik: StokObatKlinikItem[];
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Gudang", href: "" },
    { title: "Stok Obat Klinik", href: "" },
];

export default function Index() {
    const pageProps = usePage().props as unknown as PageProps & { errors?: any };
    const { stok_obat, all_stok_obat_klinik, flash, errors } = pageProps;
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (errors) Object.values(errors).forEach((e: any) => toast.error(e));
    }, [flash, errors]);

    const [search, setSearch] = useState("");

    const filtered = stok_obat?.filter((item) => {
        const q = search.toLowerCase();
        return (
            item.kode_obat_alkes?.toLowerCase().includes(q) ||
            item.nama_obat_alkes?.toLowerCase().includes(q)
        );
    }) || [];

    const handleOpenDetail = (kode: string, nama: string) => {
        if (!Array.isArray(all_stok_obat_klinik)) {
            toast.error('Data detail tidak tersedia');
            return;
        }

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = `${kode} - ${nama}`;

        const filteredItems = all_stok_obat_klinik.filter(item => item.kode_obat_alkes === kode);

        let totalStok = 0;
        filteredItems.forEach(item => {
            totalStok += parseInt(item.qty?.toString() || '0');
        });

        let tableHtml = '';
        filteredItems.forEach((item, index) => {
            const tanggalMasuk = item.tanggal_terima_obat ? new Date(item.tanggal_terima_obat).toLocaleDateString('id-ID') : '-';
            const tanggalExpired = item.expired ? new Date(item.expired).toLocaleDateString('id-ID') : '-';

            tableHtml += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center">${item.id || '-'}</td>
                    <td class="text-center">${tanggalMasuk}</td>
                    <td class="text-center">${tanggalExpired}</td>
                    <td class="text-center">${item.qty || 0}</td>
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
            <Head title="Stok Obat Klinik" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Stok Obat Klinik</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Cari obat..."
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
                                    <TableHead>Nama Obat/Alkes</TableHead>
                                    <TableHead className="text-right">Total Stok</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((item, index) => (
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
                                                    <Eye className="w-4 h-4 mr-1" /> Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            Tidak ada data stok obat klinik.
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Tanggal Masuk</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Tanggal Expired</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Stok</th>
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

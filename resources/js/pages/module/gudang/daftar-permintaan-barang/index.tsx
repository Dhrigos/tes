"use client"

import { useState } from "react";
import { Head } from "@inertiajs/react";
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
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from "@/types";

interface PermintaanBarang {
    id: number;
    kode_request: string;
    kode_klinik: string;
    nama_klinik: string;
    status: string;
    tanggal_input: string;
    user_input_name?: string;
    catatan?: string;
    [key: string]: any;
}

interface Props {
    title: string;
    permintaan: PermintaanBarang[];
}

export default function DaftarPermintaanBarangIndex({ title, permintaan }: Props) {
    const [searchTerm, setSearchTerm] = useState("");

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Gudang", href: "/gudang" },
        { title: "Daftar Permintaan Barang", href: "/gudang/daftar-permintaan-barang" },
    ];

    // Filter data berdasarkan pencarian
    const filteredPermintaan = permintaan?.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            item.kode_request?.toLowerCase().includes(q) ||
            item.kode_klinik?.toLowerCase().includes(q) ||
            item.nama_klinik?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
        );
    }) || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Cari berdasarkan kode request, kode klinik, nama klinik, atau status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Daftar Permintaan Barang */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Permintaan Barang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>Kode Request</TableHead>
                                    <TableHead>Kode Klinik</TableHead>
                                    <TableHead>Nama Klinik</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal Input</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPermintaan.length > 0 ? (
                                    filteredPermintaan.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell>{item.kode_request}</TableCell>
                                            <TableCell>{item.kode_klinik}</TableCell>
                                            <TableCell>{item.nama_klinik}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.tanggal_input}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline">
                                                    <Eye className="w-4 h-4 mr-1" /> Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            {searchTerm ? "Tidak ada data yang sesuai dengan pencarian." : "Tidak ada data permintaan barang."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


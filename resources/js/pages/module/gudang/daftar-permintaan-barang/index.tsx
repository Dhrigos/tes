'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { Eye, Search, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface PermintaanBarangDetail {
    kode_barang: string;
    nama_barang: string;
    jumlah: number;
}

interface PermintaanBarangWithDetails extends PermintaanBarang {
    details?: PermintaanBarangDetail[];
}

interface DaftarObat {
    kode: string;
    nama: string;
    [key: string]: any;
}

interface User {
    id: number;
    name: string;
    email: string;
    [key: string]: any;
}

interface Props {
    title: string;
    permintaan: PermintaanBarang[];
    dabar: DaftarObat[];
    auth?: {
        user: User;
    };
}

export default function DaftarPermintaanBarangIndex({ title, permintaan, dabar, auth }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPermintaan, setSelectedPermintaan] = useState<PermintaanBarangWithDetails | null>(null);
    const [loading, setLoading] = useState(false);

    // State for the new form fields
    const [selectedObat, setSelectedObat] = useState<{ kode: string; nama: string } | null>(null);
    const [qtyManual, setQtyManual] = useState<number>(1);
    const [manualItems, setManualItems] = useState<Array<{ kode_barang: string; nama_barang: string; jumlah: number }>>([]);
    const [searchObat, setSearchObat] = useState("");

    // State for selected rows
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Filter dabar based on search term
    const filteredDabar = dabar?.filter((barang) => {
        const q = searchObat.toLowerCase();
        return (
            barang.nama?.toLowerCase().includes(q)
        );
    }).slice(0, 5) || [];

    // Helper function to get status label and styling
    const getStatusInfo = (status: number | string) => {
        // Convert to string for comparison to handle both numeric and string inputs
        const statusStr = String(status);
        const baseClass = 'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-20 min-w-[6rem]';
        switch (statusStr) {
            case "0":
            case "pending":
                return { label: 'Pending', className: `${baseClass} bg-gray-100 text-gray-800` };
            case "1":
            case "proses":
                return { label: 'Proses', className: `${baseClass} bg-yellow-100 text-yellow-800` };
            case "2":
            case "pengiriman":
                return { label: 'Pengiriman', className: `${baseClass} bg-blue-100 text-blue-800` };
            case "3":
            case "selesai":
                return { label: 'Selesai', className: `${baseClass} bg-green-100 text-green-800` };
            default:
                return { label: 'Unknown', className: `${baseClass} bg-gray-100 text-gray-800` };
        }
    };

    // Helper function to format date to YYYY-MM-DD
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gudang', href: '/gudang' },
        { title: 'Daftar Permintaan Barang', href: '/gudang/daftar-permintaan-barang' },
    ];

    // Function to move selected items to request form
    const moveToRequestForm = () => {
        if (!selectedPermintaan || selectedRows.length === 0) {
            toast.warning('Pilih setidaknya satu barang untuk dikonfirmasi');
            return;
        }

        // Move selected items to the request form
        const selectedItems = selectedPermintaan.details?.filter(
            detail => selectedRows.includes(detail.kode_barang)
        ) || [];

        // Add each selected item to manualItems
        const newManualItems = [...manualItems];
        selectedItems.forEach(item => {
            // Check if item already exists in manualItems
            const exists = newManualItems.some(
                manualItem => manualItem.kode_barang === item.kode_barang
            );

            if (!exists) {
                newManualItems.push({
                    kode_barang: item.kode_barang,
                    nama_barang: item.nama_barang,
                    jumlah: item.jumlah
                });
            }
        });

        setManualItems(newManualItems);
        setSelectedRows([]);
        setSelectAll(false);
        toast.success(`${selectedItems.length} barang berhasil dipindahkan ke form permintaan`);
    };

    // Helper functions for the new form
    const addObatManual = () => {
        if (!selectedObat) {
            toast.error('Silakan pilih obat terlebih dahulu');
            return;
        }

        // Convert qtyManual to number if it's a string
        const qty = typeof qtyManual === 'string' ? parseInt(qtyManual) : qtyManual;
        
        // Check if qty is valid
        if (isNaN(qty) || qty <= 0) {
            toast.error('Jumlah harus lebih dari 0');
            return;
        }

        // Check if item already exists in manualItems
        const existingItemIndex = manualItems.findIndex(item => item.kode_barang === selectedObat.kode);

        if (existingItemIndex !== -1) {
            // If item exists, increment the quantity
            setManualItems(prevItems => {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    jumlah: updatedItems[existingItemIndex].jumlah + qty
                };
                return updatedItems;
            });
            toast.success(`Jumlah ${selectedObat.nama} berhasil ditambahkan`);
        } else {
            // If item doesn't exist, add new item
            const newItem = {
                kode_barang: selectedObat.kode,
                nama_barang: selectedObat.nama,
                jumlah: qty,
            };

            setManualItems([...manualItems, newItem]);
            toast.success(`${selectedObat.nama} berhasil ditambahkan`);
        }

        setSelectedObat(null);
        setQtyManual(1);
    };

    const removeManualItem = (index: number) => {
        setManualItems(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const kirimPermintaan = async () => {
        if (manualItems.length === 0) {
            toast.error('Silakan tambahkan minimal 1 item');
            return;
        }

        if (!selectedPermintaan) {
            toast.error('Tidak ada permintaan yang dipilih');
            return;
        }

        try {
            setLoading(true);
            
            // Prepare the data to send
            const requestData = {
                kode_request: selectedPermintaan.kode_request,
                tanggal_request: selectedPermintaan.tanggal_input,
                nama_klinik: selectedPermintaan.nama_klinik,
                items: manualItems.map(item => ({
                    kode_obat: item.kode_barang,
                    nama_obat: item.nama_barang,
                    jumlah: item.jumlah,
                    harga_dasar: '0'
                }))
            };

            // Log the request data and URL
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            // Send data to the backend with headers for debugging
            const response = await axios.post(
                '/api/daftar-permintaan-barang/proses-permintaan', 
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    withCredentials: true // Important for sending cookies
                }
            );

            if (response.data.success) {
                toast.success(response.data.message || `Permintaan dengan ${manualItems.length} item berhasil disimpan!`);
                // Clear the form and close modal
                setManualItems([]);
                setShowDetailModal(false);
                
                // Reload the page to reflect changes
                window.location.reload();
            } else {
                toast.error(response.data.message || 'Gagal menyimpan permintaan');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan permintaan');
        } finally {
            setLoading(false);
        }
    };

    // Handle select all rows
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        if (isChecked && selectedPermintaan?.details) {
            const allIds = selectedPermintaan.details.map(detail => detail.kode_barang);
            setSelectedRows(allIds);
        } else {
            setSelectedRows([]);
        }
    };

    // Handle select/deselect single row
    const handleSelectRow = (kodeBarang: string) => {
        setSelectedRows(prev => {
            const newSelected = prev.includes(kodeBarang)
                ? prev.filter(id => id !== kodeBarang)
                : [...prev, kodeBarang];

            // Update selectAll state based on current selection
            if (selectedPermintaan?.details) {
                setSelectAll(newSelected.length === selectedPermintaan.details.length);
            }

            return newSelected;
        });
    };

    // Filter data berdasarkan pencarian
    const filteredPermintaan =
        permintaan?.filter((item) => {
            const q = searchTerm.toLowerCase();
            return (
                item.kode_request?.toLowerCase().includes(q) ||
                item.kode_klinik?.toLowerCase().includes(q) ||
                item.nama_klinik?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q)
            );
        }) || [];

    // Function to fetch permintaan details
    const fetchPermintaanDetails = async (kodeRequest: string) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/daftar-permintaan-barang/get-detail/${kodeRequest}`);

            if (response.data.success) {
                const permintaanData = permintaan.find((p) => p.kode_request === kodeRequest);
                if (permintaanData) {
                    setSelectedPermintaan({
                        ...permintaanData,
                        details: response.data.details,
                    });
                    setShowDetailModal(true);
                }
            } else {
                toast.error(response.data.message || 'Gagal mengambil detail permintaan barang');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengambil detail permintaan barang');
        } finally {
            setLoading(false);
        }
    };

    // Function to confirm permintaan
    const konfirmasiPermintaan = async (kodeRequest: string) => {
        try {
            setLoading(true);
            
            // Get the tanggal_input from selectedPermintaan
            const tanggalInput = selectedPermintaan?.tanggal_input || '';
            
            const response = await axios.post('/gudang/daftar-permintaan-barang/konfirmasi', {
                detail_kode_request: kodeRequest,
                detail_tanggal: tanggalInput,
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Permintaan berhasil dikonfirmasi');

                // Update the local state to reflect the confirmation
                if (selectedPermintaan) {
                    setSelectedPermintaan({
                        ...selectedPermintaan,
                        status: '1',
                    });
                }

                // Also update the main permintaan list
                const updatedPermintaan = permintaan.map((item) => (item.kode_request === kodeRequest ? { ...item, status: '1' } : item));

                // Since we don't have access to setPermintaan here, we'll just close the modal
                // In a real app, you might want to pass a setter function as a prop
                // setShowDetailModal(false);
            } else {
                toast.error(response.data.message || 'Gagal mengkonfirmasi permintaan barang');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengkonfirmasi permintaan barang');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
                            <TableBody className="text-xs">
                                {filteredPermintaan.length > 0 ? (
                                    filteredPermintaan.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell>{item.kode_request}</TableCell>
                                            <TableCell>{item.kode_klinik}</TableCell>
                                            <TableCell>{item.nama_klinik}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-[0.65rem] font-medium ${getStatusInfo(item.status).className}`}
                                                >
                                                    {getStatusInfo(item.status).label}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatDate(item.tanggal_input)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => fetchPermintaanDetails(item.kode_request)}
                                                    disabled={loading}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" /> Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Tidak ada data permintaan barang.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="!max-w-7xl flex-col overflow-hidden sm:!max-w-6xl md:!max-w-7xl lg:!max-w-7xl">
                    <DialogHeader>
                        <DialogTitle>Detail Permintaan Barang</DialogTitle>
                        <div className="flex gap-4">
                            <DialogDescription>Kode Request: {selectedPermintaan?.kode_request}</DialogDescription>
                            <DialogDescription>Status: {getStatusInfo(selectedPermintaan?.status ?? '').label}</DialogDescription>
                        </div>
                    </DialogHeader>

                    {selectedPermintaan && (
                        <div className="flex h-full flex-col">
                            {/* Content area */}
                            <div className="-mr-2 flex-1 overflow-y-auto pr-2">
                                <div className="grid grid-cols-1 gap-6 pb-6 lg:grid-cols-2">
                                    {/* Kolom Kiri - Detail Permintaan */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Detail Barang</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="max-h-80 overflow-y-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-50">
                                                                {/* Checkbox Header */}
                                                                <TableHead className="w-6 text-xs">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4"
                                                                        checked={selectAll}
                                                                        onChange={handleSelectAll}
                                                                    />
                                                                </TableHead>
                                                                <TableHead className="text-xs">Nama Barang</TableHead>
                                                                <TableHead className="text-right text-xs">Jumlah</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody className="text-sm">
                                                            {selectedPermintaan.details && selectedPermintaan.details.length > 0 ? (
                                                                selectedPermintaan.details.map((detail, index) => (
                                                                    <TableRow key={index}>
                                                                        {/* Checkbox per row */}
                                                                        <TableCell>
                                                                            <input
                                                                                type="checkbox"
                                                                                className="h-4 w-4"
                                                                                checked={selectedRows.includes(detail.kode_barang)}
                                                                                onChange={() => handleSelectRow(detail.kode_barang)}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>{detail.nama_barang}</TableCell>
                                                                        <TableCell className="text-right">{detail.jumlah}</TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={3} className="text-center text-sm">
                                                                        Tidak ada detail barang
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                <div className="mt-4 flex justify-end">
                                                    <Button
                                                        variant="default"
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={moveToRequestForm}
                                                    >
                                                        Pindahkan ke Form Permintaan
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Kolom Kanan - Form Permintaan */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Form Permintaan Obat</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* Hidden inputs */}
                                                    <input
                                                        type="hidden"
                                                        id="nama_klinik_additional"
                                                        name="nama_klinik_additional"
                                                        value={selectedPermintaan.nama_klinik}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        id="kode_request_additional"
                                                        name="kode_request_additional"
                                                        value={selectedPermintaan.kode_request}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        id="tanggal_request_additional"
                                                        name="tanggal_request_additional"
                                                        value={selectedPermintaan.tanggal_input}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="obat_manual" className="mb-1 block text-xs font-medium text-gray-700">
                                                        Obat/Alkes:
                                                    </label>
                                                    <Select value={selectedObat?.kode || ''} onValueChange={(value) => {
                                                        const selectedOption = dabar.find((obat) => obat.kode === value);
                                                        if (selectedOption) {
                                                            setSelectedObat({
                                                                kode: selectedOption.kode,
                                                                nama: selectedOption.nama,
                                                            });
                                                        }
                                                    }}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Obat" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <div className="p-2">
                                                                <div className="relative">
                                                                    <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                                    <Input
                                                                        placeholder="Cari obat/alkes berdasarkan kode atau nama..."
                                                                        value={searchObat}
                                                                        onChange={(e) => setSearchObat(e.target.value)}
                                                                        className="mb-2 pl-8"
                                                                    />
                                                                </div>
                                                                {searchObat && (
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Ditemukan {filteredDabar.length} obat/alkes
                                                                        </p>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSearchObat('')}
                                                                            className="h-6 px-2 text-xs"
                                                                        >
                                                                            Reset
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {filteredDabar.length > 0 ? (
                                                                filteredDabar.map((obat) => (
                                                                    <SelectItem key={obat.kode} value={obat.kode}>
                                                                        <div className="flex flex-col">
                                                                            <div className="font-medium" title={obat.nama}>{obat.nama.length > 100 ? `${obat.nama.substring(0, 100)}...` : obat.nama}</div>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-center text-muted-foreground">
                                                                    {searchObat
                                                                        ? 'Tidak ada obat/alkes ditemukan'
                                                                        : 'Tidak ada data obat/alkes'}
                                                                </div>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Total: {dabar.length} obat/alkes
                                                        {searchObat && (
                                                            <span className="ml-1">
                                                                (Ditemukan {filteredDabar.length} obat/alkes)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor="qty_manual" className="mb-1 block text-xs font-medium text-gray-700">
                                                        Jumlah:
                                                    </label>
                                                    <div className="flex">
                                                        <input
                                                            type="number"
                                                            className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                            id="qty_manual"
                                                            name="qty_manual"
                                                            placeholder="Jumlah"
                                                            value={qtyManual}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value === '' || value === '0') {
                                                                    // Allow empty or zero values
                                                                    setQtyManual(value as any);
                                                                } else {
                                                                    // Parse valid numbers
                                                                    const numValue = parseInt(value);
                                                                    setQtyManual(isNaN(numValue) ? 1 : numValue);
                                                                }
                                                            }}
                                                            min="1"
                                                        />
                                                        <Button
                                                            className="flex items-center justify-center rounded-l-none px-3 py-2 text-sm"
                                                            onClick={addObatManual}
                                                            size="sm"
                                                        >
                                                            <span className="sr-only">Tambah Obat</span>
                                                            <span>+</span>
                                                        </Button>
                                                    </div>

                                                    {/* Tabel Item */}
                                                    <div>
                                                        <h4 className="mb-2 text-sm font-medium">Item yang akan ditambahkan:</h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="text-center text-xs">Kode Obat</TableHead>
                                                                    <TableHead className="text-center text-xs">Nama Obat</TableHead>
                                                                    <TableHead className="text-center text-xs">Jumlah</TableHead>
                                                                    <TableHead className="text-center text-xs">Aksi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody className="text-sm">
                                                                {manualItems.length > 0 ? (
                                                                    manualItems.map((item, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell className="text-center">{item.kode_barang}</TableCell>
                                                                            <TableCell className="text-center">
                                                                                <div
                                                                                    className="inline-block max-w-[200px] truncate"
                                                                                    title={item.nama_barang}
                                                                                >
                                                                                    {item.nama_barang.length > 20 ? `${item.nama_barang.substring(0, 20)}...` : item.nama_barang}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">{item.jumlah}</TableCell>
                                                                            <TableCell className="text-center">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => removeManualItem(index)}
                                                                                >
                                                                                    Hapus
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={4} className="text-center text-sm">
                                                                            Belum ada item yang ditambahkan
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed footer with action buttons */}
                            <div className="mt-auto border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        {manualItems.length > 0 && <span>{manualItems.length} item akan ditambahkan</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={kirimPermintaan}
                                            disabled={loading || manualItems.length === 0}
                                            size="sm"
                                        >
                                            {loading ? (
                                                'Memproses...'
                                            ) : (
                                                <>
                                                    <span className="mr-2">💾</span> Simpan Permintaan
                                                </>
                                            )}
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowDetailModal(false)} size="sm">
                                            Tutup
                                        </Button>
                                        {selectedPermintaan && getStatusInfo(selectedPermintaan.status).label === 'Pending' && (
                                            <Button
                                                onClick={() => konfirmasiPermintaan(selectedPermintaan.kode_request)}
                                                disabled={loading}
                                                size="sm"
                                            >
                                                {loading ? 'Memproses...' : 'Konfirmasi Permintaan'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

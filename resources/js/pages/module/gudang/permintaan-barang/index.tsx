"use client"

import { useState, useEffect } from "react";
import { usePage, Head, router } from "@inertiajs/react";
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
import { Search, Plus, Eye, X } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { type BreadcrumbItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PermintaanBarang {
    id: number;
    kode_request: string;
    kode_klinik: string;
    nama_klinik: string;
    status: string;
    tanggal_input: string;
    user_input_name: string;
    catatan?: string;
    [key: string]: any; // Untuk field tambahan yang mungkin ada
}

interface FlashMessages {
    success?: string;
    error?: string;
    nomor_antrian?: string;
}

interface Props {
    permintaan_barang: PermintaanBarang[];
    title: string;
    dabar: any[];
    request: PermintaanBarang[];
    data_kirim: PermintaanBarang[];
    flash?: FlashMessages;
}

interface DaftarBarang {
    kode_barang: string;
    nama_barang: string;
    satuan: string;
    [key: string]: any;
}

interface PermintaanItem {
    kode_barang: string;
    nama_barang: string;
    jumlah: number;
    satuan: string;
}

export default function PermintaanBarangIndex({ permintaan_barang, title, dabar, request, data_kirim, flash }: Props) {
    // Flash messages are now properly passed as props, but we can also access them via usePage if needed
    const pageProps = usePage().props as { flash?: FlashMessages; webSetting?: any };
    const flashMessages = flash || pageProps.flash || {};

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Gudang", href: "/gudang" },
        { title: "Permintaan Barang", href: "/gudang/permintaan-barang" },
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPermintaan, setSelectedPermintaan] = useState<any>(null);
    const [kodeRequest, setKodeRequest] = useState("");
    const [catatan, setCatatan] = useState("");
    const [isGeneratingKode, setIsGeneratingKode] = useState(false);
    const [items, setItems] = useState<PermintaanItem[]>([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [externalDatabase, setExternalDatabase] = useState("");

    // Tampilkan notifikasi jika ada pesan flash
    useEffect(() => {
        if (flashMessages.success) {
            toast.success(flashMessages.success);
        }
        if (flashMessages.error) {
            toast.error(flashMessages.error);
        }
    }, [flashMessages]);

    // Filter data berdasarkan pencarian
    const filteredPermintaanBarang = permintaan_barang?.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            item.kode_request?.toLowerCase().includes(q) ||
            item.kode_klinik?.toLowerCase().includes(q) ||
            item.nama_klinik?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
        );
    }) || [];

    // Handle adding a new item row
    const addItem = () => {
        setItems([...items, { kode_barang: "", nama_barang: "", jumlah: 1, satuan: "" }]);
    };

    // Handle removing an item row
    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Handle changing item data
    const handleItemChange = (index: number, field: keyof PermintaanItem, value: string | number) => {
        setItems(prevItems => {
            // Ensure the index is valid
            if (index < 0 || index >= prevItems.length) {
                return prevItems;
            }

            // Create a new array with updated item
            const newItems = [...prevItems];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };

    // Handle selecting a barang from the dropdown
    const handleBarangSelect = (index: number, barang: DaftarBarang) => {
        handleItemChange(index, 'kode_barang', barang.kode_barang);
        handleItemChange(index, 'nama_barang', barang.nama_barang);
        handleItemChange(index, 'satuan', barang.satuan);
    };

    // Generate kode request
    const generateKodeRequest = async () => {
        setIsGeneratingKode(true);
        try {
            const response = await fetch('/api/permintaan-barang/get-last-kode');
            const data = await response.json();
            if (data.success) {
                setKodeRequest(data.kode_request);
            } else {
                toast.error(data.message || "Gagal menggenerate kode request");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menggenerate kode request");
        } finally {
            setIsGeneratingKode(false);
        }
    };

    const fetchPermintaanDetail = async (kodeRequest: string) => {
        try {
            const response = await fetch(`/api/permintaan-barang/${kodeRequest}`);
            const data = await response.json();
            if (data.success) {
                setSelectedPermintaan(data);
                setShowDetailModal(true);
            } else {
                toast.error(data.message || "Gagal mengambil detail permintaan barang");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengambil detail permintaan barang");
        }
    };

    // Stepper navigation
    const nextStep = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!kodeRequest || kodeRequest.trim() === '') {
            toast.error("Kode request harus diisi");
            return;
        }

        // Validate items
        if (items.length === 0) {
            toast.error("Minimal harus ada satu item");
            return;
        }

        const invalidItem = items.find(item =>
            !item.kode_barang ||
            !item.nama_barang ||
            item.jumlah <= 0 ||
            !item.satuan
        );

        if (invalidItem) {
            toast.error("Semua field item harus diisi dengan benar");
            return;
        }

        // Get web settings from page props
        const webSetting = pageProps.webSetting || {};

        router.post(route('gudang.permintaan-barang.store'), {
            kode_request: kodeRequest.trim(),
            kode_klinik: webSetting.kode_klinik || '',
            nama_klinik: webSetting.nama || '',
            catatan: catatan || '',
            items: items.map(item => ({
                ...item,
                jumlah: Number(item.jumlah)
            }))
        }, {
            onSuccess: () => {
                setShowCreateModal(false);
                setKodeRequest("");
                setCatatan("");
                setItems([{ kode_barang: "", nama_barang: "", jumlah: 1, satuan: "" }]);
                // Success message will be shown via flash messages in useEffect
            },
            onError: (errors: any) => {
                // Validation errors will be shown via flash messages in useEffect
                // No need for direct toast notifications here
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                    <Button onClick={() => {
                        setShowCreateModal(true);
                        // Generate kode request otomatis saat membuka modal
                        generateKodeRequest();
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Permintaan Baru
                    </Button>
                </div>

                {/* Create Modal menggunakan Dialog Component */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Permintaan Obat</DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Stepper Header */}
                            <div className="bs-stepper mb-4">
                                <div className="bs-stepper-header flex justify-between mb-6" role="tablist">
                                    {/* Step 1: Pilih Koneksi */}
                                    <div className={`step flex items-center ${currentStep === 1 ? 'active' : ''}`} data-target="#koneksiExternal">
                                        <button 
                                            type="button" 
                                            className={`step-trigger flex items-center ${currentStep === 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
                                            role="tab" 
                                            aria-controls="koneksiExternal" 
                                            id="koneksiExternal-trigger"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            <span className={`bs-stepper-circle flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                                1
                                            </span>
                                            <span className="bs-stepper-label ml-2">Pilih Koneksi (Gudang Utama)</span>
                                        </button>
                                    </div>
                                    <div className="line flex items-center flex-1 mx-2">
                                        <div className="h-px bg-gray-300 w-full"></div>
                                    </div>
                                    {/* Step 2: Permintaan Obat */}
                                    <div className={`step flex items-center ${currentStep === 2 ? 'active' : ''}`} data-target="#requestObatAlkes">
                                        <button 
                                            type="button" 
                                            className={`step-trigger flex items-center ${currentStep === 2 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
                                            role="tab" 
                                            aria-controls="requestObatAlkes" 
                                            id="requestObatAlkes-trigger"
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            <span className={`bs-stepper-circle flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                                2
                                            </span>
                                            <span className="bs-stepper-label ml-2">Permintaan Obat / Alkes</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bs-stepper-content">
                                    {/* Step 1: Koneksi External Database */}
                                    {currentStep === 1 && (
                                        <div id="koneksiExternal" className="content" role="tabpanel" aria-labelledby="koneksiExternal-trigger">
                                            <div className="form-group row mb-4">
                                                <div className="col-sm-12">
                                                    <label htmlFor="external_database" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Pilih Tujuan
                                                    </label>
                                                    <select 
                                                        className="form-control w-full p-2 border rounded"
                                                        id="external_database" 
                                                        name="external_database"
                                                        value={externalDatabase}
                                                        onChange={(e) => setExternalDatabase(e.target.value)}
                                                    >
                                                        <option value="" disabled>Pilih Nama Tujuan</option>
                                                        <option value="Gudang Utama">Gudang Utama</option>
                                                        {/* Tambahkan opsi lain jika diperlukan */}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button type="button" onClick={nextStep}>
                                                    Selanjutnya
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Step 2: Request Obat atau Alkes */}
                                    {currentStep === 2 && (
                                        <div id="requestObatAlkes" className="content" role="tabpanel" aria-labelledby="requestObatAlkes-trigger">
                                            <div className="form-group row">
                                                <div className="col-md-12 mb-4">
                                                    <div className="form-group">
                                                        <label htmlFor="kode_request" className="block text-sm font-medium text-gray-700 mb-1">
                                                            Kode Permintaan
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="text"
                                                                id="kode_request"
                                                                name="kode_request"
                                                                value={kodeRequest}
                                                                onChange={(e) => setKodeRequest(e.target.value)}
                                                                required
                                                                disabled={isGeneratingKode}
                                                                readOnly
                                                            />
                                                            <Button 
                                                                type="button" 
                                                                onClick={generateKodeRequest}
                                                                disabled={isGeneratingKode}
                                                                variant="outline"
                                                            >
                                                                {isGeneratingKode ? 'Generating...' : 'Generate'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                    <div className="md:col-span-1">
                                                        <label htmlFor="nama_obat_alkes" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Obat / Alkes
                                                        </label>
                                                        <select
                                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            id="nama_obat_alkes"
                                                            name="nama_obat_alkes"
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Pilih Obat/Alkes</option>
                                                            {dabar.map((barang) => (
                                                                <option
                                                                    key={barang.kode}
                                                                    value={barang.nama}
                                                                >
                                                                    {barang.nama}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="md:col-span-1">
                                                        <label htmlFor="jumlah_obat_alkes" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Jumlah
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            id="jumlah_obat_alkes"
                                                            name="jumlah_obat_alkes"
                                                            min="1"
                                                            defaultValue="1"
                                                            placeholder="Masukan jumlahnya"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    
                                                    <div className="md:col-span-1 flex items-end">
                                                        <Button 
                                                            type="button" 
                                                            onClick={() => {
                                                                // Ambil nilai dari select dan input
                                                                const selectElement = document.getElementById('nama_obat_alkes') as HTMLSelectElement;
                                                                const jumlahElement = document.getElementById('jumlah_obat_alkes') as HTMLInputElement;
                                                                
                                                                const selectedNama = selectElement.value;
                                                                const jumlah = parseInt(jumlahElement.value) || 1;
                                                                
                                                                // Cari barang berdasarkan nama
                                                                const selectedBarang = dabar.find(b => b.nama === selectedNama);
                                                                
                                                                if (selectedBarang) {
                                                                    // Tambahkan item baru ke daftar
                                                                    const newItem = {
                                                                        kode_barang: selectedBarang.kode,
                                                                        nama_barang: selectedBarang.nama,
                                                                        jumlah: jumlah,
                                                                        satuan: selectedBarang.satuan_kecil || selectedBarang.satuan_sedang || selectedBarang.satuan_besar || ''
                                                                    };
                                                                    
                                                                    // Tambahkan ke items
                                                                    setItems(prevItems => [...prevItems, newItem]);
                                                                    
                                                                    // Reset form
                                                                    selectElement.selectedIndex = 0;
                                                                    jumlahElement.value = '1';
                                                                }
                                                            }}
                                                            className="w-full md:w-auto"
                                                        >
                                                            Tambah Data Sementara
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                <div className="col-md-12 mt-3">
                                                    <div className="table-responsive">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead style={{ width: '5%' }}>No</TableHead>
                                                                    <TableHead>Kode Obat</TableHead>
                                                                    <TableHead>Nama Obat</TableHead>
                                                                    <TableHead>Jumlah</TableHead>
                                                                    <TableHead className="text-right">Aksi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {items.map((item, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{index + 1}</TableCell>
                                                                        <TableCell>{item.kode_barang}</TableCell>
                                                                        <TableCell>{item.nama_barang}</TableCell>
                                                                        <TableCell>{item.jumlah}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button
                                                                                type="button"
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => removeItem(index)}
                                                                            >
                                                                                Hapus
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                                {items.length === 0 && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={5} className="text-center">
                                                                            Tidak ada data permintaan
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between">
                                                <Button type="button" variant="outline" onClick={prevStep}>
                                                    Sebelumnya
                                                </Button>
                                                <div className="space-x-2">
                                                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                                        Batal
                                                    </Button>
                                                    <Button type="submit">
                                                        Kirim
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-2 gap-6">
                    {/* Menunggu Persetujuan Permintaan */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Menunggu Persetujuan Permintaan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Kode Request</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="w-32 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {request && request.length > 0 ? (
                                        request.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="text-center">{index + 1}</TableCell>
                                                <TableCell>{item.kode_request}</TableCell>
                                                <TableCell>{item.tanggal_input}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button size="sm" variant="outline" onClick={() => fetchPermintaanDetail(item.kode_request)}>
                                                        <Eye className="w-4 h-4 mr-1" /> Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">
                                                Tidak ada data permintaan yang menunggu persetujuan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Data Permintaan Obat */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Data Permintaan Obat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Kode Request</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="w-32 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPermintaanBarang.length > 0 ? (
                                        filteredPermintaanBarang.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-center">{index + 1}</TableCell>
                                                <TableCell>{item.kode_request}</TableCell>
                                                <TableCell>{item.tanggal_input}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button size="sm" variant="outline" onClick={() => fetchPermintaanDetail(item.kode_request)}>
                                                        <Eye className="w-4 h-4 mr-1" /> Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">
                                                Tidak ada data permintaan obat.
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
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>Detail Permintaan Barang</DialogTitle>
                            <DialogDescription>
                                Kode Request: {selectedPermintaan?.kode_request}
                            </DialogDescription>
                        </DialogHeader>
                        
                        {selectedPermintaan && (
                            <div className="space-y-4">
                                {/* Detail Items */}
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>No</TableHead>
                                                <TableHead>Kode Barang</TableHead>
                                                <TableHead>Nama Barang</TableHead>
                                                <TableHead className="text-right">Jumlah</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedPermintaan.details.map((item: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center">{index + 1}</TableCell>
                                                    <TableCell>{item.kode_barang}</TableCell>
                                                    <TableCell>{item.nama_barang}</TableCell>
                                                    <TableCell className="text-right">{item.jumlah}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                <DialogFooter>
                                    <Button onClick={() => setShowDetailModal(false)}>Tutup</Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

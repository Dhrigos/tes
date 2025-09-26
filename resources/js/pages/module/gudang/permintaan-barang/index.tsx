'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Eye, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PermintaanBarang {
    id: number;
    kode_request: string;
    kode_klinik: string;
    nama_klinik: string;
    status: number | string; // Accept both numeric and string statuses
    tanggal_input: string;
    user_input_name: string;

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
    jenis_barang: 'obat' | 'alkes' | 'inventaris';
    [key: string]: any;
}

interface PermintaanItem {
    kode_barang: string;
    nama_barang: string;
    jumlah: number;
    satuan: string;
    jenis_barang: 'obat' | 'alkes' | 'inventaris';
}

export default function PermintaanBarangIndex({ title, dabar, request, data_kirim, flash }: Props) {
    // Flash messages are now properly passed as props, but we can also access them via usePage if needed
    const pageProps = usePage().props as { flash?: FlashMessages; webSetting?: any };
    const flashMessages = flash || pageProps.flash || {};

    // Helper function to get status label and styling
    const getStatusInfo = (status: number | string) => {
        // Convert to string for comparison to handle both numeric and string inputs
        const statusStr = String(status);
        const baseClass = 'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-20 min-w-[6rem]';
        switch (statusStr) {
            case '0':
            case 'pending':
                return { label: 'Pending', className: `${baseClass} bg-gray-100 text-gray-800` };
            case '1':
            case 'proses':
                return { label: 'Proses', className: `${baseClass} bg-yellow-100 text-yellow-800` };
            case '2':
            case 'pengiriman':
                return { label: 'Pengiriman', className: `${baseClass} bg-blue-100 text-blue-800` };
            case '3':
            case 'selesai':
                return { label: 'Selesai', className: `${baseClass} bg-green-100 text-green-800` };
            case '4':
            case 'ditolak':
                return { label: 'Ditolak', className: `${baseClass} bg-red-100 text-red-800` };
            default:
                return { label: 'Unknown', className: `${baseClass} bg-gray-100 text-gray-800` };
        }
    };

    // Helper function to format date to YYYY-MM-DD (robust for invalid inputs)
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return typeof dateString === 'string' ? dateString : '';
        }
        return date.toISOString().split('T')[0];
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gudang', href: '/gudang' },
        { title: 'Permintaan Barang', href: '/gudang/permintaan-barang' },
    ];

    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showKonfirmasiDetailModal, setShowKonfirmasiDetailModal] = useState(false);
    const [selectedPermintaan, setSelectedPermintaan] = useState<any>(null);
    const [selectedKonfirmasi, setSelectedKonfirmasi] = useState<any>(null);
    const [kodeRequest, setKodeRequest] = useState('');

    const [currentStep, setCurrentStep] = useState(1);
    const [externalDatabase, setExternalDatabase] = useState('');

    const [isGeneratingKode, setIsGeneratingKode] = useState(false);
    const [items, setItems] = useState<PermintaanItem[]>([]);

    const [searchObat, setSearchObat] = useState('');
    const [selectedObat, setSelectedObat] = useState('');
    const [jenisBarang, setJenisBarang] = useState<'obat' | 'alkes' | 'inventaris'>('obat');

    // State for rejection functionality
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [itemToReject, setItemToReject] = useState<any>(null);

    // State for checkbox selection
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

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
    const filteredPermintaanBarang =
        request?.filter((item) => {
            const q = searchTerm.toLowerCase();
            const statusInfo = getStatusInfo(item.status);
            return (
                item.kode_request?.toLowerCase().includes(q) ||
                item.kode_klinik?.toLowerCase().includes(q) ||
                item.nama_klinik?.toLowerCase().includes(q) ||
                statusInfo.label.toLowerCase().includes(q)
            );
        }) || [];

    // Filter dabar based on search term and jenis_barang
    const filteredDabar =
        dabar
            ?.filter((barang) => {
                const q = searchObat.toLowerCase();
                const matchesSearch = barang.nama?.toLowerCase().includes(q) || barang.kode?.toLowerCase().includes(q);
                // For jenis_barang filtering, we need to handle the different values that might come from backend
                const barangJenis = barang.jenis_barang?.toLowerCase();
                const matchesJenisBarang = jenisBarang === 'obat' ? barangJenis === 'farmasi' || barangJenis === 'obat' : barangJenis === jenisBarang;
                return matchesSearch && matchesJenisBarang;
            })
            .slice(0, 10) || [];

    // Handle removing an item row
    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
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
                toast.error(data.message || 'Gagal menggenerate kode request');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menggenerate kode request');
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
                toast.error(data.message || 'Gagal mengambil detail permintaan barang');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengambil detail permintaan barang');
        }
    };

    const fetchPermintaanKonfirmasiDetail = async (kodeRequest: string) => {
        try {
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch(`/api/permintaan-barang/get-detail/${kodeRequest}`, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (data.success) {
                if (data.details && data.details.length > 0) {
                    // Get the first item to extract the main request data
                    const firstItem = data.details[0];

                    // Transform the data to match the expected structure
                    const formattedData = {
                        kode_request: firstItem.kode_request,
                        tanggal_request: firstItem.tanggal_request,
                        nama_klinik: firstItem.nama_klinik,
                        details: data.details.map((item: any) => ({
                            ...item,
                            kode_obat_alkes: item.kode_obat_alkes || '',
                            nama_obat_alkes: item.nama_obat_alkes || '',
                            qty: item.qty || 0,
                            expired: item.expired || '-',
                        })),
                    };

                    setSelectedKonfirmasi(formattedData);
                    setShowKonfirmasiDetailModal(true);
                } else {
                    toast.error('Tidak ada detail permintaan yang ditemukan');
                }
            } else {
                toast.error(data.message || 'Gagal mengambil detail permintaan barang konfirmasi');
            }
        } catch (error) {
            console.error('Error fetching confirmation details:', error);
            toast.error('Terjadi kesalahan saat mengambil detail permintaan barang konfirmasi');
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
            toast.error('Kode request harus diisi');
            return;
        }

        // Validate items
        if (items.length === 0) {
            toast.error('Minimal harus ada satu item');
            return;
        }

        const invalidItem = items.find(
            (item) => !item.kode_barang || !item.nama_barang || item.jumlah <= 0 || (item.jenis_barang !== 'inventaris' && !item.satuan),
        );

        if (invalidItem) {
            toast.error('Semua field item harus diisi dengan benar');
            return;
        }

        // Get web settings from page props
        const webSetting = pageProps.webSetting || {};

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        router.post(
            route('gudang.permintaan-barang.store'),
            {
                kode_request: kodeRequest.trim(),
                kode_klinik: webSetting.kode_klinik || '',
                nama_klinik: webSetting.nama || '',
                status: 0, // 0 = pending

                items: items.map((item) => ({
                    ...item,
                    jumlah: Number(item.jumlah),
                })),
            },
            {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                onSuccess: () => {
                    setShowCreateModal(false);
                    setKodeRequest('');

                    setItems([{ kode_barang: '', nama_barang: '', jumlah: 1, satuan: '', jenis_barang: 'obat' } as PermintaanItem]);

                    // Success message will be shown via flash messages in useEffect
                },
                onError: (errors: any) => {
                    // Validation errors will be shown via flash messages in useEffect
                    // No need for direct toast notifications here
                },
            },
        );
    };

    // Handle terima semua items
    const handleTerimaSemua = async () => {
        if (!selectedKonfirmasi || !selectedKonfirmasi.kode_request || !selectedKonfirmasi.details) {
            toast.error('Data permintaan tidak valid');
            return;
        }

        try {
            const response = await fetch('/api/permintaan-barang/terima-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    kode_request: selectedKonfirmasi.kode_request,
                    items: selectedKonfirmasi.details,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setShowKonfirmasiDetailModal(false);
                // Refresh the data
                window.location.reload();
            } else {
                toast.error(result.message || 'Gagal menerima data');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Terjadi kesalahan saat menerima data');
        }
    };

    // Handle reject button click
    const handleTolakPermintaan = (item: any) => {
        setItemToReject(item);
        setShowRejectDialog(true);
    };

    // Confirm rejection
    const confirmReject = async () => {
        if (!itemToReject || !itemToReject.id) return;

        setIsRejecting(true);
        try {
            const response = await fetch(`/api/permintaan-barang/tolak-data/${itemToReject.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setShowRejectDialog(false);
                setItemToReject(null);
                // Refresh the data
                window.location.reload();
            } else {
                toast.error(result.message || 'Gagal menolak data');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Terjadi kesalahan saat menolak data');
        } finally {
            setIsRejecting(false);
        }
    };

    // Handle reject all
    const handleTolakSemua = async () => {
        // Check if we have a kode_request for bulk rejection
        if (itemToReject && itemToReject.kode_request) {
            setIsRejecting(true);
            try {
                const response = await fetch('/api/permintaan-barang/tolak-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        kode_request: itemToReject.kode_request,
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    toast.success(result.message);
                    setShowRejectDialog(false);
                    setShowKonfirmasiDetailModal(false);
                    setItemToReject(null);
                    // Refresh the data
                    window.location.reload();
                } else {
                    toast.error(result.message || 'Gagal menolak semua data');
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Terjadi kesalahan saat menolak semua data');
            } finally {
                setIsRejecting(false);
            }
        } else {
            toast.error('Tidak ada data untuk ditolak');
            setShowRejectDialog(false);
        }
    };

    // Handle reject all button click
    const handleTolakSemuaClick = () => {
        setItemToReject({ kode_request: selectedKonfirmasi?.kode_request });
        setShowRejectDialog(true);
    };

    // Checkbox helper functions
    const handleSelectAll = (checked: boolean) => {
        if (checked && selectedKonfirmasi?.details) {
            const allIndexes = new Set<number>(selectedKonfirmasi.details.map((_: any, index: number) => index));
            setSelectedItems(allIndexes);
        } else {
            setSelectedItems(new Set<number>());
        }
    };

    const handleSelectItem = (index: number, checked: boolean) => {
        const newSelected = new Set(selectedItems);
        if (checked) {
            newSelected.add(index);
        } else {
            newSelected.delete(index);
        }
        setSelectedItems(newSelected);
    };

    const isAllSelected = selectedKonfirmasi?.details
        ? selectedItems.size === selectedKonfirmasi.details.length && selectedKonfirmasi.details.length > 0
        : false;

    const isIndeterminate = selectedItems.size > 0 && selectedItems.size < (selectedKonfirmasi?.details?.length || 0);

    // Individual accept function
    const handleTerimaItem = async (item: any, index: number) => {
        if (!selectedKonfirmasi?.kode_request) {
            toast.error('Data permintaan tidak valid');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/permintaan-barang/terima-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    kode_request: selectedKonfirmasi.kode_request,
                    item: item,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Item berhasil diterima');
                // Remove from selected items
                const newSelected = new Set(selectedItems);
                newSelected.delete(index);
                setSelectedItems(newSelected);
                // Refresh the data
                window.location.reload();
            } else {
                toast.error(result.message || 'Gagal menerima item');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Terjadi kesalahan saat menerima item');
        } finally {
            setIsProcessing(false);
        }
    };

    // Individual reject function
    const handleTolakItem = async (item: any, index: number) => {
        if (!selectedKonfirmasi?.kode_request) {
            toast.error('Data permintaan tidak valid');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/permintaan-barang/tolak-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    kode_request: selectedKonfirmasi.kode_request,
                    item: item,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Item berhasil ditolak');
                // Remove from selected items
                const newSelected = new Set(selectedItems);
                newSelected.delete(index);
                setSelectedItems(newSelected);
                // Refresh the data
                window.location.reload();
            } else {
                toast.error(result.message || 'Gagal menolak item');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Terjadi kesalahan saat menolak item');
        } finally {
            setIsProcessing(false);
        }
    };

    // Bulk accept selected items
    const handleTerimaSelected = async () => {
        if (selectedItems.size === 0) {
            toast.error('Pilih minimal satu item untuk diterima');
            return;
        }

        if (!selectedKonfirmasi?.kode_request || !selectedKonfirmasi?.details) {
            toast.error('Data permintaan tidak valid');
            return;
        }

        const selectedItemsData = Array.from(selectedItems).map((index) => selectedKonfirmasi.details[index]);

        setIsProcessing(true);
        try {
            const response = await fetch('/api/permintaan-barang/terima-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    kode_request: selectedKonfirmasi.kode_request,
                    items: selectedItemsData,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Item terpilih berhasil diterima');
                setSelectedItems(new Set());
                setShowKonfirmasiDetailModal(false);
                // Refresh the data
                window.location.reload();
            } else {
                toast.error(result.message || 'Gagal menerima item terpilih');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Terjadi kesalahan saat menerima item terpilih');
        } finally {
            setIsProcessing(false);
        }
    };

    // Bulk reject selected items
    const handleTolakSelected = async () => {
        if (selectedItems.size === 0) {
            toast.error('Pilih minimal satu item untuk ditolak');
            return;
        }

        if (!selectedKonfirmasi?.kode_request || !selectedKonfirmasi?.details) {
            toast.error('Data permintaan tidak valid');
            return;
        }

        const selectedItemsData = Array.from(selectedItems).map((index) => selectedKonfirmasi.details[index]);

        setIsProcessing(true);
        try {
            const response = await fetch('/api/permintaan-barang/tolak-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    kode_request: selectedKonfirmasi.kode_request,
                    items: selectedItemsData,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Item terpilih berhasil ditolak');
                setSelectedItems(new Set());
                setShowKonfirmasiDetailModal(false);
                // Refresh the data
                window.location.reload();
            } else {
                toast.error(result.message || 'Gagal menolak item terpilih');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Terjadi kesalahan saat menolak item terpilih');
        } finally {
            setIsProcessing(false);
        }
    };

    // Clear selected items when modal closes
    useEffect(() => {
        if (!showKonfirmasiDetailModal) {
            setSelectedItems(new Set());
        }
    }, [showKonfirmasiDetailModal]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <div className="mb-6 flex items-center justify-end">
                    <Button
                        onClick={() => {
                            setShowCreateModal(true);
                            // Generate kode request otomatis saat membuka modal
                            generateKodeRequest();
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Permintaan Baru
                    </Button>
                </div>

                {/* Create Modal menggunakan Dialog Component */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Permintaan Obat</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit}>
                            {/* Stepper Header */}
                            <div className="bs-stepper mb-4">
                                <div className="bs-stepper-header mb-6 flex justify-between" role="tablist">
                                    {/* Step 1: Pilih Koneksi */}
                                    <div className={`step flex items-center ${currentStep === 1 ? 'active' : ''}`} data-target="#koneksiExternal">
                                        <button
                                            type="button"
                                            className={`step-trigger flex items-center ${currentStep === 1 ? 'font-bold text-blue-600' : 'text-gray-500'}`}
                                            role="tab"
                                            aria-controls="koneksiExternal"
                                            id="koneksiExternal-trigger"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            <span
                                                className={`bs-stepper-circle flex h-8 w-8 items-center justify-center rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                            >
                                                1
                                            </span>
                                            <span className="bs-stepper-label ml-2">Pilih Koneksi (Gudang Utama)</span>
                                        </button>
                                    </div>
                                    <div className="line mx-2 flex flex-1 items-center">
                                        <div className="h-px w-full bg-gray-300"></div>
                                    </div>
                                    {/* Step 2: Permintaan Obat */}
                                    <div className={`step flex items-center ${currentStep === 2 ? 'active' : ''}`} data-target="#requestObatAlkes">
                                        <button
                                            type="button"
                                            className={`step-trigger flex items-center ${currentStep === 2 ? 'font-bold text-blue-600' : 'text-gray-500'}`}
                                            role="tab"
                                            aria-controls="requestObatAlkes"
                                            id="requestObatAlkes-trigger"
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            <span
                                                className={`bs-stepper-circle flex h-8 w-8 items-center justify-center rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                            >
                                                2
                                            </span>
                                            <span className="bs-stepper-label ml-2">Permintaan Barang</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bs-stepper-content">
                                    {/* Step 1: Koneksi External Database */}
                                    {currentStep === 1 && (
                                        <div id="koneksiExternal" className="content" role="tabpanel" aria-labelledby="koneksiExternal-trigger">
                                            <div className="form-group row mb-4">
                                                <div className="col-sm-12">
                                                    <label htmlFor="external_database" className="mb-1 block text-xs font-medium">
                                                        Pilih Tujuan
                                                    </label>
                                                    <select
                                                        className="form-control w-full rounded border p-2 dark:bg-background"
                                                        id="external_database"
                                                        name="external_database"
                                                        value={externalDatabase}
                                                        onChange={(e) => setExternalDatabase(e.target.value)}
                                                    >
                                                        <option value="" disabled>
                                                            Pilih Nama Tujuan
                                                        </option>
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
                                                        <label htmlFor="kode_request" className="mb-1 block text-xs font-medium text-gray-700">
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

                                                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                                    <div className="md:col-span-1">
                                                        <label htmlFor="jenis_barang" className="mb-2 block text-xs font-medium text-gray-700">
                                                            Jenis Barang
                                                        </label>
                                                        <Select
                                                            value={jenisBarang}
                                                            onValueChange={(value: 'obat' | 'alkes' | 'inventaris') => setJenisBarang(value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Jenis Barang" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="obat">Obat</SelectItem>
                                                                <SelectItem value="alkes">Alkes</SelectItem>
                                                                <SelectItem value="inventaris">Inventaris</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <label htmlFor="nama_obat_alkes" className="mb-2 block text-xs font-medium text-gray-700">
                                                            Data Barang
                                                        </label>
                                                        <Select value={selectedObat} onValueChange={setSelectedObat}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Barang" />
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
                                                                    filteredDabar.map((barang) => (
                                                                        <SelectItem key={barang.kode} value={barang.kode}>
                                                                            <div className="flex flex-col">
                                                                                <div className="font-medium" title={barang.nama}>
                                                                                    {barang.nama.length > 20
                                                                                        ? `${barang.nama.substring(0, 20)}...`
                                                                                        : barang.nama}
                                                                                </div>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-2 text-center text-muted-foreground">
                                                                        {searchObat ? 'Tidak ada obat/alkes ditemukan' : 'Tidak ada data obat/alkes'}
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Total: {dabar.length} barang
                                                            {searchObat && (
                                                                <span className="ml-1">(Ditemukan {filteredDabar.length} obat/alkes)</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-1">
                                                        <label htmlFor="jumlah_obat_alkes" className="mb-2 block text-xs font-medium text-gray-700">
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

                                                    <div className="flex items-center md:col-span-1">
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                // Ambil nilai dari select dan input
                                                                const jumlahElement = document.getElementById(
                                                                    'jumlah_obat_alkes',
                                                                ) as HTMLInputElement;

                                                                const jumlah = parseInt(jumlahElement.value) || 1;

                                                                // Cari barang berdasarkan kode
                                                                const selectedBarang = dabar.find((b) => b.kode === selectedObat);

                                                                if (selectedBarang) {
                                                                    // Cek apakah item sudah ada dalam daftar
                                                                    const existingItemIndex = items.findIndex(
                                                                        (item) => item.kode_barang === selectedBarang.kode,
                                                                    );

                                                                    if (existingItemIndex !== -1) {
                                                                        // Jika item sudah ada, tambahkan jumlahnya
                                                                        setItems((prevItems) => {
                                                                            const updatedItems = [...prevItems];
                                                                            updatedItems[existingItemIndex] = {
                                                                                ...updatedItems[existingItemIndex],
                                                                                jumlah: updatedItems[existingItemIndex].jumlah + jumlah,
                                                                            };
                                                                            return updatedItems;
                                                                        });
                                                                        toast.success(`Jumlah ${selectedBarang.nama} berhasil ditambahkan`);
                                                                    } else {
                                                                        // Jika item belum ada, tambahkan item baru
                                                                        // Use the manually selected jenis_barang if the barang doesn't have a jenis_barang or if we want to override it
                                                                        const newItem: PermintaanItem = {
                                                                            kode_barang: selectedBarang.kode,
                                                                            nama_barang: selectedBarang.nama,
                                                                            jumlah: jumlah,
                                                                            satuan:
                                                                                selectedBarang.satuan_kecil ||
                                                                                selectedBarang.satuan_sedang ||
                                                                                selectedBarang.satuan_besar ||
                                                                                selectedBarang.satuan ||
                                                                                '',
                                                                            jenis_barang: selectedBarang.jenis_barang
                                                                                ? selectedBarang.jenis_barang === 'farmasi' ||
                                                                                  selectedBarang.jenis_barang === 'obat'
                                                                                    ? 'obat'
                                                                                    : selectedBarang.jenis_barang === 'alkes'
                                                                                      ? 'alkes'
                                                                                      : 'inventaris'
                                                                                : jenisBarang,
                                                                        };

                                                                        setItems((prevItems) => [...prevItems, newItem]);
                                                                    }

                                                                    // Reset form
                                                                    setSelectedObat('');
                                                                    setSearchObat('');
                                                                    jumlahElement.value = '1';
                                                                } else {
                                                                    toast.error('Silakan pilih barang terlebih dahulu');
                                                                }
                                                            }}
                                                            className="w-full md:w-auto"
                                                            disabled={!selectedObat}
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
                                                                    <TableHead>Kode Barang</TableHead>
                                                                    <TableHead>Nama Barang</TableHead>
                                                                    <TableHead>Jenis Barang</TableHead>
                                                                    <TableHead>Jumlah</TableHead>
                                                                    <TableHead className="text-right">Aksi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {items.map((item, index) => (
                                                                    <TableRow key={`${item.kode_barang}-${index}`}>
                                                                        <TableCell>{index + 1}</TableCell>
                                                                        <TableCell>{item.kode_barang}</TableCell>
                                                                        <TableCell>{item.nama_barang}</TableCell>
                                                                        <TableCell>
                                                                            <span
                                                                                className={`rounded-full px-2 py-1 text-xs font-medium ${item.jenis_barang === 'obat' ? 'bg-blue-100 text-blue-800' : item.jenis_barang === 'alkes' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}
                                                                            >
                                                                                {item.jenis_barang.charAt(0).toUpperCase() +
                                                                                    item.jenis_barang.slice(1)}
                                                                            </span>
                                                                        </TableCell>
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
                                                                    <TableRow key="empty-items">
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
                                                    <Button type="submit">Kirim</Button>
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
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode Request</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="w-32 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data_kirim && data_kirim.length > 0 ? (
                                        data_kirim.map((item: any, index: number) => (
                                            <TableRow key={`${item.kode_request}-${index}`} className="text-xs">
                                                <TableCell>{item.kode_request}</TableCell>
                                                <TableCell>{formatDate(item.tanggal_request)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        onClick={() => fetchPermintaanKonfirmasiDetail(item.kode_request)}
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" /> Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow key="empty-data-kirim">
                                            <TableCell colSpan={5} className="text-center">
                                                Tidak ada data permintaan yang menunggu persetujuan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Data Menunggu Persetujuan Permintaan Obat */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Data Persetujuan Permintaan Barang</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode Request</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="w-32 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPermintaanBarang.length > 0 ? (
                                        filteredPermintaanBarang.map((item, index) => (
                                            <TableRow key={`${item.id || item.kode_request}-${index}`} className="text-xs">
                                                <TableCell>{item.kode_request}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[0.65rem] font-medium ${getStatusInfo(item.status).className}`}
                                                    >
                                                        {getStatusInfo(item.status).label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{formatDate(item.tanggal_input)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button size="xs" variant="outline" onClick={() => fetchPermintaanDetail(item.kode_request)}>
                                                        <Eye className="mr-1 h-4 w-4" /> Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow key="empty-filtered-permintaan">
                                            <TableCell colSpan={5} className="text-center">
                                                Tidak ada data permintaan obat.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Detail Modal for Regular Permintaan */}
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>Detail Permintaan Barang</DialogTitle>
                            <DialogDescription>Kode Request: {selectedPermintaan?.kode_request}</DialogDescription>
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
                                                <TableHead>Jenis Barang</TableHead>
                                                <TableHead className="text-right">Jumlah</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedPermintaan.details && selectedPermintaan.details.length > 0 ? (
                                                selectedPermintaan.details.map((item: any, index: number) => (
                                                    <TableRow key={`${item.kode_barang}-${index}`}>
                                                        <TableCell className="text-center">{index + 1}</TableCell>
                                                        <TableCell>{item.kode_barang}</TableCell>
                                                        <TableCell>{item.nama_barang}</TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-medium ${item.jenis_barang === 'obat' ? 'bg-blue-100 text-blue-800' : item.jenis_barang === 'alkes' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}
                                                            >
                                                                {item.jenis_barang?.charAt(0).toUpperCase() + item.jenis_barang?.slice(1)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">{item.jumlah}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow key="empty-selected-permintaan-details">
                                                    <TableCell colSpan={8} className="text-center">
                                                        Tidak ada detail item.
                                                    </TableCell>
                                                </TableRow>
                                            )}
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

                {/* Detail Modal for Konfirmasi Permintaan */}
                <Dialog open={showKonfirmasiDetailModal} onOpenChange={setShowKonfirmasiDetailModal}>
                    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>Detail Konfirmasi Permintaan Barang</DialogTitle>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Kode Request:</span>
                                    <span>{selectedKonfirmasi?.kode_request || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Tanggal Input:</span>
                                    <span>{selectedKonfirmasi?.tanggal_request ? formatDate(selectedKonfirmasi.tanggal_request) : '-'}</span>
                                </div>
                            </div>
                        </DialogHeader>

                        {selectedKonfirmasi && (
                            <div className="space-y-4">
                                {/* Detail Items */}
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={isAllSelected}
                                                        onCheckedChange={handleSelectAll}
                                                        ref={(el) => {
                                                            if (el && el.querySelector('input')) {
                                                                const input = el.querySelector('input') as HTMLInputElement;
                                                                input.indeterminate = isIndeterminate;
                                                            }
                                                        }}
                                                    />
                                                </TableHead>
                                                <TableHead>No</TableHead>
                                                <TableHead>Kode Barang</TableHead>
                                                <TableHead>Nama Barang</TableHead>
                                                <TableHead>Jenis Barang</TableHead>
                                                <TableHead>Jumlah</TableHead>
                                                <TableHead>Expired</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedKonfirmasi.details && selectedKonfirmasi.details.length > 0 ? (
                                                selectedKonfirmasi.details.map((item: any, index: number) => (
                                                    <TableRow key={`${item.kode_obat_alkes}-${index}`}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedItems.has(index)}
                                                                onCheckedChange={(checked) => handleSelectItem(index, checked as boolean)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">{index + 1}</TableCell>
                                                        <TableCell>{item.kode_obat_alkes}</TableCell>
                                                        <TableCell>{item.nama_obat_alkes}</TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-medium ${!item.jenis_barang ? 'bg-gray-100 text-gray-800' : item.jenis_barang === 'obat' ? 'bg-blue-100 text-blue-800' : item.jenis_barang === 'alkes' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}
                                                            >
                                                                {item.jenis_barang
                                                                    ? item.jenis_barang.charAt(0).toUpperCase() + item.jenis_barang.slice(1)
                                                                    : 'Tidak Diketahui'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{item.qty}</TableCell>
                                                        <TableCell>{formatDate(item.expired)}</TableCell>
                                                        <TableCell className="flex justify-center gap-2">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-red-500 font-medium text-white hover:bg-red-600"
                                                                onClick={() => handleTolakItem(item, index)}
                                                                disabled={isProcessing}
                                                            >
                                                                Tolak
                                                            </Button>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-green-500 font-medium text-white hover:bg-green-600"
                                                                onClick={() => handleTerimaItem(item, index)}
                                                                disabled={isProcessing}
                                                            >
                                                                Terima
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow key="empty-selected-konfirmasi-details">
                                                    <TableCell colSpan={8} className="text-center">
                                                        Tidak ada detail item.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <DialogFooter className="flex flex-wrap gap-2">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleTerimaSelected}
                                            className="bg-green-600 text-white hover:bg-green-700"
                                            disabled={selectedItems.size === 0 || isProcessing}
                                        >
                                            Terima Terpilih ({selectedItems.size})
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleTolakSelected}
                                            className="bg-red-600 text-white hover:bg-red-700"
                                            disabled={selectedItems.size === 0 || isProcessing}
                                        >
                                            Tolak Terpilih ({selectedItems.size})
                                        </Button>
                                    </div>
                                    <Button variant="outline" onClick={() => setShowKonfirmasiDetailModal(false)}>
                                        Tutup
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Reject Confirmation Dialog */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Penolakan</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menolak permintaan ini? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={confirmReject} disabled={isRejecting}>
                                {isRejecting ? 'Memproses...' : 'Tolak Permintaan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

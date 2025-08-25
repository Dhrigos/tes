'use client';

import LaravoltIndonesiaExample from '@/components/LaravoltIndonesiaExample';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit, Eye, Plus, Search, Stethoscope, Trash2, User, UserCheck, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Perawat {
    id: number;
    nama?: string;
    profile?: string;
    nik?: string;
    npwp?: string;
    tgl_masuk?: string;
    status_pegawaian?: number;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    alamat?: string;
    rt?: string;
    rw?: string;
    kode_pos?: string;
    kewarganegaraan?: string;
    seks?: 'L' | 'P';
    agama?: number;
    pendidikan?: number;
    goldar?: number;
    pernikahan?: number;
    telepon?: string;
    provinsi_kode?: string;
    kabupaten_kode?: string;
    kecamatan_kode?: string;
    desa_kode?: string;
    suku?: number;
    bahasa?: number;
    bangsa?: number;
    users?: number;
    user_id_input?: number;
    user_name_input?: string;
    verifikasi?: string;
    // Relasi
    namauser?: {
        id: number;
        name: string;
    };
    namastatuspegawai?: {
        id: number;
        nama: string;
    };
    // Data untuk editing alamat
    provinsi_data?: {
        id: number;
        name: string;
        code: string;
    };
    kabupaten_data?: {
        id: number;
        name: string;
        code: string;
    };
    kecamatan_data?: {
        id: number;
        name: string;
        code: string;
    };
    desa_data?: {
        id: number;
        name: string;
        code: string;
    };
}

interface PageProps {
    perawats: {
        data: Perawat[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totalPerawat: number;
    perawatVerifikasi: number;
    perawatBelumVerifikasi: number;
    perawatBulanIni: number;
    posker: Array<{ id: number; nama: string }>;
    provinsi: Array<{ id: number; name: string; code: string }>;
    kelamin: Array<{ id: number; nama: string }>;
    goldar: Array<{ id: number; nama: string; rhesus?: string }>;
    pernikahan: Array<{ id: number; nama: string }>;
    agama: Array<{ id: number; nama: string }>;
    pendidikan: Array<{ id: number; nama: string }>;
    suku: Array<{ id: number; nama: string }>;
    bangsa: Array<{ id: number; nama: string }>;
    bahasa: Array<{ id: number; nama: string }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Modul SDM', href: '' },
    { title: 'Data Perawat', href: '' },
];

export default function PerawatIndex() {
    const {
        perawats,
        totalPerawat,
        perawatVerifikasi,
        perawatBelumVerifikasi,
        perawatBulanIni,
        posker,
        provinsi,
        kelamin,
        goldar,
        pernikahan,
        agama,
        pendidikan,
        suku,
        bangsa,
        bahasa,
        flash,
        errors,
    } = usePage().props as unknown as PageProps & {
        errors?: any;
    };

    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'show'>('create');
    const [selectedPerawat, setSelectedPerawat] = useState<Perawat | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        nama: '',
        nik: '',
        npwp: '',
        tgl_masuk: '',
        status_pegawaian: '',
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        rt: '001',
        rw: '002',
        kode_pos: '',
        alamat: '',
        seks: '',
        goldar: '',
        pernikahan: '',
        kewarganegaraan: '',
        agama: '',
        pendidikan: '',
        telepon: '',
        suku: '',
        bangsa: '',
        bahasa: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        profile: null as File | null,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const stats = [
        { label: 'Total Perawat', value: totalPerawat, icon: Users, color: 'bg-blue-500' },
        { label: 'Terverifikasi', value: perawatVerifikasi, icon: UserCheck, color: 'bg-green-500' },
        { label: 'Belum Verifikasi', value: perawatBelumVerifikasi, icon: User, color: 'bg-red-500' },
        { label: 'Bulan Ini', value: perawatBulanIni, icon: Stethoscope, color: 'bg-purple-500' },
    ];

    const filteredPerawats = perawats.data.filter(
        (perawat: Perawat) =>
            (perawat.user_name_input || '').toLowerCase().includes(search.toLowerCase()) ||
            (perawat.namauser?.name || '').toLowerCase().includes(search.toLowerCase()),
    );

    // Helper functions
    const resetForm = () => {
        setFormData({
            nama: '',
            nik: '',
            npwp: '',
            tgl_masuk: '',
            status_pegawaian: '',
            provinsi: '',
            kabupaten: '',
            kecamatan: '',
            desa: '',
            rt: '001',
            rw: '002',
            kode_pos: '',
            alamat: '',
            seks: '',
            goldar: '',
            pernikahan: '',
            kewarganegaraan: '',
            agama: '',
            pendidikan: '',
            telepon: '',
            suku: '',
            bangsa: '',
            bahasa: '',
            tempat_lahir: '',
            tanggal_lahir: '',
            profile: null,
        });
        setCurrentStep(1);
        setImagePreview(null);
    };

    // Tidak ada pengisian otomatis saat ini; hanya menampilkan hasil

    const fillFormWithPerawat = (perawat: Perawat) => {
        setFormData({
            nama: perawat.user_name_input || '',
            nik: perawat.nik || '',
            npwp: perawat.npwp || '',
            tgl_masuk: perawat.tgl_masuk || '',
            status_pegawaian: perawat.status_pegawaian?.toString() || '',
            provinsi: perawat.provinsi_data?.code || perawat.provinsi_data?.id.toString() || '',
            kabupaten: perawat.kabupaten_data?.code || perawat.kabupaten_data?.id.toString() || '',
            kecamatan: perawat.kecamatan_data?.code || perawat.kecamatan_data?.id.toString() || '',
            desa: perawat.desa_data?.code || perawat.desa_data?.id.toString() || '',
            rt: perawat.rt || '001',
            rw: perawat.rw || '002',
            kode_pos: perawat.kode_pos || '',
            alamat: perawat.alamat || '',
            seks: perawat.seks || '',
            goldar: perawat.goldar?.toString() || '',
            pernikahan: perawat.pernikahan?.toString() || '',
            kewarganegaraan: perawat.kewarganegaraan || '',
            agama: perawat.agama?.toString() || '',
            pendidikan: perawat.pendidikan?.toString() || '',
            telepon: perawat.telepon || '',
            suku: perawat.suku?.toString() || '',
            bangsa: perawat.bangsa?.toString() || '',
            bahasa: perawat.bahasa?.toString() || '',
            tempat_lahir: perawat.tempat_lahir || '',
            tanggal_lahir: perawat.tanggal_lahir || '',
            profile: null,
        });
        setCurrentStep(1);
        setImagePreview(perawat.profile ? `/storage/perawat/${perawat.profile}` : null);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, profile: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Modal handlers
    const handleAdd = () => {
        setModalMode('create');
        setSelectedPerawat(null);
        resetForm();
        setModalOpen(true);
    };

    const handleEdit = (perawat: Perawat) => {
        setModalMode('edit');
        setSelectedPerawat(perawat);
        fillFormWithPerawat(perawat);
        setModalOpen(true);
    };

    const handleShow = (perawat: Perawat) => {
        setModalMode('show');
        setSelectedPerawat(perawat);
        fillFormWithPerawat(perawat);
        setModalOpen(true);
    };

    // Form handlers
    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (modalMode === 'show') return;

        const url = modalMode === 'edit' ? `/sdm/perawat/${selectedPerawat?.id}` : '/sdm/perawat';

        const submitData = new FormData();
        if (modalMode === 'edit') {
            submitData.append('_method', 'PUT');
        }

        // Append all form fields
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'profile' && value instanceof File) {
                submitData.append('profile', value);
            } else if (key !== 'profile' && value !== null) {
                submitData.append(key, value.toString());
            }
        });
        // Kirim juga kode wilayah untuk kompatibilitas backend
        if (formData.provinsi) submitData.append('provinsi_kode', formData.provinsi);
        if (formData.kabupaten) submitData.append('kabupaten_kode', formData.kabupaten);
        if (formData.kecamatan) submitData.append('kecamatan_kode', formData.kecamatan);
        if (formData.desa) submitData.append('desa_kode', formData.desa);

        router.post(url, submitData, {
            onSuccess: () => {
                toast.success(modalMode === 'edit' ? 'Data perawat berhasil diperbarui!' : 'Data perawat berhasil ditambahkan!');
                setModalOpen(false);
                setSelectedPerawat(null);
                resetForm();
            },
            onError: (errors) => {
                toast.error('Terjadi kesalahan saat menyimpan data!');
                console.error(errors);
            },
        });
    };

    const handleDelete = (perawat: Perawat) => {
        if (confirm(`Apakah Anda yakin ingin menghapus perawat ${perawat.user_name_input || perawat.nik}?`)) {
            router.delete(`/sdm/perawat/${perawat.id}`, {
                onSuccess: () => {
                    toast.success('Data perawat berhasil dihapus!');
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat menghapus data!');
                },
            });
        }
    };

    // Helper functions for formatting
    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getJenisKelamin = (jk: string | undefined) => {
        if (jk === 'L') return 'Laki-laki';
        if (jk === 'P') return 'Perempuan';
        return '-';
    };

    // Step navigation
    const steps = [
        { id: 1, label: 'Data Dasar' },
        { id: 2, label: 'Data Profesi' },
        { id: 3, label: 'Kontak & Status' },
    ];

    const nextStep = () => {
        if (currentStep < steps.length) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Modal title and actions
    const getModalTitle = () => {
        switch (modalMode) {
            case 'create':
                return 'Tambah Data Perawat';
            case 'edit':
                return 'Edit Data Perawat';
            case 'show':
                return `Detail Perawat - ${selectedPerawat?.user_name_input || 'N/A'}`;
            default:
                return 'Data Perawat';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Perawat - Modul SDM" />
            <div className="space-y-6 p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="rounded-2xl shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                                <stat.icon className={`h-6 w-6 rounded-md p-1 text-white ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Daftar Perawat</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Cari perawat..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 pl-10"
                                />
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Perawat
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>NIK</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Status Pegawaian</TableHead>
                                    <TableHead>Verifikasi</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPerawats.length > 0 ? (
                                    filteredPerawats.map((perawat) => (
                                        <TableRow key={perawat.id}>
                                            <TableCell className="font-medium">{perawat.nama || '-'}</TableCell>
                                            <TableCell>{perawat.nik || '-'}</TableCell>
                                            <TableCell>{perawat.telepon || '-'}</TableCell>
                                            <TableCell>{perawat.nama || '-'}</TableCell>
                                            <TableCell>{perawat.verifikasi || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleShow(perawat)} title="Lihat Detail">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleEdit(perawat)} title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(perawat)} title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                                            Tidak ada data perawat
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Modal Tambah Staff */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent
                        className="flex max-h-[90vh] w-[95vw] !max-w-5xl flex-col rounded-lg md:w-[80vw] lg:w-[70vw]"
                        aria-describedby={undefined}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between">
                            <DialogTitle className="text-xl font-semibold">
                                {modalMode === 'create' ? 'Tambah Staff' : modalMode === 'edit' ? 'Edit Staff' : 'Detail Staff'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="overflow-x-auto px-4 py-3">
                                <div className="flex items-center justify-center">
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                        {steps.map((step, idx, arr) => (
                                            <div key={step.id} className="flex items-center">
                                                <div
                                                    className={`flex items-center transition-colors ${
                                                        currentStep >= step.id
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                                                            currentStep >= step.id
                                                                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                                                                : 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                                                        }`}
                                                    >
                                                        {step.id}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium">{step.label}</span>
                                                </div>

                                                {idx < arr.length - 1 && (
                                                    <div
                                                        className={`mx-3 h-0.5 w-12 transition-colors ${
                                                            currentStep > step.id ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* STEP 1: Foto, Nama, NIK, NPWP, TTL */}
                                {currentStep === 1 && (
                                    <div className="flex flex-col gap-8 lg:flex-row">
                                        {/* Kolom Kiri: Foto + Data Utama */}
                                        <div className="lg:w-1/2">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed">
                                                    {imagePreview ? (
                                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="hidden"
                                                                id="staff-foto"
                                                            />
                                                            <label htmlFor="staff-foto" className="cursor-pointer">
                                                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">Upload Foto</p>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 gap-5">
                                                <div>
                                                    <Label htmlFor="nama">Nama Lengkap</Label>
                                                    <Input
                                                        id="nama"
                                                        value={formData.nama}
                                                        onChange={(e) => handleInputChange('nama', e.target.value)}
                                                        placeholder="Nama Lengkap"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="nik">Nomor NIK</Label>
                                                    <Input
                                                        id="nik"
                                                        value={formData.nik}
                                                        onChange={(e) => handleInputChange('nik', e.target.value)}
                                                        placeholder="Nomor NIK"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="npwp">Nomor NPWP</Label>
                                                    <Input
                                                        id="npwp"
                                                        value={formData.npwp}
                                                        onChange={(e) => handleInputChange('npwp', e.target.value)}
                                                        placeholder="Nomor NPWP"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pembatas antara kolom kiri dan kanan */}
                                        <div className="hidden items-stretch px-4 lg:flex">
                                            <div className="h-full border-l border-gray-300"></div>
                                        </div>

                                        {/* Kolom Kanan: Tempat & Tanggal Lahir */}
                                        <div className="lg:w-1/2 lg:pl-8">
                                            <div className="grid grid-cols-1 gap-5">
                                                <div>
                                                    <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                                                    <Input
                                                        id="tempat_lahir"
                                                        value={formData.tempat_lahir}
                                                        onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                                                        placeholder="Tempat Lahir"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                                                    <Input
                                                        id="tanggal_lahir"
                                                        type="date"
                                                        value={formData.tanggal_lahir}
                                                        onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Alamat */}
                                {currentStep === 2 && (
                                    <div className="flex">
                                        {/* Left Column - Address (match pasien layout) */}
                                        <div className="w-1/2 space-y-4 pr-5">
                                            <div>
                                                <h3 className="mb-3 text-base font-semibold">Alamat Lengkap</h3>
                                                <div className="space-y-3">
                                                    <LaravoltIndonesiaExample
                                                        provinces={provinsi}
                                                        selectedProvince={formData.provinsi}
                                                        selectedRegency={formData.kabupaten}
                                                        selectedDistrict={formData.kecamatan}
                                                        selectedVillage={formData.desa}
                                                        onProvinceChange={(value) => handleInputChange('provinsi', value)}
                                                        onRegencyChange={(value) => handleInputChange('kabupaten', value)}
                                                        onDistrictChange={(value) => handleInputChange('kecamatan', value)}
                                                        onVillageChange={(value) => handleInputChange('desa', value)}
                                                    />
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        <div className="grid grid-cols-6 gap-3 md:col-span-2">
                                                            <div className="col-span-2">
                                                                <Label htmlFor="rt">RT</Label>
                                                                <Input
                                                                    id="rt"
                                                                    value={formData.rt}
                                                                    onChange={(e) => handleInputChange('rt', e.target.value)}
                                                                    placeholder="001"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Label htmlFor="rw">RW</Label>
                                                                <Input
                                                                    id="rw"
                                                                    value={formData.rw}
                                                                    onChange={(e) => handleInputChange('rw', e.target.value)}
                                                                    placeholder="002"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Label htmlFor="kode_pos">Kode Pos</Label>
                                                                <Input
                                                                    id="kode_pos"
                                                                    value={formData.kode_pos}
                                                                    onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                                                                    placeholder="Kode Pos"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="alamat">Alamat</Label>
                                                        <Textarea
                                                            id="alamat"
                                                            value={formData.alamat}
                                                            onChange={(e) => handleInputChange('alamat', e.target.value)}
                                                            placeholder="Masukkan alamat"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Right Column - kosong agar mirip struktur pasien (bisa diisi nanti) */}
                                        <div className="w-1/2 border-l pl-5">
                                            <h3 className="mb-3 text-base font-semibold">Informasi Status & Kerja</h3>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="seks">Jenis Kelamin</Label>
                                                    <Select value={formData.seks} onValueChange={(value) => handleInputChange('seks', value)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Jenis Kelamin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="L">Laki-laki</SelectItem>
                                                            <SelectItem value="P">Perempuan</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="goldar">Golongan Darah</Label>
                                                    <Select value={formData.goldar} onValueChange={(value) => handleInputChange('goldar', value)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {goldar.map((g) => (
                                                                <SelectItem key={g.id} value={g.id.toString()}>
                                                                    {g.nama}
                                                                    {g.rhesus && g.rhesus.toLowerCase() !== 'tidak ada' ? ` ${g.rhesus}` : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="pernikahan">Status Pernikahan</Label>
                                                    <Select
                                                        value={formData.pernikahan}
                                                        onValueChange={(value) => handleInputChange('pernikahan', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pernikahan.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="kewarganegaraan">Kewarganegaraan</Label>
                                                    <Select
                                                        value={formData.kewarganegaraan}
                                                        onValueChange={(value) => handleInputChange('kewarganegaraan', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Indonesia">Indonesia</SelectItem>
                                                            <SelectItem value="Asing">Asing</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="status_pegawaian">Status Pegawai</Label>
                                                    <Select
                                                        value={formData.status_pegawaian}
                                                        onValueChange={(value) => handleInputChange('status_pegawaian', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- Pilih Status Pegawai ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {posker.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="tgl_masuk">Mulai Kerja Sejak</Label>
                                                    <Input
                                                        id="tgl_masuk"
                                                        type="date"
                                                        value={formData.tgl_masuk}
                                                        onChange={(e) => handleInputChange('tgl_masuk', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="pendidikan">Pendidikan</Label>
                                                    <Select
                                                        value={formData.pendidikan}
                                                        onValueChange={(value) => handleInputChange('pendidikan', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pendidikan.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="telepon">Telepon</Label>
                                                    <Input
                                                        id="telepon"
                                                        value={formData.telepon}
                                                        onChange={(e) => handleInputChange('telepon', e.target.value)}
                                                        placeholder="Telepon"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Sisanya (Profesi + Demografis) */}
                                {currentStep === 3 && (
                                    <div className="space-y-4 md:space-y-6">
                                        {/* Demografis */}
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="agama">Agama</Label>
                                                <Select value={formData.agama} onValueChange={(value) => handleInputChange('agama', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="--- pilih ---" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {agama.map((a) => (
                                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                                {a.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="suku">Suku</Label>
                                                <Select value={formData.suku} onValueChange={(value) => handleInputChange('suku', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Suku" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {suku.map((s) => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                                {s.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="bangsa">Bangsa</Label>
                                                <Select value={formData.bangsa} onValueChange={(value) => handleInputChange('bangsa', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Bangsa" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {bangsa.map((b) => (
                                                            <SelectItem key={b.id} value={b.id.toString()}>
                                                                {b.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="bahasa">Bahasa</Label>
                                                <Select value={formData.bahasa} onValueChange={(value) => handleInputChange('bahasa', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Bahasa" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {bahasa.map((b) => (
                                                            <SelectItem key={b.id} value={b.id.toString()}>
                                                                {b.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : setModalOpen(false))}
                            >
                                Kembali
                            </Button>

                            {currentStep < steps.length && (
                                <Button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
                                    Lanjut
                                </Button>
                            )}

                            {currentStep === steps.length && (
                                <Button type="submit" onClick={handleSubmit}>
                                    Simpan
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

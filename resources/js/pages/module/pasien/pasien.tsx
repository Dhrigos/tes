'use client';

import LaravoltIndonesiaExample from '@/components/LaravoltIndonesiaExample';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, Edit, Plus, RefreshCcw, Search, User, UserCheck, UserX, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Pasien {
    id: number;
    no_rm: string;
    nik?: string;
    nama: string;
    no_bpjs: string;
    tempat_lahir?: string;
    tanggal_lahir: string;
    alamat?: string;
    telepon: string;
    verifikasi: number;
    rt?: string;
    rw?: string;
    kode_pos?: string;
    provinsi_kode?: string;
    kabupaten_kode?: string;
    kecamatan_kode?: string;
    desa_kode?: string;
    seks?: string;
    goldar?: string;
    goldar_relation?: { id: number; nama: string; rhesus: string };
    pernikahan?: string;
    kewarganegaraan?: string;
    agama?: string;
    pendidikan?: string;
    pekerjaan?: string;
    suku?: string;
    bangsa?: string;
    bahasa?: string;
    kode_ihs?: string;
    jenis_peserta_bpjs?: string;
    kelas_bpjs?: string;
    provide?: string;
    kodeprovide?: string;
    hubungan_keluarga?: string;
    tgl_exp_bpjs?: string;
    penjamin_2_nama?: string;
    penjamin_2_no?: string;
    penjamin_3_nama?: string;
    penjamin_3_no?: string;
    foto?: string;
}

interface PageProps {
    pasiens: {
        data: Pasien[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    pasienallold: number;
    pasienallnewnow: number;
    pasienall: number;
    pasiennoverif: number;
    provinsi: Array<{ id: number; name: string; code: string }>;
    kelamin: Array<{ id: number; nama: string }>;
    goldar: Array<{ id: number; nama: string; rhesus: string }>;
    pernikahan: Array<{ id: number; nama: string }>;
    agama: Array<{ id: number; nama: string }>;
    pendidikan: Array<{ id: number; nama: string }>;
    pekerjaan: Array<{ id: number; name: string }>;
    suku: Array<{ id: number; nama: string }>;
    bangsa: Array<{ id: number; nama: string }>;
    bahasa: Array<{ id: number; nama: string }>;
    asuransi: Array<{ id: number; nama: string }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pasien', href: '/pasien' }];

export default function PendaftaranPasien() {
    const {
        pasiens,
        pasienallold,
        pasienallnewnow,
        pasienall,
        pasiennoverif,
        provinsi,
        kelamin,
        goldar,
        pernikahan,
        agama,
        pendidikan,
        pekerjaan,
        suku,
        bangsa,
        bahasa,
        asuransi,
        flash,
        errors,
    } = usePage().props as unknown as PageProps & { errors?: any };

    const [search, setSearch] = useState('');
    const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [formLengkapi, setFormLengkapi] = useState({
        nomor_rm: '',
        nama: '',
        nik: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        rt: '',
        rw: '',
        kode_pos: '',
        alamat: '',
        noka: '',
        noihs: '',
        jenis_kartu: '',
        kelas: '',
        provide: '',
        kodeprovide: '',
        hubungan_keluarga: '',
        tgl_exp_bpjs: '',
        seks: '',
        goldar: '',
        pernikahan: '',
        kewarganegaraan: '',
        agama: '',
        pendidikan: '',
        status_kerja: '',
        telepon: '',
        suku: '',
        bangsa: '',
        bahasa: '',
        penjamin_2: '',
        penjamin_2_info: '',
        penjamin_3: '',
        penjamin_3_info: '',
        aktif_penjamin_2: false,
        aktif_penjamin_3: false,
        profile_image: null as File | null,
    });

    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(formLengkapi.tanggal_lahir ? new Date(formLengkapi.tanggal_lahir) : undefined);
    const [openBpjs, setOpenBpjs] = useState(false);
    const [openTambah, setOpenTambah] = useState(false);
    const [baruStep, setBaruStep] = useState(1);
    const [namaBaru, setNamaBaru] = useState('');
    const [nikBaru, setNikBaru] = useState('');
    const [tglLahirBaru, setTglLahirBaru] = useState('');
    const [kelaminBaru, setKelaminBaru] = useState<string>('');
    const [teleponBaru, setTeleponBaru] = useState('');
    const [alamatBaru, setAlamatBaru] = useState('');
    const [goldarBaru, setGoldarBaru] = useState<string>('');
    const [pernikahanBaru, setPernikahanBaru] = useState<string>('');
    const [fotoBaru, setFotoBaru] = useState<File | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        if (formLengkapi.tanggal_lahir) {
            setDate(new Date(formLengkapi.tanggal_lahir));
        } else {
            setDate(undefined);
        }
    }, [formLengkapi.tanggal_lahir]);

    const stats = [
        { label: 'Total Pasien Lama', value: pasienallold, icon: User, color: 'bg-cyan-500' },
        { label: 'Total Pasien Baru Bulan Ini', value: pasienallnewnow, icon: UserCheck, color: 'bg-green-500' },
        { label: 'Total Pasien', value: pasienall, icon: Users, color: 'bg-yellow-500' },
        { label: 'Pasien Belum Verifikasi', value: pasiennoverif, icon: UserX, color: 'bg-red-500' },
    ];

    const filteredPasiens = pasiens.data.filter(
        (p: Pasien) =>
            p.nama.toLowerCase().includes(search.toLowerCase()) ||
            p.no_rm.toLowerCase().includes(search.toLowerCase()) ||
            p.no_bpjs.toLowerCase().includes(search.toLowerCase()),
    );

    const [lengkapiOpen, setLengkapiOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const resolveIdByValue = (list: Array<{ id: number; nama: string }>, value?: string) => {
        if (!value) return '';
        const normalized = value.toString().trim().toLowerCase();
        // Cocokkan sebagai ID
        const byId = list.find((i) => i.id.toString() === normalized || i.id.toString() === value);
        if (byId) return byId.id.toString();
        // Cocokkan sebagai nama (case-insensitive, trimmed)
        const byName = list.find((i) => i.nama && i.nama.toString().trim().toLowerCase() === normalized);
        return byName ? byName.id.toString() : '';
    };

    const handleOpenEdit = (pasien: Pasien) => {
        setSelectedPasien(pasien);
        setIsEdit(true);
        setCurrentStep(1);
        setFormLengkapi({
            nomor_rm: pasien.no_rm,
            nama: pasien.nama,
            nik: pasien.nik || '',
            tempat_lahir: pasien.tempat_lahir || '',
            tanggal_lahir: pasien.tanggal_lahir || '',
            provinsi: pasien.provinsi_kode || '', // langsung pakai code
            kabupaten: pasien.kabupaten_kode || '',
            kecamatan: pasien.kecamatan_kode || '',
            desa: pasien.desa_kode || '',

            rt: pasien.rt || '',
            rw: pasien.rw || '',
            kode_pos: pasien.kode_pos || '',
            alamat: pasien.alamat || '',
            noka: pasien.no_bpjs || '',
            noihs: pasien.kode_ihs || '',
            jenis_kartu: pasien.jenis_peserta_bpjs || '',
            kelas: pasien.kelas_bpjs || '',
            provide: pasien.provide || '',
            kodeprovide: pasien.kodeprovide || '',
            hubungan_keluarga: pasien.hubungan_keluarga || '',
            tgl_exp_bpjs: pasien.tgl_exp_bpjs || '',
            seks: pasien.seks || '',
            goldar: pasien.goldar_relation ? pasien.goldar_relation.id.toString() : pasien.goldar || '',
            pernikahan: pasien.pernikahan || '',
            kewarganegaraan: pasien.kewarganegaraan || '',
            agama: pasien.agama || '',
            pendidikan: pasien.pendidikan || '',
            status_kerja: pasien.pekerjaan || '',
            telepon: pasien.telepon || '',
            suku: resolveIdByValue(suku, pasien.suku),
            bangsa: resolveIdByValue(bangsa, pasien.bangsa),
            bahasa: resolveIdByValue(bahasa, pasien.bahasa),
            penjamin_2: pasien.penjamin_2_nama || '',
            penjamin_2_info: pasien.penjamin_2_no || '',
            penjamin_3: pasien.penjamin_3_nama || '',
            penjamin_3_info: pasien.penjamin_3_no || '',
            aktif_penjamin_2: !!pasien.penjamin_2_nama,
            aktif_penjamin_3: !!pasien.penjamin_3_nama,
            profile_image: null,
        });
        setLengkapiOpen(true);
    };

    const handleOpenLengkapi = (pasien: Pasien) => {
        setSelectedPasien(pasien);
        setCurrentStep(1);

        setFormLengkapi({
            nomor_rm: pasien.no_rm,
            nama: pasien.nama,
            nik: pasien.nik || '',
            tempat_lahir: pasien.tempat_lahir || '',
            tanggal_lahir: pasien.tanggal_lahir || '',
            provinsi: pasien.provinsi_kode || '',
            kabupaten: pasien.kabupaten_kode || '',
            kecamatan: pasien.kecamatan_kode || '',
            desa: pasien.desa_kode || '',
            rt: pasien.rt || '',
            rw: pasien.rw || '',
            kode_pos: pasien.kode_pos || '',
            alamat: pasien.alamat || '',
            noka: pasien.no_bpjs || '',
            noihs: pasien.kode_ihs || '',
            jenis_kartu: pasien.jenis_peserta_bpjs || '',
            kelas: pasien.kelas_bpjs || '',
            provide: pasien.provide || '',
            kodeprovide: pasien.kodeprovide || '',
            hubungan_keluarga: pasien.hubungan_keluarga || '',
            tgl_exp_bpjs: pasien.tgl_exp_bpjs || '',
            seks: pasien.seks || '',
            goldar: pasien.goldar_relation ? pasien.goldar_relation.id.toString() : pasien.goldar || '',
            pernikahan: pasien.pernikahan || '',
            kewarganegaraan: pasien.kewarganegaraan || '',
            agama: pasien.agama || '',
            pendidikan: pasien.pendidikan || '',
            status_kerja: pasien.pekerjaan || '',
            telepon: pasien.telepon || '',
            suku: resolveIdByValue(suku, pasien.suku),
            bangsa: resolveIdByValue(bangsa, pasien.bangsa),
            bahasa: resolveIdByValue(bahasa, pasien.bahasa),
            penjamin_2: pasien.penjamin_2_nama || '',
            penjamin_2_info: pasien.penjamin_2_no || '',
            penjamin_3: pasien.penjamin_3_nama || '',
            penjamin_3_info: pasien.penjamin_3_no || '',
            aktif_penjamin_2: !!pasien.penjamin_2_nama,
            aktif_penjamin_3: !!pasien.penjamin_3_nama,
            profile_image: null,
        });
        // console.log('[OpenVerifikasi] Selected pasien wilayah:', {
        //     provinsi: pasien.provinsi_kode,
        //     kabupaten: pasien.kabupaten_kode,
        //     kecamatan: pasien.kecamatan_kode,
        //     desa: pasien.desa_kode,
        // });
        setLengkapiOpen(true);
    };

    const handleSubmitLengkapi = () => {
        const formData = new FormData();

        Object.entries(formLengkapi).forEach(([key, value]) => {
            if (key === 'profile_image' && value instanceof File) {
                formData.append(key, value);
            } else if (key !== 'profile_image' && value !== null) {
                if (key === 'aktif_penjamin_2' || key === 'aktif_penjamin_3') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        router.post('/pasien/verifikasi', formData, {
            onSuccess: () => {
                // Notifikasi akan ditampilkan dari flash server
                // console.log(formData);
                setLengkapiOpen(false);
                setSelectedPasien(null);
            },
            onError: (errors) => {
                toast.error('Terjadi kesalahan saat memperbarui data!');
            },
        });
    };

    const handleSubmitEdit = () => {
        const formData = new FormData();

        Object.entries(formLengkapi).forEach(([key, value]) => {
            if (key === 'profile_image' && value instanceof File) {
                formData.append(key, value);
            } else if (key !== 'profile_image' && value !== null) {
                if (key === 'aktif_penjamin_2' || key === 'aktif_penjamin_3') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        router.post('/pasien/update', formData, {
            onSuccess: () => {
                // Notifikasi akan ditampilkan dari flash server
                // console.log(formData);
                setLengkapiOpen(false);
                setSelectedPasien(null);
            },
            onError: (errors) => {
                toast.error('Terjadi kesalahan saat memperbarui data!');
            },
        });
    };

    const handleSubmitTambahPasien = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nama', namaBaru);
        formData.append('nik', nikBaru);
        formData.append('tgl_lahir', tglLahirBaru);
        formData.append('kelamin', kelaminBaru);
        formData.append('telepon', teleponBaru);
        formData.append('alamat', alamatBaru);
        formData.append('goldar', goldarBaru);
        formData.append('pernikahan', pernikahanBaru);
        if (fotoBaru) formData.append('foto', fotoBaru);

        router.post('/pasien/store', formData, {
            onSuccess: () => {
                toast.success('Pasien baru berhasil ditambahkan');
                setOpenTambah(false);
                setBaruStep(1);
                setNamaBaru('');
                setNikBaru('');
                setTglLahirBaru('');
                setKelaminBaru('');
                setTeleponBaru('');
                setAlamatBaru('');
                setGoldarBaru('');
                setPernikahanBaru('');
                setFotoBaru(null);
            },
            onError: (errors) => {
                // errors handled by inertia props toast elsewhere if provided
                toast.error('Gagal menambahkan pasien');
            },
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormLengkapi((prev) => ({ ...prev, profile_image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const steps = [
        { id: 1, label: 'Data Pribadi' },
        { id: 2, label: 'Alamat & BPJS' },
        { id: 3, label: 'Informasi Tambahan' },
    ];

    const nextStep = () => {
        if (currentStep < steps.length) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modul Pendaftaran Pasien" />
            <div className="space-y-6 p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {stats.map((s, i) => (
                        <Card key={i} className="rounded-2xl shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                                <s.icon className={`h-6 w-6 rounded-md p-1 text-white ${s.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{s.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search and Table */}
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Daftar Pasien</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Cari pasien..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 pl-10"
                                />
                            </div>
                            <Button size="sm" onClick={() => setOpenTambah(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Pasien
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => router.visit('/pasien/singkron')}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Singkron Pasien
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. RM</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>NIK</TableHead>
                                    <TableHead>No. BPJS</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPasiens.length > 0 ? (
                                    filteredPasiens.map((pasien) => (
                                        <TableRow key={pasien.id}>
                                            <TableCell className="font-medium">{pasien.no_rm}</TableCell>
                                            <TableCell>{pasien.nama}</TableCell>
                                            <TableCell>{pasien.nik || '-'}</TableCell>
                                            <TableCell>{pasien.no_bpjs}</TableCell>
                                            <TableCell>{pasien.telepon}</TableCell>
                                            <TableCell>
                                                <Badge variant={pasien.verifikasi === 2 ? 'default' : 'secondary'}>
                                                    {pasien.verifikasi === 2 ? 'Terverifikasi' : 'Belum Verifikasi'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {pasien.verifikasi !== 2 ? (
                                                        <Button size="sm" onClick={() => handleOpenLengkapi(pasien)}>
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(pasien)} className="p-2">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                                            Tidak ada data pasien
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Modal Lengkapi Data */}

                <Dialog open={lengkapiOpen} onOpenChange={setLengkapiOpen}>
                    <DialogContent aria-describedby={undefined} className="w-[70vw] !max-w-5xl rounded-lg">
                        <DialogHeader>
                            <DialogTitle>{isEdit ? 'Edit Data Pasien' : 'Lengkapi Data Pasien'}</DialogTitle>
                        </DialogHeader>

                        {/* Step Indicator */}
                        <div className="px-4 py-3">
                            <div className="flex items-center justify-center">
                                <div className="flex items-center space-x-6">
                                    {steps.map((step, idx, arr) => (
                                        <div key={step.id} className="flex items-center">
                                            {/* Bulatan step */}
                                            <div
                                                className={`flex items-center transition-colors ${
                                                    currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
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

                                            {/* Garis penghubung antar step */}
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

                        {/* Step Content */}
                        <form
                            className="space-y-4 p-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                isEdit ? handleSubmitEdit() : handleSubmitLengkapi();
                            }}
                        >
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    {/* Top Row - Profile and Basic Info */}
                                    <div className="flex flex-col gap-6 lg:flex-row">
                                        {/* Left Column - Profile & Basic Info */}
                                        <div className="space-y-4 lg:w-1/3">
                                            {/* Profile Image */}
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed">
                                                    {previewImage ? (
                                                        <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageChange}
                                                                className="hidden"
                                                                id="profile-image"
                                                            />
                                                            <label htmlFor="profile-image" className="cursor-pointer">
                                                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">Upload Foto</p>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Basic Info */}
                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor="nama">Nama Lengkap</Label>
                                                    <Input id="nama" value={formLengkapi.nama} readOnly />
                                                </div>

                                                <div>
                                                    <Label htmlFor="nik">NIK</Label>
                                                    <Input
                                                        id="nik"
                                                        value={formLengkapi.nik}
                                                        onChange={(e) => setFormLengkapi((prev) => ({ ...prev, nik: e.target.value }))}
                                                        placeholder="Masukkan NIK"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="tempat-lahir">Tempat Lahir</Label>
                                                        <Input
                                                            id="tempat-lahir"
                                                            value={formLengkapi.tempat_lahir}
                                                            onChange={(e) =>
                                                                setFormLengkapi((prev) => ({
                                                                    ...prev,
                                                                    tempat_lahir: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Kota kelahiran"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="tgl-lahir">Tanggal Lahir</Label>
                                                        <Popover open={open} onOpenChange={setOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" id="tgl-lahir" className="w-full justify-between">
                                                                    {date
                                                                        ? date.toLocaleDateString('id-ID', {
                                                                              day: '2-digit',
                                                                              month: '2-digit',
                                                                              year: 'numeric',
                                                                          })
                                                                        : 'Pilih tanggal'}
                                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={date}
                                                                    captionLayout="dropdown"
                                                                    onSelect={(selectedDate) => {
                                                                        setDate(selectedDate);
                                                                        setFormLengkapi((prev) => ({
                                                                            ...prev,
                                                                            tanggal_lahir: selectedDate
                                                                                ? selectedDate.toISOString().split('T')[0]
                                                                                : '',
                                                                        }));
                                                                        setOpen(false);
                                                                    }}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column - Personal Details */}
                                        <div className="lg:w-2/3 lg:border-l lg:pl-6">
                                            <h6 className="mb-4 text-base font-semibold">Informasi Pribadi</h6>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {/* Jenis Kelamin */}
                                                <div>
                                                    <Label htmlFor="seks">Jenis Kelamin</Label>
                                                    <Select
                                                        value={formLengkapi.seks}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, seks: value }))}
                                                    >
                                                        <SelectTrigger id="seks">
                                                            <SelectValue placeholder="Pilih Jenis Kelamin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {kelamin.map((k) => (
                                                                <SelectItem key={k.id} value={k.id.toString()}>
                                                                    {k.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Golongan Darah */}
                                                <div>
                                                    <Label htmlFor="goldar">Golongan Darah</Label>
                                                    <Select
                                                        value={formLengkapi.goldar}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, goldar: value }))}
                                                    >
                                                        <SelectTrigger id="goldar">
                                                            <SelectValue placeholder="Pilih Golongan Darah" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {goldar && goldar.length > 0 ? (
                                                                goldar.map((g) => {
                                                                    const displayText = g.rhesus === 'Tidak Ada' ? g.nama : `${g.nama}${g.rhesus}`;
                                                                    return (
                                                                        <SelectItem key={g.id} value={g.id.toString()}>
                                                                            {displayText}
                                                                        </SelectItem>
                                                                    );
                                                                })
                                                            ) : (
                                                                <SelectItem value="no-data" disabled>
                                                                    Tidak ada data golongan darah
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Status Pernikahan */}
                                                <div>
                                                    <Label htmlFor="pernikahan">Status Pernikahan</Label>
                                                    <Select
                                                        value={formLengkapi.pernikahan}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, pernikahan: value }))}
                                                    >
                                                        <SelectTrigger id="pernikahan">
                                                            <SelectValue placeholder="Pilih Status" />
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

                                                {/* Kewarganegaraan */}
                                                <div>
                                                    <Label htmlFor="kewarganegaraan">Kewarganegaraan</Label>
                                                    <Select
                                                        value={formLengkapi.kewarganegaraan}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, kewarganegaraan: value }))}
                                                    >
                                                        <SelectTrigger id="kewarganegaraan">
                                                            <SelectValue placeholder="Pilih Kewarganegaraan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="wni">WNI</SelectItem>
                                                            <SelectItem value="wna">WNA</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Agama */}
                                                <div>
                                                    <Label htmlFor="agama">Agama</Label>
                                                    <Select
                                                        value={formLengkapi.agama}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, agama: value }))}
                                                    >
                                                        <SelectTrigger id="agama">
                                                            <SelectValue placeholder="Pilih Agama" />
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

                                                {/* Pendidikan */}
                                                <div>
                                                    <Label htmlFor="pendidikan">Pendidikan</Label>
                                                    <Select
                                                        value={formLengkapi.pendidikan}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, pendidikan: value }))}
                                                    >
                                                        <SelectTrigger id="pendidikan">
                                                            <SelectValue placeholder="Pilih Pendidikan" />
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

                                                {/* Pekerjaan */}
                                                <div>
                                                    <Label htmlFor="pekerjaan">Pekerjaan</Label>
                                                    <Select
                                                        value={formLengkapi.status_kerja}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, status_kerja: value }))}
                                                    >
                                                        <SelectTrigger id="pekerjaan">
                                                            <SelectValue placeholder="Pilih Pekerjaan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pekerjaan.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Telepon */}
                                                <div>
                                                    <Label htmlFor="telepon">Telepon</Label>
                                                    <Input
                                                        id="telepon"
                                                        value={formLengkapi.telepon}
                                                        onChange={(e) =>
                                                            setFormLengkapi((prev) => ({
                                                                ...prev,
                                                                telepon: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Nomor telepon"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div className="flex">
                                    {/* Left Column - Address */}
                                    <div className="w-1/2 space-y-4 pr-5">
                                        <div>
                                            <h3 className="mb-3 text-base font-semibold">Alamat Lengkap</h3>
                                            <div className="space-y-3">
                                                <LaravoltIndonesiaExample
                                                    key={`wilayah-${formLengkapi.provinsi}-${formLengkapi.kabupaten}-${formLengkapi.kecamatan}-${formLengkapi.desa}-${lengkapiOpen ? 1 : 0}`}
                                                    provinces={provinsi}
                                                    selectedProvince={formLengkapi.provinsi}
                                                    selectedRegency={formLengkapi.kabupaten}
                                                    selectedDistrict={formLengkapi.kecamatan}
                                                    selectedVillage={formLengkapi.desa}
                                                    onProvinceChange={(value) =>
                                                        setFormLengkapi((prev) => ({
                                                            ...prev,
                                                            provinsi: value,
                                                            kabupaten: '',
                                                            kecamatan: '',
                                                            desa: '',
                                                        }))
                                                    }
                                                    onRegencyChange={(value) =>
                                                        setFormLengkapi((prev) => ({
                                                            ...prev,
                                                            kabupaten: value,
                                                            kecamatan: '',
                                                            desa: '',
                                                        }))
                                                    }
                                                    onDistrictChange={(value) =>
                                                        setFormLengkapi((prev) => ({
                                                            ...prev,
                                                            kecamatan: value,
                                                            desa: '',
                                                        }))
                                                    }
                                                    onVillageChange={(value) => setFormLengkapi((prev) => ({ ...prev, desa: value }))}
                                                />

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <Label>RT</Label>
                                                        <Input
                                                            value={formLengkapi.rt}
                                                            onChange={(e) => setFormLengkapi((prev) => ({ ...prev, rt: e.target.value }))}
                                                            placeholder="000"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>RW</Label>
                                                        <Input
                                                            value={formLengkapi.rw}
                                                            onChange={(e) => setFormLengkapi((prev) => ({ ...prev, rw: e.target.value }))}
                                                            placeholder="000"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Kode Pos</Label>
                                                        <Input
                                                            value={formLengkapi.kode_pos}
                                                            onChange={(e) =>
                                                                setFormLengkapi((prev) => ({
                                                                    ...prev,
                                                                    kode_pos: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="12345"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Alamat Lengkap</Label>
                                                    <Textarea
                                                        value={formLengkapi.alamat}
                                                        onChange={(e) => setFormLengkapi((prev) => ({ ...prev, alamat: e.target.value }))}
                                                        rows={3}
                                                        placeholder="Jalan, Gang, Nama Gedung, dll"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - BPJS */}
                                    <div className="w-1/2 border-l pl-5">
                                        <h3 className="mb-3 text-base font-semibold">Informasi BPJS</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Nomor BPJS</Label>
                                                <Input
                                                    value={formLengkapi.noka}
                                                    onChange={(e) => setFormLengkapi((prev) => ({ ...prev, noka: e.target.value }))}
                                                    placeholder="0000000000000"
                                                />
                                            </div>
                                            <div>
                                                <Label>Nomor IHS</Label>
                                                <Input
                                                    value={formLengkapi.noihs}
                                                    onChange={(e) => setFormLengkapi((prev) => ({ ...prev, noihs: e.target.value }))}
                                                    placeholder="P000000000000"
                                                />
                                            </div>
                                            <div>
                                                <Label>Jenis Peserta</Label>
                                                <Input
                                                    value={formLengkapi.jenis_kartu}
                                                    onChange={(e) =>
                                                        setFormLengkapi((prev) => ({
                                                            ...prev,
                                                            jenis_kartu: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="PBI/Non PBI"
                                                />
                                            </div>
                                            <div>
                                                <Label>Kelas BPJS</Label>
                                                <Input
                                                    value={formLengkapi.kelas}
                                                    onChange={(e) => setFormLengkapi((prev) => ({ ...prev, kelas: e.target.value }))}
                                                    placeholder="I/II/III"
                                                />
                                            </div>
                                            <div>
                                                <Label>Nama Faskes</Label>
                                                <Input
                                                    value={formLengkapi.provide}
                                                    onChange={(e) => setFormLengkapi((prev) => ({ ...prev, provide: e.target.value }))}
                                                    placeholder="Nama Puskesmas/Klinik"
                                                />
                                            </div>
                                            <div>
                                                <Label>Kode Faskes</Label>
                                                <Input
                                                    value={formLengkapi.kodeprovide}
                                                    onChange={(e) =>
                                                        setFormLengkapi((prev) => ({
                                                            ...prev,
                                                            kodeprovide: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Kode Faskes"
                                                />
                                            </div>
                                            <div>
                                                <Label>Hubungan Keluarga Peserta</Label>
                                                <Input
                                                    value={formLengkapi.hubungan_keluarga}
                                                    onChange={(e) =>
                                                        setFormLengkapi((prev) => ({
                                                            ...prev,
                                                            hubungan_keluarga: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Anak/Istri/Suami"
                                                />
                                            </div>
                                            {/* Masa Berlaku */}
                                            <div>
                                                <Label htmlFor="masa-berlaku">Masa Berlaku</Label>
                                                <Popover open={openBpjs} onOpenChange={setOpenBpjs}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" id="masa-berlaku" className="w-full justify-between">
                                                            {formLengkapi.tgl_exp_bpjs
                                                                ? new Date(formLengkapi.tgl_exp_bpjs).toLocaleDateString('id-ID', {
                                                                      day: '2-digit',
                                                                      month: '2-digit',
                                                                      year: 'numeric',
                                                                  })
                                                                : 'Pilih tanggal'}
                                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={formLengkapi.tgl_exp_bpjs ? new Date(formLengkapi.tgl_exp_bpjs) : undefined}
                                                            captionLayout="dropdown"
                                                            onSelect={(selectedDate) => {
                                                                setFormLengkapi((prev) => ({
                                                                    ...prev,
                                                                    tgl_exp_bpjs: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
                                                                }));
                                                                setOpenBpjs(false);
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div className="flex gap-6">
                                    {/* Left Column - Additional Info */}
                                    <div className="w-1/2 space-y-4">
                                        <div>
                                            <h3 className="mb-3 text-base font-semibold">Informasi Tambahan</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {/* SUKU */}
                                                <div>
                                                    <Label>Suku</Label>
                                                    <Select
                                                        value={formLengkapi.suku}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, suku: value }))}
                                                    >
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

                                                {/* BANGSA */}
                                                <div>
                                                    <Label>Bangsa</Label>
                                                    <Select
                                                        value={formLengkapi.bangsa}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, bangsa: value }))}
                                                    >
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

                                                {/* BAHASA */}
                                                <div>
                                                    <Label>Bahasa</Label>
                                                    <Select
                                                        value={formLengkapi.bahasa}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, bahasa: value }))}
                                                    >
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
                                    </div>

                                    {/* Right Column - Guarantor */}
                                    <div className="w-1/2 border-l pl-6">
                                        <h3 className="mb-3 text-base font-semibold">Informasi Penjamin</h3>
                                        <div className="space-y-3">
                                            {/* PENJAMIN 2 */}
                                            <div className="rounded-lg border p-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Checkbox
                                                        id="penjamin2"
                                                        checked={formLengkapi.aktif_penjamin_2}
                                                        onCheckedChange={(checked) =>
                                                            setFormLengkapi((prev) => ({
                                                                ...prev,
                                                                aktif_penjamin_2: !!checked,
                                                                ...(checked ? {} : { penjamin_2: '', penjamin_2_info: '' }),
                                                            }))
                                                        }
                                                    />
                                                    <Label htmlFor="penjamin2" className="text-sm font-medium">
                                                        Aktifkan Penjamin 2
                                                    </Label>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <Select
                                                        value={formLengkapi.penjamin_2}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, penjamin_2: value }))}
                                                        disabled={!formLengkapi.aktif_penjamin_2}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Penjamin 2" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {asuransi.map((a) => (
                                                                <SelectItem key={a.id} value={a.id.toString()}>
                                                                    {a.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="No. Penjamin 2"
                                                        value={formLengkapi.penjamin_2_info}
                                                        onChange={(e) =>
                                                            setFormLengkapi((prev) => ({
                                                                ...prev,
                                                                penjamin_2_info: e.target.value,
                                                            }))
                                                        }
                                                        disabled={!formLengkapi.aktif_penjamin_2}
                                                    />
                                                </div>
                                            </div>

                                            {/* PENJAMIN 3 */}
                                            <div className="rounded-lg border p-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Checkbox
                                                        id="penjamin3"
                                                        checked={formLengkapi.aktif_penjamin_3}
                                                        onCheckedChange={(checked) =>
                                                            setFormLengkapi((prev) => ({
                                                                ...prev,
                                                                aktif_penjamin_3: !!checked,
                                                                ...(checked ? {} : { penjamin_3: '', penjamin_3_info: '' }),
                                                            }))
                                                        }
                                                    />
                                                    <Label htmlFor="penjamin3" className="text-sm font-medium">
                                                        Aktifkan Penjamin 3
                                                    </Label>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <Select
                                                        value={formLengkapi.penjamin_3}
                                                        onValueChange={(value) => setFormLengkapi((prev) => ({ ...prev, penjamin_3: value }))}
                                                        disabled={!formLengkapi.aktif_penjamin_3}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Penjamin 3" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {asuransi.map((a) => (
                                                                <SelectItem key={a.id} value={a.id.toString()}>
                                                                    {a.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="No. Penjamin 3"
                                                        value={formLengkapi.penjamin_3_info}
                                                        onChange={(e) =>
                                                            setFormLengkapi((prev) => ({
                                                                ...prev,
                                                                penjamin_3_info: e.target.value,
                                                            }))
                                                        }
                                                        disabled={!formLengkapi.aktif_penjamin_3}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                                    Kembali
                                </Button>

                                {currentStep < steps.length && (
                                    <Button type="button" onClick={nextStep}>
                                        Lanjut
                                    </Button>
                                )}

                                {currentStep === steps.length && <Button type="submit">Simpan</Button>}
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal Tambah Pasien Baru */}
                <Dialog open={openTambah} onOpenChange={setOpenTambah}>
                    <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Tambah Pasien Baru</DialogTitle>
                        </DialogHeader>

                        <form className="mt-2 space-y-4" onSubmit={handleSubmitTambahPasien}>
                            {/* Stepper */}
                            <div className="mb-2 flex items-center justify-center gap-2">
                                {[1, 2, 3].map((s, idx) => (
                                    <div key={s} className="flex items-center">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-base font-bold ${
                                                baruStep === s
                                                    ? 'border-cyan-500 bg-cyan-500 text-white'
                                                    : 'border-gray-300 bg-gray-200 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {s}
                                        </div>
                                        {idx < 2 && <div className="mx-2 h-1 w-8 rounded bg-gray-300 dark:bg-gray-600"></div>}
                                    </div>
                                ))}
                            </div>

                            {baruStep === 1 && (
                                <>
                                    <div>
                                        <Label>Nama</Label>
                                        <Input placeholder="Nama" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>NIK</Label>
                                        <Input placeholder="NIK" value={nikBaru} onChange={(e) => setNikBaru(e.target.value)} type="text" />
                                    </div>
                                    <div>
                                        <Label>Tanggal Lahir</Label>
                                        <Input
                                            type="date"
                                            placeholder="Tanggal Lahir"
                                            value={tglLahirBaru}
                                            onChange={(e) => setTglLahirBaru(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Kelamin</Label>
                                        <Select value={kelaminBaru} onValueChange={setKelaminBaru}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Kelamin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kelamin.map((k) => (
                                                    <SelectItem key={k.id} value={String(k.id)}>
                                                        {k.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="mt-2 flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setOpenTambah(false)}>
                                            Batal
                                        </Button>
                                        <Button type="button" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setBaruStep(2)}>
                                            Lanjut
                                        </Button>
                                    </div>
                                </>
                            )}

                            {baruStep === 2 && (
                                <>
                                    <div>
                                        <Label>Nomor Telepon</Label>
                                        <Input
                                            placeholder="Nomor Telepon"
                                            type="tel"
                                            value={teleponBaru}
                                            onChange={(e) => setTeleponBaru(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Alamat</Label>
                                        <Input placeholder="Alamat" value={alamatBaru} onChange={(e) => setAlamatBaru(e.target.value)} />
                                    </div>
                                    <div className="mt-2 flex justify-between gap-2">
                                        <Button type="button" variant="outline" onClick={() => setBaruStep(1)}>
                                            Kembali
                                        </Button>
                                        <Button type="button" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setBaruStep(3)}>
                                            Lanjut
                                        </Button>
                                    </div>
                                </>
                            )}

                            {baruStep === 3 && (
                                <>
                                    <div>
                                        <Label>Golongan Darah</Label>
                                        <Select value={goldarBaru} onValueChange={setGoldarBaru}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Golongan Darah" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {goldar.map((g) => (
                                                    <SelectItem key={g.id} value={String(g.id)}>
                                                        {g.nama}
                                                        {g.rhesus && g.rhesus !== 'Tidak Ada' ? ` ${g.rhesus}` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Status Pernikahan</Label>
                                        <Select value={pernikahanBaru} onValueChange={setPernikahanBaru}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status Pernikahan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pernikahan.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Foto</Label>
                                        <Input type="file" accept="image/*" onChange={(e) => setFotoBaru(e.target.files?.[0] ?? null)} />
                                    </div>
                                    <div className="mt-2 flex justify-between gap-2">
                                        <Button type="button" variant="outline" onClick={() => setBaruStep(2)}>
                                            Kembali
                                        </Button>
                                        <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600">
                                            Simpan
                                        </Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner'; // ✅ pakai sonner

interface Asuransi {
    id: number;
    nama: string;
    kode?: string;
    jenis_asuransi?: string;
    verif_pasien?: string;
    filter_obat?: string;
    tanggal_mulai?: string;
    tanggal_akhir?: string;
    alamat_asuransi?: string;
    no_telp_asuransi?: string;
    faksimil?: string;
    pic?: string;
    no_telp_pic?: string;
    jabatan_pic?: string;
    no_rekening?: string;
    bank_id?: number | null;
    bank?: Bank | null;
}

interface Bank {
    id: number;
    nama: string;
}

interface PageProps {
    asuransis: Asuransi[];
    banks: Bank[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Master', href: '' },
    { title: 'Umum', href: '' },
    { title: 'Asuransi', href: '' },
];

export default function Index() {
    const { asuransis, banks, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (errors?.nama) {
            toast.error(errors.nama);
        }
    }, [flash, errors]);

    // State modal Tambah/Edit
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [nama, setNama] = useState('');
    const [kode, setKode] = useState('');
    const [jenis, setJenis] = useState('');
    const [verifikasiPasien, setVerifikasiPasien] = useState('');
    const [filterObat, setFilterObat] = useState('');
    const [berlakuMulai, setBerlakuMulai] = useState('');
    const [berlakuHingga, setBerlakuHingga] = useState('');
    const [alamat, setAlamat] = useState('');
    const [telpAsuransi, setTelpAsuransi] = useState('');
    const [faksimil, setFaksimil] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [telpContactPerson, setTelpContactPerson] = useState('');
    const [jabatanContactPerson, setJabatanContactPerson] = useState('');
    const [bankAkun, setBankAkun] = useState('');
    const [noRekening, setNoRekening] = useState('');

    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState('');

    // Pencarian
    const [search, setSearch] = useState('');

    const filteredAsuransis = asuransis.filter((a) => a.nama.toLowerCase().includes(search.toLowerCase()));

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mencegah auto-submit, hanya izinkan submit melalui tombol
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentStep !== 3) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleSave = () => {
        // Pastikan hanya bisa save pada step 3
        if (currentStep !== 3) return;

        const payload = {
            nama,
            kode,
            jenis_asuransi: jenis,
            verif_pasien: verifikasiPasien,
            filter_obat: filterObat,
            tanggal_mulai: berlakuMulai,
            tanggal_akhir: berlakuHingga,
            alamat_asuransi: alamat,
            no_telp_asuransi: telpAsuransi,
            faksimil,
            pic: contactPerson,
            no_telp_pic: telpContactPerson,
            jabatan_pic: jabatanContactPerson,
            bank_id: bankAkun ? Number(bankAkun) : null,
            no_rekening: noRekening || null,
        };

        if (editId) {
            router.put(`/datamaster/umum/asuransi/${editId}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    resetForm();
                    setEditId(null);
                    setCurrentStep(1);
                },
            });
        } else {
            router.post('/datamaster/umum/asuransi', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    resetForm();
                    setEditId(null);
                    setCurrentStep(1);
                },
                onError: () => {
                    // modal tetap terbuka
                },
            });
        }
    };

    const resetForm = () => {
        setNama('');
        setKode('');
        setJenis('');
        setVerifikasiPasien('');
        setFilterObat('');
        setBerlakuMulai('');
        setBerlakuHingga('');
        setAlamat('');
        setTelpAsuransi('');
        setFaksimil('');
        setContactPerson('');
        setTelpContactPerson('');
        setJabatanContactPerson('');
        setBankAkun('');
        setNoRekening('');
    };

    const handleNext = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(currentStep + 1);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(currentStep - 1);
    };

    const handleOpenEdit = (asuransi: Asuransi) => {
        setEditId(asuransi.id);
        setNama(asuransi.nama || '');
        setKode(asuransi.kode || '');
        setJenis(asuransi.jenis_asuransi || '');
        setVerifikasiPasien(asuransi.verif_pasien || '');
        setFilterObat(asuransi.filter_obat || '');
        setBerlakuMulai(asuransi.tanggal_mulai || '');
        setBerlakuHingga(asuransi.tanggal_akhir || '');
        setAlamat(asuransi.alamat_asuransi || '');
        setTelpAsuransi(asuransi.no_telp_asuransi || '');
        setFaksimil(asuransi.faksimil || '');
        setContactPerson(asuransi.pic || '');
        setTelpContactPerson(asuransi.no_telp_pic || '');
        setJabatanContactPerson(asuransi.jabatan_pic || '');
        setBankAkun(asuransi.bank?.id ? String(asuransi.bank.id) : asuransi.bank_id ? String(asuransi.bank_id) : '');
        setNoRekening(asuransi.no_rekening || '');
        setCurrentStep(1);
        setOpen(true);
    };

    const handleOpenDelete = (asuransi: Asuransi) => {
        setDeleteId(asuransi.id);
        setDeleteNama(asuransi.nama);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/datamaster/umum/asuransi/${deleteId}`, { preserveScroll: true });
        setDeleteOpen(false);
        setDeleteId(null);
    };

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return nama && kode && jenis;
            case 2:
                return alamat && telpAsuransi && contactPerson;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Asuransi" />
            <div className="p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Asuransi</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari asuransi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 pl-8"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    setEditId(null);
                                    resetForm();
                                    setCurrentStep(1);
                                    setOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="w-40 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAsuransis.length > 0 ? (
                                    filteredAsuransis.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell className="space-x-2 text-right">
                                                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleOpenDelete(item)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">
                                            Tidak ada data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah/Edit */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] w-[70vw] !max-w-5xl overflow-y-auto rounded-lg">
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Edit Asuransi' : 'Tambah Asuransi'}</DialogTitle>
                    </DialogHeader>

                    {/* Step Indicator */}
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-6">
                                {[
                                    { id: 1, label: 'Informasi Dasar' },
                                    { id: 2, label: 'Kontak & Bank' },
                                    { id: 3, label: 'Konfirmasi' },
                                ].map((step, idx, arr) => (
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

                    <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown} className="space-y-4 p-4">
                        {/* Step 1: Informasi Dasar */}
                        {currentStep === 1 && (
                            <div className="flex min-h-[400px] gap-8">
                                {/* Left Column - Basic Info */}
                                <div className="w-1/2 space-y-6">
                                    <div className="space-y-2">
                                        <Label>Nama asuransi</Label>
                                        <Input placeholder="Nama asuransi" value={nama} onChange={(e) => setNama(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kode asuransi</Label>
                                        <Input placeholder="Kode asuransi" value={kode} onChange={(e) => setKode(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jenis Asuransi</Label>
                                        <Select value={jenis} onValueChange={setJenis}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="-- Pilih --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Asuransi">Asuransi</SelectItem>
                                                <SelectItem value="Perusahaan Swasta">Perusahaan Swasta</SelectItem>
                                                <SelectItem value="Perusahaan Pemerintah/BUMN/BUMD">Perusahaan Pemerintah/BUMN/BUMD</SelectItem>
                                                <SelectItem value="Institusi Pemerintah">Institusi Pemerintah</SelectItem>
                                                <SelectItem value="Yayasan Sosial">Yayasan Sosial</SelectItem>
                                                <SelectItem value="lainnya">Lainnya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Verifikasi Pasien</Label>
                                        <Select value={verifikasiPasien} onValueChange={setVerifikasiPasien}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="-- Pilih --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Prosedural (Managed)">Prosedural (Managed)</SelectItem>
                                                <SelectItem value="Bebas (Un-managed)">Bebas (Un-managed)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Right Column - Additional Info */}
                                <div className="w-1/2 border-l pl-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Filter Obat Ditanggung</Label>
                                            <Select value={filterObat} onValueChange={setFilterObat}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="-- Pilih --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Aktif">Aktif</SelectItem>
                                                    <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Berlaku Mulai</Label>
                                            <Input
                                                type="date"
                                                value={berlakuMulai}
                                                onChange={(e) => setBerlakuMulai(e.target.value)}
                                                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                                                className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Berlaku Hingga</Label>
                                            <Input
                                                type="date"
                                                value={berlakuHingga}
                                                onChange={(e) => setBerlakuHingga(e.target.value)}
                                                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                                                className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Informasi Kontak & Bank */}
                        {currentStep === 2 && (
                            <div className="flex min-h-[400px] gap-8">
                                {/* Left Column - Contact Info */}
                                <div className="w-1/2 space-y-6">
                                    <div className="space-y-2">
                                        <Label>Alamat Asuransi</Label>
                                        <Input placeholder="Alamat Asuransi" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>No Telp Asuransi</Label>
                                            <Input
                                                placeholder="No Telp Asuransi"
                                                value={telpAsuransi}
                                                onChange={(e) => setTelpAsuransi(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Faksimil</Label>
                                            <Input placeholder="Faksimil" value={faksimil} onChange={(e) => setFaksimil(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label>Contact Person</Label>
                                            <Input
                                                placeholder="Contact Person"
                                                value={contactPerson}
                                                onChange={(e) => setContactPerson(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Telp Contact Person</Label>
                                            <Input
                                                placeholder="Telp Contact Person"
                                                value={telpContactPerson}
                                                onChange={(e) => setTelpContactPerson(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Jabatan Contact Person</Label>
                                            <Input
                                                placeholder="Jabatan Contact Person"
                                                value={jabatanContactPerson}
                                                onChange={(e) => setJabatanContactPerson(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Bank Info */}
                                <div className="w-1/2 border-l pl-8">
                                    <div className="mt-6 space-y-6">
                                        <div className="space-y-2">
                                            <Label>Bank Akun</Label>
                                            <Select value={bankAkun} onValueChange={setBankAkun}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="-- Pilih --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {banks?.map((b) => (
                                                        <SelectItem key={b.id} value={String(b.id)}>
                                                            {b.nama}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>No Rekening</Label>
                                            <Input placeholder="No Rekening" value={noRekening} onChange={(e) => setNoRekening(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Konfirmasi */}
                        {currentStep === 3 && (
                            <div className="min-h-[400px] space-y-4">
                                <div className="rounded-lg bg-muted/50 p-4 dark:bg-muted/20">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div>
                                            <Label className="text-muted-foreground">Nama Asuransi</Label>
                                            <p className="text-sm text-foreground">{nama || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Kode Asuransi</Label>
                                            <p className="text-sm text-foreground">{kode || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Jenis Asuransi</Label>
                                            <p className="text-sm text-foreground">{jenis || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Verifikasi Pasien</Label>
                                            <p className="text-sm text-foreground">{verifikasiPasien || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Filter Obat</Label>
                                            <p className="text-sm text-foreground">{filterObat || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Berlaku Mulai</Label>
                                            <p className="text-sm text-foreground">{berlakuMulai || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Berlaku Hingga</Label>
                                            <p className="text-sm text-foreground">{berlakuHingga || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Alamat</Label>
                                            <p className="text-sm text-foreground">{alamat || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">No Telp</Label>
                                            <p className="text-sm text-foreground">{telpAsuransi || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Contact Person</Label>
                                            <p className="text-sm text-foreground">{contactPerson || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Bank</Label>
                                            <p className="text-sm text-foreground">{banks?.find((b) => String(b.id) === bankAkun)?.nama || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">No Rekening</Label>
                                            <p className="text-sm text-foreground">{noRekening || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Faksimil</Label>
                                            <p className="text-sm text-foreground">{faksimil || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Telp Contact Person</Label>
                                            <p className="text-sm text-foreground">{telpContactPerson || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Jabatan Contact Person</Label>
                                            <p className="text-sm text-foreground">{jabatanContactPerson || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>

                            {currentStep > 1 && (
                                <Button type="button" variant="outline" onClick={(e) => handlePrev(e)}>
                                    Kembali
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button type="button" onClick={(e) => handleNext(e)} disabled={!isStepValid(currentStep)}>
                                    Lanjut
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleSave}>
                                    {editId ? 'Update' : 'Simpan'}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>
                    <p>
                        Apakah Anda yakin ingin menghapus asuransi <span className="font-semibold">{deleteNama}</span>?
                    </p>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                            Batal
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

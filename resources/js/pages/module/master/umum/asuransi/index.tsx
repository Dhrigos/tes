'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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
            router.put(
                `/datamaster/umum/asuransi/${editId}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpen(false);
                        resetForm();
                        setEditId(null);
                        setCurrentStep(1);
                    },
                },
            );
        } else {
            router.post(
                '/datamaster/umum/asuransi',
                payload,
                {
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
                },
            );
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

    const handleNext = () => {
        setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleOpenEdit = (asuransi: Asuransi) => {
        setEditId(asuransi.id);
        setNama(asuransi.nama);
        setBankAkun(asuransi.bank?.id ? String(asuransi.bank.id) : asuransi.bank_id ? String(asuransi.bank_id) : '');
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
                return alamat && telpAsuransi && contactPerson && bankAkun;
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
                <DialogContent className="sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editId ? 'Edit Asuransi' : 'Tambah Asuransi'}</DialogTitle>
                    </DialogHeader>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                1
                            </div>
                            <div className={`w-16 h-1 ${
                                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                            }`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                2
                            </div>
                            <div className={`w-16 h-1 ${
                                currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                            }`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                3
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Informasi Dasar */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Informasi Dasar</h3>
                                
                                {/* Baris 1: Nama, Kode, Jenis */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Nama asuransi</label>
                                        <Input placeholder="Nama asuransi" value={nama} onChange={(e) => setNama(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Kode asuransi</label>
                                        <Input placeholder="Kode asuransi" value={kode} onChange={(e) => setKode(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Jenis Asuransi</label>
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
                                </div>

                                {/* Baris 2: Verifikasi, Filter Obat, Berlaku Mulai, Berlaku Hingga */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Verifikasi Pasien</label>
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
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Filter Obat Ditanggung</label>
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
                                        <label className="text-sm font-medium leading-none">Berlaku Mulai</label>
                                        <Input
                                            type="date"
                                            value={berlakuMulai}
                                            onChange={(e) => setBerlakuMulai(e.target.value)}
                                            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Berlaku Hingga</label>
                                        <Input
                                            type="date"
                                            value={berlakuHingga}
                                            onChange={(e) => setBerlakuHingga(e.target.value)}
                                            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Informasi Kontak & Bank */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Informasi Kontak & Bank</h3>
                                
                                {/* Baris 3: Alamat (full) */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    <div className="space-y-2 lg:col-span-3">
                                        <label className="text-sm font-medium leading-none">Alamat Asuransi</label>
                                        <Input placeholder="Alamat Asuransi" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
                                    </div>
                                </div>

                                {/* Baris 4: Telp, Faksimil */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">No Telp Asuransi</label>
                                        <Input placeholder="No Telp Asuransi" value={telpAsuransi} onChange={(e) => setTelpAsuransi(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Faksimil</label>
                                        <Input placeholder="Faksimil" value={faksimil} onChange={(e) => setFaksimil(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">No Rekening</label>
                                        <Input placeholder="No Rekening" value={noRekening} onChange={(e) => setNoRekening(e.target.value)} />
                                    </div>
                                </div>

                                {/* Baris 5: CP, Telp CP, Jabatan CP */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Contact Person</label>
                                        <Input placeholder="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Telp Contact Person</label>
                                        <Input placeholder="Telp Contact Person" value={telpContactPerson} onChange={(e) => setTelpContactPerson(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Jabatan Contact Person</label>
                                        <Input placeholder="Jabatan Contact Person" value={jabatanContactPerson} onChange={(e) => setJabatanContactPerson(e.target.value)} />
                                    </div>
                                </div>

                                {/* Baris 6: Bank Akun, No Rekening */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-sm font-medium leading-none">Bank Akun</label>
                                        <Select value={bankAkun} onValueChange={setBankAkun}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="-- Pilih --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {banks?.map((b) => (
                                                    <SelectItem key={b.id} value={String(b.id)}>{b.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Konfirmasi */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Konfirmasi Data</h3>
                                
                                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Nama Asuransi</label>
                                            <p className="text-sm">{nama || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Kode Asuransi</label>
                                            <p className="text-sm">{kode || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Jenis Asuransi</label>
                                            <p className="text-sm">{jenis || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Verifikasi Pasien</label>
                                            <p className="text-sm">{verifikasiPasien || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Filter Obat</label>
                                            <p className="text-sm">{filterObat || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Berlaku Mulai</label>
                                            <p className="text-sm">{berlakuMulai || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Berlaku Hingga</label>
                                            <p className="text-sm">{berlakuHingga || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Alamat</label>
                                            <p className="text-sm">{alamat || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">No Telp</label>
                                            <p className="text-sm">{telpAsuransi || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Contact Person</label>
                                            <p className="text-sm">{contactPerson || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Bank</label>
                                            <p className="text-sm">{banks?.find(b => String(b.id) === bankAkun)?.nama || '-'}</p>
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
                                <Button type="button" variant="outline" onClick={handlePrev}>
                                    Sebelumnya
                                </Button>
                            )}
                            
                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!isStepValid(currentStep)}
                                >
                                    Selanjutnya
                                </Button>
                            ) : (
                                <Button type="submit">
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

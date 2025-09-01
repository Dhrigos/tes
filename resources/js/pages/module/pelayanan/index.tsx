import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Bell, FileText, Edit, CheckCircle, UserCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Pasien {
    nama: string;
    jenis_kelamin: string;
    tanggal_lahir: string;
    umur: string;
}

interface Poli {
    nama: string;
}

interface Dokter {
    id: number;
    namauser: {
        name: string;
    };
}

interface Pendaftaran {
    antrian: string;
    penjamin: string;
    poli_id: number;
    tanggal_kujungan: string;
}

interface PelayananData {
    id: number;
    nomor_rm: string;
    nomor_register: string;
    tanggal_kujungan: string;
    poli_id: number;
    dokter_id: number;
    tindakan_button: 'panggil' | 'soap' | 'edit' | 'Complete';
    pasien: Pasien;
    poli: Poli;
    dokter: Dokter;
    pendaftaran: Pendaftaran;
}

interface PageProps {
    pelayanan?: PelayananData[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PelayananSoPerawat() {
    const { pelayanan: initialPelayanan = [], flash } = usePage().props as unknown as PageProps;
    const [pelayanan, setPelayanan] = useState<PelayananData[]>(initialPelayanan);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showDokterDialog, setShowDokterDialog] = useState(false);
    const [selectedPasien, setSelectedPasien] = useState<PelayananData | null>(null);
    const [dokterList, setDokterList] = useState<Dokter[]>([]);
    const [selectedDokter, setSelectedDokter] = useState<string>('');

    // Sync state when Inertia props change
    useEffect(() => {
        setPelayanan(initialPelayanan || []);
    }, [initialPelayanan]);

    // Show flash messages from server if any
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const reloadPelayanan = () => {
        router.reload({
            only: ['pelayanan'],
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
            onError: () => toast.error('Gagal memuat ulang data pelayanan'),
        });
    };

    const handlePanggilPasien = async (norawat: string) => {
        try {
            const encodedNorawat = btoa(norawat);
            const res = await fetch(`/api/pelayanan/hadir/${encodedNorawat}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success) {
                toast.success(data.message || 'Pasien dipanggil');
                reloadPelayanan();
            } else {
                toast.error(data?.message || 'Gagal memanggil pasien');
            }
        } catch (error) {
            toast.error('Gagal memanggil pasien');
        }
    };

    const handleUbahDokter = (pasien: PelayananData) => {
        setSelectedPasien(pasien);
        setShowDokterDialog(true);
        fetchDokterByPoli(pasien.poli_id, pasien.tanggal_kujungan);
    };

    const fetchDokterByPoli = async (poliId: number, tanggalKunjungan: string) => {
        try {
            const url = `/api/get-dokter-by-poli/${poliId}?datetime=${encodeURIComponent(tanggalKunjungan)}`;
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            setDokterList(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Gagal mengambil data dokter');
            setDokterList([]);
        }
    };

    const handleUpdateDokter = async () => {
        if (!selectedPasien || !selectedDokter) {
            toast.error('Silakan pilih dokter terlebih dahulu');
            return;
        }

        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/api/pelayanan/dokter/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    rubahdokter_id: selectedPasien.id,
                    poli_id_update: selectedPasien.poli_id,
                    tanggal_kunjungan_update: selectedPasien.tanggal_kujungan,
                    dokter_id_update: selectedDokter,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success) {
                toast.success(data.message || 'Dokter berhasil diupdate');
                setShowDokterDialog(false);
                setSelectedPasien(null);
                setSelectedDokter('');
                reloadPelayanan();
            } else {
                toast.error(data?.message || 'Gagal mengupdate dokter');
            }
        } catch (error) {
            toast.error('Gagal mengupdate dokter');
        }
    };

    const filteredPelayanan = pelayanan.filter((p) => {
        const s = search.toLowerCase();
        return (
            (p.pasien?.nama?.toLowerCase() || '').includes(s) ||
            (p.nomor_rm?.toLowerCase() || '').includes(s) ||
            (p.nomor_register?.toLowerCase() || '').includes(s)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'panggil':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Belum Hadir</Badge>;
            case 'soap':
                return <Badge variant="default" className="bg-blue-100 text-blue-800">Pemeriksaan</Badge>;
            case 'edit':
                return <Badge variant="outline" className="bg-cyan-100 text-cyan-800">Menunggu Dokter</Badge>;
            case 'Complete':
                return <Badge variant="default" className="bg-green-100 text-green-800">Sudah Dicek Dokter</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getActionButtons = (row: PelayananData) => {
        const norawat = btoa(row.nomor_register);
        
        switch (row.tindakan_button) {
            case 'panggil':
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        onClick={() => handlePanggilPasien(row.nomor_register)}
                    >
                        <Bell className="w-4 h-4 mr-1" />
                        Panggil
                    </Button>
                );
            case 'soap':
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => router.visit(`/pelayanan/so-perawat/${norawat}`)}
                    >
                        <FileText className="w-4 h-4 mr-1" />
                        Pemeriksaan
                    </Button>
                );
            case 'edit':
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
                            onClick={() => router.visit(`/pelayanan/so-perawat/edit/${norawat}`)}
                        >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            onClick={() => handleUbahDokter(row)}
                        >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Ubah Dokter
                        </Button>
                    </div>
                );
            case 'Complete':
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        disabled
                    >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Dicek
                    </Button>
                );
            default:
                return null;
        }
    };

    // Using Table components directly instead of a DataTable abstraction

    return (
        <>
            <Head title="Pelayanan Perawat" />.-
            
            <div className="space-y-6">
                <div className="text-center">
                    <h5 className="text-lg text-muted-foreground">
                        Selamat datang di modul Pelayanan Perawat
                    </h5>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Pelayanan Perawat</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Cari pasien, nomor RM, atau registrasi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>No.RM</TableHead>
                                    <TableHead>Pasien</TableHead>
                                    <TableHead>No.Antrian</TableHead>
                                    <TableHead>No.Registrasi</TableHead>
                                    <TableHead>Tanggal Kunjungan</TableHead>
                                    <TableHead>Poli</TableHead>
                                    <TableHead>Dokter</TableHead>
                                    <TableHead>Tindakan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPelayanan.length > 0 ? (
                                    filteredPelayanan.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>{getStatusBadge(row.tindakan_button)}</TableCell>
                                            <TableCell className="text-center font-mono">{row.nomor_rm}</TableCell>
                                            <TableCell className="text-center">{row.pasien?.nama}</TableCell>
                                            <TableCell className="text-center font-mono">{row.pendaftaran?.antrian}</TableCell>
                                            <TableCell className="text-center font-mono">{row.nomor_register}</TableCell>
                                            <TableCell className="text-center">
                                                {row.tanggal_kujungan
                                                    ? format(new Date(row.tanggal_kujungan), 'dd-MM-yyyy', { locale: id })
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">{row.poli?.nama}</TableCell>
                                            <TableCell className="text-center">{row.dokter?.namauser?.name}</TableCell>
                                            <TableCell className="text-center">{getActionButtons(row)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                                            {loading ? 'Memuat data...' : 'Tidak ada data pelayanan'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Ubah Dokter */}
            <AlertDialog open={showDokterDialog} onOpenChange={setShowDokterDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ubah Dokter</AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-4">
                                <p><strong>Pasien:</strong> {selectedPasien?.pasien?.nama}</p>
                                <div>
                                    <label className="text-sm font-medium">Pilih Dokter Baru:</label>
                                    <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih Dokter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dokterList.map((dokter) => (
                                                <SelectItem key={dokter.id} value={dokter.id.toString()}>
                                                    {dokter.namauser.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowDokterDialog(false);
                            setSelectedPasien(null);
                            setSelectedDokter('');
                        }}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateDokter}>
                            Update
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

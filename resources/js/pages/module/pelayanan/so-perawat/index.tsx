import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, CheckCircle, Edit, FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
    nama?: string;
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
    tindakan_button: 'panggil' | 'soap' | 'edit' | 'complete' | 'Complete';
    pasien: Pasien;
    poli: Poli;
    dokter: Dokter;
    pendaftaran: Pendaftaran;
    status_daftar?: number;
    status_perawat?: number;
    status_dokter?: number;
    status_label?: string;
    can_hadir_daftar?: boolean;
    can_selesai_daftar?: boolean;
    can_call?: boolean;
    can_soap?: boolean;
    can_edit?: boolean;
    is_complete?: boolean;
}

interface PageProps {
    pelayanans?: PelayananData[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelayanan', href: '' },
    { title: 'SO Perawat', href: '' },
];

export default function PelayananSoPerawat() {
    const { pelayanans: initialPelayanan = [], flash } = usePage().props as unknown as PageProps;
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
            only: ['pelayanans'],
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

    // Hadir/Selesai Daftar ditangani di modul Pendaftaran (dashboard)

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
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Belum Hadir
                    </Badge>
                );
            case 'soap':
                return (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                        Pemeriksaan
                    </Badge>
                );
            case 'edit':
                return (
                    <Badge variant="outline" className="bg-cyan-100 text-cyan-800">
                        Menunggu Dokter
                    </Badge>
                );
            case 'Complete':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                        Sudah Dicek Dokter
                    </Badge>
                );
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
                        size="xs"
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                        onClick={() => handlePanggilPasien(row.nomor_register)}
                        disabled={!((row.status_daftar ?? 0) === 2 && (row.status_perawat ?? 0) === 0)}
                    >
                        <Bell className="mr-1 h-4 w-4" />
                        Panggil
                    </Button>
                );
            case 'soap':
                return (
                    <Button
                        variant="outline"
                        size="xs"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => router.visit(`/pelayanan/so-perawat/${norawat}`)}
                    >
                        <FileText className="mr-1 h-4 w-4" />
                        Pemeriksaan
                    </Button>
                );
            case 'edit':
                return (
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            size="xs"
                            className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                            onClick={() => router.visit(`/pelayanan/so-perawat/edit/${norawat}`)}
                        >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                );
            case 'Complete':
                return (
                    <Button variant="outline" size="xs" className="border-green-600 text-green-600 hover:bg-green-50" disabled>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Dicek
                    </Button>
                );
            default:
                return null;
        }
    };

    // Using Table components directly instead of a DataTable abstraction

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelayanan Perawat" />

            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
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
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead>No.RM</TableHead>
                                    <TableHead>Pasien</TableHead>
                                    <TableHead>No.Antrian</TableHead>
                                    <TableHead>No.Registrasi</TableHead>
                                    <TableHead>Tanggal Kunjungan</TableHead>
                                    <TableHead>Poli</TableHead>
                                    <TableHead>Dokter</TableHead>
                                    <TableHead className="text-center">Tindakan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPelayanan.length > 0 ? (
                                    filteredPelayanan.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="text-center">{getStatusBadge(row.tindakan_button)}</TableCell>
                                            <TableCell className="font-mono">{row.nomor_rm}</TableCell>
                                            <TableCell>{row.pasien?.nama}</TableCell>
                                            <TableCell className="text-center font-mono">{row.pendaftaran?.antrian}</TableCell>
                                            <TableCell className="text-center font-mono">{row.nomor_register}</TableCell>
                                            <TableCell className="text-center">
                                                {row.tanggal_kujungan ? format(new Date(row.tanggal_kujungan), 'dd-MM-yyyy', { locale: id }) : '-'}
                                            </TableCell>
                                            <TableCell>{row.poli?.nama}</TableCell>
                                            <TableCell>{row.dokter?.namauser?.name || row.dokter?.nama || 'Tidak ada data'}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-2">{getActionButtons(row)}</div>
                                            </TableCell>
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
        </AppLayout>
    );
}

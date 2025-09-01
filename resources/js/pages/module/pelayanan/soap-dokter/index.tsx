import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Bell, FileText, Edit, CheckCircle, UserCheck, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelayanan', href: '' },
    { title: 'SOAP Dokter', href: '' },
];

export default function PelayananSoapDokter() {
    const { pelayanan: initialPelayanan = [], flash } = usePage().props as unknown as PageProps;
    const [pelayanan, setPelayanan] = useState<PelayananData[]>(initialPelayanan);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

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

    const handlePasienSelesai = async (norawat: string) => {
        try {
            const encodedNorawat = btoa(norawat);
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/api/pelayanan/selesai/${encodedNorawat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success) {
                toast.success(data.message || 'Pasien selesai diperiksa');
                reloadPelayanan();
            } else {
                toast.error(data?.message || 'Gagal menandai pasien selesai');
            }
        } catch (error) {
            toast.error('Gagal menandai pasien selesai');
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
                        onClick={() => {
                            console.log('Button pemeriksaan clicked for:', row.nomor_register);
                            console.log('Encoded norawat:', norawat);
                            try {
                                router.visit(`/pelayanan/soap-dokter/${norawat}`);
                            } catch (error) {
                                console.error('Error navigating to pemeriksaan:', error);
                                toast.error('Gagal membuka halaman pemeriksaan');
                            }
                        }}
                    >
                        <FileText className="w-4 h-4 mr-1" />
                        Pemeriksaan
                    </Button>
                );
            case 'edit':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => router.visit(`/pelayanan/soap-dokter/rujukan/${norawat}`)}
                            >
                                <Send className="w-4 h-4 mr-1" />
                                Rujuk
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                onClick={() => router.visit(`/pelayanan/soap-dokter/edit/${norawat}`)}
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
                                onClick={() => router.visit(`/pelayanan/soap-dokter/permintaan/${norawat}`)}
                            >
                                <FileText className="w-4 h-4 mr-1" />
                                Permintaan
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handlePasienSelesai(row.nomor_register)}
                            >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Selesai
                            </Button>
                        </div>
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelayanan Dokter" />
            
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
                                                {row.tanggal_kujungan
                                                    ? format(new Date(row.tanggal_kujungan), 'dd-MM-yyyy', { locale: id })
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>{row.poli?.nama}</TableCell>
                                            <TableCell>{row.dokter?.namauser?.name}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {getActionButtons(row)}
                                                </div>
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

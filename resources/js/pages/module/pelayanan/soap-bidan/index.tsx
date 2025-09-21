import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, CheckCircle, ChevronLeft, ChevronRight, Edit, FileText, MoreVertical, Search, Send, UserCheck } from 'lucide-react';
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

interface Bidan {
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
    bidan_id: number;
    tindakan_button: 'panggil' | 'soap' | 'edit' | 'half_complete' | 'Complete';
    pasien: Pasien;
    poli: Poli;
    bidan: Bidan;
    pendaftaran: Pendaftaran;
    status_daftar?: number;
    status_perawat?: number;
    status_bidan?: number;
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
    { title: 'SOAP Bidan', href: '' },
];

export default function PelayananSoapBidan() {
    const { pelayanan: initialPelayanan = [], flash } = usePage().props as unknown as PageProps;
    const [pelayanan, setPelayanan] = useState<PelayananData[]>(initialPelayanan);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
            const res = await fetch(`/api/pelayanan/hadir-bidan/${encodedNorawat}`, {
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
            const res = await fetch(`/api/pelayanan/selesai-bidan/${encodedNorawat}`, {
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

    // Pagination functions
    const getTotalPages = () => Math.ceil(filteredPelayanan.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredPelayanan.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

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
                        Menunggu Bidan
                    </Badge>
                );
            case 'half_complete':
                return (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        Half Complete
                    </Badge>
                );
            case 'Complete':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                        Sudah Dicek Bidan
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
                        disabled={!((row.status_daftar ?? 0) === 2 && (row.status_bidan ?? 0) === 0)}
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
                        onClick={() => {
                            try {
                                router.visit(`/pelayanan/soap-bidan/${norawat}`);
                            } catch (error) {
                                toast.error('Gagal membuka halaman pemeriksaan');
                            }
                        }}
                    >
                        <FileText className="mr-1 h-4 w-4" />
                        Pemeriksaan
                    </Button>
                );
            case 'edit':
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="xs" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={() => router.visit(`/pelayanan/soap-bidan/edit/${norawat}`)}
                                className="text-yellow-600 focus:text-yellow-600"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.visit(`/pelayanan/soap-bidan/rujukan/${norawat}`)}
                                className="text-blue-600 focus:text-blue-600"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Surat Rujukan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.visit(`/pelayanan/soap-bidan/permintaan/${norawat}`)}
                                className="text-cyan-600 focus:text-cyan-600"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Surat Permintaan
                            </DropdownMenuItem>
                            {/* Tambah aksi Konfirmasi saat status_bidan === 3 */}
                            <DropdownMenuItem
                                onClick={() => router.visit(`/pelayanan/soap-bidan/konfirmasi/${norawat}`)}
                                disabled={(row.status_bidan ?? 0) !== 3}
                                className="text-purple-600 focus:text-purple-600"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Konfirmasi
                            </DropdownMenuItem>
                            {/* status_bidan === 2 -> tombol Selesai aktif; jika 1 tetap ada, opsional */}
                            <DropdownMenuItem
                                disabled={(row.status_bidan ?? 0) !== 2}
                                onClick={() => handlePasienSelesai(row.nomor_register)}
                                className="text-green-600 focus:text-green-600"
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Selesai
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case 'half_complete':
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="xs"
                            className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            onClick={() => router.visit(`/pelayanan/soap-bidan/konfirmasi/${norawat}`)}
                        >
                            <FileText className="mr-1 h-4 w-4" />
                            Konfirmasi
                        </Button>
                        <Button
                            variant="outline"
                            size="xs"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handlePasienSelesai(row.nomor_register)}
                        >
                            <UserCheck className="mr-1 h-4 w-4" />
                            Selesai
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelayanan Bidan" />

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
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-center text-sm font-semibold">Status</th>
                                            <th className="p-2 text-left text-sm font-semibold">No.RM</th>
                                            <th className="p-2 text-left text-sm font-semibold">Pasien</th>
                                            <th className="p-2 text-center text-sm font-semibold">No.Antrian</th>
                                            <th className="p-2 text-center text-sm font-semibold">No.Registrasi</th>
                                            <th className="p-2 text-center text-sm font-semibold">Tanggal Kunjungan</th>
                                            <th className="p-2 text-left text-sm font-semibold">Poli</th>
                                            <th className="p-2 text-left text-sm font-semibold">Bidan</th>
                                            <th className="p-2 text-center text-sm font-semibold">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getCurrentPageData().length > 0 ? (
                                            getCurrentPageData().map((row) => (
                                                <tr key={row.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2 text-center">{getStatusBadge(row.tindakan_button)}</td>
                                                    <td className="p-2 font-mono">{row.nomor_rm}</td>
                                                    <td className="p-2">{row.pasien?.nama}</td>
                                                    <td className="p-2 text-center font-mono">{row.pendaftaran?.antrian}</td>
                                                    <td className="p-2 text-center font-mono">{row.nomor_register}</td>
                                                    <td className="p-2 text-center">
                                                        {row.tanggal_kujungan ? format(new Date(row.tanggal_kujungan), 'dd-MM-yyyy', { locale: id }) : '-'}
                                                    </td>
                                                    <td className="p-2">{row.poli?.nama}</td>
                                                    <td className="p-2">{row.bidan?.namauser?.name}</td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-col items-center gap-2">{getActionButtons(row)}</div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                                    Tidak ada data pelayanan
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {filteredPelayanan.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="items-per-page" className="text-sm">
                                            Tampilkan:
                                        </Label>
                                        <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(Number(value))}>
                                            <SelectTrigger id="items-per-page" className="w-20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        Halaman {currentPage} dari {getTotalPages()}
                                    </span>
                                </div>

                                {getTotalPages() > 1 && (
                                    <div className="flex items-center space-x-2">
                                        {/* Previous Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Sebelumnya
                                        </Button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center space-x-1">
                                            {/* First page */}
                                            {currentPage > 3 && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} className="h-8 w-8 p-0">
                                                        1
                                                    </Button>
                                                    {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                                                </>
                                            )}

                                            {/* Pages around current page */}
                                            {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                                                let pageNumber: number;
                                                if (getTotalPages() <= 5) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= getTotalPages() - 2) {
                                                    pageNumber = getTotalPages() - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }

                                                if (pageNumber < 1 || pageNumber > getTotalPages()) return null;

                                                return (
                                                    <Button
                                                        key={pageNumber}
                                                        variant={pageNumber === currentPage ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handlePageChange(pageNumber)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {pageNumber}
                                                    </Button>
                                                );
                                            })}

                                            {/* Last page */}
                                            {currentPage < getTotalPages() - 2 && (
                                                <>
                                                    {currentPage < getTotalPages() - 3 && <span className="px-2 text-gray-500">...</span>}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePageChange(getTotalPages())}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {getTotalPages()}
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        {/* Next Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === getTotalPages()}
                                            className="flex items-center gap-1"
                                        >
                                            Selanjutnya
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

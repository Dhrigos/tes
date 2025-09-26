import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, CheckCircle, ChevronLeft, ChevronRight, Edit, FileText, Search } from 'lucide-react';
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
    const [isBusy, setIsBusy] = useState(false);
    const [showDokterDialog, setShowDokterDialog] = useState(false);
    const [selectedPasien, setSelectedPasien] = useState<PelayananData | null>(null);
    const [dokterList, setDokterList] = useState<Dokter[]>([]);
    const [selectedDokter, setSelectedDokter] = useState<string>('');

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
            only: ['pelayanans'],
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
            onError: () => toast.error('Gagal memuat ulang data pelayanan'),
        });
    };

    // Silent reload untuk polling agar tidak mengganggu UI
    const reloadPelayananSilent = () => {
        router.reload({
            only: ['pelayanans'],
            // Silent: tidak mengubah loading state dan hanya memuat prop yang diperlukan
            onError: () => toast.error('Gagal memuat ulang data pelayanan'),
        });
    };

    const handlePanggilPasien = async (norawat: string, isKia: boolean) => {
        try {
            setIsBusy(true);
            const encodedNorawat = btoa(norawat);
            const url = isKia ? `/api/pelayanan/hadir-bidan/${encodedNorawat}` : `/api/pelayanan/hadir/${encodedNorawat}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success) {
                toast.success(data.message || 'Pasien dipanggil');
                reloadPelayananSilent();
            } else {
                toast.error(data?.message || 'Gagal memanggil pasien');
            }
        } catch (error) {
            toast.error('Gagal memanggil pasien');
        } finally {
            setIsBusy(false);
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
            setIsBusy(true);
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
                reloadPelayananSilent();
            } else {
                toast.error(data?.message || 'Gagal mengupdate dokter');
            }
        } catch (error) {
            toast.error('Gagal mengupdate dokter');
        } finally {
            setIsBusy(false);
        }
    };

    // Pastikan pasien KIA tidak tampil di halaman perawat (guard sisi frontend)
    const pelayananNonKia = pelayanan.filter((p) => !(p?.poli?.nama || '').toUpperCase().includes('KIA'));

    const filteredPelayanan = pelayananNonKia.filter((p) => {
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

    // Polling ringan (visible-only) dengan silent reload dan guard interaksi
    useEffect(() => {
        let timer: number | undefined;

        const isTyping = () => {
            const ae = document.activeElement as HTMLElement | null;
            const tag = ae?.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA';
        };

        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            if (isBusy) return;
            if (isTyping()) return;
            reloadPelayananSilent();
        };

        const start = () => {
            if (document.visibilityState === 'visible') {
                tick();
                timer = window.setInterval(tick, 8000);
            }
        };

        const stop = () => {
            if (timer) {
                clearInterval(timer);
                timer = undefined;
            }
        };

        const onVisibilityChange = () => {
            stop();
            start();
        };

        start();
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [isBusy]);

    // Revalidate on focus
    useEffect(() => {
        const onFocus = () => {
            if (!isBusy) reloadPelayananSilent();
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [isBusy]);

    const getStatusBadge = (row: PelayananData) => {
        switch (row.tindakan_button) {
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
        const isKia = (row?.poli?.nama || '').toUpperCase().includes('KIA');

        switch (row.tindakan_button) {
            case 'panggil':
                return (
                    <Button
                        variant="outline"
                        size="xs"
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                        onClick={() => handlePanggilPasien(row.nomor_register, isKia)}
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
                        onClick={() => router.visit(isKia ? `/pelayanan/soap-bidan/${norawat}` : `/pelayanan/so-perawat/${norawat}?mode=pemeriksaan`)}
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
                            onClick={() =>
                                router.visit(isKia ? `/pelayanan/soap-bidan/edit/${norawat}` : `/pelayanan/so-perawat/edit/${norawat}?mode=edit`)
                            }
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
                                            <th className="p-2 text-left text-sm font-semibold">Dokter</th>
                                            <th className="p-2 text-center text-sm font-semibold">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getCurrentPageData().length > 0 ? (
                                            getCurrentPageData().map((row) => (
                                                <tr key={row.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2 text-center">{getStatusBadge(row)}</td>
                                                    <td className="p-2 font-mono">{row.nomor_rm}</td>
                                                    <td className="p-2">{row.pasien?.nama}</td>
                                                    <td className="p-2 text-center font-mono">{row.pendaftaran?.antrian}</td>
                                                    <td className="p-2 text-center font-mono">{row.nomor_register}</td>
                                                    <td className="p-2 text-center">
                                                        {row.tanggal_kujungan ? format(new Date(row.tanggal_kujungan), 'dd-MM-yyyy', { locale: id }) : '-'}
                                                    </td>
                                                    <td className="p-2">{row.poli?.nama}</td>
                                                    <td className="p-2">{row.dokter?.namauser?.name || row.dokter?.nama || 'Tidak ada data'}</td>
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

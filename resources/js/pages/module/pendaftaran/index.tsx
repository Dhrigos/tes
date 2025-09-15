import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, AlertCircle, CheckCircle, Clock, FileText, Plus, Printer, Search, Stethoscope, UserCheck, UserIcon, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

// Layout imports
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// Date formatting utility
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        return dateString;
    }
};

// Convert day name to Indonesian
const convertDayToIndonesian = (day: string) => {
    const dayMap: { [key: string]: string } = {
        senin: 'Senin',
        selasa: 'Selasa',
        rabu: 'Rabu',
        kamis: 'Kamis',
        jumat: 'Jumat',
        sabtu: 'Sabtu',
        minggu: 'Minggu',
    };
    return dayMap[day.toLowerCase()] || day;
};

// Interfaces
interface Pasien {
    id: number;
    nama: string;
    no_rm: string;
    nik: string;
    no_bpjs?: string;
    kodeprovide?: string;
}

interface Poli {
    id: number;
    nama: string;
    kode: string;
    kode_loket?: string;
}

interface Dokter {
    id: number;
    nama: string;
    users?: number;
    namauser?: {
        id: number;
        name: string;
    };
}

interface Penjamin {
    id: number;
    nama: string;
}

interface PendaftaranData {
    id: number;
    nomor_register: string;
    tanggal_kujungan: string;
    nomor_rm: string;
    antrian: string;
    no_urut?: string;
    pasien: Pasien;
    poli: Poli;
    dokter: Dokter;
    penjamin: Penjamin;
    status: {
        id: number;
        status_pendaftaran: number;
        status_panggil: number;
        Status_aplikasi: number;
    };
}

interface RekapDokter {
    dokter: Dokter;
    poli: Poli;
    menunggu: number;
    dilayani: number;
    no_antrian: string;
    status_periksa: number;
}

interface Statistics {
    total_terdaftar: number;
    jumlah_dokter: number;
    total_pasien: number;
    pasien_selesai: number;
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pendaftaran', href: '' },
    { title: 'Dashboard', href: '' },
];

// Main Component
const PendaftaranDashboard = () => {
    // State declarations
    const [pendaftaranData, setPendaftaranData] = useState<PendaftaranData[]>([]);
    const [pasienList, setPasienList] = useState<Pasien[]>([]);
    const [poliList, setPoliList] = useState<Poli[]>([]);
    const [dokterList, setDokterList] = useState<Dokter[]>([]);
    const [penjaminList, setPenjaminList] = useState<Penjamin[]>([]);
    const [rekapDokter, setRekapDokter] = useState<RekapDokter[]>([]);
    const [statistics, setStatistics] = useState<Statistics>({
        total_terdaftar: 0,
        jumlah_dokter: 0,
        total_pasien: 0,
        pasien_selesai: 0,
    });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRekapModal, setShowRekapModal] = useState(false);
    const [showBatalModal, setShowBatalModal] = useState(false);
    const [showHadirModal, setShowHadirModal] = useState(false);
    const [showUbahDokterModal, setShowUbahDokterModal] = useState(false);

    // Form states
    const [selectedPasien, setSelectedPasien] = useState('');
    const [selectedPoli, setSelectedPoli] = useState('');
    const [selectedDokter, setSelectedDokter] = useState('');
    const [selectedPenjamin, setSelectedPenjamin] = useState('');
    const [tanggalKujungan, setTanggalKujungan] = useState<string>(new Date().toISOString().split('T')[0]);
    const [waktuKunjungan, setWaktuKunjungan] = useState('08:00');
    const [hariKunjungan, setHariKunjungan] = useState('');
    const [hariList, setHariList] = useState<string[]>([]);

    // Search states
    const [searchPasien, setSearchPasien] = useState('');
    const [filteredPasienList, setFilteredPasienList] = useState<Pasien[]>([]);
    const [searchingPasien, setSearchingPasien] = useState(false);

    // Action states
    const [selectedAction, setSelectedAction] = useState<{
        id: number;
        nomor_register: string;
        nama: string;
        type: string;
    } | null>(null);
    const [alasanBatal, setAlasanBatal] = useState('');

    // Loading state
    const [loading, setLoading] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Auto set hari based on tanggal
    useEffect(() => {
        if (tanggalKujungan) {
            const date = new Date(tanggalKujungan);
            const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
            const dayName = dayNames[date.getDay()];
            setHariKunjungan(dayName);
        }
    }, [tanggalKujungan]);

    // Fetch doctors when poli, hari, or waktu changes
    useEffect(() => {
        if (selectedPoli && hariKunjungan && waktuKunjungan) {
            fetchDokterByPoli(selectedPoli, hariKunjungan, waktuKunjungan);
        } else {
            setDokterList([]);
            setSelectedDokter('');
        }
    }, [selectedPoli, hariKunjungan, waktuKunjungan]);

    // Filter pasien list based on search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchPasien.trim() === '') {
                setFilteredPasienList(pasienList);
            } else {
                const filtered = pasienList.filter(
                    (pasien) =>
                        pasien.nama.toLowerCase().includes(searchPasien.toLowerCase()) ||
                        pasien.no_rm.toLowerCase().includes(searchPasien.toLowerCase()) ||
                        pasien.nik.toLowerCase().includes(searchPasien.toLowerCase()) ||
                        (pasien.no_bpjs && pasien.no_bpjs.toLowerCase().includes(searchPasien.toLowerCase())),
                );
                setFilteredPasienList(filtered);

                // Jika hasil filter kosong dan ada pencarian, coba cari dari API
                if (filtered.length === 0 && searchPasien.length >= 3) {
                    searchPasienAPI(searchPasien);
                }
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
    }, [searchPasien, pasienList]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchMasterData(), fetchHariList(), fetchPendaftaranData()]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const response = await fetch('/api/pendaftaran/master-data', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setPasienList(data.pasien || []);
                setPoliList(data.poli || []);
                setPenjaminList(data.penjamin || []);
            } else {
                toast.error(data.message || 'Gagal memuat data master');
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
            toast.error('Gagal memuat data master: ' + (error as Error).message);
        }
    };

    const searchPasienAPI = async (searchTerm: string) => {
        setSearchingPasien(true);
        try {
            const response = await fetch(`/api/master/pasien/search?search=${encodeURIComponent(searchTerm)}&limit=20`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setPasienList(data.data || []);
            }
        } catch (error) {
            console.error('Error searching pasien:', error);
            toast.error('Gagal mencari pasien: ' + (error as Error).message);
        } finally {
            setSearchingPasien(false);
        }
    };

    const fetchHariList = async () => {
        try {
            const response = await fetch('/api/master/hari', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setHariList(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching hari list:', error);
        }
    };

    const fetchPendaftaranData = async () => {
        try {
            const response = await fetch('/api/pendaftaran/data', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setPendaftaranData(data.data.pendaftaran || []);
                setRekapDokter(data.data.rekap_dokter || []);
                setStatistics(data.data.statistics || statistics);
            } else {
                console.error('API returned error:', data.message);
            }
        } catch (error) {
            console.error('Error fetching pendaftaran data:', error);
        }
    };

    const fetchDokterByPoli = async (poliId: string, hari: string, jam: string) => {
        try {
            const response = await fetch('/api/master/dokter/by-poli', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    poli_id: parseInt(poliId),
                    hari: hari,
                    jam: jam,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setDokterList(data.data || []);
            } else {
                setDokterList([]);
                console.error('No doctors available for this schedule');
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDokterList([]);
            toast.error('Gagal memuat data dokter');
        }
    };

    // Form handlers
    const handleAddPendaftaran = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPasien || !selectedPoli || !selectedDokter || !selectedPenjamin) {
            toast.error('Mohon lengkapi semua field yang diperlukan');
            return;
        }

        // Validasi pasien yang dipilih
        const selectedPasienData = pasienList.find((p) => p.id.toString() === selectedPasien);
        if (!selectedPasienData) {
            toast.error('Data pasien tidak valid, silakan pilih ulang');
            return;
        }

        setLoading(true);

        const selectedPoliData = poliList.find((p) => p.id.toString() === selectedPoli);

        const payload = {
            pasien_id: parseInt(selectedPasien),
            poli_id: parseInt(selectedPoli),
            dokter_id: parseInt(selectedDokter),
            penjamin_id: parseInt(selectedPenjamin),
            tanggal: tanggalKujungan,
            jam: waktuKunjungan,
            kode_loket: selectedPoliData?.kode_loket,
            pasien_info: {
                nama: selectedPasienData.nama,
                no_rm: selectedPasienData.no_rm,
                nik: selectedPasienData.nik,
                no_bpjs: selectedPasienData.no_bpjs,
            },
        };

        try {
            const response = await fetch('/api/pendaftaran', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(
                    `Pendaftaran berhasil ditambahkan untuk ${selectedPasienData.nama} (RM: ${selectedPasienData.no_rm}) - Loket ${selectedPoliData?.kode_loket}`,
                );
                setShowAddModal(false);
                resetForm();
                fetchPendaftaranData();
            } else {
                throw new Error(result.message || 'Gagal menyimpan pendaftaran');
            }
        } catch (error: any) {
            console.error('Error saving pendaftaran:', error);
            toast.error((error as Error).message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setLoading(false);
        }
    };

    const handleBatalPendaftaran = async () => {
        if (!selectedAction || !alasanBatal.trim()) {
            toast.error('Mohon masukkan alasan pembatalan');
            return;
        }

        setLoading(true);
        try {
            const encodedNorawat = btoa(selectedAction.nomor_register);
            const response = await fetch(`/api/pelayanan/batal/${encodedNorawat}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    alasan_batal: alasanBatal,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Pendaftaran berhasil dibatalkan');
                setShowBatalModal(false);
                resetActionState();
                fetchPendaftaranData();
            } else {
                throw new Error(result.message || 'Gagal membatalkan pendaftaran');
            }
        } catch (error: any) {
            console.error('Error cancelling pendaftaran:', error);
            toast.error((error as Error).message || 'Gagal membatalkan pendaftaran');
        } finally {
            setLoading(false);
        }
    };

    const handleHadirPendaftaran = async () => {
        if (!selectedAction) {
            toast.error('Tidak ada data yang dipilih');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                hadirid_delete: selectedAction.id,
            };

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token tidak ditemukan');
            }

            const response = await fetch('/api/pendaftaran/hadir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success('Status kehadiran berhasil diupdate');
                setShowHadirModal(false);
                resetActionState();
                fetchPendaftaranData();
            } else {
                throw new Error(result.message || 'Gagal mengupdate status kehadiran');
            }
        } catch (error: any) {
            console.error('Error updating attendance:', error);
            toast.error((error as Error).message || 'Gagal mengupdate status kehadiran');
        } finally {
            setLoading(false);
        }
    };

    const handleUbahDokter = async () => {
        if (!selectedAction || !selectedDokter) {
            toast.error('Mohon pilih dokter baru');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/pendaftaran/dokter/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    rubahdokter_id: selectedAction.id,
                    dokter_id_update: selectedDokter,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Dokter berhasil diupdate');
                setShowUbahDokterModal(false);
                resetActionState();
                fetchPendaftaranData();
            } else {
                throw new Error(result.message || 'Gagal mengupdate dokter');
            }
        } catch (error: any) {
            console.error('Error updating doctor:', error);
            toast.error(error.message || 'Gagal mengupdate dokter');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedPasien('');
        setSelectedPoli('');
        setSelectedDokter('');
        setSelectedPenjamin('');
        setTanggalKujungan(new Date().toISOString().split('T')[0]);
        setWaktuKunjungan('08:00');
        setHariKunjungan('');
        setSearchPasien('');
    };

    const resetActionState = () => {
        setSelectedAction(null);
        setAlasanBatal('');
        setSelectedDokter('');
    };

    const buildTicketHtml = (item: PendaftaranData) => {
        return `
            <div id="printArea">
                <h1 style="font-size: 3rem; text-align: center;">${item.antrian}</h1>
            </div>
        `;
    };

    const handleCetak = (item: PendaftaranData) => {
        try {
            const ticketHtml = buildTicketHtml(item);
            const printWindow = window.open('', '', 'width=420,height=600');
            if (!printWindow) {
                toast.error('Pop-up diblokir. Izinkan pop-up untuk mencetak.');
                return;
            }
            printWindow.document.write('<html><head><title>Cetak Nomor Antrian</title>');
            printWindow.document.write('</head><body style="text-align:center; font-family:sans-serif;">');
            printWindow.document.write(ticketHtml);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } catch (err) {
            console.error('Print error:', err);
            toast.error('Gagal mencetak tiket');
        }
    };

    const getStatusPendaftaran = (status: number | string) => {
        // Convert to number for comparison
        const statusNum = Number(status);
        switch (statusNum) {
            case 1:
                return 'Aplikasi Offline';
            case 2:
                return 'Aplikasi Online';
            case 3:
                return 'Sistem BPJS / MJKN';
            default:
                return `Tidak diketahui (${status})`;
        }
    };

    const getStatusPeriksaBadge = (status: number) => {
        switch (status) {
            case 1:
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Activity className="mr-1 h-4 w-4" />
                        Menunggu
                    </Badge>
                );
            case 2:
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Stethoscope className="mr-1 h-4 w-4" />
                        Sedang melayani
                    </Badge>
                );
            case 3:
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        <X className="mr-1 h-4 w-4" />
                        Sedang kosong
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Tidak diketahui</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Main Content */}
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Pasien Terdaftar</p>
                                    <p className="text-2xl font-bold">{statistics.total_terdaftar}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Jumlah Dokter</p>
                                    <p className="text-2xl font-bold">{statistics.jumlah_dokter}</p>
                                </div>
                                <Stethoscope className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Pasien</p>
                                    <p className="text-2xl font-bold">{statistics.total_pasien}</p>
                                </div>
                                <Users className="h-8 w-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pasien Selesai</p>
                                    <p className="text-2xl font-bold">{statistics.pasien_selesai}</p>
                                </div>
                                <UserCheck className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-between">
                    <Button onClick={() => setShowRekapModal(true)} variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Lihat status Dokter
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pendaftaran Pasien
                    </Button>
                </div>

                {/* Data Table */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Data Pendaftaran Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-left text-sm font-semibold">Pasien</th>
                                            <th className="p-2 text-center text-sm font-semibold">Status</th>
                                            <th className="p-2 text-center text-sm font-semibold">No.Register</th>
                                            <th className="p-2 text-center text-sm font-semibold">Tanggal</th>
                                            <th className="p-2 text-left text-sm font-semibold">No.RM</th>
                                            <th className="p-2 text-center text-sm font-semibold">Antrian</th>
                                            <th className="p-2 text-left text-sm font-semibold">Poli & Loket</th>
                                            <th className="p-2 text-left text-sm font-semibold">Penjamin</th>
                                            <th className="p-2 text-center text-sm font-semibold">Dokter</th>
                                            <th className="p-2 text-center text-sm font-semibold">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendaftaranData.length > 0 ? (
                                            pendaftaranData.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{item.pasien.nama}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getStatusPendaftaran(item.status?.Status_aplikasi || 1)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-2 text-center text-sm">{item.nomor_register}</td>
                                                    <td className="p-2 text-center text-sm">{formatDate(item.tanggal_kujungan)}</td>
                                                    <td className="p-2 text-sm">{item.nomor_rm}</td>
                                                    <td className="p-2" align="center">
                                                        <Badge className="bg-blue-100 text-xs text-blue-800">{item.antrian}</Badge>
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{item.poli.nama}</span>
                                                            {item.poli.kode_loket && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Loket:{' '}
                                                                    <span className="rounded bg-blue-50 px-1 font-mono text-blue-700">
                                                                        {item.poli.kode_loket}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-sm">{item.penjamin.nama}</td>
                                                    <td className="p-2 text-center text-sm">{item.dokter.namauser?.name || item.dokter.nama}</td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-wrap items-center justify-center gap-1">
                                                            {String(item.status?.status_pendaftaran) === '1' && (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-xs hover:bg-blue-50"
                                                                        onClick={() => {
                                                                            setSelectedAction({
                                                                                id: item.id,
                                                                                nomor_register: item.nomor_register,
                                                                                nama: item.pasien.nama,
                                                                                type: 'dokter',
                                                                            });
                                                                            // Load dokter untuk poli yang sama
                                                                            if (hariKunjungan && waktuKunjungan) {
                                                                                fetchDokterByPoli(
                                                                                    item.poli.id.toString(),
                                                                                    hariKunjungan,
                                                                                    waktuKunjungan,
                                                                                );
                                                                            }
                                                                            setShowUbahDokterModal(true);
                                                                        }}
                                                                    >
                                                                        <UserIcon className="mr-1 h-3 w-3" />
                                                                        Ubah Dokter
                                                                    </Button>
                                                                    <div className="flex justify-center gap-1">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 px-2 text-xs text-green-600 hover:bg-green-50"
                                                                            onClick={() => {
                                                                                setSelectedAction({
                                                                                    id: item.id,
                                                                                    nomor_register: item.nomor_register,
                                                                                    nama: item.pasien.nama,
                                                                                    type: 'hadir',
                                                                                });
                                                                                setShowHadirModal(true);
                                                                            }}
                                                                        >
                                                                            <UserCheck className="mr-1 h-3 w-3" />
                                                                            Hadir
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 px-2 text-xs text-destructive hover:bg-red-50"
                                                                            onClick={() => {
                                                                                setSelectedAction({
                                                                                    id: item.id,
                                                                                    nomor_register: item.nomor_register,
                                                                                    nama: item.pasien.nama,
                                                                                    type: 'batal',
                                                                                });
                                                                                setShowBatalModal(true);
                                                                            }}
                                                                        >
                                                                            <X className="mr-1 h-3 w-3" />
                                                                            Batal
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {String(item.status?.status_pendaftaran) === '2' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-xs text-destructive hover:bg-red-50"
                                                                    onClick={() => {
                                                                        setSelectedAction({
                                                                            id: item.id,
                                                                            nomor_register: item.nomor_register,
                                                                            nama: item.pasien.nama,
                                                                            type: 'batal-pcare',
                                                                        });
                                                                        setShowBatalModal(true);
                                                                    }}
                                                                >
                                                                    <X className="mr-1 h-3 w-3" />
                                                                    Batal
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs hover:bg-gray-50"
                                                                onClick={() => handleCetak(item)}
                                                            >
                                                                <Printer className="mr-1 h-3 w-3" />
                                                                Cetak
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                                    Belum ada data pendaftaran hari ini
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Patient Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="!max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Tambah Pendaftaran Pasien
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddPendaftaran} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            {/* Form Pendaftaran */}
                            <div className="xl:col-span-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Pasien */}
                                    <div className="md:col-span-2">
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label htmlFor="pasien">Pasien</Label>
                                            <span className="text-xs text-muted-foreground">
                                                Total: {pasienList.length} pasien
                                                {searchingPasien && <span className="ml-1 text-blue-600">(mencari...)</span>}
                                            </span>
                                        </div>
                                        <Select value={selectedPasien} onValueChange={setSelectedPasien} disabled={loading}>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        loading
                                                            ? 'Memuat data pasien...'
                                                            : pasienList.length === 0
                                                              ? 'Tidak ada data pasien'
                                                              : 'Pilih Pasien'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <div className="relative">
                                                        <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                        <Input
                                                            placeholder="Cari pasien berdasarkan nama, RM, NIK, atau BPJS..."
                                                            value={searchPasien}
                                                            onChange={(e) => setSearchPasien(e.target.value)}
                                                            className="mb-2 pl-8"
                                                        />
                                                    </div>
                                                    {searchPasien && (
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <p className="text-xs text-muted-foreground">
                                                                Ditemukan {filteredPasienList.length} pasien
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSearchPasien('')}
                                                                className="h-6 px-2 text-xs"
                                                            >
                                                                Reset
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                {filteredPasienList.length > 0 ? (
                                                    filteredPasienList.map((pasien) => (
                                                        <SelectItem key={pasien.id} value={pasien.id.toString()}>
                                                            <div className="flex flex-col">
                                                                <div className="font-medium">{pasien.nama}</div>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-muted-foreground">
                                                        {searchingPasien
                                                            ? 'Mencari pasien...'
                                                            : searchPasien
                                                              ? 'Tidak ada pasien ditemukan'
                                                              : loading
                                                                ? 'Memuat data pasien...'
                                                                : 'Tidak ada data pasien'}
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {pasienList.length === 0 && !loading && (
                                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                <p className="text-sm text-amber-800">
                                                    <strong>Perhatian:</strong> Tidak ada data pasien tersedia. Silakan tambahkan data pasien terlebih
                                                    dahulu.
                                                </p>
                                            </div>
                                        )}
                                        {searchPasien && filteredPasienList.length === 0 && pasienList.length > 0 && !searchingPasien && (
                                            <p className="mt-1 text-xs text-amber-600">Tidak ada pasien yang cocok dengan pencarian</p>
                                        )}
                                    </div>

                                    {/* Tanggal Kunjungan */}
                                    <div>
                                        <Label htmlFor="tanggal">Tanggal Kunjungan</Label>
                                        <Input
                                            type="date"
                                            value={tanggalKujungan}
                                            onChange={(e) => setTanggalKujungan(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="dark:[&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Hari: {hariKunjungan ? convertDayToIndonesian(hariKunjungan) : '-'}
                                        </p>
                                    </div>

                                    {/* Waktu Kunjungan */}
                                    <div>
                                        <Label htmlFor="waktu">Waktu Kunjungan</Label>
                                        <Input type="time" value={waktuKunjungan} onChange={(e) => setWaktuKunjungan(e.target.value)} />
                                    </div>

                                    {/* Poli */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label htmlFor="poli">Poli (dengan Loket)</Label>
                                            <span className="text-xs text-muted-foreground">Total: {poliList.length} poli</span>
                                        </div>
                                        <Select value={selectedPoli} onValueChange={setSelectedPoli}>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        loading
                                                            ? 'Memuat data poli...'
                                                            : poliList.length === 0
                                                              ? 'Tidak ada poli tersedia'
                                                              : 'Pilih Poli & Loket'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {poliList.map((poli) => (
                                                    <SelectItem key={poli.id} value={poli.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <div className="font-medium">{poli.nama}</div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {poliList.length === 0 && !loading && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Tidak ada poli yang tersedia. Silakan konfigurasi loket terlebih dahulu.
                                            </p>
                                        )}
                                    </div>

                                    {/* Dokter */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label htmlFor="dokter">Dokter</Label>
                                            <span className="text-xs text-muted-foreground">
                                                Total: {dokterList.length} dokter
                                                {selectedPoli && hariKunjungan && waktuKunjungan && !loading && (
                                                    <span className="ml-1 text-blue-600">(untuk jadwal ini)</span>
                                                )}
                                            </span>
                                        </div>
                                        <Select
                                            value={selectedDokter}
                                            onValueChange={setSelectedDokter}
                                            disabled={!selectedPoli || !hariKunjungan || !waktuKunjungan}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        !selectedPoli
                                                            ? 'Pilih poli dulu'
                                                            : !hariKunjungan || !waktuKunjungan
                                                              ? 'Tentukan jadwal dulu'
                                                              : dokterList.length === 0
                                                                ? 'Tidak ada dokter lain yang tersedia'
                                                                : 'Pilih Dokter'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dokterList.map((dokter) => (
                                                    <SelectItem key={dokter.id} value={dokter.id.toString()}>
                                                        {dokter.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {dokterList.length === 0 && selectedPoli && hariKunjungan && waktuKunjungan && !loading && (
                                            <p className="mt-1 text-xs text-amber-600">Tidak ada dokter lain yang tersedia pada jadwal ini</p>
                                        )}
                                    </div>

                                    {/* Penjamin */}
                                    <div className="md:col-span-2">
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label htmlFor="penjamin">Penjamin</Label>
                                        </div>
                                        <Select value={selectedPenjamin} onValueChange={setSelectedPenjamin}>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        loading
                                                            ? 'Memuat data penjamin...'
                                                            : penjaminList.length === 0
                                                              ? 'Tidak ada data penjamin'
                                                              : 'Pilih Penjamin'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {penjaminList.map((penjamin) => (
                                                    <SelectItem key={penjamin.id} value={penjamin.id.toString()}>
                                                        {penjamin.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {penjaminList.length === 0 && !loading && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Tidak ada data penjamin tersedia. Silakan tambahkan data penjamin terlebih dahulu.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Informasi Pasien Terpilih & Ringkasan Pendaftaran */}
                            <div className="xl:col-span-1">
                                <div className="space-y-4">
                                    {/* Tampilkan informasi pasien yang dipilih */}
                                    {selectedPasien && (
                                        <div className="rounded-lg border bg-blue-50 p-3 transition-all duration-200 hover:shadow-md">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-blue-600" />
                                                    <p className="text-sm font-medium text-blue-900">Pasien Terpilih:</p>
                                                </div>
                                                <Badge className="bg-blue-100 text-xs text-blue-800">Terpilih</Badge>
                                            </div>
                                            {(() => {
                                                const pasien = pasienList.find((p) => p.id.toString() === selectedPasien);
                                                return pasien ? (
                                                    <div className="space-y-1 text-sm text-blue-800">
                                                        <p>
                                                            <strong>Nama:</strong> {pasien.nama}
                                                        </p>
                                                        <p>
                                                            <strong>No. RM:</strong> {pasien.no_rm}
                                                        </p>
                                                        <p>
                                                            <strong>NIK:</strong> {pasien.nik}
                                                        </p>
                                                        {pasien.no_bpjs && (
                                                            <p>
                                                                <strong>No. BPJS:</strong> {pasien.no_bpjs}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    )}

                                    {/* Ringkasan Pendaftaran */}
                                    {selectedPasien ? (
                                        selectedPoli && selectedDokter && selectedPenjamin ? (
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 transition-all duration-200 hover:shadow-md">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <p className="text-sm font-medium text-green-900">Ringkasan Pendaftaran:</p>
                                                    </div>
                                                    <Badge className="bg-green-100 text-xs text-green-800">Lengkap</Badge>
                                                </div>
                                                <div className="space-y-1 text-sm text-green-800">
                                                    <p>
                                                        <strong>Poli:</strong> {poliList.find((p) => p.id.toString() === selectedPoli)?.nama}
                                                        {poliList.find((p) => p.id.toString() === selectedPoli)?.kode_loket && (
                                                            <span className="ml-2 rounded bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800">
                                                                Loket {poliList.find((p) => p.id.toString() === selectedPoli)?.kode_loket}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p>
                                                        <strong>Dokter:</strong> {dokterList.find((d) => d.id.toString() === selectedDokter)?.nama}
                                                    </p>
                                                    <p>
                                                        <strong>Penjamin:</strong>{' '}
                                                        {penjaminList.find((p) => p.id.toString() === selectedPenjamin)?.nama}
                                                    </p>
                                                    <p>
                                                        <strong>Tanggal:</strong> {tanggalKujungan} ({convertDayToIndonesian(hariKunjungan)})
                                                    </p>
                                                    <p>
                                                        <strong>Waktu:</strong> {waktuKunjungan}
                                                    </p>
                                                    <p>
                                                        <strong>Kode Antrian:</strong>{' '}
                                                        <span className="rounded bg-blue-100 px-2 py-1 font-mono text-sm text-blue-800">
                                                            {poliList.find((p) => p.id.toString() === selectedPoli)?.kode_loket}-XX
                                                        </span>
                                                        <span className="ml-2 text-xs text-muted-foreground">(akan di-generate otomatis)</span>
                                                    </p>
                                                </div>
                                                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                                                    <div
                                                        className="h-2 rounded-full bg-green-600 transition-all duration-300"
                                                        style={{ width: '100%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:shadow-sm">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-gray-600" />
                                                        <p className="text-sm font-medium text-gray-900">Ringkasan Pendaftaran:</p>
                                                    </div>
                                                    <Badge className="bg-yellow-100 text-xs text-yellow-800">Progress</Badge>
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p>Lengkapi data pendaftaran untuk melihat ringkasan</p>
                                                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className="h-2 rounded-full bg-yellow-600 transition-all duration-300"
                                                            style={{ width: '60%' }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:shadow-sm">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-gray-600" />
                                                    <p className="text-sm font-medium text-gray-900">Ringkasan Pendaftaran:</p>
                                                </div>
                                                <Badge className="bg-gray-100 text-xs text-gray-800">Belum Dimulai</Badge>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>Pilih pasien terlebih dahulu untuk memulai pendaftaran</p>
                                                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                                                    <div
                                                        className="h-2 rounded-full bg-gray-400 transition-all duration-300"
                                                        style={{ width: '0%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading || !selectedPasien || !selectedPoli || !selectedDokter || !selectedPenjamin}>
                                {loading ? 'Menyimpan...' : 'Simpan Pendaftaran'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Recap Modal */}
            <Dialog open={showRekapModal} onOpenChange={setShowRekapModal}>
                <DialogContent className="!max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Status Dokter Hari Ini
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="p-3 text-left font-semibold">Nama Dokter</th>
                                    <th className="p-3 text-left font-semibold">Poli & Loket</th>
                                    <th className="p-3 text-center font-semibold">Menunggu</th>
                                    <th className="p-3 text-center font-semibold">Dilayani</th>
                                    <th className="p-3 text-center font-semibold">No Antrian</th>
                                    <th className="p-3 text-left font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rekapDokter.length > 0 ? (
                                    rekapDokter.map((data, i) => (
                                        <tr key={i} className="border-b hover:bg-muted/30">
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{data.dokter.namauser?.name || data.dokter.nama}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {data.dokter.id}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{data.poli.nama}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Kode: {data.poli.kode}
                                                        {data.poli.kode_loket && (
                                                            <span className="rounded bg-blue-50 px-1 font-mono text-blue-700">
                                                                {' '}
                                                                | Loket: {data.poli.kode_loket}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center font-semibold text-orange-600">{data.menunggu}</td>
                                            <td className="p-3 text-center font-semibold text-green-600">{data.dilayani}</td>
                                            <td className="p-3 text-center">
                                                <Badge>{data.no_antrian}</Badge>
                                            </td>
                                            <td className="p-3">{getStatusPeriksaBadge(data.status_periksa)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            Tidak ada data rekap hari ini
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Modal */}
            <Dialog open={showBatalModal} onOpenChange={setShowBatalModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pembatalan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-800">
                                Apakah Anda yakin ingin membatalkan pendaftaran pasien <strong>{selectedAction?.nama}</strong>?
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="alasan">Alasan Pembatalan *</Label>
                            <Input
                                id="alasan"
                                value={alasanBatal}
                                onChange={(e) => setAlasanBatal(e.target.value)}
                                placeholder="Masukkan alasan pembatalan"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBatalModal(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleBatalPendaftaran} disabled={loading || !alasanBatal.trim()}>
                            {loading ? 'Membatalkan...' : 'Batalkan Pendaftaran'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Attendance Modal */}
            <Dialog open={showHadirModal} onOpenChange={setShowHadirModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Kehadiran</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <p className="text-sm text-green-800">
                                Apakah pasien <strong>{selectedAction?.nama}</strong> sudah hadir dan siap dilayani?
                            </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4">
                            <p className="text-sm text-blue-800">Status akan diubah menjadi "Hadir" dan pasien akan masuk antrian untuk dilayani.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHadirModal(false)}>
                            Belum Hadir
                        </Button>
                        <Button onClick={handleHadirPendaftaran} disabled={loading}>
                            {loading ? 'Memproses...' : 'Ya, Sudah Hadir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Doctor Modal */}
            <Dialog open={showUbahDokterModal} onOpenChange={setShowUbahDokterModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah Dokter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Pasien:</strong> {selectedAction?.nama}
                            </p>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label htmlFor="dokter-baru">Pilih Dokter Baru</Label>
                                <span className="text-xs text-muted-foreground">Total: {dokterList.length} dokter</span>
                            </div>
                            <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={dokterList.length === 0 ? 'Tidak ada dokter lain yang tersedia' : 'Pilih Dokter'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {dokterList.map((dokter) => (
                                        <SelectItem key={dokter.id} value={dokter.id.toString()}>
                                            {dokter.namauser?.name || dokter.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {dokterList.length === 0 && !loading && (
                                <p className="mt-1 text-xs text-amber-600">Tidak ada dokter lain yang tersedia untuk poli ini</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUbahDokterModal(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleUbahDokter} disabled={loading || !selectedDokter}>
                            {loading ? 'Mengupdate...' : 'Update Dokter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster position="top-right" />
        </AppLayout>
    );
};

export default PendaftaranDashboard;

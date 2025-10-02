import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    MoreVertical,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Stethoscope,
    UserCheck,
    UserIcon,
    Users,
    Volume2,
    X,
} from 'lucide-react';
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
        status_bidan?: number;
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
    const [showCetakPermintaanModal, setShowCetakPermintaanModal] = useState(false);

    // Form states
    const [selectedPasien, setSelectedPasien] = useState('');
    const [selectedPoli, setSelectedPoli] = useState('');
    const [selectedDokter, setSelectedDokter] = useState('');
    const [selectedPenjamin, setSelectedPenjamin] = useState('');
    const now = new Date();
    const [tanggalKujungan, setTanggalKunjungan] = useState<string>(now.toISOString().split('T')[0]);
    const [waktuKunjungan, setWaktuKunjungan] = useState(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
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
        data?: any[];
    } | null>(null);
    const [alasanBatal, setAlasanBatal] = useState('');
    const [availablePermintaan, setAvailablePermintaan] = useState<any[]>([]);
    const [selectedPermintaan, setSelectedPermintaan] = useState('');

    // Loading state
    const [loading, setLoading] = useState(false);
    // Cache ketersediaan data permintaan cetak per nomor register
    const [permintaanAvailability, setPermintaanAvailability] = useState<Record<string, boolean>>({});

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

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

    // Cek ketersediaan permintaan untuk data yang sedang terlihat (status 2 dan 3)
    useEffect(() => {
        const visibleItems = getCurrentPageData().filter(
            (i) => String(i?.status?.status_pendaftaran) === '2' || String(i?.status?.status_pendaftaran) === '3',
        );
        
        console.log('Visible items for permintaan check:', visibleItems.length);
        console.log('Items detail:', visibleItems.map(i => ({ 
            nomor_register: i.nomor_register, 
            status_pendaftaran: i?.status?.status_pendaftaran,
            Status_aplikasi: i?.status?.Status_aplikasi,
            cached: permintaanAvailability[i.nomor_register]
        })));
        
        if (visibleItems.length === 0) return;

        // Hindari request berulang jika sudah ada di cache
        const itemsToCheck = visibleItems.filter(
            (i) => permintaanAvailability[i.nomor_register] === undefined,
        );
        
        console.log('Items to check:', itemsToCheck.length);
        
        if (itemsToCheck.length === 0) return;

        checkPermintaanAvailability(itemsToCheck);
         
    }, [pendaftaranData, currentPage, itemsPerPage, permintaanAvailability]);

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
                setTotalItems(data.data.pendaftaran?.length || 0);
                // Reset cache ketersediaan ketika dataset berubah signifikan
                setPermintaanAvailability({});
            } else {
                console.error('API returned error:', data.message);
            }
        } catch (error) {
            console.error('Error fetching pendaftaran data:', error);
        }
    };

    // Mengecek ketersediaan data permintaan cetak untuk beberapa item sekaligus
    const checkPermintaanAvailability = async (items: PendaftaranData[]) => {
        console.log('Checking permintaan availability for items:', items.map(i => i.nomor_register));
        const updates: Record<string, boolean> = {};
        await Promise.allSettled(
            items.map(async (item) => {
                try {
                    const encodedNorawat = btoa(item.nomor_register);
                    console.log(`Fetching permintaan for ${item.nomor_register}, encoded: ${encodedNorawat}`);
                    const res = await fetch(`/api/pelayanan/permintaan/cetak-data/${encodedNorawat}`, {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    });
                    if (!res.ok) {
                        console.log(`API error for ${item.nomor_register}: ${res.status}`);
                        updates[item.nomor_register] = false;
                        return;
                    }
                    const json = await res.json();
                    // Data bisa berupa array atau object tunggal
                    const hasData = Boolean(
                        json?.success && 
                        json?.data && 
                        (
                            (Array.isArray(json.data) && json.data.length > 0) || 
                            (!Array.isArray(json.data) && Object.keys(json.data).length > 0)
                        )
                    );
                    console.log(`Permintaan for ${item.nomor_register}:`, { 
                        success: json?.success, 
                        dataType: Array.isArray(json?.data) ? 'array' : 'object',
                        dataLength: Array.isArray(json?.data) ? json.data.length : Object.keys(json?.data || {}).length,
                        hasData 
                    });
                    updates[item.nomor_register] = hasData;
                } catch (error) {
                    console.error(`Error checking permintaan for ${item.nomor_register}:`, error);
                    updates[item.nomor_register] = false;
                }
            }),
        );
        console.log('Permintaan availability updates:', updates);
        if (Object.keys(updates).length > 0) {
            setPermintaanAvailability((prev) => ({ ...prev, ...updates }));
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
                body: JSON.stringify({ hadirid_delete: selectedAction.id }),
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

    const handlePanggilUlang = async (nomorRegister: string, antrian: string) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token tidak ditemukan');
            }

            const response = await fetch('/api/antrian/panggil-ulang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ nomor_register: nomorRegister }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(`Panggil ulang antrian ${antrian} berhasil`);
            } else {
                throw new Error(result.message || 'Gagal panggil ulang');
            }
        } catch (error: any) {
            console.error('Error panggil ulang:', error);
            toast.error((error as Error).message || 'Gagal panggil ulang antrian');
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
        try {
            setSelectedPasien('');
            setSelectedPoli('');
            setSelectedDokter('');
            setSelectedPenjamin('');
            const hariIni = new Date().toISOString().split('T')[0];
            
            // Set tanggal kunjungan
            setTanggalKunjungan(hariIni);
            
            // Set hari kunjungan berdasarkan tanggal
            const daftarHari = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
            const namaHari = daftarHari[new Date(hariIni).getDay()];
            setHariKunjungan(namaHari);
            
            // Set waktu kunjungan ke waktu sekarang (HH:MM)
            const now = new Date();
            const jam = String(now.getHours()).padStart(2, '0');
            const menit = String(now.getMinutes()).padStart(2, '0');
            setWaktuKunjungan(`${jam}:${menit}`);
            setSearchPasien('');
            setFilteredPasienList(pasienList);
        } catch (error) {
            console.error('Error in resetForm:', error);
        }
    };

    const resetActionState = () => {
        setSelectedAction(null);
        setAlasanBatal('');
        setSelectedDokter('');
        setAvailablePermintaan([]);
        setSelectedPermintaan('');
    };

    const handleCetakPermintaanSelected = async () => {
        if (!selectedAction || !selectedPermintaan) {
            toast.error('Pilih surat yang akan dicetak');
            return;
        }

        const permintaan = availablePermintaan.find(p => p.id.toString() === selectedPermintaan);
        if (!permintaan) {
            toast.error('Data surat tidak valid');
            return;
        }

        const encodedNorawat = btoa(selectedAction.nomor_register);
        await cetakSuratPermintaan(permintaan, encodedNorawat);
        
        setShowCetakPermintaanModal(false);
        resetActionState();
    };

    // Pagination functions
    const getTotalPages = () => Math.ceil(totalItems / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return pendaftaranData.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const getPageNumbers = () => {
        const totalPages = getTotalPages();
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('...');
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('...');
                }
                pages.push(totalPages);
            }
        }

        return pages;
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
            // Cetak via iframe (tanpa buka tab baru) dan cleanup onafterprint
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                try {
                    const cw = iframe.contentWindow;
                    if (!cw) return;
                    const cleanup = () => { try { document.body.removeChild(iframe); } catch {} };
                    (cw as any).onafterprint = cleanup;
                    window.setTimeout(cleanup, 60000);
                    window.setTimeout(() => { try { cw.focus(); cw.print(); } catch {} }, 150);
                } catch { try { document.body.removeChild(iframe); } catch {} }
            };
            const doc = iframe.contentWindow?.document || iframe.contentDocument;
            doc?.open();
            doc?.write('<html><head><title>Cetak Nomor Antrian</title></head><body style="text-align:center; font-family:sans-serif;">');
            doc?.write(ticketHtml);
            doc?.write('</body></html>');
            doc?.close();
        } catch (err) {
            console.error('Print error:', err);
            toast.error('Gagal mencetak tiket');
        }
    };

    const handleCetakPermintaan = async (item: PendaftaranData, selectedPermintaan?: any) => {
        try {
            setLoading(true);
            
            // Ambil data permintaan cetak dari database
            const encodedNorawat = btoa(item.nomor_register);
            const response = await fetch(`/api/pelayanan/permintaan/cetak-data/${encodedNorawat}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle data bisa berupa array atau object tunggal
            const hasValidData = result.success && result.data && (
                (Array.isArray(result.data) && result.data.length > 0) ||
                (!Array.isArray(result.data) && Object.keys(result.data).length > 0)
            );

            if (hasValidData) {
                // Jika data object tunggal, convert ke array untuk konsistensi
                const dataArray = Array.isArray(result.data) ? result.data : [result.data];
                
                // Jika ada surat yang dipilih, gunakan surat tersebut
                // Jika tidak, tampilkan modal pilihan
                if (selectedPermintaan) {
                    await cetakSuratPermintaan(selectedPermintaan, encodedNorawat);
                } else if (dataArray.length === 1) {
                    // Jika hanya 1 surat, langsung cetak tanpa modal
                    await cetakSuratPermintaan(dataArray[0], encodedNorawat);
                } else {
                    // Jika lebih dari 1 surat, tampilkan modal pilihan
                    setAvailablePermintaan(dataArray);
                    setSelectedAction({
                        id: item.id,
                        nomor_register: item.nomor_register,
                        nama: item.pasien.nama,
                        type: 'cetak-permintaan',
                        data: dataArray
                    });
                    setShowCetakPermintaanModal(true);
                }
            } else {
                toast.error('Tidak ada data permintaan cetak tersimpan untuk pasien ini');
            }
        } catch (error) {
            console.error('Error fetching permintaan data:', error);
            toast.error('Gagal mengambil data permintaan cetak: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const printDocument = (url: string) => {
        try {
            // Buat iframe tersembunyi untuk print dengan onafterprint
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                try {
                    const cw = iframe.contentWindow;
                    if (!cw) return;
                    const cleanup = () => { try { document.body.removeChild(iframe); } catch {} };
                    
                    // CSS A5 sudah diatur di backend controller (setPaper('a5', 'portrait'))
                    // Tidak perlu inject CSS di frontend karena akan konflik dengan backend PDF
                    
                    // Firefox-compatible: proteksi akses cross-origin onafterprint
                    try {
                        (cw as any).onafterprint = cleanup;
                    } catch (crossOriginError) {
                        // Fallback untuk Firefox: gunakan timeout cleanup
                        console.warn('Cross-origin onafterprint blocked, using fallback cleanup');
                        window.setTimeout(cleanup, 5000); // cleanup setelah 5 detik
                    }
                    
                    // Backup cleanup timeout
                    window.setTimeout(cleanup, 60000);
                    window.setTimeout(() => { try { cw.focus(); cw.print(); } catch {} }, 150);
                } catch (e) {
                    console.error('Print error:', e);
                    try { document.body.removeChild(iframe); } catch {}
                }
            };
            iframe.onerror = () => {
                console.error('Failed to load print document');
                try { document.body.removeChild(iframe); } catch {}
                toast.error('Gagal memuat dokumen untuk dicetak');
            };
            iframe.src = url;
        } catch (error) {
            console.error('Print setup error:', error);
            toast.error('Gagal menyiapkan dokumen untuk dicetak');
        }
    };

    const cetakSuratPermintaan = async (permintaan: any, encodedNorawat: string) => {
        try {
            // Print langsung tanpa buka tab baru
            const cetakUrl = `/pelayanan/permintaan/cetak/${encodedNorawat}?jenis=${permintaan.jenis_permintaan}&detail=${encodeURIComponent(JSON.stringify(permintaan.detail_permintaan))}&judul=${encodeURIComponent(permintaan.judul || '')}&keterangan=${encodeURIComponent(permintaan.keterangan || '')}`;
            
            printDocument(cetakUrl);
            toast.success('Surat permintaan sedang dicetak');
        } catch (error) {
            console.error('Error printing permintaan:', error);
            toast.error('Gagal mencetak surat permintaan: ' + (error as Error).message);
        }
    };

    const markAsPrinted = async (cetakId: number) => {
        try {
            const response = await fetch(`/api/pelayanan/permintaan/mark-printed/${cetakId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                console.warn('Failed to mark as printed:', result.message);
            }
        } catch (error) {
            console.error('Error marking as printed:', error);
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
            <div className="space-y-6 p-6">
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
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Data Pendaftaran Hari Ini</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setPermintaanAvailability({});
                                fetchPendaftaranData();
                            }}
                            disabled={loading}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </Button>
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
                                        {getCurrentPageData().length > 0 ? (
                                            getCurrentPageData().map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{item.pasien.nama}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {(() => {
                                                                const statusVal =
                                                                    typeof item.status === 'number'
                                                                        ? item.status
                                                                        : Number(item.status?.Status_aplikasi ?? 1);
                                                                const badgeClass =
                                                                    statusVal === 2
                                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                                        : statusVal === 3
                                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                                        : 'bg-gray-100 text-gray-800 border border-gray-200';
                                                                return (
                                                                    <Badge className={`text-xs ${badgeClass}`}>
                                                                        {getStatusPendaftaran(statusVal)}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                            {/* Jika loket KIA (kode 'K'), tampilkan badge status bidan */}
                                                            {String(item?.poli?.kode || '').toUpperCase() === 'K'
                                                                ? (() => {
                                                                      const sb = Number(item?.status?.status_bidan ?? -1);
                                                                      if (sb === 0) {
                                                                          return (
                                                                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                                                  <Activity className="mr-1 h-3 w-3" /> Menunggu (Bidan)
                                                                              </Badge>
                                                                          );
                                                                      }
                                                                      if (sb === 1) {
                                                                          return (
                                                                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                                                  <Stethoscope className="mr-1 h-3 w-3" /> Dilayani (Bidan)
                                                                              </Badge>
                                                                          );
                                                                      }
                                                                      return null;
                                                                  })()
                                                                : null}
                                                        </div>
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
                                                        <div className="flex flex-col items-center justify-center gap-1">
                                                            {/* Untuk status 1: tampilkan dropdown dengan banyak opsi */}
                                                            {String(item.status?.status_pendaftaran) === '1' && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48">
                                                                        <DropdownMenuItem
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
                                                                            <UserIcon className="h-4 w-4 text-purple-600" />
                                                                            Ubah Dokter
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
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
                                                                            <UserCheck className="h-4 w-4 text-green-600" />
                                                                            Hadir
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handlePanggilUlang(item.nomor_register, item.antrian)}
                                                                        >
                                                                            <Volume2 className="h-4 w-4 text-blue-600" />
                                                                            Panggil Ulang
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleCetak(item)}
                                                                        >
                                                                            <Printer className="h-4 w-4 text-gray-600" />
                                                                            Cetak Antrian
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setSelectedAction({
                                                                                    id: item.id,
                                                                                    nomor_register: item.nomor_register,
                                                                                    nama: item.pasien.nama,
                                                                                    type: 'batal',
                                                                                });
                                                                                setShowBatalModal(true);
                                                                            }}
                                                                            variant="destructive"
                                                                        >
                                                                            <X className="h-4 w-4 text-red-600" />
                                                                            Batal
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                            
                                                            {/* Untuk status 2/3: tampilkan button X di atas */}
                                                            {(String(item.status?.status_pendaftaran) === '2' || String(item.status?.status_pendaftaran) === '3') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 border-red-500 hover:bg-red-50"
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
                                                                    <X className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            )}
                                                            
                                                            {/* Button Cetak Permintaan di bawah - hanya untuk status 2/3 yang ada data */}
                                                            {(String(item.status?.status_pendaftaran) === '2' || String(item.status?.status_pendaftaran) === '3') && 
                                                             permintaanAvailability[item.nomor_register] && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 px-3"
                                                                    onClick={() => handleCetakPermintaan(item)}
                                                                    disabled={loading}
                                                                >
                                                                    <Printer className="mr-1 h-4 w-4 text-blue-600" />
                                                                    Cetak Surat
                                                                </Button>
                                                            )}
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

                        {/* Pagination */}
                        {totalItems > 0 && (
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

            {/* Add Patient Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                        <DialogContent className="!max-w-4xl p-0 overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                transition={{ 
                                    duration: 0.2, 
                                    ease: "easeOut",
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                                className="p-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 mb-5">
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
                                            onChange={(e) => setTanggalKunjungan(e.target.value)}
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
                                        <Input type="time" value={waktuKunjungan} onChange={(e) => setWaktuKunjungan(e.target.value)} 
                                          className="dark:[&::-webkit-calendar-picker-indicator]:invert"/>
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
                        </motion.div>
                    </DialogContent>
                </Dialog>
                )}
            </AnimatePresence>

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

            {/* Cetak Permintaan Modal */}
            <Dialog open={showCetakPermintaanModal} onOpenChange={setShowCetakPermintaanModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5" />
                            Pilih Surat Permintaan
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Pasien:</strong> {selectedAction?.nama}
                            </p>
                            <p className="text-sm text-blue-800">
                                <strong>Total Surat:</strong> {availablePermintaan.length} surat tersedia
                            </p>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label htmlFor="surat-permintaan">Pilih Surat yang Akan Dicetak</Label>
                            </div>
                            <Select value={selectedPermintaan} onValueChange={setSelectedPermintaan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Surat Permintaan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePermintaan.map((permintaan) => (
                                        <SelectItem key={permintaan.id} value={permintaan.id.toString()}>
                                            <div className="flex flex-col w-full max-w-full">
                                                <div className="font-medium truncate">
                                                    {permintaan.jenis_permintaan === 'radiologi' && 'Permintaan Radiologi'}
                                                    {permintaan.jenis_permintaan === 'laboratorium' && 'Permintaan Laboratorium'}
                                                    {permintaan.jenis_permintaan === 'surat_sakit' && 'Surat Sakit'}
                                                    {permintaan.jenis_permintaan === 'surat_sehat' && 'Surat Sehat'}
                                                    {permintaan.jenis_permintaan === 'surat_kematian' && 'Surat Kematian'}
                                                    {permintaan.jenis_permintaan === 'skdp' && 'SKDP'}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {permintaan.judul && `Judul: ${permintaan.judul}`}
                                                    {permintaan.status === 'printed' && ' (Sudah Dicetak)'}
                                                    {permintaan.status === 'draft' && ' (Draft)'}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    Dibuat: {new Date(permintaan.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCetakPermintaanModal(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleCetakPermintaanSelected} disabled={loading || !selectedPermintaan}>
                            {loading ? 'Mencetak...' : 'Cetak Surat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster position="top-right" />
        </AppLayout>
    );
};

export default PendaftaranDashboard;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Activity, FileText, Phone, Plus, Stethoscope, UserCheck, UserIcon, Users, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast, Toaster } from 'sonner';

// Tambahan untuk layout/header/footer dari kode sebelumnya (tidak menghapus apapun)
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// Types

// Date formatting utility
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
};
interface Pasien {
    id: number;
    nama: string;
    no_rm: string;
    no_bpjs?: string;
    nik: string;
    kodeprovide?: string;
}

interface Poli {
    id: number;
    nama: string;
    kode: string;
}

interface Dokter {
  id: number;
  nama: string; // ← tambahkan ini
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

// Breadcrumbs untuk AppLayout (tambahan saja)
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

    // Statistics
    const [totalPasienTerdaftar, setTotalPasienTerdaftar] = useState(0);
    const [jumlahDokter, setJumlahDokter] = useState(0);
    const [totalPasien, setTotalPasien] = useState(0);
    const [pasienSelesai, setPasienSelesai] = useState(0);

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
    const [tanggalKujungan, setTanggalKujungan] = useState<Date>(new Date());
    const [waktuKunjungan, setWaktuKunjungan] = useState('10:30');

    // Action states
    const [selectedAction, setSelectedAction] = useState<{
        id: number;
        nama: string;
        type: string;
    } | null>(null);
    const [alasanBatal, setAlasanBatal] = useState('');

    // Loading state
    const [loading, setLoading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Simulate API calls
            await Promise.all([fetchPendaftaran(), fetchPasien(), fetchPoli(), fetchPenjamin(), fetchStatistics(), fetchRekapDokter()]);
        } catch (error) {
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendaftaran = async () => {
        // Simulate API call
        setPendaftaranData([]);
    };

    const fetchPasien = async () => {
        // Simulate API call
        setPasienList([]);
    };

    const fetchPoli = async () => {
        // Simulate API call
        setPoliList([]);
    };

    const fetchPenjamin = async () => {
        // Simulate API call
        setPenjaminList([]);
    };

    useEffect(() => {
  fetch("/api/pendaftaran/master-data")
    .then((res) => res.json())
    .then((data) => {
      setPasienList(data.pasien);
      setDokterList(data.dokter);
      setPoliList(data.poli);
      setPenjaminList(data.penjamin);
    })
    .catch((err) => console.error("Error fetching master data:", err));
}, []);


    const fetchStatistics = async () => {
        // Simulate API call
        setTotalPasienTerdaftar(0);
        setJumlahDokter(0);
        setTotalPasien(0);
        setPasienSelesai(0);
    };

    const fetchRekapDokter = async () => {
        // Simulate API call
        setRekapDokter([]);
    };

    const fetchDokterByPoli = async (poliId: string, datetime: string) => {
        try {
            // Simulate API call to get doctors by poli and datetime
            setDokterList([]);
        } catch (error) {
            toast.error('Gagal memuat data dokter');
        }
    };

    // Handle form submissions
    const handleAddPendaftaran = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const payload = {
    pasien_id: selectedPasien,
    poli_id: selectedPoli,
    dokter_id: selectedDokter,
    penjamin_id: selectedPenjamin,
    tanggal_kunjungan: `${format(tanggalKujungan, "yyyy-MM-dd")} ${waktuKunjungan}:00`,
  };

  try {
    const res = await fetch("/api/pendaftaran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Gagal simpan data");

    toast.success("Pendaftaran berhasil ditambahkan");
    setShowAddModal(false);
  } catch (err) {
    toast.error("Terjadi kesalahan");
  } finally {
    setLoading(false);
  }
};


    const handleBatalPendaftaran = async () => {
        if (!selectedAction || !alasanBatal) {
            toast.error('Mohon masukkan alasan pembatalan');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/pendaftaran/batal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batalid_delete: selectedAction.id,
                    alasanpembatalan: alasanBatal,
                }),
            });

            if (response.ok) {
                toast.success('Pendaftaran berhasil dibatalkan');
                setShowBatalModal(false);
                resetActionState();
                fetchAllData();
            } else {
                throw new Error('Gagal membatalkan pendaftaran');
            }
        } catch (error) {
            toast.error('Gagal membatalkan pendaftaran');
        } finally {
            setLoading(false);
        }
    };

    const handleHadirPendaftaran = async () => {
        if (!selectedAction) return;

        setLoading(true);
        try {
            const response = await fetch('/api/pendaftaran/hadir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hadirid_delete: selectedAction.id,
                }),
            });

            if (response.ok) {
                toast.success('Status kehadiran berhasil diupdate');
                setShowHadirModal(false);
                resetActionState();
                fetchAllData();
            } else {
                throw new Error('Gagal mengupdate status kehadiran');
            }
        } catch (error) {
            toast.error('Gagal mengupdate status kehadiran');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedPasien('');
        setSelectedPoli('');
        setSelectedDokter('');
        setSelectedPenjamin('');
        setTanggalKujungan(new Date());
        setWaktuKunjungan('10:30');
    };

    const resetActionState = () => {
        setSelectedAction(null);
        setAlasanBatal('');
    };

    // Handle poli change to fetch doctors
    useEffect(() => {
        if (selectedPoli && tanggalKujungan) {
            const datetime = format(tanggalKujungan, 'yyyy-MM-dd') + ' ' + waktuKunjungan + ':00';
            fetchDokterByPoli(selectedPoli, datetime);
        }
    }, [selectedPoli, tanggalKujungan, waktuKunjungan]);

    const getStatusPendaftaran = (status: number) => {
        switch (status) {
            case 1:
                return 'Aplikasi Offline';
            case 2:
                return 'Aplikasi Online';
            case 3:
                return 'Sistem BPJS / MJKN';
            default:
                return 'Tidak diketahui';
        }
    };

    const getStatusPeriksaBadge = (status: number) => {
        switch (status) {
            case 1:
                return (
                    <Badge variant="secondary">
                        <Activity className="mr-1 h-4 w-4" />
                        Menunggu pemeriksaan perawat
                    </Badge>
                );
            case 2:
                return (
                    <Badge variant="secondary">
                        <Stethoscope className="mr-1 h-4 w-4" />
                        Sedang diperiksa dokter
                    </Badge>
                );
            case 3:
                return (
                    <Badge variant="secondary">
                        <X className="mr-1 h-4 w-4" />
                        Tidak ada pasien
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Status tidak diketahui</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Main Content */}
            <div className="  px-4 py-6 sm:px-6 lg:px-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Card 1 */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Pasien Terdaftar</p>
                                    <p className="text-2xl font-bold">{totalPasienTerdaftar}</p>
                                </div>
                                <div className="rounded-lg p-2">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2 */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div>
                                            <p className="text-xl font-bold">{jumlahDokter}</p>
                                            <p className="text-xs text-muted-foreground">Jumlah Dokter</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{totalPasien}</p>
                                            <p className="text-xs text-muted-foreground">Total Pasien</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-lg p-2">
                                    <Stethoscope className="h-6 w-6" />
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setShowRekapModal(true)}>
                                Selengkapnya
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Card 3 */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Pasien Selesai Dilayani</p>
                                    <p className="text-2xl font-bold">{pasienSelesai}</p>
                                </div>
                                <div className="rounded-lg p-2">
                                    <UserCheck className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <Card className="mt-6 rounded-2xl shadow-md">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Data Pendaftaran Hari Ini</CardTitle>
                            <Button onClick={() => setShowAddModal(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Pasien
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Memuat data...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="p-4 text-left font-semibold">Pasien</th>
                                            <th className="p-4 text-left font-semibold">Pendaftaran</th>
                                            <th className="p-4 text-left font-semibold">No.Registrasi</th>
                                            <th className="p-4 text-left font-semibold">Tanggal Registrasi</th>
                                            <th className="p-4 text-left font-semibold">No.RM</th>
                                            <th className="p-4 text-left font-semibold">No.Antrian</th>
                                            <th className="p-4 text-left font-semibold">Poli</th>
                                            <th className="p-4 text-left font-semibold">Penjamin</th>
                                            <th className="p-4 text-left font-semibold">Dokter</th>
                                            <th className="p-4 text-left font-semibold">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendaftaranData.length > 0 ? (
                                            pendaftaranData.map((item) => (
                                                <tr key={item.id} className="border-b border-border">
                                                    <td className="p-4">{item.pasien.nama}</td>
                                                    <td className="p-4">{getStatusPendaftaran(item.status.Status_aplikasi)}</td>
                                                    <td className="p-4">{item.nomor_register}</td>
                                                    <td className="p-4">{formatDate(item.tanggal_kujungan)}</td>
                                                    <td className="p-4">{item.nomor_rm}</td>
                                                    <td className="p-4">{item.antrian}</td>
                                                    <td className="p-4">{item.poli.nama}</td>
                                                    <td className="p-4">{item.penjamin.nama}</td>
                                                    <td className="p-4">{item.dokter.nama}</td>
                                                    <td className="p-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.status.status_pendaftaran === 1 && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-destructive"
                                                                        onClick={() => {
                                                                            setSelectedAction({
                                                                                id: item.status.id,
                                                                                nama: item.pasien.nama,
                                                                                type: 'batal',
                                                                            });
                                                                            setShowBatalModal(true);
                                                                        }}
                                                                    >
                                                                        <X className="mr-1 h-4 w-4" />
                                                                        Batal
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-primary"
                                                                        onClick={() => {
                                                                            setSelectedAction({
                                                                                id: item.status.id,
                                                                                nama: item.pasien.nama,
                                                                                type: 'hadir',
                                                                            });
                                                                            setShowHadirModal(true);
                                                                        }}
                                                                    >
                                                                        <Phone className="mr-1 h-4 w-4" />
                                                                        Hadir
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="mt-1"
                                                                        onClick={() => {
                                                                            setSelectedAction({
                                                                                id: item.id,
                                                                                nama: item.pasien.nama,
                                                                                type: 'dokter',
                                                                            });
                                                                            // Fetch current poli doctors for change doctor modal
                                                                            if (item.poli && tanggalKujungan && waktuKunjungan) {
                                                                                fetchDokterByPoli(item.poli.toString(), `${tanggalKujungan} ${waktuKunjungan}:00`);
                                                                            }
                                                                            setShowUbahDokterModal(true);
                                                                        }}
                                                                    >
                                                                        <UserIcon className="mr-1 h-4 w-4" />
                                                                        Ubah Dokter
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {item.status.status_pendaftaran === 2 && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        setSelectedAction({
                                                                            id: item.status.id,
                                                                            nama: item.pasien.nama,
                                                                            type: 'batal-pcare',
                                                                        });
                                                                        setShowBatalModal(true);
                                                                    }}
                                                                >
                                                                    <X className="mr-1 h-4 w-4" />
                                                                    Batal
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
                    </CardContent>
                </Card>
            </div>

            {/* Add Patient Modal - improved UI */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
    <DialogContent className="w-[70vw] !max-w-3xl rounded-lg">
        <div className="flex items-start gap-4">
            <div className="rounded-md bg-muted p-2">
                <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-foreground">Tambah Pasien</h3>
                <p className="mt-1 text-sm text-muted-foreground">Isi data pasien dan jadwal kunjungan.</p>
            </div>
        </div>

        <form onSubmit={handleAddPendaftaran} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Pasien */}
                <div className="md:col-span-2">
                    <Label htmlFor="pasien">Pasien</Label>
                    <Select value={selectedPasien} onValueChange={setSelectedPasien}>
                        <SelectTrigger className="w-full" aria-label="Pilih Pasien">
                            <SelectValue placeholder="Pilih Pasien" />
                        </SelectTrigger>
                        <SelectContent>
                            {pasienList.length > 0 ? (
                                pasienList.map((pasien) => (
                                    <SelectItem key={pasien.id} value={pasien.id.toString()}>
                                        {pasien.nama} — {pasien.no_rm}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-muted-foreground">Tidak ada pasien</div>
                            )}
                        </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">Pilih pasien yang sudah terdaftar di sistem.</p>
                </div>

                {/* Poli */}
                <div>
                    <Label htmlFor="poli">Poli</Label>
                    <Select value={selectedPoli} onValueChange={setSelectedPoli}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Poli" />
                        </SelectTrigger>
                        <SelectContent>
                            {poliList.length > 0 ? (
                                poliList.map((poli) => (
                                    <SelectItem key={poli.id} value={poli.id.toString()}>
                                        {poli.nama}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-muted-foreground">Tidak ada poli</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Jadwal Kunjungan */}
                <div>
                    <Label htmlFor="tanggal">Jadwal Kunjungan</Label>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={format(tanggalKujungan, 'yyyy-MM-dd')}
                            onChange={(e) => setTanggalKujungan(new Date(e.target.value))}
                            className="flex-1"
                        />
                        <Input
                            type="time"
                            value={waktuKunjungan}
                            onChange={(e) => setWaktuKunjungan(e.target.value)}
                            className="w-32"
                        />
                    </div>
                </div>

                {/* Dokter */}
                <div>
                    <Label htmlFor="dokter">Dokter</Label>
<Select value={selectedDokter} onValueChange={setSelectedDokter}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Pilih Dokter" />
  </SelectTrigger>
  <SelectContent>
    {dokterList.length > 0 ? (
      dokterList.map((dokter) => (
        <SelectItem key={dokter.id} value={dokter.id.toString()}>
          {/* Pastikan properti ini sesuai dengan struktur response */}
          {dokter.namauser?.name || dokter.nama || `Dokter #${dokter.id}`}
        </SelectItem>
      ))
    ) : (
      <div className="p-2 text-sm text-muted-foreground">Tidak ada dokter</div>
    )}
  </SelectContent>
</Select>

                </div>

                {/* Penjamin */}
                <div>
                    <Label htmlFor="penjamin">Penjamin Pasien</Label>
                    <Select value={selectedPenjamin} onValueChange={setSelectedPenjamin}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Penjamin" />
                        </SelectTrigger>
                        <SelectContent>
                            {penjaminList.length > 0 ? (
                                penjaminList.map((penjamin) => (
                                    <SelectItem key={penjamin.id} value={penjamin.id.toString()}>
                                        {penjamin.nama}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-muted-foreground">Tidak ada penjamin</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Tambah'}
                </Button>
            </DialogFooter>
        </form>
    </DialogContent>
</Dialog>


            {/* Recap Modal - improved table */}
            <Dialog open={showRekapModal} onOpenChange={setShowRekapModal}>
                <DialogContent className="w-[60vw] !max-w-5xl rounded-lg">
                    <div className="flex items-start gap-4">
                        <div className="rounded-md bg-muted p-2">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Rekap Per Dokter</h3>
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-md border border-border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="sticky top-0 bg-muted">
                                <tr>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Nama Dokter</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Poli</th>
                                    <th className="p-3 text-center text-sm font-medium text-muted-foreground">Menunggu</th>
                                    <th className="p-3 text-center text-sm font-medium text-muted-foreground">Dilayani</th>
                                    <th className="p-3 text-center text-sm font-medium text-muted-foreground">No Antrian</th>
                                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Status Pemeriksaan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {rekapDokter.length > 0 ? (
                                    rekapDokter.map((data, i) => (
                                        <tr key={`${data.dokter.id}-${data.poli.id}`} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                                            <td className="p-3 text-sm">{data.dokter.nama}</td>
                                            <td className="p-3 text-sm">{data.poli.nama}</td>
                                            <td className="p-3 text-center text-sm font-medium">{data.menunggu}</td>
                                            <td className="p-3 text-center text-sm font-medium">{data.dilayani}</td>
                                            <td className="p-3 text-center text-sm">{data.no_antrian}</td>
                                            <td className="p-3 text-sm">{getStatusPeriksaBadge(data.status_periksa)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            Tidak ada data
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
                        <DialogTitle>Batal Pendaftaran</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>
                            Apakah Anda yakin ingin membatalkan pendaftaran pasien <strong>{selectedAction?.nama}</strong>?
                        </p>
                        {selectedAction?.type === 'batal' && (
                            <div>
                                <Label htmlFor="alasan">Alasan Pembatalan</Label>
                                <Input
                                    id="alasan"
                                    value={alasanBatal}
                                    onChange={(e) => setAlasanBatal(e.target.value)}
                                    placeholder="Masukkan alasan pembatalan"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBatalModal(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleBatalPendaftaran} disabled={loading}>
                            {loading ? 'Membatalkan...' : 'Batalkan'}
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
                    <p>
                        Apakah pasien <strong>{selectedAction?.nama}</strong> sudah hadir?
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHadirModal(false)}>
                            Belum Hadir
                        </Button>
                        <Button onClick={handleHadirPendaftaran} disabled={loading}>
                            {loading ? 'Memproses...' : 'Ya, Hadir!'}
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
                        <p>
                            <strong>Pasien:</strong> {selectedAction?.nama}
                        </p>
                        <div>
                            <Label htmlFor="dokter-baru">Pilih Dokter Baru</Label>
                            <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Dokter" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dokterList.map((dokter) => (
                                        <SelectItem key={dokter.id} value={dokter.id.toString()}>
                                            {dokter.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUbahDokterModal(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleUbahDokter} disabled={loading || !selectedDokter}>
                            {loading ? 'Mengupdate...' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster position="top-right" />
        </AppLayout>
    );

    // Handle doctor change function (tetap diletakkan di akhir seperti file asli)
    async function handleUbahDokter() {
        if (!selectedAction || !selectedDokter) return;

        setLoading(true);
        try {
            const response = await fetch('/api/pendaftaran/dokter/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rubahdokter_id: selectedAction.id,
                    dokter_id_update: selectedDokter,
                }),
            });

            if (response.ok) {
                toast.success('Dokter berhasil diupdate');
                setShowUbahDokterModal(false);
                resetActionState();
                fetchAllData();
            } else {
                throw new Error('Gagal mengupdate dokter');
            }
        } catch (error) {
            toast.error('Gagal mengupdate dokter');
        } finally {
            setLoading(false);
        }
    }
};

export default PendaftaranDashboard;

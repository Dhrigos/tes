import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PatientData {
    nomor_rm: string;
    nama: string;
    nomor_register: string;
    jenis_kelamin: string;
    penjamin: string;
    tanggal_lahir: string;
    umur: string;
    no_bpjs: string;
    // Field dari relasi pendaftaran
    dokter_id?: string;
    dokter_nama?: string;
    poli_id?: string;
    poli_nama?: string;
    // Field dari sdm/dokter dan data/master/poli
    dokter?: string;
    poli?: string;
    // Data ICD dari Pelayanan_Soap_Dokter_Icd
    icd_data?: {
        diagnosis_utama: string;
        diagnosis_utama_priority: string;
        diagnosis_penyerta_1: string;
    } | null;
    // Prefill Surat Sehat dari Pelayanan_Soap_Dokter
    sehat_data?: {
        tgl_periksa: string | null;
        sistole: string;
        diastole: string;
        suhu: string;
        berat: string;
        respiratory_rate: string;
        nadi: string;
        tinggi: string;
        buta_warna_check: boolean;
        buta_warna_status: 'Tidak' | 'Ya';
    } | null;
}

interface PageProps {
    pelayanan: PatientData;
    norawat: string;
    radiologiPemeriksaans?: Array<{ id: number; nama: string }>;
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelayanan', href: '' },
    { title: 'Permintaan', href: '' },
];

export default function Permintaan() {
    const { pelayanan, errors, flash, norawat, radiologiPemeriksaans } = usePage().props as unknown as PageProps;

    // Debug: Log data yang diterima dari backend

    // Helper function untuk format umur
    const formatUmur = (umur: string) => {
        if (!umur) return '';

        // Jika sudah dalam format "X Tahun Y Bulan Z Hari", return as is
        if (umur.includes('Tahun') && umur.includes('Bulan') && umur.includes('Hari')) {
            return umur;
        }

        // Jika dalam format decimal (tahun), konversi ke format yang diinginkan
        const tahunDecimal = parseFloat(umur);
        if (!isNaN(tahunDecimal)) {
            const tahun = Math.floor(tahunDecimal);
            const bulanDecimal = (tahunDecimal - tahun) * 12;
            const bulan = Math.floor(bulanDecimal);
            const hariDecimal = (bulanDecimal - bulan) * 30;
            const hari = Math.round(hariDecimal);

            return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
        }

        return umur;
    };

    const [activeTab, setActiveTab] = useState('sakit');

    const jenisMap: Record<string, string> = {
        sakit: 'surat_sakit',
        sehat: 'surat_sehat',
        kematian: 'surat_kematian',
        skdp: 'skdp',
        radiologi: 'radiologi',
        laboratorium: 'laboratorium',
    };

    const buildDetailForTab = (tab: string) => {
        switch (tab) {
            case 'radiologi':
                return {
                    items: radItems,
                    diagnosa: radForm.diagnosa,
                    tanggal_periksa: radForm.tanggal_periksa,
                    catatan: radForm.catatan,
                };
            case 'laboratorium':
                return {
                    items: labItems,
                    bidang: labForm.bidang,
                    diagnosa: labForm.diagnosa,
                    tanggal_periksa: labForm.tanggal_periksa,
                    catatan: labForm.catatan,
                };
            case 'skdp':
                return skdp;
            case 'sehat':
                return suratSehat;
            case 'kematian':
                return suratKematian;
            case 'sakit':
            default:
                return {
                    ...suratSakit,
                    diagnosis_utama: suratSakit.diagnosis_utama || pelayanan.icd_data?.diagnosis_utama || '',
                    diagnosis_penyerta_1: suratSakit.diagnosis_penyerta_1 || pelayanan.icd_data?.diagnosis_penyerta_1 || '',
                };
        }
    };

    const renderSummary = () => {
        const detail: any = buildDetailForTab(activeTab) as any;
        const Row = ({ label, value }: { label: string; value: any }) => (
            <div className="grid grid-cols-12 gap-2 text-sm">
                <div className="col-span-4 text-muted-foreground">{label}</div>
                <div className="col-span-8 break-words">{value ?? '-'}</div>
            </div>
        );

        if (activeTab === 'sakit') {
            return (
                <div className="space-y-2">
                    <Row label="Diagnosis Utama" value={detail.diagnosis_utama} />
                    <Row label="Diagnosa Penyerta 1" value={detail.diagnosis_penyerta_1} />
                    <Row label="Diagnosa Penyerta 2" value={detail.diagnosis_penyerta_2} />
                    <Row label="Diagnosa Penyerta 3" value={detail.diagnosis_penyerta_3} />
                    <Row label="Komplikasi 1" value={detail.komplikasi_1} />
                    <Row label="Komplikasi 2" value={detail.komplikasi_2} />
                    <Row label="Komplikasi 3" value={detail.komplikasi_3} />
                    <Row label="Lama Istirahat (hari)" value={detail.lama_istirahat} />
                    <Row label="Terhitung Mulai" value={detail.terhitung_mulai} />
                </div>
            );
        }

        if (activeTab === 'sehat') {
            return (
                <div className="space-y-2">
                    <Row label="Tanggal Periksa" value={detail.tgl_periksa} />
                    <Row label="Tekanan Darah" value={`${detail.sistole || '-'} / ${detail.diastole || '-'} mmHg`} />
                    <Row label="Suhu" value={detail.suhu ? `${detail.suhu} °C` : '-'} />
                    <Row label="Berat" value={detail.berat ? `${detail.berat} Kg` : '-'} />
                    <Row label="RR" value={detail.respiratory_rate ? `${detail.respiratory_rate} /mnt` : '-'} />
                    <Row label="Nadi" value={detail.nadi ? `${detail.nadi} /mnt` : '-'} />
                    <Row label="Tinggi" value={detail.tinggi ? `${detail.tinggi} cm` : '-'} />
                    <Row label="Buta Warna" value={detail.buta_warna_status || '-'} />
                </div>
            );
        }

        if (activeTab === 'radiologi') {
            const items = detail.items || [];
            return (
                <div className="space-y-2">
                    <Row label="Jumlah Item" value={items.length} />
                    {items.length > 0 && (
                        <div className="text-sm">
                            {items.map((it: any, idx: number) => (
                                <div key={idx} className="ml-1">• {it.pemeriksaan} {it.jenis_posisi ? `(${it.jenis_posisi}${it.posisi ? ` - ${it.posisi}` : ''})` : ''}</div>
                            ))}
                        </div>
                    )}
                    <Row label="Diagnosa" value={detail.diagnosa} />
                    <Row label="Tanggal Periksa" value={detail.tanggal_periksa} />
                    <Row label="Catatan" value={detail.catatan} />
                </div>
            );
        }

        if (activeTab === 'laboratorium') {
            const items = detail.items || [];
            return (
                <div className="space-y-2">
                    <Row label="Bidang" value={detail.bidang} />
                    <Row label="Jumlah Pemeriksaan" value={items.length} />
                    {items.length > 0 && (
                        <div className="text-sm">
                            {items.map((it: any, idx: number) => (
                                <div key={idx} className="ml-1">• {it}</div>
                            ))}
                        </div>
                    )}
                    <Row label="Diagnosa" value={detail.diagnosa} />
                    <Row label="Tanggal Periksa" value={detail.tanggal_periksa} />
                    <Row label="Catatan" value={detail.catatan} />
                </div>
            );
        }

        if (activeTab === 'skdp') {
            return (
                <div className="space-y-2">
                    <Row label="Tanggal Pemeriksaan" value={detail.tanggal_pemeriksaan} />
                    <Row label="Kode Surat" value={detail.kode_surat} />
                    <Row label="Untuk" value={detail.untuk} />
                    <Row label="Pada" value={detail.pada} />
                    <Row label="Poli / Unit" value={detail.poli_unit} />
                    <Row label="Alasan (1)" value={detail.alasan1} />
                    <Row label="Alasan (2)" value={detail.alasan2} />
                    <Row label="Rencana (1)" value={detail.rencana1} />
                    <Row label="Rencana (2)" value={detail.rencana2} />
                    <Row label="SEP BPJS" value={detail.sep_bpjs} />
                    <Row label="Diagnosa" value={detail.diagnosa} />
                    <Row label="Jumlah Hari" value={detail.jumlah_hari} />
                    <Row label="Tgl Awal" value={detail.tgl_awal} />
                    <Row label="Tgl Akhir" value={detail.tgl_akhir} />
                </div>
            );
        }

        if (activeTab === 'kematian') {
            return (
                <div className="space-y-2">
                    <Row label="Tanggal Periksa" value={detail.tgl_periksa} />
                    <Row label="Tanggal Meninggal" value={detail.tanggal_meninggal} />
                    <Row label="Jam Meninggal" value={detail.jam_meninggal} />
                    <Row label="Referensi (UGD/Poli/Ranap)" value={detail.ref_tgl_jam} />
                    <Row label="Penyebab" value={detail.penyebab_kematian} />
                    {detail.penyebab_kematian === 'Lainnya' && (
                        <Row label="Penyebab Lainnya" value={detail.penyebab_lainnya} />
                    )}
                </div>
            );
        }

        return null;
    };

    const [judul, setJudul] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSimpanPermintaan = async (onSuccess?: () => void) => {
        try {
            const jenis_permintaan = jenisMap[activeTab] || 'surat_sakit';
            const detail_permintaan = buildDetailForTab(activeTab);

            // Validasi komprehensif per jenis (gabungan logika simpan + print)
            if (jenis_permintaan === 'radiologi' && (radItems.length === 0 || !radForm.tanggal_periksa || !radForm.diagnosa)) {
                toast.warning('Lengkapi tabel pemeriksaan, diagnosa, dan tanggal periksa.');
                return;
            }
            if (jenis_permintaan === 'laboratorium' && (labItems.length === 0 || !labForm.tanggal_periksa || !labForm.diagnosa)) {
                toast.warning('Lengkapi tabel pemeriksaan, diagnosa, dan tanggal periksa.');
                return;
            }
            if (jenis_permintaan === 'skdp' && (!skdp.tanggal_pemeriksaan || !skdp.untuk || !skdp.pada)) {
                toast.warning('Lengkapi tanggal pemeriksaan, untuk dan pada.');
                return;
            }
            if (jenis_permintaan === 'surat_sehat' && !suratSehat.tgl_periksa) {
                toast.warning('Isi tanggal periksa terlebih dahulu.');
                return;
            }
            if (
                jenis_permintaan === 'surat_kematian' &&
                (!suratKematian.tgl_periksa || !suratKematian.tanggal_meninggal || !suratKematian.jam_meninggal)
            ) {
                toast.warning('Lengkapi tanggal periksa, tanggal meninggal, dan jam meninggal.');
                return;
            }
            if (
                jenis_permintaan === 'surat_sakit' &&
                (!((detail_permintaan as any).diagnosis_utama) || !((detail_permintaan as any).lama_istirahat) || !((detail_permintaan as any).terhitung_mulai))
            ) {
                toast.warning('Lengkapi diagnosis utama, lama istirahat dan terhitung mulai.');
                return;
            }

            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            // Simpan ke database via API (Pelayanan_Permintaan + Pasien_History + update status dokter)
            const res = await fetch('/api/pelayanan/permintaan/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    nomor_register: pelayanan.nomor_register,
                    jenis_permintaan,
                    detail_permintaan,
                    judul,
                    keterangan,
                }),
            });

            if (!res.ok) {
                // Coba ambil pesan error JSON jika ada
            try {
                const data = await res.json();
                    throw new Error(data?.message || `HTTP ${res.status}`);
                } catch (err) {
                    throw new Error(`HTTP ${res.status}`);
                }
            }

            // Save only (tidak cetak)
            toast.success('Permintaan disimpan');
            onSuccess && onSuccess();
        } catch (e) {
            toast.error('Terjadi kesalahan saat menyimpan permintaan');
        }
    };

    // Print helper menggunakan iframe tersembunyi (tidak membuka tab baru)
    const printDocument = (url: string) => {
        try {
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

                    // Cleanup hanya setelah print selesai, bukan berdasarkan timer pendek
                    const cleanup = () => {
                        try { document.body.removeChild(iframe); } catch {}
                    };

                    // Gunakan onafterprint kalau tersedia agar tidak menutup sebelum user selesai
                    // Beberapa browser mendukung event ini pada window dokumen yang di-print
                    (cw as any).onafterprint = cleanup;

                    // Fallback: jika onafterprint tidak pernah terpanggil, bersihkan setelah 60 detik
                    const fallbackTimer = window.setTimeout(cleanup, 60000);

                    // Panggil print
                    setTimeout(() => {
                        try {
                            cw.focus();
                            cw.print();
                        } catch {
                            // Jika gagal memicu print, tetap bersihkan setelah fallback timeout
                        }
                    }, 150);
                } catch {
                    try { document.body.removeChild(iframe); } catch {}
                }
            };
            iframe.src = url;
        } catch {
            // ignore
        }
    };

    // Simpan + Cetak (tanpa membuka tab baru)
    const handleSimpanDanPrint = async () => {
        try {
            const jenis_permintaan = jenisMap[activeTab] || 'surat_sakit';
            const detail_permintaan = buildDetailForTab(activeTab);

            // Validasi sama seperti simpan
            if (jenis_permintaan === 'radiologi' && (radItems.length === 0 || !radForm.tanggal_periksa || !radForm.diagnosa)) {
                toast.warning('Lengkapi tabel pemeriksaan, diagnosa, dan tanggal periksa.');
                return;
            }
            if (jenis_permintaan === 'laboratorium' && (labItems.length === 0 || !labForm.tanggal_periksa || !labForm.diagnosa)) {
                toast.warning('Lengkapi tabel pemeriksaan, diagnosa, dan tanggal periksa.');
                return;
            }
            if (jenis_permintaan === 'skdp' && (!skdp.tanggal_pemeriksaan || !skdp.untuk || !skdp.pada)) {
                toast.warning('Lengkapi tanggal pemeriksaan, untuk dan pada.');
                return;
            }
            if (jenis_permintaan === 'surat_sehat' && !suratSehat.tgl_periksa) {
                toast.warning('Isi tanggal periksa terlebih dahulu.');
                return;
            }
            if (
                jenis_permintaan === 'surat_kematian' &&
                (!suratKematian.tgl_periksa || !suratKematian.tanggal_meninggal || !suratKematian.jam_meninggal)
            ) {
                toast.warning('Lengkapi tanggal periksa, tanggal meninggal, dan jam meninggal.');
                return;
            }
            if (
                jenis_permintaan === 'surat_sakit' &&
                (!((detail_permintaan as any).diagnosis_utama) || !((detail_permintaan as any).lama_istirahat) || !((detail_permintaan as any).terhitung_mulai))
            ) {
                toast.warning('Lengkapi diagnosis utama, lama istirahat dan terhitung mulai.');
                return;
            }

            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/api/pelayanan/permintaan/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    nomor_register: pelayanan.nomor_register,
                    jenis_permintaan,
                    detail_permintaan,
                    judul,
                    keterangan,
                }),
            });
            if (!res.ok) {
                toast.error('Gagal menyimpan permintaan');
                return;
            }

            // Cetak via iframe menggunakan URL panjang (tanpa short link)
            const encodedNorawat = btoa(pelayanan.nomor_register);
            const detailQuery = encodeURIComponent(JSON.stringify(detail_permintaan));
            const urlToPrint = `/pelayanan/permintaan/cetak/${encodedNorawat}?jenis=${encodeURIComponent(jenis_permintaan)}&judul=${encodeURIComponent(judul)}&keterangan=${encodeURIComponent(keterangan)}&detail=${detailQuery}`;
            printDocument(urlToPrint);
            toast.success('Permintaan disimpan dan dicetak');
            setIsConfirmOpen(false);
        } catch {
            toast.error('Gagal menyimpan atau mencetak');
        }
    };

    // Radiologi state
    const [radItems, setRadItems] = useState<Array<{ pemeriksaan: string; jenis_posisi: string; posisi: string; metode: string }>>([]);
    const [selectedRadIndex, setSelectedRadIndex] = useState<number | null>(null);
    const [radForm, setRadForm] = useState({
        pemeriksaan: '',
        jenis_posisi: '',
        posisi: '',
        metode: '',
        diagnosa: '',
        tanggal_periksa: '',
        catatan: '',
    });

    // Laboratorium state
    const [labItems, setLabItems] = useState<string[]>([]);
    const [selectedLabIndex, setSelectedLabIndex] = useState<number | null>(null);
    const [labForm, setLabForm] = useState({
        bidang: '',
        pemeriksaan: '',
        diagnosa: '',
        tanggal_periksa: '',
        catatan: '',
    });

    // SKDP state
    const [skdp, setSkdp] = useState({
        tanggal_pemeriksaan: '',
        kode_surat: '',
        jenis: 'BPJS',
        untuk: 'KONTROL PASIEN',
        pada: '',
        poli_unit: 'POLI UMUM',
        alasan1: '',
        alasan2: '',
        rencana1: '',
        rencana2: '',
        sep_bpjs: '',
    });

    // Sakit state
    const [suratSakit, setSuratSakit] = useState({
        diagnosis_utama: '',
        diagnosis_penyerta_1: '',
        diagnosis_penyerta_2: '',
        diagnosis_penyerta_3: '',
        komplikasi_1: '',
        komplikasi_2: '',
        komplikasi_3: '',
        lama_istirahat: '',
        terhitung_mulai: '',
    });

    // Sehat state
    const [suratSehat, setSuratSehat] = useState({
        tgl_periksa: pelayanan.sehat_data?.tgl_periksa ?? '',
        sistole: pelayanan.sehat_data?.sistole ?? '',
        diastole: pelayanan.sehat_data?.diastole ?? '',
        suhu: pelayanan.sehat_data?.suhu ?? '',
        berat: pelayanan.sehat_data?.berat ?? '',
        respiratory_rate: pelayanan.sehat_data?.respiratory_rate ?? '',
        nadi: pelayanan.sehat_data?.nadi ?? '',
        tinggi: pelayanan.sehat_data?.tinggi ?? '',
        buta_warna_check: pelayanan.sehat_data?.buta_warna_check ?? false,
        buta_warna_status: (pelayanan.sehat_data?.buta_warna_status as 'Tidak' | 'Ya') ?? 'Tidak',
    });

    // Kematian state
    const [suratKematian, setSuratKematian] = useState({
        tgl_periksa: '',
        dokter_kematian: '',
        penandatangan: '',
        tanggal_meninggal: '',
        jam_meninggal: '',
        ref_tgl_jam: '',
        penyebab_kematian: 'Sakit',
        penyebab_lainnya: '',
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Set default datetime/date values
    useEffect(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const nowDateTime = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        const nowDate = `${yyyy}-${mm}-${dd}`;

        setRadForm((prev) => ({ ...prev, tanggal_periksa: prev.tanggal_periksa || nowDateTime }));
        setLabForm((prev) => ({ ...prev, tanggal_periksa: prev.tanggal_periksa || nowDateTime }));
        setSkdp((prev) => ({ ...prev, tanggal_pemeriksaan: prev.tanggal_pemeriksaan || nowDateTime }));
        setSuratSehat((prev) => ({ ...prev, tgl_periksa: prev.tgl_periksa || nowDate }));
        setSuratKematian((prev) => ({ ...prev, tgl_periksa: prev.tgl_periksa || nowDate }));
    }, []);

    // Helpers radiologi/lab add/delete + print stub
    const handleRadAdd = () => {
        const { pemeriksaan, jenis_posisi, posisi, metode } = radForm;
        if (!pemeriksaan || !jenis_posisi || !posisi || !metode) {
            toast.warning('Lengkapi pemeriksaan, jenis posisi, posisi, dan metode.');
            return;
        }
        const duplicate = radItems.some(
            (r) => r.pemeriksaan === pemeriksaan && r.jenis_posisi === jenis_posisi && r.posisi === posisi && r.metode === metode,
        );
        if (duplicate) {
            toast.warning('Item radiologi sudah ada.');
            return;
        }
        setRadItems((prev) => [...prev, { pemeriksaan, jenis_posisi, posisi, metode }]);
        setRadForm((prev) => ({ ...prev, pemeriksaan: '', jenis_posisi: '', posisi: '', metode: '' }));
    };

    const handleRadDelete = () => {
        if (selectedRadIndex === null) {
            toast.info('Pilih baris radiologi yang ingin dihapus.');
            return;
        }
        setRadItems((prev) => prev.filter((_, i) => i !== selectedRadIndex));
        setSelectedRadIndex(null);
    };

    const handleLabAdd = () => {
        if (!labForm.pemeriksaan) {
            toast.warning('Isi pemeriksaan laboratorium terlebih dahulu.');
            return;
        }
        if (labItems.includes(labForm.pemeriksaan)) {
            toast.warning('Pemeriksaan sudah ada.');
            return;
        }
        setLabItems((prev) => [...prev, labForm.pemeriksaan]);
        setLabForm((prev) => ({ ...prev, pemeriksaan: '' }));
    };

    const handleLabDelete = () => {
        if (selectedLabIndex === null) {
            toast.info('Pilih baris laboratorium yang ingin dihapus.');
            return;
        }
        setLabItems((prev) => prev.filter((_, i) => i !== selectedLabIndex));
        setSelectedLabIndex(null);
    };

    const handlePrintStub = (label: string, valid: boolean, needMsg: string) => {
        if (!valid) {
            toast.warning(needMsg);
            return;
        }
        toast.info(`Cetak ${label} belum terhubung.`);
    };

    

    

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surat Permintaan Pasien" />

            <div className="p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
                    {/* Card Kiri - Data Pasien */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Data Pasien</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Avatar */}
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                                    <svg className="h-12 w-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Informasi Pasien */}
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium">No. RM</Label>
                                    <Input value={pelayanan.nomor_rm || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nama Pasien</Label>
                                    <Input value={pelayanan.nama || ''} readOnly />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-sm font-medium">Jenis Kelamin</Label>
                                        <Input
                                            value={
                                                pelayanan.jenis_kelamin === '1'
                                                    ? 'Laki-laki'
                                                    : pelayanan.jenis_kelamin === '2'
                                                      ? 'Perempuan'
                                                      : pelayanan.jenis_kelamin || ''
                                            }
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Penjamin</Label>
                                        <Input value={pelayanan.penjamin || ''} readOnly />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-sm font-medium">Tanggal Lahir</Label>
                                        <Input value={pelayanan.tanggal_lahir || ''} readOnly />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Umur</Label>
                                        <Input value={formatUmur(pelayanan.umur || '')} readOnly />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Dokter Pengirim</Label>
                                    <Input value={pelayanan.dokter_nama || pelayanan.dokter || 'Data tidak tersedia'} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Poli</Label>
                                    <Input value={pelayanan.poli_nama || pelayanan.poli || 'Data tidak tersedia'} readOnly />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card Kanan - Form Permintaan */}
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Surat Permintaan Pasien</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Tabs Permintaan */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-6">
                                    <TabsTrigger value="sakit">Sakit</TabsTrigger>
                                    <TabsTrigger value="sehat">Sehat</TabsTrigger>
                                    <TabsTrigger value="kematian">Kematian</TabsTrigger>
                                    <TabsTrigger value="skdp">Keterangan</TabsTrigger>
                                    <TabsTrigger value="radiologi">Radiologi</TabsTrigger>
                                    <TabsTrigger value="laboratorium">Laboratorium</TabsTrigger>
                                </TabsList>

                                {/* Surat Sakit */}
                                <TabsContent value="sakit">
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-10">
                                                <Label>Diagnosis Utama</Label>
                                                <Input
                                                    value={suratSakit.diagnosis_utama || pelayanan.icd_data?.diagnosis_utama || ''}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, diagnosis_utama: e.target.value })}
                                                    placeholder="Masukkan diagnosis utama (contoh: A09 - Diarrhoea and colitis)"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Priority</Label>
                                                <Input
                                                    value={pelayanan.icd_data?.diagnosis_utama_priority || ''}
                                                    readOnly
                                                    placeholder="Priority"
                                                    className="text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Diagnosis Penyerta</Label>
                                                <Input
                                                    className="mb-2"
                                                    value={suratSakit.diagnosis_penyerta_1 || pelayanan.icd_data?.diagnosis_penyerta_1 || ''}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, diagnosis_penyerta_1: e.target.value })}
                                                    placeholder="Diagnosis penyerta 1"
                                                />
                                                <Input
                                                    className="mb-2"
                                                    value={suratSakit.diagnosis_penyerta_2}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, diagnosis_penyerta_2: e.target.value })}
                                                    placeholder="Diagnosis penyerta 2"
                                                />
                                                <Input
                                                    value={suratSakit.diagnosis_penyerta_3}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, diagnosis_penyerta_3: e.target.value })}
                                                    placeholder="Diagnosis penyerta 3"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-6">
                                                <Label>Komplikasi</Label>
                                                <Input
                                                    className="mb-2"
                                                    value={suratSakit.komplikasi_1}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, komplikasi_1: e.target.value })}
                                                />
                                                <Input
                                                    className="mb-2"
                                                    value={suratSakit.komplikasi_2}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, komplikasi_2: e.target.value })}
                                                />
                                                <Input
                                                    value={suratSakit.komplikasi_3}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, komplikasi_3: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-6">
                                                <Label>Lama Istirahat (hari)</Label>
                                                <Input
                                                    type="number"
                                                    value={suratSakit.lama_istirahat}
                                                    onChange={(e) => setSuratSakit({ ...suratSakit, lama_istirahat: e.target.value })}
                                                />
                                                <div className="mt-7">
                                                    <Label>Terhitung Mulai</Label>
                                                    <Input
                                                        type="date"
                                                        value={suratSakit.terhitung_mulai}
                                                        onChange={(e) => setSuratSakit({ ...suratSakit, terhitung_mulai: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Radiologi */}
                                <TabsContent value="radiologi">
                                    <div className="mt-4 space-y-4">
                                        <div className="rounded-lg border p-3">
                                            <h3 className="mb-3 text-lg font-semibold">Permintaan Radiologi</h3>
                                            <div className="overflow-x-auto" style={{ maxHeight: 255 }}>
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0">
                                                        <tr>
                                                            <th className="w-[10%] text-left">No</th>
                                                            <th className="w-[35%] text-left">Nama Pemeriksaan</th>
                                                            <th className="w-[35%] text-left">Posisi</th>
                                                            <th className="w-[20%] text-left">Metode</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {radItems.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="py-2 text-center text-gray-500">
                                                                    Belum ada data
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {radItems.map((item, idx) => (
                                                            <tr
                                                                key={`${item.pemeriksaan}-${idx}`}
                                                                className={`cursor-pointer ${selectedRadIndex === idx ? 'bg-blue-50' : ''}`}
                                                                onClick={() => setSelectedRadIndex(idx)}
                                                            >
                                                                <td className="py-1">{idx + 1}</td>
                                                                <td className="py-1">{item.pemeriksaan}</td>
                                                                <td className="py-1">
                                                                    {item.jenis_posisi} - {item.posisi}
                                                                </td>
                                                                <td className="py-1">{item.metode}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Row: Pemeriksaan + Tambah */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Pemeriksaan</Label>
                                            </div>
                                            <div className="md:col-span-8">
                                                <Select value={radForm.pemeriksaan} onValueChange={(v) => setRadForm({ ...radForm, pemeriksaan: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(radiologiPemeriksaans || []).map((p) => (
                                                            <SelectItem key={p.id} value={p.nama}>
                                                                {p.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Button type="button" onClick={handleRadAdd} className="w-full">
                                                    Tambah
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Row: Posisi + Metode + Hapus */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Posisi</Label>
                                            </div>
                                            <div className="md:col-span-4">
                                                <Input
                                                    value={radForm.jenis_posisi}
                                                    onChange={(e) => setRadForm({ ...radForm, jenis_posisi: e.target.value })}
                                                    placeholder="-- Pilih --"
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <Select value={radForm.posisi} onValueChange={(v) => setRadForm({ ...radForm, posisi: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="R">R</SelectItem>
                                                        <SelectItem value="L">L</SelectItem>
                                                        <SelectItem value="Both">Both</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Button type="button" variant="destructive" onClick={handleRadDelete} className="w-full">
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Row: Metode */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Metode</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Select value={radForm.metode} onValueChange={(v) => setRadForm({ ...radForm, metode: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Rutin">Rutin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Row: Diagnosa Referensi */}
                                        <div className="grid grid-cols-1 items-center gap-1 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Diagnosa Referensi</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Select value={radForm.diagnosa} onValueChange={(v) => setRadForm({ ...radForm, diagnosa: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>{/* Opsi diagnosa referensi */}</SelectContent>
                                                </Select>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    * Hanya sebagai referensi, bukan diagnosa akhir dari pasien.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row: Tanggal Periksa */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Tanggal Periksa</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Input
                                                    type="datetime-local"
                                                    value={radForm.tanggal_periksa}
                                                    onChange={(e) => setRadForm({ ...radForm, tanggal_periksa: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Row: Catatan Dokter */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Catatan Dokter</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Input
                                                    value={radForm.catatan}
                                                    onChange={(e) => setRadForm({ ...radForm, catatan: e.target.value })}
                                                    placeholder="Masukkan catatan dokter..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Laboratorium */}
                                <TabsContent value="laboratorium">
                                    <div className="mt-4 space-y-4">
                                        <div className="rounded-lg border p-3">
                                            <h3 className="mb-3 text-lg font-semibold">Permintaan Laboratorium</h3>
                                            <div className="overflow-x-auto" style={{ maxHeight: 285 }}>
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0">
                                                        <tr>
                                                            <th className="w-[10%] text-left">No</th>
                                                            <th className="w-[90%] text-left">Nama Pemeriksaan</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {labItems.length === 0 && (
                                                            <tr>
                                                                <td colSpan={2} className="py-2 text-center text-gray-500">
                                                                    Belum ada data
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {labItems.map((item, idx) => (
                                                            <tr
                                                                key={`${item}-${idx}`}
                                                                className={`cursor-pointer ${selectedLabIndex === idx ? 'bg-blue-50' : ''}`}
                                                                onClick={() => setSelectedLabIndex(idx)}
                                                            >
                                                                <td className="py-1">{idx + 1}</td>
                                                                <td className="py-1">{item}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Row: Bidang + Tambah/Hapus */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Bidang</Label>
                                            </div>
                                            <div className="md:col-span-7">
                                                <Select value={labForm.bidang} onValueChange={(v) => setLabForm({ ...labForm, bidang: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>{/* Opsi bidang sesuai master */}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex gap-2 md:col-span-2">
                                                <Button type="button" size="sm" onClick={handleLabAdd}>
                                                    Tambah
                                                </Button>
                                                <Button type="button" size="sm" variant="destructive" onClick={handleLabDelete}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Row: Pemeriksaan */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Pemeriksaan</Label>
                                            </div>
                                            <div className="md:col-span-7">
                                                <Select value={labForm.pemeriksaan} onValueChange={(v) => setLabForm({ ...labForm, pemeriksaan: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>{/* Opsi pemeriksaan sesuai master */}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Row: Diagnosa Referensi */}
                                        <div className="grid grid-cols-1 items-center gap-1 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Diagnosa Referensi</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Select value={labForm.diagnosa} onValueChange={(v) => setLabForm({ ...labForm, diagnosa: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih --" />
                                                    </SelectTrigger>
                                                    <SelectContent>{/* Opsi diagnosa referensi */}</SelectContent>
                                                </Select>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    * Hanya sebagai referensi, bukan diagnosa akhir dari pasien.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row: Tanggal Periksa */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Tanggal Periksa</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Input
                                                    type="datetime-local"
                                                    value={labForm.tanggal_periksa}
                                                    onChange={(e) => setLabForm({ ...labForm, tanggal_periksa: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Row: Catatan Dokter */}
                                        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                            <div className="md:col-span-2">
                                                <Label>Catatan Dokter</Label>
                                            </div>
                                            <div className="md:col-span-10">
                                                <Input
                                                    value={labForm.catatan}
                                                    onChange={(e) => setLabForm({ ...labForm, catatan: e.target.value })}
                                                    placeholder="Masukkan catatan dokter..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* SKDP */}
                                <TabsContent value="skdp">
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-4">
                                                <Label>Tgl Pemeriksaan</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={skdp.tanggal_pemeriksaan}
                                                    onChange={(e) => setSkdp({ ...skdp, tanggal_pemeriksaan: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <Label>Kode Surat</Label>
                                                <Input
                                                    value={skdp.kode_surat}
                                                    onChange={(e) => setSkdp({ ...skdp, kode_surat: e.target.value })}
                                                    placeholder="Otomatis/Manual"
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <Label>Jenis</Label>
                                                <div className="mt-2 flex gap-4">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="radio"
                                                            checked={skdp.jenis === 'BPJS'}
                                                            onChange={() => setSkdp({ ...skdp, jenis: 'BPJS' })}
                                                        />{' '}
                                                        BPJS
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="radio"
                                                            checked={skdp.jenis === 'Non BPJS'}
                                                            onChange={() => setSkdp({ ...skdp, jenis: 'Non BPJS' })}
                                                        />{' '}
                                                        Non BPJS
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Untuk</Label>
                                                <Select value={skdp.untuk} onValueChange={(v) => setSkdp({ ...skdp, untuk: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="KONTROL PASIEN">KONTROL PASIEN</SelectItem>
                                                        <SelectItem value="RUJUKAN">RUJUKAN</SelectItem>
                                                        <SelectItem value="LAINNYA">LAINNYA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Pada</Label>
                                                <Input type="date" value={skdp.pada} onChange={(e) => setSkdp({ ...skdp, pada: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Poli / Unit</Label>
                                                <Select value={skdp.poli_unit} onValueChange={(v) => setSkdp({ ...skdp, poli_unit: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="POLI ANAK">POLI ANAK</SelectItem>
                                                        <SelectItem value="POLI UMUM">POLI UMUM</SelectItem>
                                                        <SelectItem value="POLI GIGI">POLI GIGI</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-6" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-6">
                                                <Label>Belum dapat dikembalikan ke FKTP dengan alasan :</Label>
                                                <Input
                                                    className="mb-2"
                                                    value={skdp.alasan1}
                                                    onChange={(e) => setSkdp({ ...skdp, alasan1: e.target.value })}
                                                    placeholder="(1) Kontrol"
                                                />
                                                <Input
                                                    value={skdp.alasan2}
                                                    onChange={(e) => setSkdp({ ...skdp, alasan2: e.target.value })}
                                                    placeholder="(2)"
                                                />
                                            </div>
                                            <div className="md:col-span-6">
                                                <Label>Rencana tindak lanjut pada kunjungan selanjutnya :</Label>
                                                <Input
                                                    className="mb-2"
                                                    value={skdp.rencana1}
                                                    onChange={(e) => setSkdp({ ...skdp, rencana1: e.target.value })}
                                                    placeholder="(1) Pemeriksaan Lanjutan/Terapi"
                                                />
                                                <Input
                                                    value={skdp.rencana2}
                                                    onChange={(e) => setSkdp({ ...skdp, rencana2: e.target.value })}
                                                    placeholder="(2)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Surat Sehat */}
                                <TabsContent value="sehat">
                                    <div className="mt-4 space-y-4">
                                        {/* Baris 1: Tanggal Periksa */}
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Tgl Periksa</Label>
                                                <Input
                                                    type="date"
                                                    value={suratSehat.tgl_periksa}
                                                    onChange={(e) => setSuratSehat({ ...suratSehat, tgl_periksa: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Baris 2: Tensi, Suhu, Berat */}
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-4">
                                                <Label>Tensi (mmHg)</Label>
                                                <div className="grid grid-cols-5 gap-1">
                                                    <Input
                                                        className="col-span-2"
                                                        step="1"
                                                        type="number"
                                                        placeholder="Sistole"
                                                        value={suratSehat.sistole}
                                                        onChange={(e) => setSuratSehat({ ...suratSehat, sistole: e.target.value })}
                                                    />
                                                    <div className="col-span-1 flex items-center justify-center text-sm">/</div>
                                                    <Input
                                                        className="col-span-2"
                                                        step="1"
                                                        type="number"
                                                        placeholder="Diastole"
                                                        value={suratSehat.diastole}
                                                        onChange={(e) => setSuratSehat({ ...suratSehat, diastole: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-4">
                                                <Label>Suhu (°C)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="Suhu"
                                                    value={suratSehat.suhu}
                                                    onChange={(e) => setSuratSehat({ ...suratSehat, suhu: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <Label>Berat (/Kg)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="Berat"
                                                    value={suratSehat.berat}
                                                    onChange={(e) => setSuratSehat({ ...suratSehat, berat: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Baris 3: RR, Nadi, Tinggi */}
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-4">
                                                <Label>RR (/mnt)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Respiratory Rate"
                                                    value={suratSehat.respiratory_rate}
                                                    onChange={(e) => setSuratSehat({ ...suratSehat, respiratory_rate: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <Label>Nadi (/mnt)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Nadi"
                                                    value={suratSehat.nadi}
                                                    onChange={(e) => setSuratSehat({ ...suratSehat, nadi: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <Label>Tinggi (Cm)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Tinggi"
                                                    value={suratSehat.tinggi}
                                                    onChange={(e) => setSuratSehat({ ...suratSehat, tinggi: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Baris 4: Radio Buta Warna dengan Dropdown */}
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Buta Warna</Label>
                                                <div className="mt-2 flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="radio"
                                                            name="buta_warna"
                                                            checked={suratSehat.buta_warna_status === 'Ya'}
                                                            onChange={() =>
                                                                setSuratSehat({ ...suratSehat, buta_warna_status: 'Ya', buta_warna_check: true })
                                                            }
                                                        />
                                                        Ya
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="radio"
                                                            name="buta_warna"
                                                            checked={suratSehat.buta_warna_status === 'Tidak'}
                                                            onChange={() =>
                                                                setSuratSehat({ ...suratSehat, buta_warna_status: 'Tidak', buta_warna_check: false })
                                                            }
                                                        />
                                                        Tidak
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Surat Kematian */}
                                <TabsContent value="kematian">
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Tgl Periksa</Label>
                                                <Input
                                                    type="date"
                                                    value={suratKematian.tgl_periksa}
                                                    onChange={(e) => setSuratKematian({ ...suratKematian, tgl_periksa: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Tanggal / Jam Meninggal</Label>
                                                <div className="flex gap-3">
                                                    <Input
                                                        type="date"
                                                        value={suratKematian.tanggal_meninggal}
                                                        onChange={(e) => setSuratKematian({ ...suratKematian, tanggal_meninggal: e.target.value })}
                                                    />
                                                    <Input
                                                        type="time"
                                                        value={suratKematian.jam_meninggal}
                                                        onChange={(e) => setSuratKematian({ ...suratKematian, jam_meninggal: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>*) Referensi tanggal / jam meninggal di UGD, Poli Umum, Ranap</Label>
                                                <Input
                                                    placeholder="Contoh: UGD, Poli Umum, Ranap"
                                                    value={suratKematian.ref_tgl_jam}
                                                    onChange={(e) => setSuratKematian({ ...suratKematian, ref_tgl_jam: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                            <div className="md:col-span-12">
                                                <Label>Penyebab Kematian</Label>
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="radio"
                                                                name="penyebab_kematian"
                                                                checked={suratKematian.penyebab_kematian === 'Sakit'}
                                                                onChange={() => setSuratKematian({ ...suratKematian, penyebab_kematian: 'Sakit' })}
                                                            />
                                                            Sakit
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="radio"
                                                                name="penyebab_kematian"
                                                                checked={suratKematian.penyebab_kematian === 'Lainnya'}
                                                                onChange={() => setSuratKematian({ ...suratKematian, penyebab_kematian: 'Lainnya' })}
                                                            />
                                                            Lainnya
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="radio"
                                                                name="penyebab_kematian"
                                                                checked={suratKematian.penyebab_kematian === 'DOA'}
                                                                onChange={() => setSuratKematian({ ...suratKematian, penyebab_kematian: 'DOA' })}
                                                            />
                                                            DOA
                                                        </label>
                                                    </div>
                                                    {suratKematian.penyebab_kematian === 'Lainnya' && (
                                                        <Input
                                                            value={suratKematian.penyebab_lainnya}
                                                            onChange={(e) => setSuratKematian({ ...suratKematian, penyebab_lainnya: e.target.value })}
                                                            placeholder="Sebutkan penyebab lainnya"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <div className="mt-4 flex justify-end">
                                <Button type="button" onClick={() => setIsConfirmOpen(true)}>
                                    Simpan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Modal Konfirmasi */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Permintaan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                            <div className="md:col-span-6">
                                <Label>Tab Aktif</Label>
                                <Input value={activeTab.toUpperCase()} readOnly />
                            </div>
                            <div className="md:col-span-6">
                                <Label>Nomor Register</Label>
                                <Input value={pelayanan.nomor_register} readOnly />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                            <div className="md:col-span-6">
                                <Label>Judul</Label>
                                <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul permintaan (opsional)" />
                            </div>
                            <div className="md:col-span-6">
                                <Label>Keterangan</Label>
                                <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Keterangan (opsional)" />
                            </div>
                        </div>
                        <div>
                            <Label>Ringkasan Permintaan</Label>
                            <div className="mt-2 rounded-md bg-muted p-3">
                                {renderSummary()}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsConfirmOpen(false)}>
                            Batal
                        </Button>
                        <Button type="button" onClick={handleSimpanDanPrint}>Print</Button>
                        
                        <Button type="button" onClick={() => handleSimpanPermintaan(() => setIsConfirmOpen(false))}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

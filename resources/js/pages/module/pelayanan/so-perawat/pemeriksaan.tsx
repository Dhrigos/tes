import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// Define interfaces for props
interface PasienData {
    nomor_rm: string;
    nama: string;
    nomor_register: string;
    jenis_kelamin: string;
    penjamin: string;
    tanggal_lahir: string;
    umur: string;
}

interface HttSubpemeriksaan {
    id: string;
    nama: string;
    id_htt_pemeriksaan: string;
}

interface PemeriksaanPageProps {
    pelayanan: {
        nomor_rm: string;
        nama: string;
        nomor_register: string;
        jenis_kelamin: string;
        penjamin: string;
        tanggal_lahir: string;
        umur: string;
    };
    so_perawat?: Partial<{
        sistol: string;
        distol: string;
        tensi: string;
        suhu: string;
        nadi: string;
        rr: string;
        tinggi: string;
        berat: string;
        spo2: string;
        lingkar_perut: string;
        nilai_bmi: string;
        status_bmi: string;
        jenis_alergi: string;
        alergi: string;
        eye: string;
        verbal: string;
        motorik: string;
        kesadaran: string;
        summernote: string;
        files: string;
    }>;
    gsc_eye: { skor: string; nama: string }[];
    gcs_verbal: { skor: string; nama: string }[];
    gcs_motorik: { skor: string; nama: string }[];
    gcs_kesadaran: { skor: string; nama: string }[];
    htt_pemeriksaan: { id: string; nama_pemeriksaan: string; htt_subpemeriksaans?: HttSubpemeriksaan[] }[];
    norawat?: string;
}

// Breadcrumbs will be set dynamically based on mode

type ConfirmOptions = {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
};

function useConfirmDialog() {
    const [open, setOpen] = useState(false);
    const [opts, setOpts] = useState<ConfirmOptions>({});
    const resolverRef = useRef<((value: boolean) => void) | undefined>(undefined);

    const confirm = (options: ConfirmOptions) => {
        setOpts({
            cancelText: 'Ubah',
            confirmText: 'Lanjut',
            ...options,
        });
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
        });
    };

    const handleCancel = () => {
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = undefined;
        }
        setOpen(false);
    };

    const handleConfirm = () => {
        if (resolverRef.current) {
            resolverRef.current(true);
            resolverRef.current = undefined;
        }
        setOpen(false);
    };

    const ConfirmDialog = (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                // Treat outside click / ESC as cancel if unresolved
                if (!next && open && resolverRef.current) {
                    resolverRef.current(false);
                    resolverRef.current = undefined;
                }
                setOpen(next);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{opts.title || 'Konfirmasi'}</AlertDialogTitle>
                    {opts.description ? (
                        <AlertDialogDescription style={{ whiteSpace: 'pre-line' }}>
                            {opts.description}
                        </AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>
                        {opts.cancelText || 'Batal'}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>
                        {opts.confirmText || 'Lanjut'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return { confirm, ConfirmDialog };
}

export default function PemeriksaanPerawat() {
    const { pelayanan, so_perawat = {}, gsc_eye = [], gcs_verbal = [], gcs_motorik = [], gcs_kesadaran = [], htt_pemeriksaan = [], norawat } = usePage().props as unknown as PemeriksaanPageProps;
    
    // Determine if this is edit mode (data exists) or create mode (data empty)
    const isEditMode = so_perawat && Object.keys(so_perawat).length > 0;
    
    // Dynamic breadcrumbs and title based on mode
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pelayanan', href: '/pelayanan/so-perawat' },
        { title: 'SO Perawat', href: '/pelayanan/so-perawat' },
        { title: isEditMode ? 'Edit' : 'Pemeriksaan', href: '' },
    ];
    
    const pageTitle = isEditMode ? 'Edit SO Perawat' : 'Pemeriksaan SO Perawat';
    const formTitle = isEditMode ? 'Form Edit SO Perawat' : 'Form Pemeriksaan SO Perawat';
    const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Simpan Pemeriksaan';

    const { confirm, ConfirmDialog } = useConfirmDialog();

    // Form state for Subyektif
    const [keluhan, setKeluhan] = useState('');
    const [durasi, setDurasi] = useState('');
    const [durasiUnit, setDurasiUnit] = useState('Menit');
    const [keluhanList, setKeluhanList] = useState<Array<{keluhan: string, durasi: string}>>([]);

    // Form state for Obyektif - initialize with existing data if in edit mode
    const [sistol, setSistol] = useState(so_perawat.sistol || '');
    const [distol, setDistol] = useState(so_perawat.distol || '');
    const [tensi, setTensi] = useState(so_perawat.tensi || '');
    const [suhu, setSuhu] = useState(so_perawat.suhu || '');
    const [nadi, setNadi] = useState(so_perawat.nadi || '');
    const [rr, setRr] = useState(so_perawat.rr || '');
    const [tinggi, setTinggi] = useState(so_perawat.tinggi || '');
    const [berat, setBerat] = useState(so_perawat.berat || '');
    const [spo2, setSpo2] = useState(so_perawat.spo2 || '');
    const [jenisAlergi, setJenisAlergi] = useState(so_perawat.jenis_alergi || '');
    const [alergi, setAlergi] = useState(so_perawat.alergi || '');
    const [lingkarPerut, setLingkarPerut] = useState(so_perawat.lingkar_perut || '');
    const [nilaiBmi, setNilaiBmi] = useState(so_perawat.nilai_bmi || '');
    const [statusBmi, setStatusBmi] = useState(so_perawat.status_bmi || '');
    const [gcsEye, setGcsEye] = useState(so_perawat.eye || '');
    const [gcsVerbal, setGcsVerbal] = useState(so_perawat.verbal || '');
    const [gcsMotorik, setGcsMotorik] = useState(so_perawat.motorik || '');
    const [gcsKesadaran, setGcsKesadaran] = useState(so_perawat.kesadaran || '');
    const [catatan, setCatatan] = useState(so_perawat.summernote || '');

    // Form state for Head To Toe
    const [selectedHtt, setSelectedHtt] = useState('');
    const [selectedSubPemeriksaan, setSelectedSubPemeriksaan] = useState('');
    const [httDetailText, setHttDetailText] = useState('');
    const [httItems, setHttItems] = useState<Array<{pemeriksaan: string, subPemeriksaan: string, detail: string}>>([]);

    // Tab navigation state
    const [activeTab, setActiveTab] = useState('subyektif');

    // Helpers & validators for Obyektif inputs
    const calculateAge = (tanggalLahir: string): { years: number; months: number } => {
        const today = new Date();
        const birthDate = new Date(tanggalLahir);

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        if (today.getDate() < birthDate.getDate()) {
            months--;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return { years, months };
    };

    const handleTensiBlur = async () => {
        if (!sistol || !distol) return;

        const tanggalLahir = (pelayanan?.tanggal_lahir ?? '').trim();
        if (!tanggalLahir) {
            toast.warning('Tanggal lahir kosong. Mohon isi tanggal lahir terlebih dahulu.');
            return;
        }

        const sVal = parseInt(sistol.trim(), 10);
        const dVal = parseInt(distol.trim(), 10);
        if (isNaN(sVal) || isNaN(dVal)) {
            toast.warning('Sistol dan Diastol harus diisi dengan angka yang valid.');
            setSistol('');
            setDistol('');
            setTensi('');
            return;
        }

        const tensiValue = `${sVal}/${dVal}`;
        setTensi(tensiValue);

        const { years: tahun } = calculateAge(tanggalLahir);

        let message = '';
        if (tahun <= 5) {
            if (sVal <= 74 || dVal <= 49) message = 'Data Tensi Terdeteksi HIPOTENSI. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 75 && sVal <= 100 && dVal >= 50 && dVal <= 65) message = 'Data Tensi Normal. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 101 || dVal >= 66) message = 'Data Tensi Terdeteksi HIPERTENSI. Apakah Anda ingin melanjutkan?';
        } else if (tahun <= 12) {
            if (sVal <= 89 || dVal <= 59) message = 'Data Tensi Terdeteksi HIPOTENSI. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 90 && sVal <= 110 && dVal >= 60 && dVal <= 75) message = 'Data Tensi Normal. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 111 || dVal >= 76) message = 'Data Tensi Terdeteksi HIPERTENSI. Apakah Anda ingin melanjutkan?';
        } else if (tahun <= 17) {
            if (sVal <= 89 || dVal <= 59) message = 'Data Tensi Terdeteksi HIPOTENSI. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 90 && sVal <= 120 && dVal >= 60 && dVal <= 80) message = 'Data Tensi Normal. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 121 || dVal >= 81) message = 'Data Tensi Terdeteksi HIPERTENSI. Apakah Anda ingin melanjutkan?';
        } else if (tahun <= 64) {
            if (sVal <= 89 || dVal <= 59) message = 'Data Tensi Terdeteksi HIPOTENSI. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 90 && sVal <= 120 && dVal >= 60 && dVal <= 80) message = 'Data Tensi Normal. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 121 || dVal >= 81) message = 'Data Tensi Terdeteksi HIPERTENSI. Apakah Anda ingin melanjutkan?';
        } else if (tahun >= 65) {
            if (sVal <= 89 || dVal <= 59) message = 'Data Tensi Terdeteksi HIPOTENSI. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 90 && sVal <= 140 && dVal >= 60 && dVal <= 90) message = 'Data Tensi Normal. Apakah Anda ingin melanjutkan?';
            else if (sVal >= 141 || dVal >= 91) message = 'Data Tensi Terdeteksi HIPERTENSI. Apakah Anda ingin melanjutkan?';
        }

        if (message) {
            const ok = await confirm({
                title: 'Validasi Tensi',
                description: message,
                confirmText: 'Lanjut',
                cancelText: 'Ubah',
            });
            if (!ok) {
                setSistol('');
                setDistol('');
                setTensi('');
            }
        }
    };

    const handleRrBlur = async () => {
        if (!rr) return;

        const tanggalLahir = (pelayanan?.tanggal_lahir ?? '').trim();
        if (!tanggalLahir) {
            toast.warning('Tanggal lahir kosong. Mohon isi tanggal lahir terlebih dahulu.');
            return;
        }

        const rrValue = parseInt(rr.trim(), 10);
        if (isNaN(rrValue)) {
            toast.warning('Mohon masukkan angka Respiratory Rate (RR) yang benar!');
            setRr('');
            return;
        }

        const { years: tahun, months: bulan } = calculateAge(tanggalLahir);

        let status = '';
        let pesan = '';
        const checkRange = (min: number, max: number) => {
            if (rrValue < min) {
                status = 'RR Terlalu Rendah';
                pesan = `RR Anda (${rrValue}) di bawah batas normal (${min} - ${max})`;
            } else if (rrValue > max) {
                status = 'RR Terlalu Cepat';
                pesan = `RR Anda (${rrValue}) di atas batas normal (${min} - ${max})`;
            } else {
                status = 'RR Normal';
                pesan = `RR Anda (${rrValue}) berada dalam rentang normal (${min} - ${max})`;
            }
        };

        if (tahun === 0 && bulan <= 12) checkRange(30, 60);
        else if (tahun >= 1 && tahun <= 2) checkRange(24, 40);
        else if (tahun >= 3 && tahun <= 5) checkRange(22, 34);
        else if (tahun >= 6 && tahun <= 12) checkRange(18, 30);
        else if (tahun >= 13 && tahun <= 17) checkRange(12, 20);
        else if (tahun >= 18 && tahun <= 64) checkRange(18, 24);
        else if (tahun >= 65) checkRange(12, 28);

        const ok = await confirm({
            title: status || 'Validasi RR',
            description: `${pesan}.`,
            confirmText: 'Lanjut',
            cancelText: 'Ubah',
        });
        if (!ok) setRr('');
    };

    const handleSuhuBlur = async () => {
        if (!suhu) return;
        const valueRaw = suhu.trim();
        if (valueRaw.includes(',')) {
            toast.warning('Gunakan titik (.) sebagai pemisah desimal, bukan koma!');
            setSuhu('');
            return;
        }

        const suhuNumber = parseFloat(valueRaw);
        if (isNaN(suhuNumber)) {
            toast.warning('Mohon masukkan suhu dalam angka yang benar!');
            setSuhu('');
            return;
        }

        let status = '';
        let pesan = '';
        if (suhuNumber < 34.4) {
            status = 'Hipotermia';
            pesan = 'Suhu tubuh terlalu rendah. Segera konsultasi medis jika perlu.';
        } else if (suhuNumber >= 34.4 && suhuNumber <= 37.4) {
            status = 'Suhu Normal';
            pesan = 'Suhu tubuh Anda berada dalam rentang normal.';
        } else if (suhuNumber >= 37.5 && suhuNumber <= 37.9) {
            status = 'Demam Ringan';
            pesan = 'Kemungkinan terdapat infeksi ringan atau peradangan.';
        } else if (suhuNumber >= 38 && suhuNumber <= 38.9) {
            status = 'Demam';
            pesan = 'Tubuh sedang melawan infeksi atau peradangan.';
        } else if (suhuNumber >= 39) {
            status = 'Demam Tinggi';
            pesan = 'Segera konsultasi medis bila gejala berlanjut.';
        }

        const ok = await confirm({
            title: status || 'Validasi Suhu',
            description: `${pesan} (Suhu: ${suhuNumber}°C).`,
            confirmText: 'Lanjut',
            cancelText: 'Ubah',
        });
        if (!ok) setSuhu('');
    };

    const handleSpo2Blur = async () => {
        if (!spo2) return;
        const value = parseFloat(spo2.trim());
        if (isNaN(value)) {
            toast.warning('SpO2 tidak valid. Mohon masukkan angka yang benar!');
            setSpo2('');
            return;
        }

        let title = '';
        let text = '';
        if (value < 95 || value > 100) {
            title = 'SpO2 Tidak Normal';
            if (value < 95) {
                text = `SpO2 Anda (${value}%) terlalu rendah. Normal: 95% - 100%.`;
            } else {
                text = `SpO2 Anda (${value}%) terlalu tinggi. Normal: 95% - 100%.`;
            }
        } else {
            title = 'SpO2 Normal';
            text = `SpO2 Anda (${value}%) berada dalam rentang normal.`;
        }

        const ok = await confirm({
            title: title || 'Validasi SpO2',
            description: text,
            confirmText: 'Lanjut',
            cancelText: 'Ubah',
        });
        if (!ok) setSpo2('');
    };

    const handleNadiBlur = async () => {
        if (!nadi) return;
        const tanggalLahir = (pelayanan?.tanggal_lahir ?? '').trim();
        if (!tanggalLahir) {
            toast.warning('Tanggal lahir kosong. Data tanggal lahir tidak tersedia.');
            return;
        }

        const nadiVal = parseInt(nadi.trim(), 10);
        if (isNaN(nadiVal)) {
            toast.warning('Masukkan angka nadi yang benar!');
            setNadi('');
            return;
        }

        const { years, months } = calculateAge(tanggalLahir);
        let range = { min: 0, max: 0 };
        if (years === 0 && months <= 12) range = { min: 100, max: 160 };
        else if (years <= 2) range = { min: 90, max: 150 };
        else if (years <= 5) range = { min: 80, max: 140 };
        else if (years <= 10) range = { min: 70, max: 130 };
        else range = { min: 60, max: 100 };

        const dalamRentang = nadiVal >= range.min && nadiVal <= range.max;
        const status = dalamRentang ? 'Data Nadi Sesuai' : 'Data Nadi Tidak Sesuai';
        const pesan = dalamRentang
            ? `Nadi Anda (${nadiVal} bpm) sesuai untuk umur ${years} Tahun ${months} Bulan.`
            : `Nadi Anda (${nadiVal} bpm) di luar rentang normal (${range.min}-${range.max} bpm) untuk umur ${years} Tahun ${months} Bulan.`;

        const ok = await confirm({
            title: status || 'Validasi Nadi',
            description: pesan,
            confirmText: 'Lanjut',
            cancelText: 'Ubah',
        });
        if (!ok) setNadi('');
    };

    const handleBmiBlur = async () => {
        if (!tinggi || !berat) return;

        const tinggiVal = parseFloat(tinggi.trim());
        const beratVal = parseFloat(berat.trim());
        const inputInvalid = isNaN(tinggiVal) || isNaN(beratVal) || tinggiVal <= 0 || beratVal <= 0;

        let message = '';
        if (inputInvalid) {
            message = 'Data Tinggi / Berat Badan Ada Yang Tidak Sesuai.\nMohon isi yang benar!';
        } else {
            const tinggiMeter = tinggiVal / 100;
            const bmi = beratVal / (tinggiMeter * tinggiMeter);
            const bmiFixed = bmi.toFixed(2);

            let bmiCategory = '';
            if (bmi < 18.5) bmiCategory = 'Berat badan kurang (Underweight)';
            else if (bmi < 25) bmiCategory = 'Berat badan normal';
            else if (bmi < 30) bmiCategory = 'Kelebihan berat badan (Overweight)';
            else bmiCategory = 'Obesitas';

            // update states (effect also updates simplified status)
            setNilaiBmi(bmiFixed);
            setStatusBmi((prev) => prev); // keep effect-driven label

            message = `Data BMI-nya adalah: ${bmiFixed},\nDengan kategori: ${bmiCategory}\nApakah Anda ingin melanjutkan?`;
        }

        const ok = await confirm({
            title: 'Validasi BMI',
            description: message,
            confirmText: 'Lanjut',
            cancelText: 'Ubah',
        });
        if (!ok) {
            setTinggi('');
            setBerat('');
            setNilaiBmi('');
            setStatusBmi('');
        }
    };

    // Calculate BMI when tinggi or berat changes
    useEffect(() => {
        if (tinggi && berat) {
            const heightInMeters = parseFloat(tinggi) / 100;
            if (heightInMeters > 0) {
                const bmiValue = parseFloat(berat) / (heightInMeters * heightInMeters);
                setNilaiBmi(bmiValue.toFixed(2));
                
                // Set status BMI based on value
                if (bmiValue < 18.5) {
                    setStatusBmi('Kurus');
                } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
                    setStatusBmi('Normal');
                } else if (bmiValue >= 25 && bmiValue <= 29.9) {
                    setStatusBmi('Gemuk');
                } else {
                    setStatusBmi('Obesitas');
                }
            }
        }
    }, [tinggi, berat]);

    const handleAddKeluhan = () => {
        if (!keluhan.trim()) {
            toast.error('Keluhan harus diisi');
            return;
        }
        
        if (!durasi.trim()) {
            toast.error('Durasi harus diisi');
            return;
        }
        
        const durasiWithUnit = `${durasi} ${durasiUnit}`;
        setKeluhanList([...keluhanList, { keluhan, durasi: durasiWithUnit }]);
        setKeluhan('');
        setDurasi('');
        // durasiUnit will retain its value for the next entry
    };

    const handleRemoveKeluhan = (index: number) => {
        setKeluhanList(keluhanList.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const payload = {
                sistol,
                distol,
                tensi: tensi || `${sistol}/${distol}`,
                suhu,
                nadi,
                rr,
                tinggi,
                berat,
                spo2,
                lingkar_perut: lingkarPerut,
                nilai_bmi: nilaiBmi,
                status_bmi: statusBmi,
                jenis_alergi: jenisAlergi,
                alergi,
                eye: gcsEye,
                verbal: gcsVerbal,
                motorik: gcsMotorik,
                kesadaran: gcsKesadaran,
                summernote: catatan,
                htt_items: httItems,
            };

            if (isEditMode && norawat) {
                // Edit mode - use PUT
                router.put(`/pelayanan/so-perawat/${norawat}`, payload, {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('SO Perawat berhasil diperbarui');
                        router.visit('/pelayanan/so-perawat');
                    },
                    onError: (errors: Record<string, string>) => {
                        const msg = errors?.error || 'Gagal memperbarui SO Perawat';
                        toast.error(msg);
                    },
                });
            } else {
                // Create mode - use POST
                router.post('/pelayanan/so-perawat', payload, {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('SO Perawat berhasil disimpan');
                        router.visit('/pelayanan/so-perawat');
                    },
                    onError: (errors: Record<string, string>) => {
                        const msg = errors?.error || 'Gagal menyimpan SO Perawat';
                        toast.error(msg);
                    },
                });
            }
        } catch (err) {
            toast.error(isEditMode ? 'Gagal memperbarui SO Perawat' : 'Gagal menyimpan SO Perawat');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            {ConfirmDialog}

            <div className="p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* ... */}
                        {pelayanan ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><Label>Nomor RM</Label><Input value={pelayanan?.nomor_rm || ''} readOnly /></div>
                                <div><Label>Nama</Label><Input value={pelayanan?.nama || ''} readOnly /></div>
                                <div><Label>Nomor Rawat</Label><Input value={pelayanan?.nomor_register || ''} readOnly /></div>
                                <div><Label>Jenis Kelamin</Label><Input value={pelayanan?.jenis_kelamin || ''} readOnly /></div>
                                <div><Label>Penjamin</Label><Input value={pelayanan?.penjamin || ''} readOnly /></div>
                                <div><Label>Tanggal Lahir</Label><Input value={pelayanan?.tanggal_lahir || ''} readOnly /></div>
                                <div><Label>Umur</Label><Input value={pelayanan?.umur || ''} readOnly /></div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-yellow-500">Menggunakan data dummy untuk pengujian.</p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                    <div><Label>Nomor RM</Label><Input value="DUM001" readOnly /></div>
                                    <div><Label>Nama</Label><Input value="Pasien Dummy" readOnly /></div>
                                    <div><Label>Nomor Rawat</Label><Input value="DUMREG001" readOnly /></div>
                                    <div><Label>Jenis Kelamin</Label><Input value="Laki-laki" readOnly /></div>
                                    <div><Label>Penjamin</Label><Input value="Umum" readOnly /></div>
                                    <div><Label>Tanggal Lahir</Label><Input value="1990-01-01" readOnly /></div>
                                    <div><Label>Umur</Label><Input value="35 Tahun" readOnly /></div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="p-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="subyektif">1. Subyektif</TabsTrigger>
                                    <TabsTrigger value="obyektif">2. Obyektif</TabsTrigger>
                                    <TabsTrigger value="htt">3. Head To Toe</TabsTrigger>
                                </TabsList>

                                <TabsContent value="subyektif" className="mt-4">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{formTitle}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-4">
                                                        <Label htmlFor="keluhan" className="mt-3">Keluhan</Label>
                                                        <div className="flex-1">
                                                            <Textarea 
                                                                id="keluhan"
                                                                value={keluhan}
                                                                onChange={(e) => setKeluhan(e.target.value)}
                                                                placeholder="Masukkan keluhan pasien..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Label className="mb-0 mr-4">Sejak</Label>
                                                        <div className="flex-1">
                                                            <Input 
                                                                id="durasi"
                                                                value={durasi}
                                                                onChange={(e) => setDurasi(e.target.value)}
                                                                placeholder="Masukkan durasi"
                                                                type="number"
                                                            />
                                                        </div>
                                                        <div className="w-[120px]">
                                                            <Select value={durasiUnit} onValueChange={setDurasiUnit}>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Menit">Menit</SelectItem>
                                                                    <SelectItem value="Jam">Jam</SelectItem>
                                                                    <SelectItem value="Hari">Hari</SelectItem>
                                                                    <SelectItem value="Minggu">Minggu</SelectItem>
                                                                    <SelectItem value="Bulan">Bulan</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Button type="button" onClick={handleAddKeluhan}>Tambah</Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Daftar Keluhan</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {keluhanList.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Keluhan</TableHead>
                                                                <TableHead>Durasi</TableHead>
                                                                <TableHead className="text-right">Aksi</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {keluhanList.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.keluhan}</TableCell>
                                                                    <TableCell>{item.durasi}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button 
                                                                            variant="destructive" 
                                                                            size="sm"
                                                                            onClick={() => handleRemoveKeluhan(index)}
                                                                        >
                                                                            Hapus
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-center text-gray-500 py-4">Belum ada keluhan yang ditambahkan</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <Button type="button" onClick={() => setActiveTab('obyektif')}>Next</Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="obyektif" className="mt-4">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Tanda Vital</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                                                    <div>
                                                        <Label htmlFor="tensi">Tensi (mmHg)</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Input 
                                                                id="sistol"
                                                                value={sistol}
                                                                onChange={(e) => setSistol(e.target.value)}
                                                                onBlur={handleTensiBlur}
                                                                placeholder="Sistol"
                                                                className="w-1/2"
                                                            />
                                                            <span>/</span>
                                                            <Input 
                                                                id="distol"
                                                                value={distol}
                                                                onChange={(e) => setDistol(e.target.value)}
                                                                onBlur={handleTensiBlur}
                                                                placeholder="Distol"
                                                                className="w-1/2"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="suhu">Suhu (°C)</Label>
                                                        <Input 
                                                            id="suhu"
                                                            value={suhu}
                                                            onChange={(e) => setSuhu(e.target.value)}
                                                            onBlur={handleSuhuBlur}
                                                            placeholder="Suhu"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="nadi">Nadi (/Menit)</Label>
                                                        <Input 
                                                            id="nadi"
                                                            value={nadi}
                                                            onChange={(e) => setNadi(e.target.value)}
                                                            onBlur={handleNadiBlur}
                                                            placeholder="Nadi"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="rr">RR (/Menit)</Label>
                                                        <Input 
                                                            id="rr"
                                                            value={rr}
                                                            onChange={(e) => setRr(e.target.value)}
                                                            onBlur={handleRrBlur}
                                                            placeholder="RR"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="tinggi">Tinggi (cm)</Label>
                                                        <Input 
                                                            id="tinggi"
                                                            value={tinggi}
                                                            onChange={(e) => setTinggi(e.target.value)}
                                                            onBlur={handleBmiBlur}
                                                            placeholder="Tinggi"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="berat">Berat (kg)</Label>
                                                        <Input 
                                                            id="berat"
                                                            value={berat}
                                                            onChange={(e) => setBerat(e.target.value)}
                                                            onBlur={handleBmiBlur}
                                                            placeholder="Berat"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <Label htmlFor="spo2">SpO2 (%)</Label>
                                                        <Input 
                                                            id="spo2"
                                                            value={spo2}
                                                            onChange={(e) => setSpo2(e.target.value)}
                                                            onBlur={handleSpo2Blur}
                                                            placeholder="SpO2"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="jenisAlergi">Jenis Alergi</Label>
                                                        <Select value={jenisAlergi} onValueChange={setJenisAlergi}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Jenis Alergi" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Obat">Obat</SelectItem>
                                                                <SelectItem value="Makanan">Makanan</SelectItem>
                                                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="alergi">Alergi</Label>
                                                        <Input 
                                                            id="alergi"
                                                            value={alergi}
                                                            onChange={(e) => setAlergi(e.target.value)}
                                                            placeholder="Alergi"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="lingkarPerut">Lingkar Perut (cm)</Label>
                                                        <Input 
                                                            id="lingkarPerut"
                                                            value={lingkarPerut}
                                                            onChange={(e) => setLingkarPerut(e.target.value)}
                                                            placeholder="Lingkar Perut"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <Label htmlFor="nilaiBmi">Nilai BMI</Label>
                                                        <Input 
                                                            id="nilaiBmi"
                                                            value={nilaiBmi}
                                                            readOnly
                                                            placeholder="Nilai BMI"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="statusBmi">Status BMI</Label>
                                                        <Input 
                                                            id="statusBmi"
                                                            value={statusBmi}
                                                            readOnly
                                                            placeholder="Status BMI"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <Label htmlFor="gcsEye">Eye</Label>
                                                        <Select value={gcsEye} onValueChange={setGcsEye}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Eye" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {gsc_eye.map((item) => (
                                                                    <SelectItem key={item.skor} value={item.skor}>
                                                                        {item.nama}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="gcsVerbal">Verbal</Label>
                                                        <Select value={gcsVerbal} onValueChange={setGcsVerbal}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Verbal" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {gcs_verbal.map((item) => (
                                                                    <SelectItem key={item.skor} value={item.skor}>
                                                                        {item.nama}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="gcsMotorik">Motorik</Label>
                                                        <Select value={gcsMotorik} onValueChange={setGcsMotorik}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Motorik" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {gcs_motorik.map((item) => (
                                                                    <SelectItem key={item.skor} value={item.skor}>
                                                                        {item.nama}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="gcsKesadaran">Kesadaran</Label>
                                                        <Select value={gcsKesadaran} onValueChange={setGcsKesadaran}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Kesadaran" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {gcs_kesadaran.map((item) => (
                                                                    <SelectItem key={item.skor} value={item.skor}>
                                                                        {item.nama}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('subyektif')}>Previous</Button>
                                        <Button type="button" onClick={() => setActiveTab('htt')}>Next</Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="htt" className="mt-4">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Head To Toe</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <Label htmlFor="htt_pemeriksaan">Pemeriksaan</Label>
                                                            <Select value={selectedHtt} onValueChange={(value) => {
                                                                setSelectedHtt(value);
                                                                setSelectedSubPemeriksaan(''); // Reset sub-pemeriksaan when main changes
                                                            }}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih Jenis Pemeriksaan" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {htt_pemeriksaan.map((item) => (
                                                                        <SelectItem key={item.id} value={item.id}>
                                                                            {item.nama_pemeriksaan}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        
                                                        <div>
                                                            <Label htmlFor="sub_pemeriksaan">Sub Pemeriksaan</Label>
                                                            <Select 
                                                                value={selectedSubPemeriksaan} 
                                                                onValueChange={setSelectedSubPemeriksaan}
                                                                disabled={!selectedHtt}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih Sub Pemeriksaan" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {selectedHtt && 
                                                                        htt_pemeriksaan
                                                                            .find(p => p.id === selectedHtt)
                                                                            ?.htt_subpemeriksaans
                                                                            ?.map((subItem) => (
                                                                                <SelectItem key={subItem.id} value={subItem.id}>
                                                                                    {subItem.nama}
                                                                                </SelectItem>
                                                                            ))
                                                                    }
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        
                                                        <div>
                                                            <Label htmlFor="htt_pemeriksaan_detail">Detail</Label>
                                                            <Input 
                                                                id="htt_pemeriksaan_detail"
                                                                value={httDetailText}
                                                                onChange={(e) => setHttDetailText(e.target.value)}
                                                                placeholder="Masukkan detail..."
                                                                disabled={!selectedSubPemeriksaan}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-end">
                                                        <Button 
                                                            type="button" 
                                                            onClick={() => {
                                                                // Add validation
                                                                if (!selectedHtt || !selectedSubPemeriksaan) {
                                                                    toast.error('Harap pilih pemeriksaan dan sub pemeriksaan');
                                                                    return;
                                                                }
                                                                
                                                                // Get names for display
                                                                const pemeriksaanName = htt_pemeriksaan.find(p => p.id === selectedHtt)?.nama_pemeriksaan || '';
                                                                const subPemeriksaanName = htt_pemeriksaan
                                                                    .find(p => p.id === selectedHtt)
                                                                    ?.htt_subpemeriksaans
                                                                    ?.find(s => s.id === selectedSubPemeriksaan)?.nama || '';
                                                                
                                                                // Add to items list
                                                                setHttItems([...httItems, {
                                                                    pemeriksaan: pemeriksaanName,
                                                                    subPemeriksaan: subPemeriksaanName,
                                                                    detail: httDetailText
                                                                }]);
                                                                
                                                                // Reset form
                                                                setSelectedSubPemeriksaan('');
                                                                setHttDetailText('');
                                                                
                                                                toast.success('Data berhasil ditambahkan');
                                                            }}
                                                        >
                                                            Tambahkan
                                                        </Button>
                                                    </div>
                                                    
                                                    {/* Display added items */}
                                                    {httItems.length > 0 && (
                                                        <div className="mt-6">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Pemeriksaan</TableHead>
                                                                        <TableHead>Sub Pemeriksaan</TableHead>
                                                                        <TableHead>Detail</TableHead>
                                                                        <TableHead className="text-right">Aksi</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {httItems.map((item, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{item.pemeriksaan}</TableCell>
                                                                            <TableCell>{item.subPemeriksaan}</TableCell>
                                                                            <TableCell>{item.detail}</TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Button 
                                                                                    type="button" 
                                                                                    variant="destructive" 
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setHttItems(httItems.filter((_, i) => i !== index));
                                                                                    }}
                                                                                >
                                                                                    Hapus
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                    
                                                    <div>
                                                        <Label htmlFor="summernote">Catatan</Label>
                                                        <Textarea 
                                                            id="summernote"
                                                            value={catatan}
                                                            onChange={(e) => setCatatan(e.target.value)}
                                                            placeholder="Masukkan catatan..."
                                                            className="min-h-[150px]"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('obyektif')}>Previous</Button>
                                        <Button type="submit">{submitButtonText}</Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}

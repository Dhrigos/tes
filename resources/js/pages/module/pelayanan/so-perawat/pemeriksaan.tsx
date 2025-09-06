import CpptTimeline from '@/components/CpptTimeline';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, FileText, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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
        id?: number;
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
    alergi_data: { id: number; kode: string; jenis_alergi: string; nama: string }[];
    norawat?: string;
    mode?: string;
}

// Breadcrumbs will be set dynamically based on mode

type ConfirmOptions = {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
};

// Status Indicator Component
const StatusIndicator = ({ status, message, isValid }: { status: string; message: string; isValid: boolean }) => {
    if (!status) return null;

    const getIcon = () => {
        if (isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
        if (status.includes('Ringan') || status.includes('Rendah')) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
        return <XCircle className="h-4 w-4 text-red-600" />;
    };

    const getColor = () => {
        if (isValid) return 'text-green-700 bg-green-50 border-green-200';
        if (status.includes('Ringan') || status.includes('Rendah')) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        return 'text-red-700 bg-red-50 border-red-200';
    };

    return (
        <div className={`mt-1 flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${getColor()}`}>
            {getIcon()}
            <span className="font-medium">{status}</span>
            <span className="text-xs opacity-75">({message})</span>
        </div>
    );
};

function useConfirmDialog() {
    const [open, setOpen] = useState(false);
    const [opts, setOpts] = useState<ConfirmOptions>({});
    const resolverRef = useRef<((value: boolean) => void) | undefined>(undefined);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 100); // Small delay to ensure the element is focusable
        }
    }, [open]);

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
                    {opts.description ? <AlertDialogDescription style={{ whiteSpace: 'pre-line' }}>{opts.description}</AlertDialogDescription> : null}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>{opts.cancelText || 'Batal'}</AlertDialogCancel>
                    <AlertDialogAction ref={confirmButtonRef} onClick={handleConfirm}>
                        {opts.confirmText || 'Lanjut'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return { confirm, ConfirmDialog };
}

export default function PemeriksaanPerawat() {
    const {
        pelayanan,
        so_perawat = {},
        gsc_eye = [],
        gcs_verbal = [],
        gcs_motorik = [],
        gcs_kesadaran = [],
        htt_pemeriksaan = [],
        alergi_data = [],
        norawat,
        mode: backendMode,
    } = usePage().props as unknown as PemeriksaanPageProps;

    // Determine if this is edit mode based on backend mode parameter or data existence
    const mode = backendMode || new URLSearchParams(window.location.search).get('mode');

    // Debug log
    console.log('Backend mode parameter:', backendMode);
    console.log('URL mode parameter:', new URLSearchParams(window.location.search).get('mode'));
    console.log('Final mode:', mode);
    console.log('SO Perawat data:', so_perawat);
    console.log('SO Perawat ID:', so_perawat?.id);

    // If mode is explicitly set, use it; otherwise, determine based on data existence
    const isEditMode = mode === 'edit' || (mode !== 'pemeriksaan' && so_perawat && so_perawat.id && so_perawat.id !== null);

    console.log('Final isEditMode:', isEditMode);

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

    // Parse tableData correctly for edit mode
    const parseTableData = (tableData: any) => {
        if (typeof tableData === 'string') {
            try {
                return JSON.parse(tableData);
            } catch {
                return {};
            }
        }
        return tableData || {};
    };

    const tableData = parseTableData((so_perawat as any)?.tableData);
    const [keluhanList, setKeluhanList] = useState<Array<{ keluhan: string; durasi: string }>>(tableData?.keluhanList || []);

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

    // Sync form state when so_perawat props change (prefill edit mode)
    useEffect(() => {
        const td = parseTableData((so_perawat as any)?.tableData);
        setKeluhanList(td?.keluhanList || []);
        setHttItems(td?.httItems || []);

        setSistol(so_perawat.sistol || '');
        setDistol(so_perawat.distol || '');
        setTensi(so_perawat.tensi || '');
        setSuhu(so_perawat.suhu || '');
        setNadi(so_perawat.nadi || '');
        setRr(so_perawat.rr || '');
        setTinggi(so_perawat.tinggi || '');
        setBerat(so_perawat.berat || '');
        setSpo2(so_perawat.spo2 || '');
        setJenisAlergi(so_perawat.jenis_alergi || '');
        setAlergi(so_perawat.alergi || '');
        setLingkarPerut(so_perawat.lingkar_perut || '');
        setNilaiBmi(so_perawat.nilai_bmi || '');
        setStatusBmi(so_perawat.status_bmi || '');
        // Ensure GCS values are strings to match SelectItem values
        setGcsEye(String(so_perawat.eye || ''));
        setGcsVerbal(String(so_perawat.verbal || ''));
        setGcsMotorik(String(so_perawat.motorik || ''));
        // kesadaran diturunkan otomatis dari E/V/M melalui effect lain; tetap isi jika tersedia
        if ((so_perawat as any)?.kesadaran) {
            setGcsKesadaran((so_perawat as any).kesadaran as string);
        }
        setCatatan(so_perawat.summernote || '');
    }, [so_perawat]);

    // Calculate GCS kesadaran automatically when eye, verbal, motorik change
    useEffect(() => {
        if (gcsEye && gcsVerbal && gcsMotorik) {
            const eyeScore = parseInt(gcsEye, 10) || 0;
            const verbalScore = parseInt(gcsVerbal, 10) || 0;
            const motorikScore = parseInt(gcsMotorik, 10) || 0;
            const total = eyeScore + verbalScore + motorikScore;
            setGcsKesadaran(total.toString());
        } else {
            setGcsKesadaran('');
        }
    }, [gcsEye, gcsVerbal, gcsMotorik]);

    // Unique jenis alergi options (to avoid duplicate keys/values)
    const jenisAlergiOptions = useMemo(() => {
        if (!Array.isArray(alergi_data)) return [] as string[];
        const set = new Set<string>();
        for (const item of alergi_data) {
            if (item?.jenis_alergi) set.add(item.jenis_alergi);
        }
        return Array.from(set);
    }, [alergi_data]);

    // Form state for Head To Toe
    const [selectedHtt, setSelectedHtt] = useState('');
    const [selectedSubPemeriksaan, setSelectedSubPemeriksaan] = useState('');
    const [httOptions, setHttOptions] = useState<typeof htt_pemeriksaan>(htt_pemeriksaan || []);
    const [subOptions, setSubOptions] = useState<HttSubpemeriksaan[]>([]);
    const [httDetailText, setHttDetailText] = useState('');
    const [httItems, setHttItems] = useState<Array<{ pemeriksaan: string; subPemeriksaan: string; detail: string }>>(tableData?.httItems || []);

    // Tab navigation state
    const [activeTab, setActiveTab] = useState('subyektif');
    const [cpptEntries, setCpptEntries] = useState<any[]>([]);
    const [cpptLoading, setCpptLoading] = useState(false);

    // Load CPPT data when CPPT tab is accessed
    const loadCpptData = async () => {
        if (!pelayanan?.nomor_register) return;

        setCpptLoading(true);
        try {
            const response = await fetch(`/api/pelayanan/cppt/timeline/${pelayanan.nomor_register}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setCpptEntries(data.entries || []);
            } else {
                console.error('Failed to load CPPT data');
            }
        } catch (error) {
            console.error('Error loading CPPT data:', error);
        } finally {
            setCpptLoading(false);
        }
    };

    // Load CPPT data when CPPT tab is selected
    useEffect(() => {
        if (activeTab === 'cppt') {
            loadCpptData();
        }
    }, [activeTab, pelayanan?.nomor_register]);

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

        // Bulatkan umur jika lebih dari 1 tahun
        if (years > 0) {
            years = Math.round(years + months / 12);
            months = 0;
        }

        return { years, months };
    };

    // Validation functions with real-time feedback
    const validateTensi = (sistol: string, distol: string, umur: number) => {
        if (!sistol || !distol) return { isValid: false, status: '', message: '' };

        const s = parseInt(sistol);
        const d = parseInt(distol);
        if (isNaN(s) || isNaN(d)) return { isValid: false, status: '', message: '' };

        let status = '';
        let message = '';
        let isValid = true;

        if (umur <= 5) {
            if (s <= 74 || d <= 49) {
                status = 'Hipotensi';
                message = 'Tekanan darah terlalu rendah';
                isValid = false;
            } else if (s >= 75 && s <= 100 && d >= 50 && d <= 65) {
                status = 'Normal';
                message = 'Tekanan darah normal';
            } else if (s >= 101 || d >= 66) {
                status = 'Hipertensi';
                message = 'Tekanan darah terlalu tinggi';
                isValid = false;
            }
        } else if (umur <= 12) {
            if (s <= 89 || d <= 59) {
                status = 'Hipotensi';
                message = 'Tekanan darah terlalu rendah';
                isValid = false;
            } else if (s >= 90 && s <= 110 && d >= 60 && d <= 75) {
                status = 'Normal';
                message = 'Tekanan darah normal';
            } else if (s >= 111 || d >= 76) {
                status = 'Hipertensi';
                message = 'Tekanan darah terlalu tinggi';
                isValid = false;
            }
        } else if (umur <= 17) {
            if (s <= 89 || d <= 59) {
                status = 'Hipotensi';
                message = 'Tekanan darah terlalu rendah';
                isValid = false;
            } else if (s >= 90 && s <= 120 && d >= 60 && d <= 80) {
                status = 'Normal';
                message = 'Tekanan darah normal';
            } else if (s >= 121 || d >= 81) {
                status = 'Hipertensi';
                message = 'Tekanan darah terlalu tinggi';
                isValid = false;
            }
        } else if (umur <= 64) {
            if (s <= 89 || d <= 59) {
                status = 'Hipotensi';
                message = 'Tekanan darah terlalu rendah';
                isValid = false;
            } else if (s >= 90 && s <= 120 && d >= 60 && d <= 80) {
                status = 'Normal';
                message = 'Tekanan darah normal';
            } else if (s >= 121 || d >= 81) {
                status = 'Hipertensi';
                message = 'Tekanan darah terlalu tinggi';
                isValid = false;
            }
        } else if (umur >= 65) {
            if (s <= 89 || d <= 59) {
                status = 'Hipotensi';
                message = 'Tekanan darah terlalu rendah';
                isValid = false;
            } else if (s >= 90 && s <= 140 && d >= 60 && d <= 90) {
                status = 'Normal';
                message = 'Tekanan darah normal';
            } else if (s >= 141 || d >= 91) {
                status = 'Hipertensi';
                message = 'Tekanan darah terlalu tinggi';
                isValid = false;
            }
        }

        return { isValid, status, message };
    };

    const validateRR = (rr: string, umur: number) => {
        if (!rr) return { isValid: false, status: '', message: '' };

        const rrValue = parseInt(rr);
        if (isNaN(rrValue)) return { isValid: false, status: '', message: '' };

        let status = '';
        let message = '';
        let isValid = true;

        if (umur === 0) {
            // 0-12 bulan
            if (rrValue < 30) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (30-60)';
                isValid = false;
            } else if (rrValue > 60) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (30-60)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (30-60)';
            }
        } else if (umur <= 2) {
            if (rrValue < 24) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (24-40)';
                isValid = false;
            } else if (rrValue > 40) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (24-40)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (24-40)';
            }
        } else if (umur <= 5) {
            if (rrValue < 22) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (22-34)';
                isValid = false;
            } else if (rrValue > 34) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (22-34)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (22-34)';
            }
        } else if (umur <= 12) {
            if (rrValue < 18) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (18-30)';
                isValid = false;
            } else if (rrValue > 30) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (18-30)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (18-30)';
            }
        } else if (umur <= 17) {
            if (rrValue < 12) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (12-20)';
                isValid = false;
            } else if (rrValue > 20) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (12-20)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (12-20)';
            }
        } else if (umur <= 64) {
            if (rrValue < 18) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (18-24)';
                isValid = false;
            } else if (rrValue > 24) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (18-24)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (18-24)';
            }
        } else if (umur >= 65) {
            if (rrValue < 12) {
                status = 'Terlalu Rendah';
                message = 'RR di bawah normal (12-28)';
                isValid = false;
            } else if (rrValue > 28) {
                status = 'Terlalu Cepat';
                message = 'RR di atas normal (12-28)';
                isValid = false;
            } else {
                status = 'Normal';
                message = 'RR normal (12-28)';
            }
        }

        return { isValid, status, message };
    };

    const validateSuhu = (suhu: string) => {
        if (!suhu) return { isValid: false, status: '', message: '' };

        const suhuNumber = parseFloat(suhu);
        if (isNaN(suhuNumber)) return { isValid: false, status: '', message: '' };

        let status = '';
        let message = '';
        let isValid = true;

        if (suhuNumber < 34.4) {
            status = 'Hipotermia';
            message = 'Suhu tubuh terlalu rendah';
            isValid = false;
        } else if (suhuNumber >= 34.4 && suhuNumber <= 37.4) {
            status = 'Normal';
            message = 'Suhu tubuh normal';
        } else if (suhuNumber >= 37.5 && suhuNumber <= 37.9) {
            status = 'Demam Ringan';
            message = 'Kemungkinan infeksi ringan';
            isValid = false;
        } else if (suhuNumber >= 38 && suhuNumber <= 38.9) {
            status = 'Demam';
            message = 'Tubuh melawan infeksi';
            isValid = false;
        } else if (suhuNumber >= 39) {
            status = 'Demam Tinggi';
            message = 'Segera konsultasi medis';
            isValid = false;
        }

        return { isValid, status, message };
    };

    const validateSpo2 = (spo2: string) => {
        if (!spo2) return { isValid: false, status: '', message: '' };

        const value = parseFloat(spo2);
        if (isNaN(value)) return { isValid: false, status: '', message: '' };

        let status = '';
        let message = '';
        let isValid = true;

        if (value < 90) {
            status = 'Kritis';
            message = 'SpO2 sangat rendah, segera konsultasi';
            isValid = false;
        } else if (value >= 90 && value < 95) {
            status = 'Rendah';
            message = 'SpO2 di bawah normal';
            isValid = false;
        } else if (value >= 95 && value <= 100) {
            status = 'Normal';
            message = 'SpO2 dalam rentang normal';
        } else {
            status = 'Tidak Valid';
            message = 'Nilai SpO2 tidak valid';
            isValid = false;
        }

        return { isValid, status, message };
    };

    const validateBMI = (tinggi: string, berat: string) => {
        if (!tinggi || !berat) return { isValid: false, status: '', message: '' };

        const t = parseFloat(tinggi) / 100; // Convert cm to m
        const b = parseFloat(berat);
        if (isNaN(t) || isNaN(b) || t <= 0) return { isValid: false, status: '', message: '' };

        const bmi = b / (t * t);
        let status = '';
        let message = '';
        let isValid = true;

        if (bmi < 18.5) {
            status = 'Kurus';
            message = 'BMI di bawah normal';
            isValid = false;
        } else if (bmi >= 18.5 && bmi < 25) {
            status = 'Normal';
            message = 'BMI dalam rentang normal';
        } else if (bmi >= 25 && bmi < 30) {
            status = 'Gemuk';
            message = 'BMI di atas normal';
            isValid = false;
        } else if (bmi >= 30) {
            status = 'Obesitas';
            message = 'BMI sangat tinggi';
            isValid = false;
        }

        return { isValid, status, message, bmi: bmi.toFixed(1) };
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

    // Fetch HTT options from API (source of truth controller master)
    useEffect(() => {
        const loadHtt = async () => {
            try {
                const res = await fetch('/api/master/htt/pemeriksaan', { headers: { Accept: 'application/json' } });
                if (res.ok) {
                    const data = await res.json();
                    setHttOptions(Array.isArray(data) ? data : []);
                } else {
                    setHttOptions(htt_pemeriksaan || []);
                }
            } catch {
                setHttOptions(htt_pemeriksaan || []);
            }
        };
        loadHtt();
    }, []);

    useEffect(() => {
        const loadSub = async () => {
            if (!selectedHtt) {
                setSubOptions([]);
                return;
            }
            try {
                const res = await fetch(`/api/master/htt/subpemeriksaan/${selectedHtt}`, { headers: { Accept: 'application/json' } });
                if (res.ok) {
                    const data = await res.json();
                    setSubOptions(Array.isArray(data) ? data : []);
                } else {
                    const local = httOptions.find((p) => String(p.id) === selectedHtt)?.htt_subpemeriksaans || [];
                    setSubOptions(local as HttSubpemeriksaan[]);
                }
            } catch {
                const local = httOptions.find((p) => String(p.id) === selectedHtt)?.htt_subpemeriksaans || [];
                setSubOptions(local as HttSubpemeriksaan[]);
            }
        };
        loadSub();
    }, [selectedHtt, httOptions]);

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

    // Calculate GCS kesadaran when eye, verbal, or motorik changes
    useEffect(() => {
        if (gcsEye && gcsVerbal && gcsMotorik) {
            const eyeScore = parseInt(gcsEye);
            const verbalScore = parseInt(gcsVerbal);
            const motorikScore = parseInt(gcsMotorik);

            if (!isNaN(eyeScore) && !isNaN(verbalScore) && !isNaN(motorikScore)) {
                const totalScore = eyeScore + verbalScore + motorikScore;

                // Map total score to kesadaran level based on GCS seeder
                let kesadaran = '';
                if (totalScore >= 14) {
                    kesadaran = 'COMPOS MENTIS';
                } else if (totalScore >= 12) {
                    kesadaran = 'APATIS';
                } else if (totalScore >= 7) {
                    kesadaran = 'SOMNOLEN';
                } else if (totalScore >= 5) {
                    kesadaran = 'SOPOR';
                } else if (totalScore >= 4) {
                    kesadaran = 'SEMI COMA';
                } else {
                    kesadaran = 'KOMA';
                }

                setGcsKesadaran(kesadaran);
            }
        }
    }, [gcsEye, gcsVerbal, gcsMotorik]);

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
                // Identitas untuk linking & audit
                no_rawat: pelayanan?.nomor_register || '',
                nomor_rm: pelayanan?.nomor_rm || '',
                nama: pelayanan?.nama || '',
                seks: pelayanan?.jenis_kelamin || '',
                penjamin: pelayanan?.penjamin || '',
                tanggal_lahir: pelayanan?.tanggal_lahir || '',
                umur: pelayanan?.umur || '',
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
                tableData: JSON.stringify({
                    keluhanList,
                    httItems,
                }),
                files: undefined,
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

            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* ... */}
                        {pelayanan ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Nomor RM</Label>
                                    <Input value={pelayanan?.nomor_rm || ''} readOnly />
                                </div>
                                <div>
                                    <Label>Nama</Label>
                                    <Input value={pelayanan?.nama || ''} readOnly />
                                </div>
                                <div>
                                    <Label>Nomor Rawat</Label>
                                    <Input value={pelayanan?.nomor_register || ''} readOnly />
                                </div>
                                <div>
                                    <Label>Jenis Kelamin</Label>
                                    <Input value={pelayanan?.jenis_kelamin || ''} readOnly />
                                </div>
                                <div>
                                    <Label>Penjamin</Label>
                                    <Input value={pelayanan?.penjamin || ''} readOnly />
                                </div>
                                <div>
                                    <Label>Tanggal Lahir</Label>
                                    <Input value={pelayanan?.tanggal_lahir || ''} readOnly />
                                </div>
                                <div>
                                    <Label>Umur</Label>
                                    <Input
                                        value={
                                            pelayanan?.umur
                                                ? (() => {
                                                      // Ambil angka di depan (sebelum spasi/tahun), bulatkan ke bawah, lalu tambahkan " Tahun"
                                                      const match = String(pelayanan.umur).match(/^([\d.]+)/);
                                                      if (match) {
                                                          const tahun = Math.floor(Number(match[1]));
                                                          return `${tahun} Tahun`;
                                                      }
                                                      return pelayanan.umur;
                                                  })()
                                                : ''
                                        }
                                        readOnly
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-yellow-500">Menggunakan data dummy untuk pengujian.</p>
                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                                    <div>
                                        <Label>Nomor RM</Label>
                                        <Input value="DUM001" readOnly />
                                    </div>
                                    <div>
                                        <Label>Nama</Label>
                                        <Input value="Pasien Dummy" readOnly />
                                    </div>
                                    <div>
                                        <Label>Nomor Rawat</Label>
                                        <Input value="DUMREG001" readOnly />
                                    </div>
                                    <div>
                                        <Label>Jenis Kelamin</Label>
                                        <Input value="Laki-laki" readOnly />
                                    </div>
                                    <div>
                                        <Label>Penjamin</Label>
                                        <Input value="Umum" readOnly />
                                    </div>
                                    <div>
                                        <Label>Tanggal Lahir</Label>
                                        <Input value="1990-01-01" readOnly />
                                    </div>
                                    <div>
                                        <Label>Umur</Label>
                                        <Input value="35 Tahun" readOnly />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="p-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="subyektif">1. Subyektif</TabsTrigger>
                                    <TabsTrigger value="obyektif">2. Obyektif</TabsTrigger>
                                    <TabsTrigger value="htt">3. Head To Toe</TabsTrigger>
                                    <TabsTrigger value="cppt">4. CPPT</TabsTrigger>
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
                                                        <Label htmlFor="keluhan" className="mt-3">
                                                            Keluhan
                                                        </Label>
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
                                                        <Label className="mr-4 mb-0">Sejak</Label>
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
                                                        <Button type="button" onClick={handleAddKeluhan}>
                                                            Tambah
                                                        </Button>
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
                                                    <p className="py-4 text-center text-gray-500">Belum ada keluhan yang ditambahkan</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button type="button" onClick={() => setActiveTab('obyektif')}>
                                            Next
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="obyektif" className="mt-4">
                                    <div className="space-y-6">
                                        {/* Top Section: Vital Signs & Anthropometry */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Tanda Vital & Antropometri</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                                                    <div>
                                                        <Label htmlFor="tensi" className="text-sm font-semibold">
                                                            Tensi (mmHg)
                                                        </Label>
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <Input
                                                                id="sistol"
                                                                value={sistol}
                                                                onChange={(e) => setSistol(e.target.value)}
                                                                onBlur={handleTensiBlur}
                                                                placeholder="Sistol"
                                                                className="w-1/2 text-sm"
                                                            />
                                                            <span className="text-gray-500">/</span>
                                                            <Input
                                                                id="distol"
                                                                value={distol}
                                                                onChange={(e) => setDistol(e.target.value)}
                                                                onBlur={handleTensiBlur}
                                                                placeholder="Distol"
                                                                className="w-1/2 text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="suhu" className="text-sm font-semibold">
                                                            Suhu (°C)
                                                        </Label>
                                                        <Input
                                                            id="suhu"
                                                            value={suhu}
                                                            onChange={(e) => setSuhu(e.target.value)}
                                                            onBlur={handleSuhuBlur}
                                                            placeholder="Suhu"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="nadi" className="text-sm font-semibold">
                                                            Nadi (/mnt)
                                                        </Label>
                                                        <Input
                                                            id="nadi"
                                                            value={nadi}
                                                            onChange={(e) => setNadi(e.target.value)}
                                                            onBlur={handleNadiBlur}
                                                            placeholder="Nadi"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="rr" className="text-sm font-semibold">
                                                            RR (/mnt)
                                                        </Label>
                                                        <Input
                                                            id="rr"
                                                            value={rr}
                                                            onChange={(e) => setRr(e.target.value)}
                                                            onBlur={handleRrBlur}
                                                            placeholder="RR"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="tinggi" className="text-sm font-semibold">
                                                            Tinggi (Cm)
                                                        </Label>
                                                        <Input
                                                            id="tinggi"
                                                            value={tinggi}
                                                            onChange={(e) => setTinggi(e.target.value)}
                                                            onBlur={handleBmiBlur}
                                                            placeholder="Tinggi"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="berat" className="text-sm font-semibold">
                                                            Berat (/Kg)
                                                        </Label>
                                                        <Input
                                                            id="berat"
                                                            value={berat}
                                                            onChange={(e) => setBerat(e.target.value)}
                                                            onBlur={handleBmiBlur}
                                                            placeholder="Berat"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Middle Section: SpO2, Allergy, Waist, BMI */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Data Tambahan</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                    <div>
                                                        <Label htmlFor="spo2" className="text-sm font-semibold">
                                                            SpO2
                                                        </Label>
                                                        <Input
                                                            id="spo2"
                                                            value={spo2}
                                                            onChange={(e) => setSpo2(e.target.value)}
                                                            onBlur={handleSpo2Blur}
                                                            placeholder="SpO2"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <Label className="text-sm font-semibold">Alergi dan jenis</Label>
                                                        <div className="mt-1 grid grid-cols-2 gap-2">
                                                            <Select
                                                                value={jenisAlergi}
                                                                onValueChange={(value) => {
                                                                    setJenisAlergi(value);
                                                                    setAlergi(''); // Reset alergi when jenis changes
                                                                }}
                                                                disabled={!alergi_data || alergi_data.length === 0}
                                                            >
                                                                <SelectTrigger className="text-sm">
                                                                    <SelectValue
                                                                        placeholder={
                                                                            !alergi_data || alergi_data.length === 0
                                                                                ? 'Tidak ada data'
                                                                                : '-- Pilih --'
                                                                        }
                                                                    />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {jenisAlergiOptions.map((jenis) => (
                                                                        <SelectItem key={jenis} value={jenis}>
                                                                            {jenis}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select value={alergi} onValueChange={setAlergi} disabled={!jenisAlergi}>
                                                                <SelectTrigger className="text-sm">
                                                                    <SelectValue placeholder={!jenisAlergi ? 'Pilih jenis dulu' : '-- Pilih --'} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {jenisAlergi && alergi_data && alergi_data.length > 0 ? (
                                                                        alergi_data
                                                                            .filter((item) => item.jenis_alergi?.trim() === jenisAlergi?.trim())
                                                                            .map((item) => (
                                                                                <SelectItem key={item.id} value={item.nama}>
                                                                                    {item.nama}
                                                                                </SelectItem>
                                                                            ))
                                                                    ) : jenisAlergi ? (
                                                                        <SelectItem value="no-data" disabled>
                                                                            Tidak ada data untuk jenis ini
                                                                        </SelectItem>
                                                                    ) : (
                                                                        <SelectItem value="select-first" disabled>
                                                                            Pilih jenis alergi dulu
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        {/* Debug info removed */}
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="lingkarPerut" className="text-sm font-semibold">
                                                            Lingkar Perut
                                                        </Label>
                                                        <Input
                                                            id="lingkarPerut"
                                                            value={lingkarPerut}
                                                            onChange={(e) => setLingkarPerut(e.target.value)}
                                                            placeholder="Lingkar Perut"
                                                            className="mt-1 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div>
                                                        <Label htmlFor="nilaiBmi" className="text-sm font-semibold">
                                                            Data BMI
                                                        </Label>
                                                        <Input
                                                            id="nilaiBmi"
                                                            value={nilaiBmi}
                                                            readOnly
                                                            placeholder="Nilai BMI"
                                                            className="mt-1 bg-gray-100 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="statusBmi" className="text-sm font-semibold">
                                                            Status BMI
                                                        </Label>
                                                        <Input
                                                            id="statusBmi"
                                                            value={statusBmi}
                                                            readOnly
                                                            placeholder="Status BMI"
                                                            className="mt-1 bg-gray-100 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Bottom Section: GCS */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Glasgow Coma Scale (GCS)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                    <div>
                                                        <Label htmlFor="gcsEye" className="text-sm font-semibold">
                                                            EYE
                                                        </Label>
                                                        <Select value={gcsEye} onValueChange={setGcsEye}>
                                                            <SelectTrigger className="mt-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                                                                <SelectValue className="truncate" placeholder="-- Pilih --" />
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
                                                        <Label htmlFor="gcsVerbal" className="text-sm font-semibold">
                                                            VERBAL
                                                        </Label>
                                                        <Select value={gcsVerbal} onValueChange={setGcsVerbal}>
                                                            <SelectTrigger className="mt-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                                                                <SelectValue className="truncate" placeholder="-- Pilih --" />
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
                                                        <Label htmlFor="gcsMotorik" className="text-sm font-semibold">
                                                            MOTORIK
                                                        </Label>
                                                        <Select value={gcsMotorik} onValueChange={setGcsMotorik}>
                                                            <SelectTrigger className="mt-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                                                                <SelectValue className="truncate" placeholder="-- Pilih --" />
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
                                                        <Label htmlFor="gcsKesadaran" className="text-sm font-semibold">
                                                            Kesadaran
                                                        </Label>
                                                        <Input
                                                            id="gcsKesadaran"
                                                            value={gcsKesadaran}
                                                            readOnly
                                                            placeholder="Otomatis terisi"
                                                            className="mt-1 bg-gray-100 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('subyektif')}>
                                            Previous
                                        </Button>
                                        <Button type="button" onClick={() => setActiveTab('htt')}>
                                            Next
                                        </Button>
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
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        <div>
                                                            <Label htmlFor="htt_pemeriksaan">Pemeriksaan</Label>
                                                            <Select
                                                                value={selectedHtt}
                                                                onValueChange={(value) => {
                                                                    setSelectedHtt(value);
                                                                    setSelectedSubPemeriksaan(''); // Reset sub-pemeriksaan when main changes
                                                                }}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih Jenis Pemeriksaan" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {httOptions.map((item) => (
                                                                        <SelectItem key={item.id} value={String(item.id)}>
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
                                                                    {subOptions.map((subItem) => (
                                                                        <SelectItem key={subItem.id} value={String(subItem.id)}>
                                                                            {subItem.nama}
                                                                        </SelectItem>
                                                                    ))}
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
                                                                const pemeriksaanName =
                                                                    httOptions.find((p) => String(p.id) === selectedHtt)?.nama_pemeriksaan || '';
                                                                const subPemeriksaanName =
                                                                    subOptions.find((s) => String(s.id) === selectedSubPemeriksaan)?.nama || '';

                                                                // Add to items list
                                                                setHttItems([
                                                                    ...httItems,
                                                                    {
                                                                        pemeriksaan: pemeriksaanName,
                                                                        subPemeriksaan: subPemeriksaanName,
                                                                        detail: httDetailText,
                                                                    },
                                                                ]);

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
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('obyektif')}>
                                            Previous
                                        </Button>
                                        <Button type="submit">{submitButtonText}</Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="cppt" className="mt-4">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    CPPT (Catatan Perkembangan Pasien Terintegrasi)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <CpptTimeline
                                                    nomor_register={pelayanan?.nomor_register || ''}
                                                    entries={cpptEntries}
                                                    loading={cpptLoading}
                                                />
                                            </CardContent>
                                        </Card>
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

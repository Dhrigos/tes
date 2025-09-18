import CpptTimeline from '@/components/CpptTimeline';
import RichTextEditor from '@/components/RichTextEditor';
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
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, FileText } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface PatientData {
    nomor_rm: string;
    nama: string;
    nomor_register: string;
    jenis_kelamin: string;
    penjamin: string;
    tanggal_lahir: string;
    umur: string;
    pasien?: {
        nama: string;
        tanggal_lahir: string;
        umur: string;
        kelamin?: {
            nama: string;
        };
    };
    pendaftaran?: {
        penjamin?: {
            nama: string;
        };
    };
}

interface SoapDokterData {
    no_rawat?: string;
    kode_tindakan?: string;
    umur?: string;
    sistol?: string;
    distol?: string;
    tensi?: string;
    suhu?: string;
    nadi?: string;
    rr?: string;
    tinggi?: string;
    berat?: string;
    spo2?: string;
    lingkar_perut?: string;
    nilai_bmi?: string;
    status_bmi?: string;
    jenis_alergi: string[];
    alergi: string[];
    eye?: string;
    verbal?: string;
    motorik?: string;
    kesadaran?: string;
    htt?: string;
    anamnesa?: string;
    assesmen?: string;
    plan?: string;
    resep_obat?: string;
    jenis_tindakan?: string;
    jenis_pelaksana?: string;
    harga?: string;
    jenis_diet?: string;
    jenis_diet_makanan?: string;
    jenis_diet_makanan_tidak?: string;
    diet?: {
        jenis_diet?: string;
        jenis_diet_makanan?: string;
        jenis_diet_makanan_tidak?: string;
    };
    odontogram?: string;
    Decayed?: string;
    Missing?: string;
    Filled?: string;
    Oclusi?: string;
    Palatinus?: string;
    Mandibularis?: string;
    Platum?: string;
    Diastema?: string;
    Anomali?: string;
    tableData?: any[];
}

interface GcsEye {
    id: number;
    nama: string;
    skor: string;
}

interface GcsVerbal {
    id: number;
    nama: string;
    skor: string;
}

interface GcsMotorik {
    id: number;
    nama: string;
    skor: string;
}

interface GcsKesadaran {
    id: number;
    nama: string;
    skor: string;
}

interface HttPemeriksaan {
    id: number;
    nama_pemeriksaan: string;
    htt_subpemeriksaans: Array<{
        id: number;
        nama: string;
    }>;
}

interface Icd10 {
    kode: string;
    nama: string;
}

interface Icd9 {
    kode: string;
    nama: string;
}

interface IcdData {
    id?: number;
    kode_icd10?: string;
    nama_icd10?: string;
    priority_icd10?: string;
    kode_icd9?: string;
    nama_icd9?: string;
}

interface JenisDiet {
    id: number;
    nama: string;
}

interface Makanan {
    id: number;
    nama: string;
}

interface TindakanData {
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    tarif_dokter: string;
    tarif_perawat: string;
    tarif_total: string;
}

interface TindakanItem {
    kode: string;
    nama: string;
    kategori?: string;
    pelaksana: string;
    harga: number;
}

interface ExistingDietData {
    id: number;
    jenis_diet: string;
    jenis_diet_makanan: string;
    jenis_diet_makanan_tidak: string;
}

interface AlergiData {
    id: number;
    kode: string;
    jenis_alergi: string;
    nama: string;
}

interface PageProps {
    pelayanan: PatientData;
    soap_dokter?: SoapDokterData;
    so_perawat?: any;
    existing_diet_data: ExistingDietData[];
    alergi_data: AlergiData[];
    penggunaan_obat?: Array<{ id: number; nama: string }>;
    gcs_eye: GcsEye[];
    gcs_verbal: GcsVerbal[];
    gcs_motorik: GcsMotorik[];
    gcs_kesadaran: GcsKesadaran[];
    htt_pemeriksaan: HttPemeriksaan[];
    icd10: Icd10[];
    icd9: Icd9[];
    jenis_diet: JenisDiet[];
    makanan: Makanan[];
    tindakan: TindakanData[];
    norawat: string;
    saved_icd10?: Array<{ kode: string; nama: string; priority?: string }>;
    saved_icd9?: Array<{ kode: string; nama: string; priority?: string }>;
    tindakan_list_saved?: Array<{ kode: string; nama: string; kategori?: string; pelaksana?: string; harga?: string | number }>;
    obat_saved?: Array<{ penanda?: string; nama_obat?: string; instruksi?: string; signa?: string; satuan_gudang?: string; penggunaan?: string }>;
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelayanan', href: '/pelayanan/so-dokter' },
    { title: 'SOAP Dokter', href: '/pelayanan/so-dokter' },
    { title: 'Pemeriksaan', href: '' },
];

export default function PemeriksaanSoapDokter() {
    // Ambil props Inertia di top-level (hindari memanggil hooks di dalam effect/initializer)
    const page = usePage();
    const inertiaProps = page.props as any;

    const {
        pelayanan,
        soap_dokter,
        so_perawat,
        existing_diet_data,
        alergi_data,
        penggunaan_obat,
        gcs_eye,
        gcs_verbal,
        gcs_motorik,
        gcs_kesadaran,
        htt_pemeriksaan,
        icd10,
        icd9,
        jenis_diet,
        makanan,
        tindakan,
        norawat,
        saved_icd10,
        saved_icd9,
        tindakan_list_saved,
        obat_saved,
        errors,
    } = usePage().props as unknown as PageProps;

    const [activeTab, setActiveTab] = useState('subyektif');
    const [cpptEntries, setCpptEntries] = useState<any[]>([]);
    const [cpptLoading, setCpptLoading] = useState(false);

    const truncate = (text: string, max: number = 30): string => {
        if (!text) return '';
        const s = String(text);
        return s.length > max ? s.slice(0, max) + '...' : s;
    };

    // Load CPPT data when CPPT tab is accessed
    const loadCpptData = async () => {
        if (!pelayanan?.nomor_rm) return;

        setCpptLoading(true);
        try {
            const response = await fetch(`/api/pelayanan/cppt/timeline/${pelayanan.nomor_rm}`, {
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
    }, [activeTab, pelayanan?.nomor_rm]);

    // Initialize penggunaanOptions from props
    useEffect(() => {
        if (Array.isArray(inertiaProps?.penggunaan_obat)) {
            setPenggunaanOptions(inertiaProps.penggunaan_obat as Array<{ id: number; nama: string }>);
        } else {
            // Fallback to any window-based bootstrap (if present)
            try {
                const arr = Array.isArray((window as any)?.__PENGGUNAAN_OBAT__)
                    ? ((window as any).__PENGGUNAAN_OBAT__ as Array<{ id: number; nama: string }>)
                    : [];
                setPenggunaanOptions(arr);
            } catch {
                setPenggunaanOptions([]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Opsi jenis alergi unik dan detail alergi terfilter (dideklarasikan setelah formData)

    const [formData, setFormData] = useState<SoapDokterData>(() => {
        const p = so_perawat as any;
        const composeTensi = (s: string, d: string, t: string) => {
            if (t && t.trim() !== '') return t;
            if (s && d) return `${s}/${d}`;
            return '';
        };
        return {
            no_rawat: soap_dokter?.no_rawat || pelayanan?.nomor_register || '',
            sistol: soap_dokter?.sistol || (p?.sistol ? String(p.sistol) : ''),
            distol: soap_dokter?.distol || (p?.distol ? String(p.distol) : ''),
            tensi: soap_dokter?.tensi || composeTensi(p?.sistol || '', p?.distol || '', p?.tensi || ''),
            suhu: soap_dokter?.suhu || (p?.suhu ? String(p.suhu) : ''),
            nadi: soap_dokter?.nadi || (p?.nadi ? String(p.nadi) : ''),
            rr: soap_dokter?.rr || (p?.rr ? String(p.rr) : ''),
            tinggi: soap_dokter?.tinggi || (p?.tinggi ? String(p.tinggi) : ''),
            berat: soap_dokter?.berat || (p?.berat ? String(p.berat) : ''),
            spo2: soap_dokter?.spo2 || (p?.spo2 ? String(p.spo2) : ''),
            lingkar_perut: soap_dokter?.lingkar_perut || (p?.lingkar_perut ? String(p.lingkar_perut) : ''),
            nilai_bmi: soap_dokter?.nilai_bmi || (p?.nilai_bmi ? String(p.nilai_bmi) : ''),
            status_bmi: soap_dokter?.status_bmi || (p?.status_bmi ? String(p.status_bmi) : ''),
            jenis_alergi: Array.isArray((soap_dokter as any)?.jenis_alergi)
                ? ((soap_dokter as any).jenis_alergi as string[])
                : Array.isArray(p?.jenis_alergi)
                    ? (p?.jenis_alergi as string[])
                    : [],
            alergi: Array.isArray((soap_dokter as any)?.alergi)
                ? ((soap_dokter as any).alergi as string[])
                : Array.isArray(p?.alergi)
                    ? (p?.alergi as string[])
                    : [],
            eye: soap_dokter?.eye || (p?.eye !== undefined && p?.eye !== null ? String(p.eye) : ''),
            verbal: soap_dokter?.verbal || (p?.verbal !== undefined && p?.verbal !== null ? String(p.verbal) : ''),
            motorik: soap_dokter?.motorik || (p?.motorik !== undefined && p?.motorik !== null ? String(p.motorik) : ''),
            kesadaran: soap_dokter?.kesadaran || p?.kesadaran || '',
            htt: soap_dokter?.htt || '',
            anamnesa: soap_dokter?.anamnesa || '',
            assesmen: soap_dokter?.assesmen || '',
            plan: soap_dokter?.plan || '',
            odontogram: soap_dokter?.odontogram || '',
            Decayed: soap_dokter?.Decayed || '',
            Missing: soap_dokter?.Missing || '',
            Filled: soap_dokter?.Filled || '',
            Oclusi: soap_dokter?.Oclusi || '',
            Palatinus: soap_dokter?.Palatinus || '',
            Mandibularis: soap_dokter?.Mandibularis || '',
            Platum: soap_dokter?.Platum || '',
            Diastema: soap_dokter?.Diastema || '',
            Anomali: soap_dokter?.Anomali || '',
            tableData: (soap_dokter?.tableData && Array.isArray(soap_dokter.tableData) ? soap_dokter.tableData : p?.tableData || []) as any[],
        };
    });

    // Opsi jenis alergi unik dan detail alergi terfilter
    const jenisAlergiOptions: string[] = useMemo(() => {
        if (!Array.isArray(alergi_data)) return [] as string[];
        const set = new Set<string>();
        for (const item of alergi_data) {
            const j = (item?.jenis_alergi || '').trim();
            if (j) set.add(j);
        }
        return Array.from(set);
    }, [alergi_data]);

    const detailAlergiOptions: AlergiData[] = useMemo(() => {
        if (!Array.isArray(alergi_data)) return [] as AlergiData[];
        const jenisList = Array.isArray(formData.jenis_alergi) ? formData.jenis_alergi : [];
        if (jenisList.length === 0) return [] as AlergiData[];
        return alergi_data.filter((item) => jenisList.includes((item?.jenis_alergi || '').trim()));
    }, [alergi_data, formData.jenis_alergi]);

    // Confirm dialog state & helpers (mirror perawat)
    type ConfirmOptions = { title?: string; description?: string; confirmText?: string; cancelText?: string };
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions>({});
    const confirmResolverRef = useRef<((value: boolean) => void) | undefined>(undefined);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (confirmOpen) {
            setTimeout(() => confirmButtonRef.current?.focus(), 100);
        }
    }, [confirmOpen]);
    const confirm = (options: ConfirmOptions) => {
        setConfirmOpts({ cancelText: 'Ubah', confirmText: 'Lanjut', ...options });
        setConfirmOpen(true);
        return new Promise<boolean>((resolve) => {
            confirmResolverRef.current = resolve;
        });
    };
    const handleConfirmCancel = () => {
        if (confirmResolverRef.current) {
            confirmResolverRef.current(false);
            confirmResolverRef.current = undefined;
        }
        setConfirmOpen(false);
    };
    const handleConfirmOk = () => {
        if (confirmResolverRef.current) {
            confirmResolverRef.current(true);
            confirmResolverRef.current = undefined;
        }
        setConfirmOpen(false);
    };

    // ICD state
    const [icdData, setIcdData] = useState<IcdData>({
        kode_icd10: '',
        nama_icd10: '',
        priority_icd10: '',
        kode_icd9: '',
        nama_icd9: '',
    });

    // ICD lists
    const [icd10List, setIcd10List] = useState<IcdData[]>([]);
    const [icd9List, setIcd9List] = useState<IcdData[]>([]);

    // Keluhan state
    const [keluhan, setKeluhan] = useState('');
    const [durasi, setDurasi] = useState('');
    const [durasiUnit, setDurasiUnit] = useState('Hari');
    const [keluhanList, setKeluhanList] = useState<Array<{ keluhan: string; durasi: string }>>([]);

    // HTT state
    const [httItems, setHttpItems] = useState<Array<{ pemeriksaan: string; subPemeriksaan: string; detail: string }>>([]);
    const [selectedHtt, setSelectedHtt] = useState('');
    const [selectedSubHtt, setSelectedSubHtt] = useState('');
    const [httDetailText, setHttDetailText] = useState('');
    const [httOptions, setHttOptions] = useState<HttPemeriksaan[]>(htt_pemeriksaan || []);
    const [subOptions, setSubOptions] = useState<Array<{ id: number; nama: string }>>([]);

    // Obat interface
    interface Obat {
        kode_obat_alkes: string;
        nama_obat_alkes: string;
        total_stok: number;
    }

    // Obat state
    const [obatData, setObatData] = useState({
        nama_obat: '',
        jumlah: '',
        instruksi: '',
        signa: '',
        satuan_gudang: '',
        satuan_signa: '',
        penggunaan: '',
        dtd: '',
        jumlah_diberikan: '',
        dtd_mode: 'NON DTD',
    });

    const [obatList, setObatList] = useState<Array<typeof obatData>>([]);
    const [obatTersedia, setObatTersedia] = useState<Array<{ kode_obat_alkes: string; nama_obat_alkes: string; total_stok: number }>>([]);
    const [instruksiObat, setInstruksiObat] = useState<Array<{ id: number; nama: string }>>([]);
    const [penggunaanOptions, setPenggunaanOptions] = useState<Array<{ id: number; nama: string }>>([]);
    const [satuanBarang, setSatuanBarang] = useState<Array<{ id: number; nama: string }>>([]);
    const [loadingObat, setLoadingObat] = useState(false);
    const [editIndexObat, setEditIndexObat] = useState<number | null>(null);

    const tambahObat = () => {
        // validation: require jumlah_diberikan; DTD optional
        const jumlahOk = !!String(obatData.jumlah_diberikan || '').trim();
        if (!jumlahOk) {
            try {
                toast.error('Mohon isi Jumlah Diberikan');
            } catch { }
            return;
        }
        if (editIndexObat !== null) {
            const updated = [...obatList];
            updated[editIndexObat] = obatData;
            setObatList(updated);
            setEditIndexObat(null);
        } else {
            setObatList([...obatList, obatData]);
        }
        setObatData({
            nama_obat: '',
            jumlah: '',
            instruksi: '',
            signa: '',
            satuan_gudang: '',
            satuan_signa: '',
            penggunaan: '',
            dtd: '',
            jumlah_diberikan: '',
            dtd_mode: 'NON DTD',
        });
    };

    const hapusObat = (index: number) => {
        const daftarBaru = [...obatList];
        daftarBaru.splice(index, 1);
        setObatList(daftarBaru);
        if (editIndexObat !== null) {
            if (editIndexObat === index) {
                setEditIndexObat(null);
                setObatData({
                    nama_obat: '',
                    jumlah: '',
                    instruksi: '',
                    signa: '',
                    satuan_gudang: '',
                    satuan_signa: '',
                    penggunaan: '',
                    dtd: '',
                    jumlah_diberikan: '',
                    dtd_mode: 'NON DTD',
                });
            } else if (editIndexObat > index) {
                setEditIndexObat(editIndexObat - 1);
            }
        }
    };

    const editObat = (index: number) => {
        const item = obatList[index];
        setObatData({ ...item });
        setEditIndexObat(index);
    };

    const cancelEditObat = () => {
        setEditIndexObat(null);
        setObatData({
            nama_obat: '',
            jumlah: '',
            instruksi: '',
            signa: '',
            satuan_gudang: '',
            satuan_signa: '',
            penggunaan: '',
            dtd: '',
            jumlah_diberikan: '',
            dtd_mode: 'NON DTD',
        });
    };

    const moveObatUp = (index: number) => {
        if (index <= 0) return;
        const newList = [...obatList];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setObatList(newList);
        if (editIndexObat === index) setEditIndexObat(index - 1);
        else if (editIndexObat === index - 1) setEditIndexObat(index);
    };

    const moveObatDown = (index: number) => {
        if (index >= obatList.length - 1) return;
        const newList = [...obatList];
        [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
        setObatList(newList);
        if (editIndexObat === index) setEditIndexObat(index + 1);
        else if (editIndexObat === index + 1) setEditIndexObat(index);
    };

    // Ambil data obat tersedia dari stok gudang
    const ambilObatTersedia = async () => {
        setLoadingObat(true);
        try {
            const response = await fetch('/api/obat/tersedia');
            if (response.ok) {
                const obat = await response.json();
                setObatTersedia(obat);
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setLoadingObat(false);
        }
    };

    const ambilInstruksiObat = async () => {
        try {
            const response = await fetch('/api/obat/instruksi');
            if (response.ok) {
                const instruksi = await response.json();
                setInstruksiObat(instruksi);
            }
        } catch (error) {
            console.error('Error fetching instruksi obat:', error);
        }
    };

    const ambilSatuanBarang = async () => {
        try {
            const response = await fetch('/api/obat/satuan');
            if (response.ok) {
                const satuan = await response.json();
                setSatuanBarang(satuan);
            }
        } catch (error) {
            console.error('Error fetching satuan barang:', error);
        }
    };

    // Keep penggunaan options in sync with server-provided Inertia props
    useEffect(() => {
        if (Array.isArray(penggunaan_obat)) {
            setPenggunaanOptions(penggunaan_obat);
        }
    }, [penggunaan_obat]);

    // Muat data obat saat komponen pertama kali dimuat
    useEffect(() => {
        ambilObatTersedia();
        ambilInstruksiObat();
        ambilSatuanBarang();

        // Load existing keluhan dari so_perawat jika tersedia (tanpa preload HTT)
        if (so_perawat?.tableData) {
            const td = so_perawat.tableData as any;
            if (Array.isArray(td?.keluhanList)) {
                setKeluhanList(td.keluhanList);
            }
        }

        // Load HTT options from server-provided models (no API)
        setHttOptions(htt_pemeriksaan || []);
    }, []);

    // Keep HTT options in sync if props change
    useEffect(() => {
        setHttOptions(htt_pemeriksaan || []);
    }, [htt_pemeriksaan]);

    // Prefill from saved bundles on edit
    useEffect(() => {
        const editMode = !!(soap_dokter && Object.keys(soap_dokter).length > 0);
        if (!editMode) return;

        // 1) Prefill ICD10/ICD9 from saved props if provided
        try {
            const icd10Prefill = Array.isArray(saved_icd10 as any)
                ? (saved_icd10 as any).map((x: any) => ({
                    kode_icd10: x.kode,
                    nama_icd10: x.nama,
                    priority_icd10: x.priority,
                }))
                : [];
            if (icd10Prefill.length) setIcd10List(icd10Prefill);
        } catch { }
        try {
            const icd9Prefill = Array.isArray(saved_icd9 as any)
                ? (saved_icd9 as any).map((x: any) => ({
                    kode_icd9: x.kode,
                    nama_icd9: x.nama,
                }))
                : [];
            if (icd9Prefill.length) setIcd9List(icd9Prefill);
        } catch { }

        // 2) Prefill tindakan list or single form values
        try {
            const list = Array.isArray(tindakan_list_saved as any) ? (tindakan_list_saved as any) : [];
            if (list.length) {
                setTindakanList(
                    list.map((it: any) => ({
                        kode: it.kode || '',
                        nama: it.nama || '',
                        kategori: it.kategori || '',
                        pelaksana: it.pelaksana || '',
                        harga: Number(it.harga || 0),
                    })),
                );
            }
        } catch { }

        // 3) Prefill obat list
        try {
            const resep = Array.isArray(obat_saved as any) ? (obat_saved as any) : [];
            if (resep.length) setObatList(resep as any);
        } catch { }

        // 4) Prefill keluhan dari tableData (tanpa preload HTT)
        try {
            const td = (soap_dokter as any)?.tableData;
            const parsed = typeof td === 'string' ? JSON.parse(td) : td;
            if (parsed && typeof parsed === 'object') {
                if (Array.isArray(parsed.keluhanList)) setKeluhanList(parsed.keluhanList);
            }
        } catch { }
    }, [soap_dokter]);

    // Tindakan state
    const [tindakanData, setTindakanData] = useState({
        kode_tindakan: soap_dokter?.kode_tindakan || '',
        jenis_tindakan: soap_dokter?.jenis_tindakan || '',
        jenis_pelaksana: soap_dokter?.jenis_pelaksana || '',
        harga: soap_dokter?.harga || '',
        manualPricing: false,
    });

    const [tindakanList, setTindakanList] = useState<TindakanItem[]>([]);

    // Diet state
    const [dietData, setDietData] = useState({
        jenis_diet: soap_dokter?.diet?.jenis_diet || '',
        jenis_diet_makanan: soap_dokter?.diet?.jenis_diet_makanan || '',
        jenis_diet_makanan_tidak: soap_dokter?.diet?.jenis_diet_makanan_tidak || '',
    });

    // Diet list state for managing selected items
    const [dietList, setDietList] = useState<Array<{ jenis_diet: string; jenis_diet_makanan: string; jenis_diet_makanan_tidak: string }>>(() => {
        // Initialize with existing diet data if available
        return (
            existing_diet_data?.map((diet) => ({
                jenis_diet: diet.jenis_diet,
                jenis_diet_makanan: diet.jenis_diet_makanan,
                jenis_diet_makanan_tidak: diet.jenis_diet_makanan_tidak,
            })) || []
        );
    });

    // Collapsible states for Objektif sections
    const [openVitalGroup, setOpenVitalGroup] = useState(true);
    const [openHtt, setOpenHtt] = useState(true);
    const [openDiet, setOpenDiet] = useState(true);
    const [openOdontogram, setOpenOdontogram] = useState(true);

    // Collapsible states for Assesmen sections
    const [openAssessment, setOpenAssessment] = useState(true);
    const [openIcd, setOpenIcd] = useState(true);
    const [openTindakan, setOpenTindakan] = useState(true);
    const [openObat, setOpenObat] = useState(true);

    const allOpen = openVitalGroup && openHtt && openDiet && openOdontogram;
    const toggleAll = (open: boolean) => {
        setOpenVitalGroup(open);
        setOpenHtt(open);
        setOpenDiet(open);
        setOpenOdontogram(open);
    };

    const allAssesmenOpen = openAssessment && openIcd && openTindakan && openObat;
    const toggleAllAssesmen = (open: boolean) => {
        setOpenAssessment(open);
        setOpenIcd(open);
        setOpenTindakan(open);
        setOpenObat(open);
    };

    // Calculate GCS kesadaran when eye, verbal, or motorik changes
    useEffect(() => {
        if (formData.eye && formData.verbal && formData.motorik) {
            const eyeScore = parseInt(formData.eye);
            const verbalScore = parseInt(formData.verbal);
            const motorikScore = parseInt(formData.motorik);

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

                setFormData((prev) => ({
                    ...prev,
                    kesadaran: kesadaran,
                }));
            }
        }
    }, [formData.eye, formData.verbal, formData.motorik]);

    // Auto-calc BMI/status like perawat when tinggi/berat change
    useEffect(() => {
        const tinggi = parseFloat(formData.tinggi || '');
        const berat = parseFloat(formData.berat || '');
        if (!isNaN(tinggi) && !isNaN(berat) && tinggi > 0) {
            const heightInMeters = tinggi / 100;
            const bmiValue = berat / (heightInMeters * heightInMeters);
            const nilai = bmiValue.toFixed(2);
            let status = '';
            if (bmiValue < 18.5) status = 'Kurus';
            else if (bmiValue >= 18.5 && bmiValue <= 24.9) status = 'Normal';
            else if (bmiValue >= 25 && bmiValue <= 29.9) status = 'Gemuk';
            else status = 'Obesitas';
            setFormData((prev) => ({ ...prev, nilai_bmi: nilai, status_bmi: status }));
        }
    }, [formData.tinggi, formData.berat]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (name: string, value: string | string[]) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Refs for keyboard navigation (mirror perawat)
    const sistolRef = useRef<HTMLInputElement>(null);
    const distolRef = useRef<HTMLInputElement>(null);
    const suhuRef = useRef<HTMLInputElement>(null);
    const nadiRef = useRef<HTMLInputElement>(null);
    const rrRef = useRef<HTMLInputElement>(null);
    const tinggiRef = useRef<HTMLInputElement>(null);
    const beratRef = useRef<HTMLInputElement>(null);
    const spo2Ref = useRef<HTMLInputElement>(null);
    const lingkarPerutRef = useRef<HTMLInputElement>(null);
    const jenisAlergiTriggerRef = useRef<HTMLButtonElement>(null);

    // Helpers
    const calculateAge = (tanggalLahir: string): { years: number; months: number } => {
        const today = new Date();
        const birthDate = new Date(tanggalLahir);
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        if (today.getDate() < birthDate.getDate()) months--;
        if (months < 0) {
            years--;
            months += 12;
        }
        if (years > 0) {
            years = Math.round(years + months / 12);
            months = 0;
        }
        return { years, months };
    };

    // Format umur tampilan: X Tahun Y Bulan Z Hari
    const formatUmurDisplay = (tanggalLahir?: string, umurRaw?: string): string => {
        const raw = umurRaw || '';
        if (raw && raw.includes('Tahun') && raw.includes('Bulan') && raw.includes('Hari')) {
            return raw;
        }
        if (!tanggalLahir) {
            return raw;
        }
        const today = new Date();
        const birth = new Date(tanggalLahir);
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();

        if (days < 0) {
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
            months -= 1;
        }
        if (months < 0) {
            months += 12;
            years -= 1;
        }
        if (years < 0) return raw || '';
        return `${years} Tahun ${months} Bulan ${days} Hari`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string, nextField?: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentField === 'suhu') handleSuhuBlur();
            else if (currentField === 'nadi') handleNadiBlur();
            else if (currentField === 'rr') handleRrBlur();
            else if (currentField === 'spo2') handleSpo2Blur();
            else if (currentField === 'tinggi' || currentField === 'berat') handleBmiBlur();
        }
    };

    // Validation/blur handlers ported from perawat
    const handleTensiBlur = async (source?: 'sistol' | 'distol') => {
        const sistol = (formData.sistol || '').trim();
        const distol = (formData.distol || '').trim();
        if (!sistol || !distol) return;
        const tanggalLahir = (pelayanan?.tanggal_lahir ?? '').trim();
        if (!tanggalLahir) {
            toast.warning('Tanggal lahir kosong. Mohon isi tanggal lahir terlebih dahulu.');
            return;
        }
        const sVal = parseInt(sistol, 10);
        const dVal = parseInt(distol, 10);
        if (isNaN(sVal) || isNaN(dVal)) {
            toast.warning('Sistol dan Diastol harus diisi dengan angka yang valid.');
            setFormData((prev) => ({ ...prev, sistol: '', distol: '', tensi: '' }));
            return;
        }
        const tensiValue = `${sVal}/${dVal}`;
        setFormData((prev) => ({ ...prev, tensi: tensiValue }));
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
            const ok = await confirm({ title: 'Validasi Tensi', description: message, confirmText: 'Lanjut', cancelText: 'Ubah' });
            if (!ok) {
                setFormData((prev) => ({ ...prev, sistol: '', distol: '', tensi: '' }));
            }
        }
    };

    const handleRrBlur = async () => {
        const rr = (formData.rr || '').trim();
        if (!rr) return;
        const tanggalLahir = (pelayanan?.tanggal_lahir ?? '').trim();
        if (!tanggalLahir) {
            toast.warning('Tanggal lahir kosong. Mohon isi tanggal lahir terlebih dahulu.');
            return;
        }
        const rrValue = parseInt(rr, 10);
        if (isNaN(rrValue)) {
            toast.warning('Mohon masukkan angka Respiratory Rate (RR) yang benar!');
            setFormData((prev) => ({ ...prev, rr: '' }));
            return;
        }
        const { years: tahun, months: bulan } = calculateAge(tanggalLahir);
        let status = '';
        let pesan = '';
        const checkRange = (min: number, max: number) => {
            if (rrValue < min) {
                status = 'RR Terlalu Rendah';
                pesan = `RR pasien (${rrValue}) di bawah batas normal (${min} - ${max})`;
            } else if (rrValue > max) {
                status = 'RR Terlalu Cepat';
                pesan = `RR pasien (${rrValue}) di atas batas normal (${min} - ${max})`;
            } else {
                status = 'RR Normal';
                pesan = `RR pasien (${rrValue}) berada dalam rentang normal (${min} - ${max})`;
            }
        };
        if (tahun === 0 && bulan <= 12) checkRange(30, 60);
        else if (tahun >= 1 && tahun <= 2) checkRange(24, 40);
        else if (tahun >= 3 && tahun <= 5) checkRange(22, 34);
        else if (tahun >= 6 && tahun <= 12) checkRange(18, 30);
        else if (tahun >= 13 && tahun <= 17) checkRange(12, 20);
        else if (tahun >= 18 && tahun <= 64) checkRange(18, 24);
        else if (tahun >= 65) checkRange(12, 28);
        const ok = await confirm({ title: status || 'Validasi RR', description: `${pesan}.`, confirmText: 'Lanjut', cancelText: 'Ubah' });
        if (!ok) setFormData((prev) => ({ ...prev, rr: '' }));
        else {
        }
    };

    const handleSuhuBlur = async () => {
        const raw = (formData.suhu || '').trim();
        if (!raw) return;
        if (raw.includes(',')) {
            toast.warning('Gunakan titik (.) sebagai pemisah desimal, bukan koma!');
            setFormData((prev) => ({ ...prev, suhu: '' }));
            return;
        }
        const suhuNumber = parseFloat(raw);
        if (isNaN(suhuNumber)) {
            toast.warning('Mohon masukkan suhu dalam angka yang benar!');
            setFormData((prev) => ({ ...prev, suhu: '' }));
            return;
        }
        let status = '';
        let pesan = '';
        if (suhuNumber < 34.4) {
            status = 'Hipotermia';
            pesan = 'Suhu tubuh terlalu rendah. Segera konsultasi medis jika perlu.';
        } else if (suhuNumber >= 34.4 && suhuNumber <= 37.4) {
            status = 'Suhu Normal';
            pesan = 'Suhu tubuh pasien berada dalam rentang normal.';
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
        if (!ok) setFormData((prev) => ({ ...prev, suhu: '' }));
        else {
        }
    };

    const handleSpo2Blur = async () => {
        const raw = (formData.spo2 || '').trim();
        if (!raw) return;
        const value = parseFloat(raw);
        if (isNaN(value)) {
            toast.warning('SpO2 tidak valid. Mohon masukkan angka yang benar!');
            setFormData((prev) => ({ ...prev, spo2: '' }));
            return;
        }
        let title = '';
        let text = '';
        if (value < 95 || value > 100) {
            title = 'SpO2 Tidak Normal';
            text =
                value < 95
                    ? `SpO2 pasien (${value}%) terlalu rendah. Normal: 95% - 100%.`
                    : `SpO2 pasien (${value}%) terlalu tinggi. Normal: 95% - 100%.`;
        } else {
            title = 'SpO2 Normal';
            text = `SpO2 pasien (${value}%) berada dalam rentang normal.`;
        }
        const ok = await confirm({ title: title || 'Validasi SpO2', description: text, confirmText: 'Lanjut', cancelText: 'Ubah' });
        if (!ok) setFormData((prev) => ({ ...prev, spo2: '' }));
        else {
        }
    };

    const handleNadiBlur = async () => {
        const raw = (formData.nadi || '').trim();
        if (!raw) return;
        const tanggalLahir = (pelayanan?.tanggal_lahir ?? '').trim();
        if (!tanggalLahir) {
            toast.warning('Tanggal lahir kosong. Data tanggal lahir tidak tersedia.');
            return;
        }
        const nadiVal = parseInt(raw, 10);
        if (isNaN(nadiVal)) {
            toast.warning('Masukkan angka nadi yang benar!');
            setFormData((prev) => ({ ...prev, nadi: '' }));
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
            ? `Nadi pasien (${nadiVal} bpm) sesuai untuk umur ${years} Tahun ${months} Bulan.`
            : `Nadi pasien (${nadiVal} bpm) di luar rentang normal (${range.min}-${range.max} bpm) untuk umur ${years} Tahun ${months} Bulan.`;
        const ok = await confirm({ title: status || 'Validasi Nadi', description: pesan, confirmText: 'Lanjut', cancelText: 'Ubah' });
        if (!ok) setFormData((prev) => ({ ...prev, nadi: '' }));
        else {
        }
    };

    const handleBmiBlur = async () => {
        const tinggi = (formData.tinggi || '').trim();
        const berat = (formData.berat || '').trim();
        if (!tinggi || !berat) return;
        const tinggiVal = parseFloat(tinggi);
        const beratVal = parseFloat(berat);
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
            setFormData((prev) => ({ ...prev, nilai_bmi: bmiFixed }));
            message = `Data BMI pasien adalah: ${bmiFixed},\nDengan kategori: ${bmiCategory}\nApakah Anda ingin melanjutkan?`;
        }
        const ok = await confirm({ title: 'Validasi BMI', description: message, confirmText: 'Lanjut', cancelText: 'Ubah' });
        if (!ok) setFormData((prev) => ({ ...prev, tinggi: '', berat: '', nilai_bmi: '', status_bmi: '' }));
        else {
        }
    };

    // Diet handlers
    const handleAddDiet = () => {
        if (dietData.jenis_diet.trim() && dietData.jenis_diet_makanan.trim() && dietData.jenis_diet_makanan_tidak.trim()) {
            const newDiet = {
                jenis_diet: dietData.jenis_diet.trim(),
                jenis_diet_makanan: dietData.jenis_diet_makanan.trim(),
                jenis_diet_makanan_tidak: dietData.jenis_diet_makanan_tidak.trim(),
            };
            setDietList((prev) => [...prev, newDiet]);
            setDietData({ jenis_diet: '', jenis_diet_makanan: '', jenis_diet_makanan_tidak: '' });
            toast.success('Diet berhasil ditambahkan');
        } else {
            toast.error('Mohon lengkapi semua field diet');
        }
    };

    const handleRemoveDiet = (index: number) => {
        setDietList((prev) => prev.filter((_, i) => i !== index));
        toast.success('Diet berhasil dihapus');
    };

    // Keluhan handlers
    const handleAddKeluhan = () => {
        if (keluhan.trim() && durasi.trim()) {
            const newKeluhan = {
                keluhan: keluhan.trim(),
                durasi: `${durasi} ${durasiUnit}`,
            };
            setKeluhanList((prev) => [...prev, newKeluhan]);
            setKeluhan('');
            setDurasi('');
            toast.success('Keluhan berhasil ditambahkan');
        } else {
            toast.error('Mohon isi keluhan dan durasi');
        }
    };

    const handleRemoveKeluhan = (index: number) => {
        setKeluhanList((prev) => prev.filter((_, i) => i !== index));
        toast.success('Keluhan berhasil dihapus');
    };

    const handleEditKeluhan = (index: number) => {
        const item = keluhanList[index];
        setKeluhan(item.keluhan);
        // Parse durasi to extract number and unit
        const durasiParts = item.durasi.split(' ');
        if (durasiParts.length >= 2) {
            setDurasi(durasiParts[0]);
            setDurasiUnit(durasiParts.slice(1).join(' '));
        }
        handleRemoveKeluhan(index);
    };

    // HTT handlers
    const handleHttChange = async (httId: string) => {
        setSelectedHtt(httId);
        setSelectedSubHtt('');
        setSubOptions([]);

        if (!httId) return;

        const local = httOptions.find((p) => String(p.id) === httId)?.htt_subpemeriksaans || [];
        setSubOptions(local);
    };

    const handleAddHtt = () => {
        if (!selectedHtt || !selectedSubHtt || !httDetailText.trim()) {
            toast.error('Mohon lengkapi semua field HTT');
            return;
        }

        const pemeriksaanName = httOptions.find((p) => String(p.id) === selectedHtt)?.nama_pemeriksaan || '';
        const subPemeriksaanName = subOptions.find((s) => String(s.id) === selectedSubHtt)?.nama || '';

        const newHttItem = {
            pemeriksaan: pemeriksaanName,
            subPemeriksaan: subPemeriksaanName,
            detail: httDetailText.trim(),
        };

        setHttpItems((prev) => [...prev, newHttItem]);
        setSelectedHtt('');
        setSelectedSubHtt('');
        setHttDetailText('');
        setSubOptions([]);
        toast.success('HTT berhasil ditambahkan');
    };

    const handleRemoveHtt = (index: number) => {
        setHttpItems((prev) => prev.filter((_, i) => i !== index));
        toast.success('HTT berhasil dihapus');
    };

    // Helper function to convert readable gender to database code
    const convertGenderToCode = (genderName: string): string => {
        if (!genderName) return '';

        // Handle different formats
        switch (genderName.toLowerCase().trim()) {
            case 'laki-laki':
            case 'laki laki':
            case 'pria':
            case 'male':
                return 'L'; // Laki-laki = L
            case 'perempuan':
            case 'wanita':
            case 'female':
                return 'P'; // Perempuan = P
            default:
                // If it's already a code, convert to new format (L/P)
                if (genderName === 'L' || genderName === '1') {
                    return 'L';
                }
                if (genderName === 'P' || genderName === '2') {
                    return 'P';
                }
                return genderName; // fallback
        }
    };

    // Helper function to convert database code to readable gender name
    const convertCodeToGender = (genderCode: string): string => {
        if (!genderCode) return '';

        switch (genderCode.trim()) {
            case 'L':
            case '1':
                return 'Laki-laki';
            case 'P':
            case '2':
                return 'Perempuan';
            default:
                return genderCode; // fallback
        }
    };

    // Validate all required fields before submit
    const validateRequiredFields = (): boolean => {
        // Require at least one keluhan item
        if (!keluhanList || keluhanList.length === 0) {
            toast.error('Harap tambahkan minimal 1 keluhan');
            setActiveTab('subyektif');
            return false;
        }

        setActiveTab('objektif');

        // Vital signs
        if (!String(formData.sistol || '').trim()) {
            toast.error('Sistol wajib diisi');
            (sistolRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.distol || '').trim()) {
            toast.error('Diastol wajib diisi');
            (distolRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.suhu || '').trim()) {
            toast.error('Suhu wajib diisi');
            (suhuRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.nadi || '').trim()) {
            toast.error('Nadi wajib diisi');
            (nadiRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.rr || '').trim()) {
            toast.error('RR wajib diisi');
            (rrRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.spo2 || '').trim()) {
            toast.error('SpO2 wajib diisi');
            (spo2Ref as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.tinggi || '').trim()) {
            toast.error('Tinggi badan wajib diisi');
            (tinggiRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.berat || '').trim()) {
            toast.error('Berat badan wajib diisi');
            (beratRef as any)?.current?.focus?.();
            return false;
        }
        if (!String(formData.lingkar_perut || '').trim()) {
            toast.error('Lingkar perut wajib diisi');
            (lingkarPerutRef as any)?.current?.focus?.();
            return false;
        }

        // Alergi
        const jenis = formData.jenis_alergi || [];
        if (!Array.isArray(jenis) || jenis.length === 0) {
            toast.error('Jenis alergi wajib dipilih');
            return false;
        }
        const detail = formData.alergi || [];
        const hasTidakAda = jenis.includes('00');
        if (hasTidakAda) {
            if (!(Array.isArray(detail) && detail.length === 1 && detail[0] === '00')) {
                toast.error('Jika memilih "Tidak ada", detail alergi harus "Tidak ada"');
                return false;
            }
        } else {
            if (!Array.isArray(detail) || detail.length === 0) {
                toast.error('Detail alergi wajib dipilih');
                return false;
            }
        }

        // GCS selections
        if (!String(formData.eye || '').trim()) {
            toast.error('GCS Eye wajib dipilih');
            return false;
        }
        if (!String(formData.verbal || '').trim()) {
            toast.error('GCS Verbal wajib dipilih');
            return false;
        }
        if (!String(formData.motorik || '').trim()) {
            toast.error('GCS Motorik wajib dipilih');
            return false;
        }

        // Anamnesa, Assessment, Plan
        if (!String(formData.anamnesa || '').trim()) {
            toast.error('Anamnesa wajib diisi');
            setActiveTab('subyektif');
            return false;
        }
        if (!String(formData.assesmen || '').trim()) {
            toast.error('Assessment wajib diisi');
            setActiveTab('assessment');
            return false;
        }
        if (!String(formData.plan || '').trim()) {
            toast.error('Plan wajib diisi');
            setActiveTab('plan');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateRequiredFields()) {
            return;
        }

        // Prepare ICD arrays for backend
        const icd10_code = icd10List.map((item) => item.kode_icd10);
        const icd10_name = icd10List.map((item) => item.nama_icd10);
        const icd10_priority = icd10List.map((item) => item.priority_icd10);

        const icd9_code = icd9List.map((item) => item.kode_icd9);
        const icd9_name = icd9List.map((item) => item.nama_icd9);

        // Prepare diet arrays
        const diet_jenis = dietList.map((item) => item.jenis_diet);
        const diet_anjuran = dietList.map((item) => item.jenis_diet_makanan);
        const diet_pantangan = dietList.map((item) => item.jenis_diet_makanan_tidak);

        // Prepare tindakan arrays (send full list)
        const tindakan_kode = tindakanList.length ? tindakanList.map((t) => t.kode) : tindakanData.kode_tindakan ? [tindakanData.kode_tindakan] : [];
        const tindakan_nama = tindakanList.length
            ? tindakanList.map((t) => t.nama)
            : tindakanData.jenis_tindakan
                ? [tindakanData.jenis_tindakan]
                : [];
        const tindakan_pelaksana = tindakanList.length
            ? tindakanList.map((t) => t.pelaksana)
            : tindakanData.jenis_pelaksana
                ? [tindakanData.jenis_pelaksana]
                : [];
        const tindakan_harga = tindakanList.length ? tindakanList.map((t) => t.harga) : tindakanData.harga ? [Number(tindakanData.harga)] : [];

        // Compose tableData to include current keluhanList (HTT tidak disimpan di tableData lagi)
        const composedTableData = (() => {
            let existing: any = {};
            const td = (formData as any).tableData;
            if (td) {
                if (typeof td === 'string') {
                    try {
                        const parsed = JSON.parse(td);
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) existing = parsed;
                    } catch { }
                } else if (typeof td === 'object' && !Array.isArray(td)) {
                    existing = td;
                }
            }
            return { ...existing, keluhanList };
        })();

        const payload = {
            nomor_rm: pelayanan.nomor_rm,
            nama: pelayanan.pasien?.nama || pelayanan.nama || '',
            no_rawat: pelayanan.nomor_register,
            sex: convertGenderToCode(pelayanan.pasien?.kelamin?.nama || pelayanan.jenis_kelamin || ''),
            penjamin: pelayanan.pendaftaran?.penjamin?.nama || pelayanan.penjamin || '',
            tanggal_lahir: pelayanan.pasien?.tanggal_lahir || pelayanan.tanggal_lahir || '',
            umur: pelayanan.pasien?.umur || pelayanan.umur || '',
            tableData: JSON.stringify(composedTableData),
            anamnesa: formData.anamnesa || '',
            sistol: formData.sistol ? String(formData.sistol) : '',
            distol: formData.distol ? String(formData.distol) : '',
            tensi: formData.tensi || '',
            suhu: formData.suhu ? String(formData.suhu) : '',
            nadi: formData.nadi ? String(formData.nadi) : '',
            rr: formData.rr ? String(formData.rr) : '',
            tinggi: formData.tinggi ? String(formData.tinggi) : '',
            berat: formData.berat ? String(formData.berat) : '',
            spo2: formData.spo2 ? String(formData.spo2) : '',
            jenis_alergi: Array.isArray(formData.jenis_alergi) ? formData.jenis_alergi.join(',') : String(formData.jenis_alergi || ''),
            alergi: Array.isArray(formData.alergi) ? formData.alergi.join(',') : String(formData.alergi || ''),
            lingkar_perut: formData.lingkar_perut ? String(formData.lingkar_perut) : '',
            nilai_bmi: formData.nilai_bmi ? String(formData.nilai_bmi) : '',
            status_bmi: formData.status_bmi || '',
            eye: formData.eye ? String(formData.eye) : '',
            verbal: formData.verbal ? String(formData.verbal) : '',
            motorik: formData.motorik ? String(formData.motorik) : '',
            htt: JSON.stringify(httItems || []),
            assesmen: formData.assesmen || '',
            plan: formData.plan || '',
            icd10_code,
            icd10_name,
            icd10_priority,
            icd9_code,
            icd9_name,
            diet_jenis,
            diet_anjuran,
            diet_pantangan,
            tindakan_kode,
            tindakan_nama,
            tindakan_pelaksana,
            tindakan_harga,
            resep_data: JSON.stringify(obatList),
        };

        try {
            if (isEditMode && norawat) {
                router.put(`/pelayanan/soap-dokter/${norawat}`, payload, {
                    onSuccess: () => {
                        toast.success('Pemeriksaan berhasil diperbarui');
                    },
                    onError: (errors) => {
                        toast.error('Gagal memperbarui pemeriksaan');
                    },
                });
            } else {
                router.post('/pelayanan/soap-dokter', payload, {
                    onSuccess: () => {
                        toast.success('Pemeriksaan berhasil disimpan');
                    },
                    onError: (errors) => {
                        toast.error('Gagal menyimpan pemeriksaan');
                    },
                });
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan pemeriksaan');
        }
    };

    const handleBack = () => {
        router.visit('/pelayanan/so-dokter');
    };

    // State to track selected tooth and its condition
    const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
    const [toothCondition, setToothCondition] = useState<string>('');
    const [showToothModal, setShowToothModal] = useState<boolean>(false);

    // Function to handle tooth clicks in odontogram
    const handleToothClick = (toothNumber: string) => {
        setSelectedTooth(toothNumber);
        setShowToothModal(true);

        // Check if the tooth has any existing conditions
        if (formData.Decayed?.includes(toothNumber)) {
            setToothCondition('Decayed');
        } else if (formData.Missing?.includes(toothNumber)) {
            setToothCondition('Missing');
        } else if (formData.Filled?.includes(toothNumber)) {
            setToothCondition('Filled');
        } else {
            setToothCondition('');
        }
    };

    // Function to save tooth condition
    const saveToothCondition = () => {
        if (!selectedTooth) return;

        // Create new arrays for each condition, removing the tooth if it exists
        const decayed = formData.Decayed?.split(',').filter(Boolean) || [];
        const missing = formData.Missing?.split(',').filter(Boolean) || [];
        const filled = formData.Filled?.split(',').filter(Boolean) || [];

        // Remove the tooth from all conditions
        const newDecayed = decayed.filter((t) => t !== selectedTooth);
        const newMissing = missing.filter((t) => t !== selectedTooth);
        const newFilled = filled.filter((t) => t !== selectedTooth);

        // Add to the selected condition if a condition is selected
        if (toothCondition === 'Decayed') {
            newDecayed.push(selectedTooth);
        } else if (toothCondition === 'Missing') {
            newMissing.push(selectedTooth);
        } else if (toothCondition === 'Filled') {
            newFilled.push(selectedTooth);
        }

        // Update the form data
        setFormData({
            ...formData,
            Decayed: newDecayed.join(','),
            Missing: newMissing.join(','),
            Filled: newFilled.join(','),
        });

        setShowToothModal(false);
        toast.success(`Tooth ${selectedTooth} marked as ${toothCondition || 'normal'}`);
    };

    // Function to get the appropriate tooth image based on its condition
    const getToothImage = (toothNumber: string) => {
        if (formData.Decayed?.includes(toothNumber)) return '/img/odo/CAR.png';
        if (formData.Missing?.includes(toothNumber)) return '/img/odo/MIS.png';
        if (formData.Filled?.includes(toothNumber)) return '/img/odo/CRT.png';

        // Default images based on tooth type
        const middleLineNumbers = [
            '11',
            '12',
            '13',
            '51',
            '52',
            '53',
            '81',
            '82',
            '83',
            '41',
            '42',
            '43',
            '21',
            '22',
            '23',
            '61',
            '62',
            '63',
            '71',
            '72',
            '73',
            '31',
            '32',
            '33',
        ];
        return middleLineNumbers.includes(toothNumber) ? '/img/odo/seri.png' : '/img/odo/geraham.png';
    };

    // Determine if this is edit mode
    const isEditMode = soap_dokter && Object.keys(soap_dokter).length > 0;
    const pageTitle = isEditMode ? 'Edit SOAP Dokter' : 'Pemeriksaan SOAP Dokter';
    const submitButtonText = isEditMode ? 'Update Pemeriksaan' : 'Simpan Pemeriksaan';

    useEffect(() => {
        if (!isEditMode || !soap_dokter) return;

        // 1) Keluhan & HTT dari tableData
        try {
            const td =
                typeof (soap_dokter as any).tableData === 'string'
                    ? JSON.parse((soap_dokter as any).tableData)
                    : (soap_dokter as any).tableData || {};
            if (td && typeof td === 'object') {
                if (Array.isArray(td.keluhanList)) setKeluhanList(td.keluhanList);
                if (Array.isArray(td.httItems)) setHttpItems(td.httItems);
            }
        } catch { }

        // 2) Resep (array of item)
        try {
            const resep = (soap_dokter as any).resep_data || (soap_dokter as any).resep_obat;
            if (resep) {
                const parsed = typeof resep === 'string' ? JSON.parse(resep) : resep;
                if (Array.isArray(parsed)) setObatList(parsed);
            }
        } catch { }

        // 3) ICD10
        const icd10Codes: string[] = (soap_dokter as any).icd10_code || [];
        const icd10Names: string[] = (soap_dokter as any).icd10_name || [];
        const icd10Prio: string[] = (soap_dokter as any).icd10_priority || [];
        if (icd10Codes.length) {
            const list = icd10Codes.map((kode: string, i: number) => ({
                kode_icd10: kode,
                nama_icd10: icd10Names[i] || '',
                priority_icd10: icd10Prio[i] || '',
            }));
            setIcd10List(list);
        }

        // 4) ICD9
        const icd9Codes: string[] = (soap_dokter as any).icd9_code || [];
        const icd9Names: string[] = (soap_dokter as any).icd9_name || [];
        if (icd9Codes.length) {
            const list = icd9Codes.map((kode: string, i: number) => ({
                kode_icd9: kode,
                nama_icd9: icd9Names[i] || '',
            }));
            setIcd9List(list);
        }

        // 5) Diet (kalau backend kirim array selain existing_diet_data)
        const diets: any[] = (soap_dokter as any).diet_list || [];
        if (Array.isArray(diets) && diets.length) {
            setDietList(
                diets.map((d) => ({
                    jenis_diet: d.jenis_diet || '',
                    jenis_diet_makanan: d.jenis_diet_makanan || '',
                    jenis_diet_makanan_tidak: d.jenis_diet_makanan_tidak || '',
                })),
            );
        }

        // 6) Tindakan (kalau disimpan banyak item)
        const tk: string[] = (soap_dokter as any).tindakan_kode || [];
        const tn: string[] = (soap_dokter as any).tindakan_nama || [];
        const tp: string[] = (soap_dokter as any).tindakan_pelaksana || [];
        const th: (number | string)[] = (soap_dokter as any).tindakan_harga || [];
        if (tk.length) {
            // TODO: jika ingin render tabel tindakan, simpan ke state tindakanList dan tampilkan
            // setTindakanList(tk.map((kode, i) => ({ kode, nama: tn[i]||'', kategori: '', pelaksana: tp[i]||'', harga: Number(th[i]||0) })));
            setTindakanData((prev) => ({
                ...prev,
                kode_tindakan: tk[0] || '',
                jenis_tindakan: tn[0] || '',
                jenis_pelaksana: tp[0] || '',
                harga: String(th[0] ?? ''),
            }));
        }
    }, [isEditMode, soap_dokter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SOAP Dokter - Pemeriksaan" />

            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Patient Information */}
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
                                    <Input
                                        value={pelayanan?.pasien?.kelamin?.nama || convertCodeToGender(pelayanan?.jenis_kelamin || '') || ''}
                                        readOnly
                                    />
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
                                    <Input value={formatUmurDisplay(pelayanan?.tanggal_lahir, pelayanan?.umur || '')} readOnly />
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
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="p-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="subyektif">Subyektif</TabsTrigger>
                                    <TabsTrigger value="objektif">Objektif</TabsTrigger>
                                    <TabsTrigger value="assesmen">Assesmen</TabsTrigger>
                                    <TabsTrigger value="plan">Plan</TabsTrigger>
                                    <TabsTrigger value="cppt">Histori Pasien</TabsTrigger>
                                </TabsList>

                                {/* Subyektif Tab */}
                                <TabsContent value="subyektif" className="mt-4">
                                    <div className="space-y-6">
                                        {/* Daftar Keluhan */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Daftar Keluhan <span className="text-red-500">*</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {keluhanList.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Keluhan</TableHead>
                                                                <TableHead>Durasi</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {keluhanList.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.keluhan}</TableCell>
                                                                    <TableCell>{item.durasi}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="py-4 text-center text-gray-500">Belum ada keluhan yang ditambahkan</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                        {/* Anamnesa */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Anamnesa <span className="text-red-500">*</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <RichTextEditor
                                                    id="anamnesa"
                                                    value={formData.anamnesa}
                                                    onChange={(value) => handleInputChange({ target: { name: 'anamnesa', value } } as any)}
                                                    placeholder="Masukkan anamnesa pasien..."
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button type="button" onClick={() => setActiveTab('objektif')}>
                                            Next
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Objektif Tab */}
                                <TabsContent value="objektif" className="mt-4">
                                    <div className="mb-3 flex items-center justify-end gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => toggleAll(!allOpen)}>
                                            {allOpen ? 'Tutup Semua' : 'Buka Semua'}
                                        </Button>
                                    </div>
                                    <div className="space-y-6">
                                        {/* Tanda Vital Group */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">
                                                    Tanda Vital <span className="text-red-500">*</span>
                                                </CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenVitalGroup(!openVitalGroup)}>
                                                    {openVitalGroup ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openVitalGroup ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-6">
                                                    {/* Vital Signs */}
                                                    <div>
                                                        <h3 className="text-md mb-3 font-medium">Tanda Vital</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                            <div>
                                                                <Label htmlFor="tensi">Tekanan Darah (mmHg)</Label>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        ref={sistolRef as any}
                                                                        id="sistol"
                                                                        name="sistol"
                                                                        value={formData.sistol}
                                                                        onChange={handleInputChange}
                                                                        onBlur={() => handleTensiBlur('sistol')}
                                                                        onKeyDown={(e) => handleKeyDown(e as any, 'sistol', 'distol')}
                                                                        placeholder="120"
                                                                        className="w-20 text-center"
                                                                        required
                                                                    />
                                                                    <span>/</span>
                                                                    <Input
                                                                        ref={distolRef as any}
                                                                        id="distol"
                                                                        name="distol"
                                                                        value={formData.distol}
                                                                        onChange={handleInputChange}
                                                                        onBlur={() => handleTensiBlur('distol')}
                                                                        onKeyDown={(e) => handleKeyDown(e as any, 'distol', 'suhu')}
                                                                        placeholder="80"
                                                                        className="w-20 text-center"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="suhu">Suhu (°C)</Label>
                                                                <Input
                                                                    ref={suhuRef as any}
                                                                    id="suhu"
                                                                    name="suhu"
                                                                    value={formData.suhu}
                                                                    onChange={handleInputChange}
                                                                    onBlur={handleSuhuBlur}
                                                                    onKeyDown={(e) => handleKeyDown(e as any, 'suhu', 'nadi')}
                                                                    placeholder="36.5"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="nadi">Nadi (/menit)</Label>
                                                                <Input
                                                                    ref={nadiRef as any}
                                                                    id="nadi"
                                                                    name="nadi"
                                                                    value={formData.nadi}
                                                                    onChange={handleInputChange}
                                                                    onBlur={handleNadiBlur}
                                                                    onKeyDown={(e) => handleKeyDown(e as any, 'nadi', 'rr')}
                                                                    placeholder="80"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="rr">RR (/menit)</Label>
                                                                <Input
                                                                    ref={rrRef as any}
                                                                    id="rr"
                                                                    name="rr"
                                                                    value={formData.rr}
                                                                    onChange={handleInputChange}
                                                                    onBlur={handleRrBlur}
                                                                    onKeyDown={(e) => handleKeyDown(e as any, 'rr', 'spo2')}
                                                                    placeholder="20"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                            <div>
                                                                <Label htmlFor="spo2">SpO2 (%)</Label>
                                                                <Input
                                                                    ref={spo2Ref as any}
                                                                    id="spo2"
                                                                    name="spo2"
                                                                    value={formData.spo2}
                                                                    onChange={handleInputChange}
                                                                    onBlur={handleSpo2Blur}
                                                                    onKeyDown={(e) => handleKeyDown(e as any, 'spo2', 'lingkarPerut')}
                                                                    placeholder="98"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="lingkar_perut">Lingkar Perut (cm)</Label>
                                                                <Input
                                                                    ref={lingkarPerutRef as any}
                                                                    id="lingkar_perut"
                                                                    name="lingkar_perut"
                                                                    value={formData.lingkar_perut}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Antropometri */}
                                                    <div>
                                                        <h3 className="text-md mb-3 font-medium">Antropometri</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                            <div>
                                                                <Label htmlFor="tinggi">Tinggi Badan (cm)</Label>
                                                                <Input
                                                                    ref={tinggiRef as any}
                                                                    id="tinggi"
                                                                    name="tinggi"
                                                                    value={formData.tinggi}
                                                                    onChange={handleInputChange}
                                                                    onBlur={handleBmiBlur}
                                                                    onKeyDown={(e) => handleKeyDown(e as any, 'tinggi', 'berat')}
                                                                    placeholder="170"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="berat">Berat Badan (kg)</Label>
                                                                <Input
                                                                    ref={beratRef as any}
                                                                    id="berat"
                                                                    name="berat"
                                                                    value={formData.berat}
                                                                    onChange={handleInputChange}
                                                                    onBlur={handleBmiBlur}
                                                                    onKeyDown={(e) => handleKeyDown(e as any, 'berat', 'jenisAlergi')}
                                                                    placeholder="70"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="nilai_bmi">Nilai BMI</Label>
                                                                <Input id="nilai_bmi" name="nilai_bmi" value={formData.nilai_bmi} readOnly />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="status_bmi">Status BMI</Label>
                                                                <Input id="status_bmi" name="status_bmi" value={formData.status_bmi} readOnly />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Alergi */}
                                                    <div>
                                                        <h3 className="text-md mb-3 font-medium">Alergi</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            {/* Jenis Alergi */}
                                                            <div>
                                                                <Label htmlFor="jenis_alergi">Jenis Alergi</Label>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant="outline" className="w-full justify-between">
                                                                            {formData.jenis_alergi.length > 0
                                                                                ? formData.jenis_alergi.join(', ')
                                                                                : 'Pilih jenis alergi'}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[300px] p-0">
                                                                        <Command>
                                                                            <CommandList>
                                                                                <CommandEmpty>Tidak ada data</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    <CommandItem
                                                                                        value="00"
                                                                                        onSelect={() => {
                                                                                            const selected = formData.jenis_alergi.includes('00')
                                                                                                ? formData.jenis_alergi.filter((v) => v !== '00')
                                                                                                : [...formData.jenis_alergi, '00'];
                                                                                            handleSelectChange('jenis_alergi', selected);

                                                                                            // Jika "00" dipilih, set alergi = ["00"]
                                                                                            if (selected.includes('00')) {
                                                                                                handleSelectChange('alergi', ['00']);
                                                                                            } else {
                                                                                                handleSelectChange('alergi', []);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                'mr-2 h-4 w-4',
                                                                                                formData.jenis_alergi.includes('00')
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0',
                                                                                            )}
                                                                                        />
                                                                                        Tidak ada
                                                                                    </CommandItem>
                                                                                    {jenisAlergiOptions.map((opt: string) => (
                                                                                        <CommandItem
                                                                                            key={opt}
                                                                                            value={opt}
                                                                                            onSelect={() => {
                                                                                                const selected = formData.jenis_alergi.includes(opt)
                                                                                                    ? formData.jenis_alergi.filter((v) => v !== opt)
                                                                                                    : [...formData.jenis_alergi, opt];
                                                                                                handleSelectChange('jenis_alergi', selected);
                                                                                            }}
                                                                                        >
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    'mr-2 h-4 w-4',
                                                                                                    formData.jenis_alergi.includes(opt)
                                                                                                        ? 'opacity-100'
                                                                                                        : 'opacity-0',
                                                                                                )}
                                                                                            />
                                                                                            {opt}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>

                                                            {/* Detail Alergi */}
                                                            <div>
                                                                <Label htmlFor="alergi">Detail Alergi</Label>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            disabled={formData.jenis_alergi.length === 0}
                                                                            className="w-full justify-between"
                                                                        >
                                                                            {formData.alergi.length > 0
                                                                                ? formData.alergi.join(', ')
                                                                                : formData.jenis_alergi.length === 0
                                                                                    ? 'Pilih jenis terlebih dahulu'
                                                                                    : 'Pilih detail alergi'}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[300px] p-0">
                                                                        <Command>
                                                                            <CommandList>
                                                                                <CommandEmpty>Tidak ada data</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    <CommandItem
                                                                                        value="00"
                                                                                        onSelect={() => {
                                                                                            const selected = formData.alergi.includes('00')
                                                                                                ? formData.alergi.filter((v) => v !== '00')
                                                                                                : [...formData.alergi, '00'];
                                                                                            handleSelectChange('alergi', selected);
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                'mr-2 h-4 w-4',
                                                                                                formData.alergi.includes('00')
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0',
                                                                                            )}
                                                                                        />
                                                                                        Tidak ada
                                                                                    </CommandItem>
                                                                                    {detailAlergiOptions.map((item: AlergiData) => (
                                                                                        <CommandItem
                                                                                            key={item.id}
                                                                                            value={(item.nama || '').trim()}
                                                                                            onSelect={() => {
                                                                                                const value = (item.nama || '').trim();
                                                                                                const selected = formData.alergi.includes(value)
                                                                                                    ? formData.alergi.filter((v) => v !== value)
                                                                                                    : [...formData.alergi, value];
                                                                                                handleSelectChange('alergi', selected);
                                                                                            }}
                                                                                        >
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    'mr-2 h-4 w-4',
                                                                                                    formData.alergi.includes((item.nama || '').trim())
                                                                                                        ? 'opacity-100'
                                                                                                        : 'opacity-0',
                                                                                                )}
                                                                                            />
                                                                                            {(item.nama || '').trim()}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* GCS */}
                                                    <div>
                                                        <h3 className="text-md mb-3 font-medium">Glasgow Coma Scale (GCS)</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                            <div>
                                                                <Label htmlFor="eye">Eye Response</Label>
                                                                <Select
                                                                    value={String(formData.eye)}
                                                                    onValueChange={(value) => handleSelectChange('eye', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Eye Response" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {gcs_eye.map((item) => (
                                                                            <SelectItem key={item.id} value={item.skor}>
                                                                                {item.skor} - {item.nama}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="verbal">Verbal Response</Label>
                                                                <Select
                                                                    value={String(formData.verbal)}
                                                                    onValueChange={(value) => handleSelectChange('verbal', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Verbal Response" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {gcs_verbal.map((item) => (
                                                                            <SelectItem key={item.id} value={item.skor}>
                                                                                {item.skor} - {item.nama}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="motorik">Motor Response</Label>
                                                                <Select
                                                                    value={String(formData.motorik)}
                                                                    onValueChange={(value) => handleSelectChange('motorik', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Motor Response" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {gcs_motorik.map((item) => (
                                                                            <SelectItem key={item.id} value={item.skor}>
                                                                                {item.skor} - {item.nama}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="kesadaran">Kesadaran</Label>
                                                                <Input
                                                                    id="kesadaran"
                                                                    name="kesadaran"
                                                                    value={formData.kesadaran}
                                                                    readOnly
                                                                    className="border-input bg-background"
                                                                    placeholder="Otomatis terisi"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* HTT (Head To Toe) Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">
                                                    Head To Toe (HTT) <span className="text-red-500">*</span>
                                                </CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenHtt(!openHtt)}>
                                                    {openHtt ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openHtt ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-6">
                                                    {/* HTT Input Controls: 2 selects, 1 text, Add button */}
                                                    <div className="grid grid-cols-12 items-end gap-4">
                                                        <div className="col-span-12 sm:col-span-3">
                                                            <Label className="text-sm">Pemeriksaan</Label>
                                                            <Select value={selectedHtt} onValueChange={handleHttChange}>
                                                                <SelectTrigger className="mt-1 text-sm">
                                                                    <SelectValue placeholder="-- Pilih Pemeriksaan --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {httOptions.map((opt) => (
                                                                        <SelectItem key={opt.id} value={String(opt.id)}>
                                                                            {opt.nama_pemeriksaan}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="col-span-12 sm:col-span-3">
                                                            <Label className="text-sm">Sub Pemeriksaan</Label>
                                                            <Select
                                                                value={selectedSubHtt}
                                                                onValueChange={(v) => setSelectedSubHtt(v)}
                                                                disabled={!selectedHtt || subOptions.length === 0}
                                                            >
                                                                <SelectTrigger className="mt-1 text-sm">
                                                                    <SelectValue
                                                                        placeholder={
                                                                            subOptions.length === 0
                                                                                ? 'Tidak ada Sub Pemeriksaan'
                                                                                : '-- Pilih Sub Pemeriksaan --'
                                                                        }
                                                                    />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {subOptions.map((sub) => (
                                                                        <SelectItem key={sub.id} value={String(sub.id)}>
                                                                            {sub.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="col-span-12 sm:col-span-4">
                                                            <Label className="text-sm">Detail</Label>
                                                            <Input
                                                                className="mt-1"
                                                                placeholder="Tulis detail pemeriksaan..."
                                                                value={httDetailText}
                                                                onChange={(e) => setHttDetailText(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="col-span-12 sm:col-span-2">
                                                            <Button type="button" className="w-full" onClick={handleAddHtt}>
                                                                Tambah
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {/* HTT Items Table */}
                                                    {httItems.length > 0 && (
                                                        <div>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Pemeriksaan</TableHead>
                                                                        <TableHead>Sub Pemeriksaan</TableHead>
                                                                        <TableHead>Detail</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {httItems.map((item, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{item.pemeriksaan}</TableCell>
                                                                            <TableCell>{item.subPemeriksaan}</TableCell>
                                                                            <TableCell>{item.detail}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* Diet Section moved above */}

                                        {/* Odontogram Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Odontogram</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenOdontogram(!openOdontogram)}>
                                                    {openOdontogram ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openOdontogram ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent>
                                                    <style>
                                                        {`
                                                            .svg-container {
                                                                display: flex;
                                                                justify-content: center;
                                                                align-items: center;
                                                                width: 100%;
                                                            }
                                                            .clickable-box {
                                                                cursor: pointer;
                                                            }
                                                        `}
                                                    </style>
                                                    <div className="svg-container container">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="100%"
                                                            viewBox="0 0 980 300"
                                                            preserveAspectRatio="xMidYMin meet"
                                                        >
                                                            {/* Define tooth numbers */}
                                                            {(() => {
                                                                const leftNumbers = [
                                                                    18, 17, 16, 15, 14, 13, 12, 11, 55, 54, 53, 52, 51, 85, 84, 83, 82, 81, 48, 47,
                                                                    46, 45, 44, 43, 42, 41,
                                                                ];
                                                                const rightNumbers = [
                                                                    21, 22, 23, 24, 25, 26, 27, 28, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 31, 32,
                                                                    33, 34, 35, 36, 37, 38,
                                                                ];

                                                                const getToothPosition = (number: number, isLeft: boolean) => {
                                                                    const numbers = isLeft ? leftNumbers : rightNumbers;
                                                                    const index = numbers.indexOf(number);

                                                                    if (index === -1) return { x: 0, y: 0 };

                                                                    const row = index < 8 ? 0 : index < 13 ? 1 : index < 18 ? 2 : 3;
                                                                    const col =
                                                                        index < 8
                                                                            ? index
                                                                            : index < 13
                                                                                ? index - 8 + 1.5
                                                                                : index < 18
                                                                                    ? index - 13 + 1.5
                                                                                    : index - 18;
                                                                    const x = col * 60 + (isLeft ? 0 : 500);
                                                                    const y = row * 60;

                                                                    return { x, y };
                                                                };

                                                                const isDiagonal = (number: number) => {
                                                                    const diagonalNumbers = [
                                                                        14, 15, 16, 17, 18, 44, 45, 46, 47, 48, 54, 55, 84, 85, 24, 25, 26, 27, 28,
                                                                        34, 35, 36, 37, 38, 64, 65, 74, 75,
                                                                    ];
                                                                    return diagonalNumbers.includes(number);
                                                                };

                                                                const isMiddleLine = (number: number) => {
                                                                    const middleLineNumbers = [
                                                                        11, 12, 13, 51, 52, 53, 81, 82, 83, 41, 42, 43, 21, 22, 23, 61, 62, 63, 71,
                                                                        72, 73, 31, 32, 33,
                                                                    ];
                                                                    return middleLineNumbers.includes(number);
                                                                };

                                                                const getImagePath = (number: number) => {
                                                                    return getToothImage(number.toString());
                                                                };

                                                                return (
                                                                    <>
                                                                        {/* Left teeth */}
                                                                        {leftNumbers.map((number) => {
                                                                            const { x, y } = getToothPosition(number, true);
                                                                            const imagePath = getImagePath(number);

                                                                            return (
                                                                                <g
                                                                                    key={number}
                                                                                    className="clickable-box"
                                                                                    onClick={() => handleToothClick(number.toString())}
                                                                                >
                                                                                    <image
                                                                                        x={x + 10}
                                                                                        y={y + 10}
                                                                                        width="40"
                                                                                        height="40"
                                                                                        href={imagePath}
                                                                                        pointerEvents="all"
                                                                                    />
                                                                                    <text
                                                                                        x={x + 30}
                                                                                        y={y + 65}
                                                                                        fontSize="12"
                                                                                        textAnchor="middle"
                                                                                        pointerEvents="none"
                                                                                    >
                                                                                        {number}
                                                                                    </text>
                                                                                </g>
                                                                            );
                                                                        })}

                                                                        {/* Divider */}
                                                                        <rect x="490" y="0" width="5" height="255" fill="red" />

                                                                        {/* Right teeth */}
                                                                        {rightNumbers.map((number) => {
                                                                            const { x, y } = getToothPosition(number, false);
                                                                            const imagePath = getImagePath(number);

                                                                            return (
                                                                                <g
                                                                                    key={number}
                                                                                    className="clickable-box"
                                                                                    onClick={() => handleToothClick(number.toString())}
                                                                                >
                                                                                    <image
                                                                                        x={x + 10}
                                                                                        y={y + 10}
                                                                                        width="40"
                                                                                        height="40"
                                                                                        href={imagePath}
                                                                                        pointerEvents="all"
                                                                                    />
                                                                                    <text
                                                                                        x={x + 30}
                                                                                        y={y + 65}
                                                                                        fontSize="12"
                                                                                        textAnchor="middle"
                                                                                        pointerEvents="none"
                                                                                    >
                                                                                        {number}
                                                                                    </text>
                                                                                </g>
                                                                            );
                                                                        })}
                                                                    </>
                                                                );
                                                            })()}
                                                        </svg>
                                                    </div>

                                                    <div className="card collapsed-card mt-4">
                                                        <div className="card-header bg-info">
                                                            <p className="card-title text-white">Pemeriksaan Gigi</p>
                                                        </div>

                                                        <div className="card-body">
                                                            <div className="row">
                                                                {/* Bagian kiri: DMF */}
                                                                <div className="col-md-4">
                                                                    <h5 className="font-weight-bold mb-3 text-primary">Status Gigi (DMF)</h5>

                                                                    <div className="form-group">
                                                                        <Label htmlFor="Decayed">Decayed</Label>
                                                                        <Input
                                                                            type="text"
                                                                            id="Decayed"
                                                                            name="Decayed"
                                                                            value={formData.Decayed}
                                                                            onChange={handleInputChange}
                                                                        />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <Label htmlFor="Missing">Missing</Label>
                                                                        <Input
                                                                            type="text"
                                                                            id="Missing"
                                                                            name="Missing"
                                                                            value={formData.Missing}
                                                                            onChange={handleInputChange}
                                                                        />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <Label htmlFor="Filled">Filled</Label>
                                                                        <Input
                                                                            type="text"
                                                                            id="Filled"
                                                                            name="Filled"
                                                                            value={formData.Filled}
                                                                            onChange={handleInputChange}
                                                                        />
                                                                    </div>

                                                                    <Button
                                                                        type="button"
                                                                        className="btn btn-info mt-3 w-100"
                                                                        onClick={() => toast.success('Data odontogram berhasil disimpan')}
                                                                    >
                                                                        Simpan
                                                                    </Button>
                                                                </div>

                                                                {/* Spacer */}
                                                                <div className="col-md-1"></div>

                                                                {/* Bagian kanan: Pemeriksaan Tambahan */}
                                                                <div className="col-md-7">
                                                                    <h5 className="font-weight-bold mb-3 text-primary">Pemeriksaan Tambahan</h5>

                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Oclusi" className="col-sm-4 col-form-label">
                                                                            Oclusi
                                                                        </Label>
                                                                        <div className="col-sm-8">
                                                                            <select
                                                                                className="form-control"
                                                                                id="Oclusi"
                                                                                name="Oclusi"
                                                                                value={formData.Oclusi}
                                                                                onChange={(e) => handleSelectChange('Oclusi', e.target.value)}
                                                                            >
                                                                                <option value="">Pilih</option>
                                                                                <option value="Normal Bite">Normal Bite</option>
                                                                                <option value="Cross Bite">Cross Bite</option>
                                                                                <option value="deep Bite">deep Bite</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Palatinus" className="col-sm-4 col-form-label">
                                                                            Torus Palatinus
                                                                        </Label>
                                                                        <div className="col-sm-8">
                                                                            <select
                                                                                className="form-control"
                                                                                id="Palatinus"
                                                                                name="Palatinus"
                                                                                value={formData.Palatinus}
                                                                                onChange={(e) => handleSelectChange('Palatinus', e.target.value)}
                                                                            >
                                                                                <option value="">Pilih</option>
                                                                                <option value="Tidak Ada">Tidak Ada</option>
                                                                                <option value="Kecil">Kecil</option>
                                                                                <option value="Sedang">Sedang</option>
                                                                                <option value="Besar">Besar</option>
                                                                                <option value="Multiple">Multiple</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Mandibularis" className="col-sm-4 col-form-label">
                                                                            Torus Mandibularis
                                                                        </Label>
                                                                        <div className="col-sm-8">
                                                                            <select
                                                                                className="form-control"
                                                                                id="Mandibularis"
                                                                                name="Mandibularis"
                                                                                value={formData.Mandibularis}
                                                                                onChange={(e) => handleSelectChange('Mandibularis', e.target.value)}
                                                                            >
                                                                                <option value="">Pilih</option>
                                                                                <option value="Sisi Kiri">Sisi Kiri</option>
                                                                                <option value="Sisi Kanan">Sisi Kanan</option>
                                                                                <option value="Kedua Sisi">Kedua Sisi</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Platum" className="col-sm-4 col-form-label">
                                                                            Platum
                                                                        </Label>
                                                                        <div className="col-sm-8">
                                                                            <select
                                                                                className="form-control"
                                                                                id="Platum"
                                                                                name="Platum"
                                                                                value={formData.Platum}
                                                                                onChange={(e) => handleSelectChange('Platum', e.target.value)}
                                                                            >
                                                                                <option value="">Pilih</option>
                                                                                <option value="Dalam">Dalam</option>
                                                                                <option value="Sedang">Sedang</option>
                                                                                <option value="Rendah">Rendah</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Diastema" className="col-sm-4 col-form-label">
                                                                            Diastema
                                                                        </Label>
                                                                        <div className="col-sm-8">
                                                                            <select
                                                                                className="form-control"
                                                                                id="Diastema"
                                                                                name="Diastema"
                                                                                value={formData.Diastema}
                                                                                onChange={(e) => handleSelectChange('Diastema', e.target.value)}
                                                                            >
                                                                                <option value="">Pilih</option>
                                                                                <option value="Ada">Ada</option>
                                                                                <option value="Tidak Ada">Tidak Ada</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Anomali" className="col-sm-4 col-form-label">
                                                                            Gigi Anomali
                                                                        </Label>
                                                                        <div className="col-sm-8">
                                                                            <select
                                                                                className="form-control"
                                                                                id="Anomali"
                                                                                name="Anomali"
                                                                                value={formData.Anomali}
                                                                                onChange={(e) => handleSelectChange('Anomali', e.target.value)}
                                                                            >
                                                                                <option value="">Pilih</option>
                                                                                <option value="Ada">Ada</option>
                                                                                <option value="Tidak Ada">Tidak Ada</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('subyektif')}>
                                            Previous
                                        </Button>
                                        <Button type="button" onClick={() => setActiveTab('assesmen')}>
                                            Next
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Assesmen Tab */}
                                <TabsContent value="assesmen" className="mt-4">
                                    <div className="space-y-6">
                                        {/* Assessment Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">
                                                    Assessment <span className="text-red-500">*</span>
                                                </CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenAssessment(!openAssessment)}>
                                                    {openAssessment ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            {openAssessment && (
                                                <div className={`transition-all duration-300 ease-in-out`}>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="assesmen">Diagnosis / Assessment</Label>
                                                            <div className="mt-1">
                                                                <RichTextEditor
                                                                    id="assesmen"
                                                                    value={formData.assesmen}
                                                                    onChange={(value) =>
                                                                        handleInputChange({ target: { name: 'assesmen', value } } as any)
                                                                    }
                                                                    placeholder="Masukkan diagnosis atau assessment pasien..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </div>
                                            )}
                                        </Card>

                                        {/* ICD Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">ICD</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenIcd(!openIcd)}>
                                                    {openIcd ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            {openIcd && (
                                                <div className={`transition-all duration-300 ease-in-out`}>
                                                    <CardContent className="space-y-6">
                                                        {/* 2-Column Layout for ICD10 and ICD9 */}
                                                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                            {/* ICD 10 Column */}
                                                            <div className="space-y-4">
                                                                <h3 className="border-b pb-2 text-lg font-medium">Diagnosa (ICD 10)</h3>

                                                                {/* ICD 10 Input Form */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-end gap-4">
                                                                        <div className="flex-1">
                                                                            <Label htmlFor="icd10">KODE ICD 10</Label>
                                                                            <Select
                                                                                value={icdData.kode_icd10 || ''}
                                                                                onValueChange={(value) => {
                                                                                    const selectedIcd = icd10.find((icd) => icd.kode === value);
                                                                                    setIcdData((prev) => ({
                                                                                        ...prev,
                                                                                        kode_icd10: value,
                                                                                        nama_icd10: selectedIcd ? selectedIcd.nama : '',
                                                                                    }));
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="text-sm">
                                                                                    <SelectValue placeholder="-- Pilih --" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {(icd10 || []).slice(0, 10).map((item) => (
                                                                                        <SelectItem key={item.kode} value={item.kode}>
                                                                                            {item.kode} -{' '}
                                                                                            {item.nama.length > 25
                                                                                                ? item.nama.substring(0, 25) + '...'
                                                                                                : item.nama}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>

                                                                        <div className="flex-1">
                                                                            <Label htmlFor="priority_icd10">Prioritas</Label>
                                                                            <Select
                                                                                value={icdData.priority_icd10 || ''}
                                                                                onValueChange={(value) =>
                                                                                    setIcdData((prev) => ({ ...prev, priority_icd10: value }))
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="text-sm">
                                                                                    <SelectValue placeholder="-- Pilih --" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Primary">Primary</SelectItem>
                                                                                    <SelectItem value="Secondary">Secondary</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>

                                                                        <Button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (icdData.kode_icd10 && icdData.nama_icd10 && icdData.priority_icd10) {
                                                                                    // Prevent multiple Primary entries
                                                                                    const hasPrimary = icd10List.some(
                                                                                        (it) => (it.priority_icd10 || '').toLowerCase() === 'primary',
                                                                                    );
                                                                                    if (
                                                                                        (icdData.priority_icd10 || '').toLowerCase() === 'primary' &&
                                                                                        hasPrimary
                                                                                    ) {
                                                                                        toast.warning(
                                                                                            'Prioritas Primary untuk ICD10 sudah ada. Tidak boleh lebih dari satu.',
                                                                                        );
                                                                                        return;
                                                                                    }
                                                                                    setIcd10List((prev) => [...prev, { ...icdData }]);
                                                                                    setIcdData((prev) => ({
                                                                                        ...prev,
                                                                                        kode_icd10: '',
                                                                                        nama_icd10: '',
                                                                                        priority_icd10: '',
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            size="sm"
                                                                        >
                                                                            + Tambah
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* ICD 10 Table */}
                                                                <div>
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Kode</TableHead>
                                                                                <TableHead>Nama Penyakit</TableHead>
                                                                                <TableHead>Prioritas</TableHead>
                                                                                <TableHead>Aksi</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {icd10List.map((item, index) => (
                                                                                <TableRow key={index}>
                                                                                    <TableCell className="font-mono">{item.kode_icd10}</TableCell>
                                                                                    <TableCell className="text-sm">
                                                                                        {truncate(item.nama_icd10 || '', 30)}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <span
                                                                                            className={`rounded px-2 py-1 text-xs ${item.priority_icd10 === 'Primary'
                                                                                                ? 'bg-blue-100 text-blue-800'
                                                                                                : 'bg-gray-100 text-gray-800'
                                                                                                }`}
                                                                                        >
                                                                                            {item.priority_icd10}
                                                                                        </span>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="destructive"
                                                                                            size="sm"
                                                                                            onClick={() =>
                                                                                                setIcd10List((prev) => prev.filter((_, i) => i !== index))
                                                                                            }
                                                                                        >
                                                                                            Hapus
                                                                                        </Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>

                                                            {/* ICD 9 Column */}
                                                            <div className="space-y-4">
                                                                <h3 className="border-b pb-2 text-lg font-medium">Tindakan (ICD 9)</h3>

                                                                {/* ICD 9 Input Form */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-end gap-4">
                                                                        <div className="flex-1">
                                                                            <Label htmlFor="icd9">KODE ICD 9</Label>
                                                                            <Select
                                                                                value={icdData.kode_icd9 || ''}
                                                                                onValueChange={(value) => {
                                                                                    const selectedIcd = icd9.find((icd) => icd.kode === value);
                                                                                    setIcdData((prev) => ({
                                                                                        ...prev,
                                                                                        kode_icd9: value,
                                                                                        nama_icd9: selectedIcd ? selectedIcd.nama : '',
                                                                                    }));
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="text-sm">
                                                                                    <SelectValue placeholder="-- Pilih --" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {(icd9 || []).slice(0, 200).map((item) => (
                                                                                        <SelectItem key={item.kode} value={item.kode}>
                                                                                            {item.kode} - {item.nama}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>

                                                                        <Button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (icdData.kode_icd9 && icdData.nama_icd9) {
                                                                                    setIcd9List((prev) => [...prev, { ...icdData }]);
                                                                                    setIcdData((prev) => ({
                                                                                        ...prev,
                                                                                        kode_icd9: '',
                                                                                        nama_icd9: '',
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            size="sm"
                                                                        >
                                                                            + Tambah
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* ICD 9 Table */}
                                                                <div>
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Kode</TableHead>
                                                                                <TableHead>Nama Penyakit</TableHead>
                                                                                <TableHead>Aksi</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {icd9List.map((item, index) => (
                                                                                <TableRow key={index}>
                                                                                    <TableCell className="font-mono">{item.kode_icd9}</TableCell>
                                                                                    <TableCell className="text-sm">
                                                                                        {truncate(item.nama_icd9 || '', 30)}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="destructive"
                                                                                            size="sm"
                                                                                            onClick={() =>
                                                                                                setIcd9List((prev) => prev.filter((_, i) => i !== index))
                                                                                            }
                                                                                        >
                                                                                            Hapus
                                                                                        </Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </div>
                                            )}
                                        </Card>

                                        {/* Tindakan Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Tindakan</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenTindakan(!openTindakan)}>
                                                    {openTindakan ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openTindakan ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        <div>
                                                            <Label htmlFor="jenis_tindakan">Jenis Tindakan</Label>
                                                            <Select
                                                                value={tindakanData.kode_tindakan}
                                                                onValueChange={(value) => {
                                                                    const selectedTindakan = tindakan.find((t) => t.kode === value);
                                                                    setTindakanData((prev) => ({
                                                                        ...prev,
                                                                        kode_tindakan: selectedTindakan ? selectedTindakan.kode : '',
                                                                        jenis_tindakan: selectedTindakan ? selectedTindakan.nama : '',
                                                                        harga: selectedTindakan ? selectedTindakan.tarif_total : '',
                                                                        manualPricing: false,
                                                                    }));
                                                                }}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="-- Pilih Tindakan --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {tindakan && tindakan.length > 0 ? (
                                                                        tindakan.map((item) => (
                                                                            <SelectItem key={item.id} value={item.kode}>
                                                                                {item.kode} - {item.nama}
                                                                            </SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        <SelectItem value="no-data" disabled>
                                                                            Tidak ada data tindakan
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jenis_pelaksana">Pelaksana</Label>
                                                            <Select
                                                                value={tindakanData.jenis_pelaksana}
                                                                onValueChange={(value) => {
                                                                    const selected = tindakan.find((t) => t.kode === tindakanData.kode_tindakan);
                                                                    let autoHarga = '';
                                                                    if (selected) {
                                                                        if (value === 'Dokter') autoHarga = selected.tarif_dokter || '';
                                                                        else if (value === 'Perawat') autoHarga = selected.tarif_perawat || '';
                                                                        else if (value === 'Dokter, Perawat') autoHarga = selected.tarif_total || '';
                                                                        else autoHarga = '';
                                                                    }
                                                                    setTindakanData((prev) => ({
                                                                        ...prev,
                                                                        jenis_pelaksana: value,
                                                                        harga: prev.manualPricing ? prev.harga : autoHarga,
                                                                    }));
                                                                }}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="-- Pilih Pelaksana --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Dokter">Dokter</SelectItem>
                                                                    <SelectItem value="Perawat">Perawat</SelectItem>
                                                                    <SelectItem value="Dokter, Perawat">Dokter & Perawat</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="harga">Harga</Label>
                                                            <div className="mt-1 flex items-center gap-3">
                                                                <label className="flex items-center gap-2 text-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={tindakanData.manualPricing}
                                                                        onChange={(e) => {
                                                                            const manual = e.target.checked;
                                                                            if (!manual) {
                                                                                const selected = tindakan.find(
                                                                                    (t) => t.kode === tindakanData.kode_tindakan,
                                                                                );
                                                                                let autoHarga = '';
                                                                                if (selected) {
                                                                                    if (tindakanData.jenis_pelaksana === 'Dokter')
                                                                                        autoHarga = selected.tarif_dokter || '';
                                                                                    else if (tindakanData.jenis_pelaksana === 'Perawat')
                                                                                        autoHarga = selected.tarif_perawat || '';
                                                                                    else if (tindakanData.jenis_pelaksana === 'Dokter & Perawat')
                                                                                        autoHarga = selected.tarif_total || '';
                                                                                }
                                                                                setTindakanData((prev) => ({
                                                                                    ...prev,
                                                                                    manualPricing: false,
                                                                                    harga: autoHarga,
                                                                                }));
                                                                            } else {
                                                                                setTindakanData((prev) => ({ ...prev, manualPricing: true }));
                                                                            }
                                                                        }}
                                                                    />
                                                                    Manual
                                                                </label>
                                                                <Input
                                                                    id="harga"
                                                                    name="harga"
                                                                    value={tindakanData.harga}
                                                                    onChange={(e) => setTindakanData((prev) => ({ ...prev, harga: e.target.value }))}
                                                                    className="border-input bg-background"
                                                                    placeholder="Otomatis / manual"
                                                                    disabled={
                                                                        tindakanData.jenis_pelaksana === 'Tindakan (Tidak ada harga)' ||
                                                                        !tindakanData.manualPricing
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Keterangan dihapus sesuai permintaan */}

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    tindakanData.kode_tindakan &&
                                                                    tindakanData.jenis_tindakan &&
                                                                    tindakanData.jenis_pelaksana
                                                                ) {
                                                                    const hargaNumber = Number(tindakanData.harga || 0);
                                                                    setTindakanList((prev) => [
                                                                        ...prev,
                                                                        {
                                                                            kode: tindakanData.kode_tindakan,
                                                                            nama: tindakanData.jenis_tindakan,
                                                                            kategori:
                                                                                tindakan.find((t) => t.kode === tindakanData.kode_tindakan)
                                                                                    ?.kategori || '',
                                                                            pelaksana: tindakanData.jenis_pelaksana,
                                                                            harga: isNaN(hargaNumber) ? 0 : hargaNumber,
                                                                        },
                                                                    ]);
                                                                    setTindakanData({
                                                                        kode_tindakan: '',
                                                                        jenis_tindakan: '',
                                                                        jenis_pelaksana: '',
                                                                        harga: '',
                                                                        manualPricing: false,
                                                                    });
                                                                } else {
                                                                    toast.error('Lengkapi kode, jenis tindakan, dan pelaksana');
                                                                }
                                                            }}
                                                            size="sm"
                                                        >
                                                            + Tambah Tindakan
                                                        </Button>
                                                    </div>

                                                    {/* Daftar Tindakan (inside Tindakan card) */}
                                                    {tindakanList.length > 0 && (
                                                        <div className="mt-4">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Kode</TableHead>
                                                                        <TableHead>Jenis Tindakan</TableHead>
                                                                        <TableHead>Pelaksana</TableHead>
                                                                        <TableHead>Harga</TableHead>
                                                                        <TableHead className="text-right">Aksi</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {tindakanList.map((row, idx) => (
                                                                        <TableRow key={`${row.kode}-${idx}`}>
                                                                            <TableCell className="font-mono">{row.kode}</TableCell>
                                                                            <TableCell>{row.nama}</TableCell>
                                                                            <TableCell>{row.pelaksana}</TableCell>
                                                                            <TableCell>Rp {row.harga.toLocaleString('id-ID')}</TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        setTindakanList((prev) => prev.filter((_, i) => i !== idx))
                                                                                    }
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
                                                </CardContent>
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('objektif')}>
                                            Previous
                                        </Button>
                                        <Button type="button" onClick={() => setActiveTab('plan')}>
                                            Next
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Plan Tab */}
                                <TabsContent value="plan" className="mt-4">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">
                                                    Plan dan Edukasi <span className="text-red-500">*</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <Label htmlFor="plan">Plan dan Edukasi</Label>
                                                    <div className="mt-1">
                                                        <RichTextEditor
                                                            id="plan"
                                                            value={formData.plan}
                                                            onChange={(value) => handleInputChange({ target: { name: 'plan', value } } as any)}
                                                            placeholder="Masukkan rencana tindakan dan edukasi untuk pasien..."
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        {/* Diet Section (moved into Plan tab) */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Diet</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenDiet(!openDiet)}>
                                                    {openDiet ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openDiet ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        <div>
                                                            <Label htmlFor="jenis_diet">Jenis Diet</Label>
                                                            <Select
                                                                value={dietData.jenis_diet}
                                                                onValueChange={(value) => setDietData((prev) => ({ ...prev, jenis_diet: value }))}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Pilih Jenis Diet" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {jenis_diet.map((diet) => (
                                                                        <SelectItem key={diet.id} value={diet.nama}>
                                                                            {diet.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jenis_diet_makanan">Makanan Dianjurkan</Label>
                                                            <Select
                                                                value={dietData.jenis_diet_makanan}
                                                                onValueChange={(value) =>
                                                                    setDietData((prev) => ({ ...prev, jenis_diet_makanan: value }))
                                                                }
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Pilih Makanan Dianjurkan" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {makanan.map((food) => (
                                                                        <SelectItem key={food.id} value={food.nama}>
                                                                            {food.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jenis_diet_makanan_tidak">Makanan Tidak Boleh</Label>
                                                            <Select
                                                                value={dietData.jenis_diet_makanan_tidak}
                                                                onValueChange={(value) =>
                                                                    setDietData((prev) => ({ ...prev, jenis_diet_makanan_tidak: value }))
                                                                }
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Pilih Makanan Tidak Boleh" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {makanan.map((food) => (
                                                                        <SelectItem key={food.id} value={food.nama}>
                                                                            {food.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button type="button" onClick={handleAddDiet}>
                                                            Tambah Diet
                                                        </Button>
                                                    </div>

                                                    {/* Diet List */}
                                                    {dietList.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="mb-2 text-sm font-medium">Daftar Diet:</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Jenis Diet</TableHead>
                                                                        <TableHead>Makanan Dianjurkan</TableHead>
                                                                        <TableHead>Makanan Tidak Boleh</TableHead>
                                                                        <TableHead className="text-right">Aksi</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {dietList.map((item, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{item.jenis_diet}</TableCell>
                                                                            <TableCell>{item.jenis_diet_makanan}</TableCell>
                                                                            <TableCell>{item.jenis_diet_makanan_tidak}</TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveDiet(index)}
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
                                                </CardContent>
                                            </div>
                                        </Card>
                                        {/* Obat Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Resep Obat</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenObat(!openObat)}>
                                                    {openObat ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openObat ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-4">
                                                    {/* Medicine Selection Row */}
                                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        <div>
                                                            <Label htmlFor="nama_obat">Nama Obat</Label>
                                                            <Select
                                                                value={obatData.nama_obat}
                                                                onValueChange={(value) => setObatData((prev) => ({ ...prev, nama_obat: value }))}
                                                                disabled={loadingObat}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={loadingObat ? 'Memuat obat...' : '-- Pilih Obat --'} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {obatTersedia.length === 0 && !loadingObat && (
                                                                        <SelectItem value="no-obat" disabled>
                                                                            Tidak ada obat tersedia
                                                                        </SelectItem>
                                                                    )}
                                                                    {obatTersedia.map((obat, idx) => (
                                                                        <SelectItem
                                                                            key={`${obat.kode_obat_alkes}-${obat.nama_obat_alkes}-${idx}`}
                                                                            value={obat.nama_obat_alkes}
                                                                        >
                                                                            {obat.nama_obat_alkes} (Stok: {obat.total_stok})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="instruksi">Instruksi</Label>
                                                            <Select
                                                                value={obatData.instruksi}
                                                                onValueChange={(value) => setObatData((prev) => ({ ...prev, instruksi: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="-- Pilih Instruksi --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {instruksiObat.map((instruksi) => (
                                                                        <SelectItem key={instruksi.id} value={instruksi.nama}>
                                                                            {instruksi.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jumlah_diberikan">Jumlah Diberikan</Label>
                                                            <div className="flex items-center space-x-2">
                                                                <Input
                                                                    id="jumlah_diberikan"
                                                                    name="jumlah_diberikan"
                                                                    type="number"
                                                                    value={obatData.jumlah_diberikan}
                                                                    onChange={(e) =>
                                                                        setObatData((prev) => ({ ...prev, jumlah_diberikan: e.target.value }))
                                                                    }
                                                                    placeholder="0"
                                                                    className="w-28"
                                                                />
                                                                <Select
                                                                    value={obatData.satuan_gudang}
                                                                    onValueChange={(value) =>
                                                                        setObatData((prev) => ({ ...prev, satuan_gudang: value }))
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-40">
                                                                        <SelectValue placeholder="Satuan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {satuanBarang.map((satuan) => (
                                                                            <SelectItem key={satuan.id} value={satuan.nama}>
                                                                                {satuan.nama}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Signa + Satuan + Waktu + DTD Row */}
                                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        {/* Signa */}

                                                        <div>
                                                            <Label>Signa</Label>
                                                            <div className="flex items-center space-x-2">
                                                                <Input
                                                                    type="number"
                                                                    value={obatData.signa.split('x')[0] || ''}
                                                                    onChange={(e) => {
                                                                        const parts = obatData.signa.split('x');
                                                                        const newSigna = `${e.target.value || 0}x${parts[1] || 0}`;
                                                                        setObatData((prev) => ({ ...prev, signa: newSigna }));
                                                                    }}
                                                                    placeholder="1"
                                                                    className="w-20"
                                                                />
                                                                <span className="font-bold">x</span>
                                                                <Input
                                                                    type="number"
                                                                    value={obatData.signa.split('x')[1] || ''}
                                                                    onChange={(e) => {
                                                                        const parts = obatData.signa.split('x');
                                                                        const newSigna = `${parts[0] || 0}x${e.target.value || 0}`;
                                                                        setObatData((prev) => ({ ...prev, signa: newSigna }));
                                                                    }}
                                                                    placeholder="3"
                                                                    className="w-20"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Satuan signa */}
                                                        <div>
                                                            <Label htmlFor="satuan_gudang">Satuan signa</Label>
                                                            <Select
                                                                value={obatData.satuan_signa}
                                                                onValueChange={(value) => setObatData((prev) => ({ ...prev, satuan_signa: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Satuan signa" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {satuanBarang.map((satuan) => (
                                                                        <SelectItem key={satuan.id} value={satuan.nama}>
                                                                            {satuan.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Waktu */}
                                                        <div>
                                                            <Label htmlFor="penggunaan">Instruksi makan</Label>
                                                            <Select
                                                                value={obatData.penggunaan}
                                                                onValueChange={(value) => setObatData((prev) => ({ ...prev, penggunaan: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih intruksi makan" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {penggunaanOptions.length
                                                                        ? penggunaanOptions.map((opt) => (
                                                                            <SelectItem key={opt.id} value={opt.nama}>
                                                                                {opt.nama}
                                                                            </SelectItem>
                                                                        ))
                                                                        : null}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* DTD */}
                                                        <div>
                                                            <Label>DTD</Label>
                                                            <div className="flex items-center space-x-2">
                                                                <Select
                                                                    value={obatData.dtd_mode}
                                                                    onValueChange={(value) => setObatData((prev) => ({ ...prev, dtd_mode: value }))}
                                                                >
                                                                    <SelectTrigger className="w-32">
                                                                        <SelectValue placeholder="Pilih" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="DTD">DTD</SelectItem>
                                                                        <SelectItem value="NON DTD">Non DTD</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Input
                                                                    id="dtd"
                                                                    name="dtd"
                                                                    value={obatData.dtd}
                                                                    onChange={(e) => setObatData((prev) => ({ ...prev, dtd: e.target.value }))}
                                                                    placeholder={obatData.dtd_mode === 'DTD' ? 'Contoh: No. 10' : 'Contoh: No. 10'}
                                                                    className="flex-1"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            onClick={tambahObat}
                                                            disabled={!obatData.nama_obat || !String(obatData.jumlah_diberikan || '').trim()}
                                                        >
                                                            {editIndexObat !== null ? 'Simpan Perubahan' : 'Tambah Obat ke Resep'}
                                                        </Button>
                                                        {editIndexObat !== null && (
                                                            <Button type="button" variant="outline" onClick={cancelEditObat}>
                                                                Batal Edit
                                                            </Button>
                                                        )}
                                                        <Button type="button" variant="outline">
                                                            Print Resep (PDF)
                                                        </Button>
                                                    </div>

                                                    {/* Resep Display (text-like list with actions) */}
                                                    {obatList.length > 0 ? (
                                                        <div className="mt-4">
                                                            <Label className="text-base font-semibold">Resep:</Label>
                                                            <div className="mt-2 h-64 divide-y overflow-y-auto rounded-md border">
                                                                {obatList.map((obat, index) => (
                                                                    <div key={index} className="flex items-start justify-between gap-3 p-3">
                                                                        <div className="font-mono text-sm whitespace-pre-wrap">
                                                                            {(() => {
                                                                                const lines: string[] = [];
                                                                                // 1) Nama obat + Kuantitas (di baris yang sama)
                                                                                const unit = (obat.satuan_gudang || '')
                                                                                    .toString()
                                                                                    .trim()
                                                                                    .toLowerCase();
                                                                                const qty = (obat.jumlah_diberikan || obat.jumlah || '')
                                                                                    .toString()
                                                                                    .trim();
                                                                                const isTabletLike = [
                                                                                    'tab',
                                                                                    'tablet',
                                                                                    'kapsul',
                                                                                    'caps',
                                                                                    'capsule',
                                                                                    'kaplet',
                                                                                    'bungkus',
                                                                                ].includes(unit);
                                                                                const qtyDisplay = qty
                                                                                    ? isTabletLike
                                                                                        ? `No ${qty}`
                                                                                        : unit
                                                                                            ? `${qty} ${obat.satuan_gudang}`.trim()
                                                                                            : `${qty}`
                                                                                    : '';
                                                                                lines.push(
                                                                                    `${obat.nama_obat}${qtyDisplay ? ` ${qtyDisplay}` : ''}`.trim(),
                                                                                );
                                                                                // 2) Instruksi + DTD digabung jika DTD ada
                                                                                const hasInstruksi = !!obat.instruksi;
                                                                                const hasDtd = !!obat.dtd;
                                                                                if (hasInstruksi && hasDtd) {
                                                                                    const dtdLabel =
                                                                                        obat.dtd_mode === 'DTD' && !/^\s*dtd/i.test(obat.dtd)
                                                                                            ? `d.t.d. no. ${obat.dtd}`
                                                                                            : `${obat.dtd}`;
                                                                                    lines.push(
                                                                                        `${obat.instruksi}${obat.instruksi.endsWith('.') ? '' : '.'} ${dtdLabel}`,
                                                                                    );
                                                                                } else if (hasInstruksi) {
                                                                                    lines.push(`${obat.instruksi}`);
                                                                                } else if (hasDtd) {
                                                                                    const dtdOnly =
                                                                                        obat.dtd_mode === 'DTD' && !/^\s*dtd/i.test(obat.dtd)
                                                                                            ? `d.t.d. no. ${obat.dtd}`
                                                                                            : `${obat.dtd}`;
                                                                                    lines.push(dtdOnly);
                                                                                }

                                                                                // 3) Signa: tampilkan sebagai "S: A x B {unit} {penggunaan}" jika bukan 0 x 0
                                                                                {
                                                                                    const parts = String(obat.signa || '').split('x');
                                                                                    const freq = (parts[0] || '0').toString().trim();
                                                                                    const dose = (parts[1] || '0').toString().trim();
                                                                                    const freqNum = Number(freq) || 0;
                                                                                    const doseNum = Number(dose) || 0;
                                                                                    const shouldShowSigna = freqNum > 0 || doseNum > 0;
                                                                                    if (shouldShowSigna) {
                                                                                        const signaUnit =
                                                                                            (obat.satuan_signa || '').toString().trim() || unit || '';
                                                                                        const signaPieces = [
                                                                                            'S.',
                                                                                            String(freqNum),
                                                                                            'x',
                                                                                            String(doseNum),
                                                                                            signaUnit,
                                                                                        ].filter(Boolean);
                                                                                        const penggunaanTxt = (obat.penggunaan || '')
                                                                                            .toString()
                                                                                            .trim();
                                                                                        const signaLine =
                                                                                            `${signaPieces.join(' ')}${penggunaanTxt ? ` ${penggunaanTxt}` : ''}`.trim();
                                                                                        if (signaLine) lines.push(signaLine);
                                                                                    }
                                                                                }

                                                                                // Tentukan prefix "R/" per aturan racikan:
                                                                                // - Item yang hanya nama+jumlah (tanpa signa & tanpa instruksi/DTD) dianggap komponen racikan
                                                                                // - "R/" hanya muncul pada baris pertama dari rangkaian komponen racikan,
                                                                                //   dan rangkaian berakhir saat ada item dengan signa atau instruksi/DTD
                                                                                const hasSigna = !!(obat.signa && String(obat.signa).trim());
                                                                                const hasInstruksiAtauDtd = !!(
                                                                                    (obat.instruksi && String(obat.instruksi).trim()) ||
                                                                                    (obat.dtd && String(obat.dtd).trim())
                                                                                );
                                                                                const onlyNameQty = !hasSigna && !hasInstruksiAtauDtd;

                                                                                let prevOnlyNameQty = false;
                                                                                if (index > 0) {
                                                                                    const prev = obatList[index - 1] as any;
                                                                                    const prevHasSigna = !!(prev?.signa && String(prev.signa).trim());
                                                                                    const prevHasInstruksiAtauDtd = !!(
                                                                                        (prev?.instruksi && String(prev.instruksi).trim()) ||
                                                                                        (prev?.dtd && String(prev.dtd).trim())
                                                                                    );
                                                                                    prevOnlyNameQty = !prevHasSigna && !prevHasInstruksiAtauDtd;
                                                                                }

                                                                                const shouldPrefixR = onlyNameQty
                                                                                    ? !prevOnlyNameQty
                                                                                    : !prevOnlyNameQty;
                                                                                if (lines.length > 0 && shouldPrefixR) {
                                                                                    lines[0] = `R/ ${lines[0]}`;
                                                                                }
                                                                                return lines.join('\n');
                                                                            })()}
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => moveObatUp(index)}
                                                                                disabled={index === 0}
                                                                                title="Naikkan urutan"
                                                                            >
                                                                                ↑
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => moveObatDown(index)}
                                                                                disabled={index === obatList.length - 1}
                                                                                title="Turunkan urutan"
                                                                            >
                                                                                ↓
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => editObat(index)}
                                                                            >
                                                                                Edit
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => hapusObat(index)}
                                                                                className="text-red-600"
                                                                            >
                                                                                Hapus
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <Label className="text-base font-semibold">Resep:</Label>
                                                            <div className="mt-2 h-64 overflow-y-auto rounded-md border bg-gray-50 p-3 text-sm text-gray-500">
                                                                Resep akan muncul di sini setelah menambahkan obat...
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('assesmen')}>
                                            Previous
                                        </Button>
                                        <Button type="submit">{submitButtonText}</Button>
                                    </div>
                                </TabsContent>

                                {/* CPPT Tab */}
                                <TabsContent value="cppt" className="mt-4">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    History Pemeriksaan Pasien
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

            {/* Tooth Condition Modal */}
            {showToothModal && selectedTooth && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="w-full max-w-md rounded-lg bg-white p-6">
                        <h3 className="mb-4 text-lg font-bold">Tooth {selectedTooth} - Select Condition</h3>

                        <div className="mb-6 space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="condition-normal"
                                    name="toothCondition"
                                    value=""
                                    checked={!toothCondition}
                                    onChange={() => setToothCondition('')}
                                    className="mr-2"
                                />
                                <label htmlFor="condition-normal" className="flex items-center">
                                    <img src="/img/odo/seri.png" alt="Normal" className="mr-2 h-8 w-8" />
                                    <span>Normal</span>
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="condition-decayed"
                                    name="toothCondition"
                                    value="Decayed"
                                    checked={toothCondition === 'Decayed'}
                                    onChange={() => setToothCondition('Decayed')}
                                    className="mr-2"
                                />
                                <label htmlFor="condition-decayed" className="flex items-center">
                                    <img src="/img/odo/CAR.png" alt="Decayed" className="mr-2 h-8 w-8" />
                                    <span>Decayed (Karies)</span>
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="condition-missing"
                                    name="toothCondition"
                                    value="Missing"
                                    checked={toothCondition === 'Missing'}
                                    onChange={() => setToothCondition('Missing')}
                                    className="mr-2"
                                />
                                <label htmlFor="condition-missing" className="flex items-center">
                                    <img src="/img/odo/MIS.png" alt="Missing" className="mr-2 h-8 w-8" />
                                    <span>Missing (Hilang)</span>
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="condition-filled"
                                    name="toothCondition"
                                    value="Filled"
                                    checked={toothCondition === 'Filled'}
                                    onChange={() => setToothCondition('Filled')}
                                    className="mr-2"
                                />
                                <label htmlFor="condition-filled" className="flex items-center">
                                    <img src="/img/odo/CRT.png" alt="Filled" className="mr-2 h-8 w-8" />
                                    <span>Filled (Tumpatan)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowToothModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveToothCondition}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirm Dialog */}
            <AlertDialog
                open={confirmOpen}
                onOpenChange={(next) => {
                    if (!next && confirmOpen && confirmResolverRef.current) {
                        confirmResolverRef.current(false);
                        confirmResolverRef.current = undefined;
                    }
                    setConfirmOpen(next);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmOpts.title || 'Konfirmasi'}</AlertDialogTitle>
                        {confirmOpts.description ? (
                            <AlertDialogDescription style={{ whiteSpace: 'pre-line' }}>{confirmOpts.description}</AlertDialogDescription>
                        ) : null}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleConfirmCancel}>{confirmOpts.cancelText || 'Batal'}</AlertDialogCancel>
                        <AlertDialogAction ref={confirmButtonRef} onClick={handleConfirmOk}>
                            {confirmOpts.confirmText || 'Lanjut'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

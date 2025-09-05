import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
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
    jenis_alergi?: string;
    alergi?: string;
    eye?: string;
    verbal?: string;
    motorik?: string;
    kesadaran?: string;
    htt?: string;
    anamnesa?: string;
    assesmen?: string;
    expertise?: string;
    evaluasi?: string;
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
    nama: string;
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

interface ExistingDietData {
    id: number;
    jenis_diet: string;
    jenis_diet_makanan: string;
    jenis_diet_makanan_tidak: string;
}

interface PageProps {
    pelayanan: PatientData;
    soap_dokter?: SoapDokterData;
    so_perawat?: any;
    existing_diet_data: ExistingDietData[];
    gcs_eye: GcsEye[];
    gcs_verbal: GcsVerbal[];
    gcs_motorik: GcsMotorik[];
    gcs_kesadaran: GcsKesadaran[];
    htt_pemeriksaan: HttPemeriksaan[];
    icd10: Icd10[];
    icd9: Icd9[];
    jenis_diet: JenisDiet[];
    makanan: Makanan[];
    norawat: string;
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
    const { pelayanan, soap_dokter, so_perawat, existing_diet_data, gcs_eye, gcs_verbal, gcs_motorik, gcs_kesadaran, htt_pemeriksaan, icd10, icd9, jenis_diet, makanan, norawat, errors } =
        usePage().props as unknown as PageProps;

    // Debug logging
    console.log('PemeriksaanSoapDokter component loaded');
    console.log('Props received:', { pelayanan, soap_dokter, so_perawat, norawat, errors });

    const [activeTab, setActiveTab] = useState('subyektif');
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
            jenis_alergi: soap_dokter?.jenis_alergi || p?.jenis_alergi || '',
            alergi: soap_dokter?.alergi || p?.alergi || '',
            eye: soap_dokter?.eye || (p?.eye !== undefined && p?.eye !== null ? String(p.eye) : ''),
            verbal: soap_dokter?.verbal || (p?.verbal !== undefined && p?.verbal !== null ? String(p.verbal) : ''),
            motorik: soap_dokter?.motorik || (p?.motorik !== undefined && p?.motorik !== null ? String(p.motorik) : ''),
            kesadaran: soap_dokter?.kesadaran || p?.kesadaran || '',
            htt: soap_dokter?.htt || '',
            anamnesa: soap_dokter?.anamnesa || '',
            assesmen: soap_dokter?.assesmen || '',
            expertise: soap_dokter?.expertise || '',
            evaluasi: soap_dokter?.evaluasi || '',
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
    const [keluhanList, setKeluhanList] = useState<Array<{keluhan: string, durasi: string}>>([]);

    // HTT state
    const [httItems, setHttpItems] = useState<Array<{pemeriksaan: string, subPemeriksaan: string, detail: string}>>([]);
    const [selectedHtt, setSelectedHtt] = useState('');
    const [selectedSubHtt, setSelectedSubHtt] = useState('');
    const [httDetailText, setHttDetailText] = useState('');
    const [httOptions, setHttOptions] = useState<HttPemeriksaan[]>(htt_pemeriksaan || []);
    const [subOptions, setSubOptions] = useState<Array<{id: number, nama: string}>>([]);

    // Obat interface
    interface Obat {
        kode_obat_alkes: string;
        nama_obat_alkes: string;
        total_stok: number;
    }

    // Obat state
    const [obatData, setObatData] = useState({
        penanda: '',
        nama_obat: '',
        jumlah: '',
        instruksi: '',
        signa: '',
        satuan_gudang: '',
        penggunaan: '',
    });
    
    const [obatList, setObatList] = useState<Array<typeof obatData>>([]);
    const [obatTersedia, setObatTersedia] = useState<Array<{kode_obat_alkes: string, nama_obat_alkes: string, total_stok: number}>>([]);
    const [instruksiObat, setInstruksiObat] = useState<Array<{id: number, nama: string}>>([]);
    const [satuanBarang, setSatuanBarang] = useState<Array<{id: number, nama: string}>>([]);
    const [loadingObat, setLoadingObat] = useState(false);
    
    const tambahObat = () => {
        setObatList([...obatList, obatData]);
        setObatData({
            penanda: '',
            nama_obat: '',
            jumlah: '',
            instruksi: '',
            signa: '',
            satuan_gudang: '',
            penggunaan: '',
        });
    };
    
    const hapusObat = (index: number) => {
        const daftarBaru = [...obatList];
        daftarBaru.splice(index, 1);
        setObatList(daftarBaru);
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

    // Muat data obat saat komponen pertama kali dimuat
    useEffect(() => {
        ambilObatTersedia();
        ambilInstruksiObat();
        ambilSatuanBarang();
        
        // Load existing keluhan and HTT data from so_perawat if available
        if (so_perawat?.tableData) {
            const td = so_perawat.tableData as any;
            if (Array.isArray(td?.keluhanList)) {
                setKeluhanList(td.keluhanList);
            }
            if (Array.isArray(td?.httItems)) {
                setHttpItems(td.httItems);
            }
        }
        
        // Load HTT options
        const loadHtt = async () => {
            try {
                const res = await fetch('/api/master/htt/pemeriksaan', { headers: { Accept: 'application/json' } });
                if (res.ok) {
                    const data = await res.json();
                    setHttOptions(Array.isArray(data) ? data : htt_pemeriksaan || []);
                } else {
                    setHttOptions(htt_pemeriksaan || []);
                }
            } catch {
                setHttOptions(htt_pemeriksaan || []);
            }
        };
        loadHtt();
    }, []);

    // Tindakan state
    const [tindakanData, setTindakanData] = useState({
        jenis_tindakan: soap_dokter?.jenis_tindakan || '',
        jenis_pelaksana: soap_dokter?.jenis_pelaksana || '',
        harga: soap_dokter?.harga || '',
    });

    // Diet state
    const [dietData, setDietData] = useState({
        jenis_diet: soap_dokter?.diet?.jenis_diet || '',
        jenis_diet_makanan: soap_dokter?.diet?.jenis_diet_makanan || '',
        jenis_diet_makanan_tidak: soap_dokter?.diet?.jenis_diet_makanan_tidak || '',
    });

    // Diet list state for managing selected items
    const [dietList, setDietList] = useState<Array<{jenis_diet: string, jenis_diet_makanan: string, jenis_diet_makanan_tidak: string}>>(() => {
        // Initialize with existing diet data if available
        return existing_diet_data?.map(diet => ({
            jenis_diet: diet.jenis_diet,
            jenis_diet_makanan: diet.jenis_diet_makanan,
            jenis_diet_makanan_tidak: diet.jenis_diet_makanan_tidak
        })) || [];
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    // Diet handlers
    const handleAddDiet = () => {
        if (dietData.jenis_diet.trim() && dietData.jenis_diet_makanan.trim() && dietData.jenis_diet_makanan_tidak.trim()) {
            const newDiet = {
                jenis_diet: dietData.jenis_diet.trim(),
                jenis_diet_makanan: dietData.jenis_diet_makanan.trim(),
                jenis_diet_makanan_tidak: dietData.jenis_diet_makanan_tidak.trim()
            };
            setDietList(prev => [...prev, newDiet]);
            setDietData({ jenis_diet: '', jenis_diet_makanan: '', jenis_diet_makanan_tidak: '' });
            toast.success('Diet berhasil ditambahkan');
        } else {
            toast.error('Mohon lengkapi semua field diet');
        }
    };

    const handleRemoveDiet = (index: number) => {
        setDietList(prev => prev.filter((_, i) => i !== index));
        toast.success('Diet berhasil dihapus');
    };

    // Keluhan handlers
    const handleAddKeluhan = () => {
        if (keluhan.trim() && durasi.trim()) {
            const newKeluhan = {
                keluhan: keluhan.trim(),
                durasi: `${durasi} ${durasiUnit}`
            };
            setKeluhanList(prev => [...prev, newKeluhan]);
            setKeluhan('');
            setDurasi('');
            toast.success('Keluhan berhasil ditambahkan');
        } else {
            toast.error('Mohon isi keluhan dan durasi');
        }
    };

    const handleRemoveKeluhan = (index: number) => {
        setKeluhanList(prev => prev.filter((_, i) => i !== index));
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
        
        try {
            const res = await fetch(`/api/master/htt/subpemeriksaan/${httId}`, { headers: { Accept: 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                setSubOptions(Array.isArray(data) ? data : []);
            } else {
                const local = httOptions.find((p) => String(p.id) === httId)?.htt_subpemeriksaans || [];
                setSubOptions(local);
            }
        } catch {
            const local = httOptions.find((p) => String(p.id) === httId)?.htt_subpemeriksaans || [];
            setSubOptions(local);
        }
    };

    const handleAddHtt = () => {
        if (!selectedHtt || !selectedSubHtt || !httDetailText.trim()) {
            toast.error('Mohon lengkapi semua field HTT');
            return;
        }
        
        const pemeriksaanName = httOptions.find(p => String(p.id) === selectedHtt)?.nama || '';
        const subPemeriksaanName = subOptions.find(s => String(s.id) === selectedSubHtt)?.nama || '';
        
        const newHttItem = {
            pemeriksaan: pemeriksaanName,
            subPemeriksaan: subPemeriksaanName,
            detail: httDetailText.trim()
        };
        
        setHttpItems(prev => [...prev, newHttItem]);
        setSelectedHtt('');
        setSelectedSubHtt('');
        setHttDetailText('');
        setSubOptions([]);
        toast.success('HTT berhasil ditambahkan');
    };

    const handleRemoveHtt = (index: number) => {
        setHttpItems(prev => prev.filter((_, i) => i !== index));
        toast.success('HTT berhasil dihapus');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare ICD arrays for backend
        const icd10_code = icd10List.map(item => item.kode_icd10);
        const icd10_name = icd10List.map(item => item.nama_icd10);
        const icd10_priority = icd10List.map(item => item.priority_icd10);
        
        const icd9_code = icd9List.map(item => item.kode_icd9);
        const icd9_name = icd9List.map(item => item.nama_icd9);

        // Prepare diet arrays
        const diet_jenis = dietList.map(item => item.jenis_diet);
        const diet_anjuran = dietList.map(item => item.jenis_diet_makanan);
        const diet_pantangan = dietList.map(item => item.jenis_diet_makanan_tidak);

        // Prepare tindakan arrays
        const tindakan_nama = tindakanData.jenis_tindakan ? [tindakanData.jenis_tindakan] : [];
        const tindakan_pelaksana = tindakanData.jenis_pelaksana ? [tindakanData.jenis_pelaksana] : [];
        const tindakan_harga = tindakanData.harga ? [tindakanData.harga] : [];

        const payload = {
            nomor_rm: pelayanan.nomor_rm,
            nama: pelayanan.pasien?.nama || '',
            no_rawat: pelayanan.nomor_register,
            sex: pelayanan.pasien?.kelamin?.nama || '',
            penjamin: pelayanan.pendaftaran?.penjamin?.nama || '',
            tanggal_lahir: pelayanan.pasien?.tanggal_lahir || '',
            umur: formData.umur || '',
            tableData: JSON.stringify(formData.tableData || {}),
            anamnesa: formData.anamnesa || '',
            sistol: formData.sistol ? parseFloat(formData.sistol) : null,
            distol: formData.distol ? parseFloat(formData.distol) : null,
            tensi: formData.tensi || '',
            suhu: formData.suhu ? parseFloat(formData.suhu) : null,
            nadi: formData.nadi ? parseFloat(formData.nadi) : null,
            rr: formData.rr ? parseFloat(formData.rr) : null,
            tinggi: formData.tinggi ? parseFloat(formData.tinggi) : null,
            berat: formData.berat ? parseFloat(formData.berat) : null,
            spo2: formData.spo2 ? parseFloat(formData.spo2) : null,
            jenis_alergi: formData.jenis_alergi || '',
            alergi: formData.alergi || '',
            lingkar_perut: formData.lingkar_perut ? parseFloat(formData.lingkar_perut) : null,
            nilai_bmi: formData.nilai_bmi ? parseFloat(formData.nilai_bmi) : null,
            status_bmi: formData.status_bmi || '',
            eye: formData.eye ? parseInt(formData.eye) : null,
            verbal: formData.verbal ? parseInt(formData.verbal) : null,
            motorik: formData.motorik ? parseInt(formData.motorik) : null,
            htt: formData.htt || '',
            assesmen: formData.assesmen || '',
            evaluasi: formData.evaluasi || '',
            plan: formData.plan || '',
            expertise: formData.expertise || '',
            icd10_code,
            icd10_name,
            icd10_priority,
            icd9_code,
            icd9_name,
            diet_jenis,
            diet_anjuran,
            diet_pantangan,
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
        const newDecayed = decayed.filter(t => t !== selectedTooth);
        const newMissing = missing.filter(t => t !== selectedTooth);
        const newFilled = filled.filter(t => t !== selectedTooth);

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
            Filled: newFilled.join(',')
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
        const middleLineNumbers = ['11', '12', '13', '51', '52', '53', '81', '82', '83', '41', '42', '43', '21', '22', '23', '61', '62', '63', '71', '72', '73', '31', '32', '33'];
        return middleLineNumbers.includes(toothNumber) ? '/img/odo/seri.png' : '/img/odo/geraham.png';
    };

    // Determine if this is edit mode
    const isEditMode = soap_dokter && Object.keys(soap_dokter).length > 0;
    const pageTitle = isEditMode ? 'Edit SOAP Dokter' : 'Pemeriksaan SOAP Dokter';
    const submitButtonText = isEditMode ? 'Update Pemeriksaan' : 'Simpan Pemeriksaan';

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
                                    <TabsTrigger value="subyektif">Subyektif</TabsTrigger>
                                    <TabsTrigger value="objektif">Objektif</TabsTrigger>
                                    <TabsTrigger value="assesmen">Assesmen</TabsTrigger>
                                    <TabsTrigger value="plan">Plan</TabsTrigger>
                                </TabsList>

                                {/* Subyektif Tab */}
                                <TabsContent value="subyektif" className="mt-4">
                                    <div className="space-y-6">
                                         {/* Daftar Keluhan */}
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
                                                <CardTitle>Anamnesa</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Textarea
                                                    id="anamnesa"
                                                    name="anamnesa"
                                                    value={formData.anamnesa}
                                                    onChange={handleInputChange}
                                                    rows={6}
                                                    className="border-input bg-background"
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
                                                <CardTitle className="text-lg">Tanda Vital</CardTitle>
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
                                                        <h3 className="text-md font-medium mb-3">Tanda Vital</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                            <div>
                                                            <Label htmlFor="tensi">Tekanan Darah (mmHg)</Label>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                    id="sistol"
                                                                    name="sistol"
                                                                    value={formData.sistol}
                                                                    onChange={handleInputChange}
                                                                    placeholder="120"
                                                                    className="w-20 text-center"
                                                                    />
                                                                    <span>/</span>
                                                                    <Input
                                                                    id="distol"
                                                                    name="distol"
                                                                    value={formData.distol}
                                                                    onChange={handleInputChange}
                                                                    placeholder="80"
                                                                    className="w-20 text-center"
                                                                    />
                                                                </div>
                                                            </div>                                                 
                                                            <div>
                                                                <Label htmlFor="suhu">Suhu (°C)</Label>
                                                                <Input
                                                                    id="suhu"
                                                                    name="suhu"
                                                                    value={formData.suhu}
                                                                    onChange={handleInputChange}
                                                                    placeholder="36.5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="nadi">Nadi (/menit)</Label>
                                                                <Input
                                                                    id="nadi"
                                                                    name="nadi"
                                                                    value={formData.nadi}
                                                                    onChange={handleInputChange}
                                                                    placeholder="80"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="rr">RR (/menit)</Label>
                                                                <Input
                                                                    id="rr"
                                                                    name="rr"
                                                                    value={formData.rr}
                                                                    onChange={handleInputChange}
                                                                    placeholder="20"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">                                                                                                                    
                                                            <div>
                                                                <Label htmlFor="spo2">SpO2 (%)</Label>
                                                                <Input
                                                                    id="spo2"
                                                                    name="spo2"
                                                                    value={formData.spo2}
                                                                    onChange={handleInputChange}
                                                                    placeholder="98"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="lingkar_perut">Lingkar Perut (cm)</Label>
                                                                <Input
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
                                                        <h3 className="text-md font-medium mb-3">Antropometri</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                            <div>
                                                                <Label htmlFor="tinggi">Tinggi Badan (cm)</Label>
                                                                <Input
                                                                    id="tinggi"
                                                                    name="tinggi"
                                                                    value={formData.tinggi}
                                                                    onChange={handleInputChange}
                                                                    placeholder="170"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="berat">Berat Badan (kg)</Label>
                                                                <Input
                                                                    id="berat"
                                                                    name="berat"
                                                                    value={formData.berat}
                                                                    onChange={handleInputChange}
                                                                    placeholder="70"
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
                                                        <h3 className="text-md font-medium mb-3">Alergi</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div>
                                                                <Label htmlFor="jenis_alergi">Jenis Alergi</Label>
                                                                <Select
                                                                    value={formData.jenis_alergi}
                                                                    onValueChange={(value) => handleSelectChange('jenis_alergi', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih jenis alergi" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                                                                        <SelectItem value="Obat">Obat</SelectItem>
                                                                        <SelectItem value="Makanan">Makanan</SelectItem>
                                                                        <SelectItem value="Udara">Udara</SelectItem>
                                                                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="alergi">Detail Alergi</Label>
                                                                <Input
                                                                    id="alergi"
                                                                    name="alergi"
                                                                    value={formData.alergi}
                                                                    onChange={handleInputChange}
                                                                    placeholder="Sebutkan detail alergi..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* GCS */}
                                                    <div>
                                                        <h3 className="text-md font-medium mb-3">Glasgow Coma Scale (GCS)</h3>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                            <div>
                                                                <Label htmlFor="eye">Eye Response</Label>
                                                                <Select value={String(formData.eye)} onValueChange={(value) => handleSelectChange('eye', value)}>
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
                                                <CardTitle className="text-lg">Head To Toe (HTT)</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenHtt(!openHtt)}>
                                                    {openHtt ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openHtt ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-6">
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

                                        {/* Diet Section */}
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
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <Label htmlFor="jenis_diet">Jenis Diet</Label>
                                                            <select
                                                                id="jenis_diet"
                                                                name="jenis_diet"
                                                                value={dietData.jenis_diet}
                                                                onChange={(e) => setDietData(prev => ({ ...prev, jenis_diet: e.target.value }))}
                                                                className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                                            >
                                                                <option value="">Pilih Jenis Diet</option>
                                                                {jenis_diet.map((diet) => (
                                                                    <option key={diet.id} value={diet.nama}>
                                                                        {diet.nama}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jenis_diet_makanan">Makanan Dianjurkan</Label>
                                                            <select
                                                                id="jenis_diet_makanan"
                                                                name="jenis_diet_makanan"
                                                                value={dietData.jenis_diet_makanan}
                                                                onChange={(e) => setDietData(prev => ({ ...prev, jenis_diet_makanan: e.target.value }))}
                                                                className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                                            >
                                                                <option value="">Pilih Makanan Dianjurkan</option>
                                                                {makanan.map((food) => (
                                                                    <option key={food.id} value={food.nama}>
                                                                        {food.nama}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jenis_diet_makanan_tidak">Makanan Tidak Boleh</Label>
                                                            <select
                                                                id="jenis_diet_makanan_tidak"
                                                                name="jenis_diet_makanan_tidak"
                                                                value={dietData.jenis_diet_makanan_tidak}
                                                                onChange={(e) => setDietData(prev => ({ ...prev, jenis_diet_makanan_tidak: e.target.value }))}
                                                                className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                                            >
                                                                <option value="">Pilih Makanan Tidak Boleh</option>
                                                                {makanan.map((food) => (
                                                                    <option key={food.id} value={food.nama}>
                                                                        {food.nama}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-end">
                                                        <Button type="button" onClick={handleAddDiet} className="bg-blue-600 hover:bg-blue-700">
                                                            Tambah Diet
                                                        </Button>
                                                    </div>

                                                    {/* Diet List */}
                                                    {dietList.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="text-sm font-medium mb-2">Daftar Diet:</h4>
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
                                                    <div className="container svg-container">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 980 300" preserveAspectRatio="xMidYMin meet">
                                                            {/* Define tooth numbers */}
                                                            {(() => {
                                                                const leftNumbers = [18, 17, 16, 15, 14, 13, 12, 11, 55, 54, 53, 52, 51, 85, 84, 83, 82, 81, 48, 47, 46, 45, 44, 43, 42, 41];
                                                                const rightNumbers = [21, 22, 23, 24, 25, 26, 27, 28, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 31, 32, 33, 34, 35, 36, 37, 38];
                                                                
                                                                const getToothPosition = (number: number, isLeft: boolean) => {
                                                                    const numbers = isLeft ? leftNumbers : rightNumbers;
                                                                    const index = numbers.indexOf(number);
                                                                    
                                                                    if (index === -1) return { x: 0, y: 0 };
                                                                    
                                                                    const row = index < 8 ? 0 : (index < 13 ? 1 : (index < 18 ? 2 : 3));
                                                                    const col = index < 8 ? index : (index < 13 ? index - 8 + 1.5 : (index < 18 ? index - 13 + 1.5 : index - 18));
                                                                    const x = col * 60 + (isLeft ? 0 : 500);
                                                                    const y = row * 60;
                                                                    
                                                                    return { x, y };
                                                                };
                                                                
                                                                const isDiagonal = (number: number) => {
                                                                    const diagonalNumbers = [14, 15, 16, 17, 18, 44, 45, 46, 47, 48, 54, 55, 84, 85, 24, 25, 26, 27, 28, 34, 35, 36, 37, 38, 64, 65, 74, 75];
                                                                    return diagonalNumbers.includes(number);
                                                                };
                                                                
                                                                const isMiddleLine = (number: number) => {
                                                                    const middleLineNumbers = [11, 12, 13, 51, 52, 53, 81, 82, 83, 41, 42, 43, 21, 22, 23, 61, 62, 63, 71, 72, 73, 31, 32, 33];
                                                                    return middleLineNumbers.includes(number);
                                                                };
                                                                
                                                                const getImagePath = (number: number) => {
                                                                    return getToothImage(number.toString());
                                                                };
                                                                
                                                                return (
                                                                    <>
                                                                        {/* Left teeth */}
                                                                        {leftNumbers.map(number => {
                                                                            const { x, y } = getToothPosition(number, true);
                                                                            const imagePath = getImagePath(number);
                                                                            
                                                                            return (
                                                                                <g key={number} className="clickable-box" onClick={() => handleToothClick(number.toString())}>
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
                                                                        {rightNumbers.map(number => {
                                                                            const { x, y } = getToothPosition(number, false);
                                                                            const imagePath = getImagePath(number);
                                                                            
                                                                            return (
                                                                                <g key={number} className="clickable-box" onClick={() => handleToothClick(number.toString())}>
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
                                                                    <h5 className="mb-3 font-weight-bold text-primary">Status Gigi (DMF)</h5>
                                                                    
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
                                                                    
                                                                    <Button type="button" className="btn btn-info mt-3 w-100" onClick={() => toast.success('Data odontogram berhasil disimpan')}>
                                                                        Simpan
                                                                    </Button>
                                                                </div>
                                                                
                                                                {/* Spacer */}
                                                                <div className="col-md-1"></div>
                                                                
                                                                {/* Bagian kanan: Pemeriksaan Tambahan */}
                                                                <div className="col-md-7">
                                                                    <h5 className="mb-3 font-weight-bold text-primary">Pemeriksaan Tambahan</h5>
                                                                    
                                                                    <div className="form-group row align-items-center">
                                                                        <Label htmlFor="Oclusi" className="col-sm-4 col-form-label">Oclusi</Label>
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
                                                                        <Label htmlFor="Palatinus" className="col-sm-4 col-form-label">Torus Palatinus</Label>
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
                                                                        <Label htmlFor="Mandibularis" className="col-sm-4 col-form-label">Torus Mandibularis</Label>
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
                                                                        <Label htmlFor="Platum" className="col-sm-4 col-form-label">Platum</Label>
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
                                                                        <Label htmlFor="Diastema" className="col-sm-4 col-form-label">Diastema</Label>
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
                                                                        <Label htmlFor="Anomali" className="col-sm-4 col-form-label">Gigi Anomali</Label>
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
                                                <CardTitle className="text-lg">Assessment</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenAssessment(!openAssessment)}>
                                                    {openAssessment ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openAssessment ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="assesmen">Diagnosis / Assessment</Label>
                                                        <Textarea
                                                            id="assesmen"
                                                            name="assesmen"
                                                            value={formData.assesmen}
                                                            onChange={handleInputChange}
                                                            rows={6}
                                                            className="mt-1 border-input bg-background"
                                                            placeholder="Masukkan diagnosis atau assessment pasien..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="expertise">Expertise / Konsultasi</Label>
                                                        <Textarea
                                                            id="expertise"
                                                            name="expertise"
                                                            value={formData.expertise}
                                                            onChange={handleInputChange}
                                                            rows={4}
                                                            className="mt-1 border-input bg-background"
                                                            placeholder="Masukkan expertise atau konsultasi yang diperlukan..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="evaluasi">Evaluasi</Label>
                                                        <Textarea
                                                            id="evaluasi"
                                                            name="evaluasi"
                                                            value={formData.evaluasi}
                                                            onChange={handleInputChange}
                                                            rows={4}
                                                            className="mt-1 border-input bg-background"
                                                            placeholder="Masukkan evaluasi kondisi pasien..."
                                                        />
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* ICD Section */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">ICD</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenIcd(!openIcd)}>
                                                    {openIcd ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIcd ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-6">
                                                    {/* 2-Column Layout for ICD10 and ICD9 */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {/* ICD 10 Column */}
                                                        <div className="space-y-4">
                                                            <h3 className="font-medium text-lg border-b pb-2">Diagnosa (ICD 10)</h3>
                                                            
                                                            {/* ICD 10 Input Form */}
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label htmlFor="icd10">KODE ICD 10</Label>
                                                                    <Select
                                                                        value={icdData.kode_icd10 || ''}
                                                                        onValueChange={(value) => {
                                                                            const selectedIcd = icd10.find(icd => icd.kode === value);
                                                                            setIcdData(prev => ({
                                                                                ...prev,
                                                                                kode_icd10: value,
                                                                                nama_icd10: selectedIcd ? selectedIcd.nama : ''
                                                                            }));
                                                                        }}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="-- Pilih --" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {icd10.map((item) => (
                                                                                <SelectItem key={item.kode} value={item.kode}>
                                                                                    {item.kode} - {item.nama}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                
                                                                <div>
                                                                    <Label htmlFor="priority_icd10">Pilih</Label>
                                                                    <Select
                                                                        value={icdData.priority_icd10 || ''}
                                                                        onValueChange={(value) => setIcdData(prev => ({ ...prev, priority_icd10: value }))}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="-- Pilih --" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Primary">Primary</SelectItem>
                                                                            <SelectItem value="Sekunder">Sekunder</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                
                                                                <div className="flex justify-end">
                                                                    <Button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            if (icdData.kode_icd10 && icdData.nama_icd10 && icdData.priority_icd10) {
                                                                                setIcd10List(prev => [...prev, { ...icdData }]);
                                                                                setIcdData(prev => ({
                                                                                    ...prev,
                                                                                    kode_icd10: '',
                                                                                    nama_icd10: '',
                                                                                    priority_icd10: ''
                                                                                }));
                                                                            }
                                                                        }}
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        ✓
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
                                                                                <TableCell className="text-sm">{item.nama_icd10}</TableCell>
                                                                                <TableCell>
                                                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                                                        item.priority_icd10 === 'Primary' 
                                                                                            ? 'bg-blue-100 text-blue-800' 
                                                                                            : 'bg-gray-100 text-gray-800'
                                                                                    }`}>
                                                                                        {item.priority_icd10}
                                                                                    </span>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <Button 
                                                                                        type="button" 
                                                                                        variant="destructive" 
                                                                                        size="sm"
                                                                                        onClick={() => setIcd10List(prev => prev.filter((_, i) => i !== index))}
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
                                                            <h3 className="font-medium text-lg border-b pb-2">Tindakan (ICD 9)</h3>
                                                            
                                                            {/* ICD 9 Input Form */}
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label htmlFor="icd9">KODE ICD 9</Label>
                                                                    <Select
                                                                        value={icdData.kode_icd9 || ''}
                                                                        onValueChange={(value) => {
                                                                            const selectedIcd = icd9.find(icd => icd.kode === value);
                                                                            setIcdData(prev => ({
                                                                                ...prev,
                                                                                kode_icd9: value,
                                                                                nama_icd9: selectedIcd ? selectedIcd.nama : ''
                                                                            }));
                                                                        }}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="-- Pilih --" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {icd9.map((item) => (
                                                                                <SelectItem key={item.kode} value={item.kode}>
                                                                                    {item.kode} - {item.nama}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                
                                                                <div className="flex justify-end">
                                                                    <Button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            if (icdData.kode_icd9 && icdData.nama_icd9) {
                                                                                setIcd9List(prev => [...prev, { ...icdData }]);
                                                                                setIcdData(prev => ({
                                                                                    ...prev,
                                                                                    kode_icd9: '',
                                                                                    nama_icd9: ''
                                                                                }));
                                                                            }
                                                                        }}
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        ✓
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
                                                                                <TableCell className="text-sm">{item.nama_icd9}</TableCell>
                                                                                <TableCell>
                                                                                    <Button 
                                                                                        type="button" 
                                                                                        variant="destructive" 
                                                                                        size="sm"
                                                                                        onClick={() => setIcd9List(prev => prev.filter((_, i) => i !== index))}
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
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <Label htmlFor="jenis_tindakan">Jenis Tindakan</Label>
                                                            <Input
                                                                id="jenis_tindakan"
                                                                name="jenis_tindakan"
                                                                value={tindakanData.jenis_tindakan}
                                                                onChange={(e) => setTindakanData(prev => ({ ...prev, jenis_tindakan: e.target.value }))}
                                                                className="mt-1 border-input bg-background"
                                                                placeholder="Masukkan jenis tindakan..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jenis_pelaksana">Jenis Pelaksana</Label>
                                                            <Input
                                                                id="jenis_pelaksana"
                                                                name="jenis_pelaksana"
                                                                value={tindakanData.jenis_pelaksana}
                                                                onChange={(e) => setTindakanData(prev => ({ ...prev, jenis_pelaksana: e.target.value }))}
                                                                className="mt-1 border-input bg-background"
                                                                placeholder="Masukkan jenis pelaksana..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="harga">Harga</Label>
                                                            <Input
                                                                id="harga"
                                                                name="harga"
                                                                value={tindakanData.harga}
                                                                onChange={(e) => setTindakanData(prev => ({ ...prev, harga: e.target.value }))}
                                                                className="mt-1 border-input bg-background"
                                                                placeholder="Masukkan harga..."
                                                            />
                                                        </div>
                                                    </div>
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
                                                    {/* R:/ Input */}
                                                    <div className="flex items-center space-x-2 mb-4">
                                                        <div className="flex items-center space-x-2 flex-1">
                                                            <Button 
                                                                type="button" 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="bu"
                                                            >
                                                                R:/
                                                            </Button>
                                                            <Input
                                                                id="penanda"
                                                                name="penanda"
                                                                value={obatData.penanda}
                                                                onChange={(e) => setObatData(prev => ({ ...prev, penanda: e.target.value }))}
                                                                placeholder="Kosong = R:/, isi = R:/ + teks"
                                                                className="flex-1"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Medicine Selection Row */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <Label htmlFor="nama_obat">Nama Obat</Label>
                                                            <Select 
                                                                value={obatData.nama_obat}
                                                                onValueChange={(value) => setObatData(prev => ({ ...prev, nama_obat: value }))}
                                                                disabled={loadingObat}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={loadingObat ? "Memuat obat..." : "-- Pilih Obat --"} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {obatTersedia.length === 0 && !loadingObat && (
                                                                        <SelectItem value="" disabled>Tidak ada obat tersedia</SelectItem>
                                                                    )}
                                                                    {obatTersedia.map((obat) => (
                                                                        <SelectItem 
                                                                            key={obat.kode_obat_alkes} 
                                                                            value={obat.nama_obat_alkes}
                                                                        >
                                                                            {obat.nama_obat_alkes} (Stok: {obat.total_stok})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="jumlah">Qty / Jumlah</Label>
                                                            <Input
                                                                id="jumlah"
                                                                name="jumlah"
                                                                type="number"
                                                                value={obatData.jumlah}
                                                                onChange={(e) => setObatData(prev => ({ ...prev, jumlah: e.target.value }))}
                                                                placeholder="Contoh: 500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="instruksi">Instruksi</Label>
                                                            <Select 
                                                                value={obatData.instruksi}
                                                                onValueChange={(value) => setObatData(prev => ({ ...prev, instruksi: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="-- Pilih Instruksi --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {instruksiObat.map((instruksi) => (
                                                                        <SelectItem 
                                                                            key={instruksi.id} 
                                                                            value={instruksi.nama}
                                                                        >
                                                                            {instruksi.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Signa Row */}
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                        <div className="md:col-span-2">
                                                            <Label>Signa</Label>
                                                            <div className="flex items-center space-x-2">
                                                                <Input
                                                                    type="number"
                                                                    value={obatData.signa.split('x')[0] || ''}
                                                                    onChange={(e) => {
                                                                        const parts = obatData.signa.split('x');
                                                                        const newSigna = `${e.target.value}x${parts[1] || ''}`;
                                                                        setObatData(prev => ({ ...prev, signa: newSigna }));
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
                                                                        const newSigna = `${parts[0] || ''}x${e.target.value}`;
                                                                        setObatData(prev => ({ ...prev, signa: newSigna }));
                                                                    }}
                                                                    placeholder="3"
                                                                    className="w-20"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="satuan_gudang" className="invisible">Satuan</Label>
                                                            <Select 
                                                                value={obatData.satuan_gudang}
                                                                onValueChange={(value) => setObatData(prev => ({ ...prev, satuan_gudang: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Satuan" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {satuanBarang.map((satuan) => (
                                                                        <SelectItem 
                                                                            key={satuan.id} 
                                                                            value={satuan.nama}
                                                                        >
                                                                            {satuan.nama}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="penggunaan" className="invisible">Waktu</Label>
                                                            <Select 
                                                                value={obatData.penggunaan}
                                                                onValueChange={(value) => setObatData(prev => ({ ...prev, penggunaan: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="SEBELUM MAKAN" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="SEBELUM MAKAN">SEBELUM MAKAN</SelectItem>
                                                                    <SelectItem value="SESUDAH MAKAN">SESUDAH MAKAN</SelectItem>
                                                                    <SelectItem value="SEBELUM/SESUDAH MAKAN">SEBELUM/SESUDAH MAKAN</SelectItem>
                                                                    <SelectItem value="JIKA MUAL-MUAL">JIKA MUAL-MUAL</SelectItem>
                                                                    <SelectItem value="JIKA BUANG AIR BESAR">JIKA BUANG AIR BESAR</SelectItem>
                                                                    <SelectItem value="JIKA MERASA NYERI">JIKA MERASA NYERI</SelectItem>
                                                                    <SelectItem value="DIMINUM SETELAH SUAPAN PERTAMA">DIMINUM SETELAH SUAPAN PERTAMA</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex space-x-2 mb-4">
                                                        <Button 
                                                            type="button" 
                                                            onClick={tambahObat}
                                                            disabled={!obatData.nama_obat || !obatData.jumlah}
                                                            className="bg-blue-500 hover:bg-blue-600"
                                                        >
                                                            Tambah Obat ke Resep
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline"
                                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                                        >
                                                            Print Resep (PDF)
                                                        </Button>
                                                    </div>

                                                    {/* Resep Display */}
                                                    <div>
                                                        <Label className="text-base font-semibold">Resep:</Label>
                                                        <Textarea
                                                            value={obatList.map((obat, index) => {
                                                                let resep = obat.penanda ? `R:/ ${obat.penanda}\n` : 'R:/\n';
                                                                resep += `${obat.nama_obat}\n`;
                                                                if (obat.instruksi) resep += `${obat.instruksi}\n`;
                                                                resep += `S ${obat.signa} ${obat.satuan_gudang} ${obat.penggunaan}\n`;
                                                                return resep;
                                                            }).join('\n')}
                                                            rows={8}
                                                            className="mt-2 bg-gray-50"
                                                            readOnly
                                                            placeholder="Resep akan muncul di sini setelah menambahkan obat..."
                                                        />
                                                    </div>
                                                    
                                                    {obatList.length > 0 && (
                                                        <div className="mt-4 border rounded-md">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>No</TableHead>
                                                                        <TableHead>Nama Obat</TableHead>
                                                                        <TableHead>Jumlah</TableHead>
                                                                        <TableHead>Instruksi</TableHead>
                                                                        <TableHead>Signa</TableHead>
                                                                        <TableHead>Satuan</TableHead>
                                                                        <TableHead>Aksi</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {obatList.map((obat, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{index + 1}</TableCell>
                                                                            <TableCell>{obat.nama_obat}</TableCell>
                                                                            <TableCell>{obat.jumlah} {obat.satuan_gudang}</TableCell>
                                                                            <TableCell>{obat.instruksi}</TableCell>
                                                                            <TableCell>{obat.signa}</TableCell>
                                                                            <TableCell>{obat.satuan_gudang}</TableCell>
                                                                            <TableCell>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="sm"
                                                                                    onClick={() => hapusObat(index)}
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
                                                <CardTitle className="text-lg">Plan Tindakan</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div>
                                                    <Label htmlFor="plan">Rencana Tindakan / Terapi</Label>
                                                    <Textarea
                                                        id="plan"
                                                        name="plan"
                                                        value={formData.plan}
                                                        onChange={handleInputChange}
                                                        rows={8}
                                                        className="mt-1 border-input bg-background"
                                                        placeholder="Masukkan rencana tindakan, terapi, atau pengobatan untuk pasien..."
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('assesmen')}>
                                            Previous
                                        </Button>
                                        <Button type="submit">{submitButtonText}</Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </form>
            </div>
            
            {/* Tooth Condition Modal */}
            {showToothModal && selectedTooth && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Tooth {selectedTooth} - Select Condition</h3>
                        
                        <div className="space-y-3 mb-6">
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
                                    <img src="/img/odo/seri.png" alt="Normal" className="w-8 h-8 mr-2" />
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
                                    <img src="/img/odo/CAR.png" alt="Decayed" className="w-8 h-8 mr-2" />
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
                                    <img src="/img/odo/MIS.png" alt="Missing" className="w-8 h-8 mr-2" />
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
                                    <img src="/img/odo/CRT.png" alt="Filled" className="w-8 h-8 mr-2" />
                                    <span>Filled (Tumpatan)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowToothModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={saveToothCondition}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

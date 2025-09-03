import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
}

interface SoapDokterData {
    no_rawat?: string;
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

interface PageProps {
    pelayanan: PatientData;
    soap_dokter?: SoapDokterData;
    so_perawat?: any;
    gcs_eye: GcsEye[];
    gcs_verbal: GcsVerbal[];
    gcs_motorik: GcsMotorik[];
    gcs_kesadaran: GcsKesadaran[];
    htt_pemeriksaan: HttPemeriksaan[];
    icd10: Icd10[];
    icd9: Icd9[];
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
    const { pelayanan, soap_dokter, so_perawat, gcs_eye, gcs_verbal, gcs_motorik, gcs_kesadaran, htt_pemeriksaan, icd10, icd9, norawat, errors } =
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
            tableData: (soap_dokter?.tableData && Array.isArray(soap_dokter.tableData) ? soap_dokter.tableData : p?.tableData || []) as any[],
        };
    });

    // Collapsible states for Objektif sections
    const [openVital, setOpenVital] = useState(true);
    const [openAntropometri, setOpenAntropometri] = useState(true);
    const [openAlergi, setOpenAlergi] = useState(true);
    const [openGcs, setOpenGcs] = useState(true);
    const [openHtt, setOpenHtt] = useState(true);

    const allOpen = openVital && openAntropometri && openAlergi && openGcs && openHtt;
    const toggleAll = (open: boolean) => {
        setOpenVital(open);
        setOpenAntropometri(open);
        setOpenAlergi(open);
        setOpenGcs(open);
        setOpenHtt(open);
    };

    // Calculate BMI when height or weight changes
    useEffect(() => {
        if (formData.tinggi && formData.berat) {
            const tinggi = parseFloat(formData.tinggi);
            const berat = parseFloat(formData.berat);

            if (tinggi > 0 && berat > 0) {
                const bmi = berat / Math.pow(tinggi / 100, 2);
                setFormData((prev) => ({
                    ...prev,
                    nilai_bmi: bmi.toFixed(2),
                }));
            }
        }
    }, [formData.tinggi, formData.berat]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            no_rawat: pelayanan.nomor_register,
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
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="anamnesa">Anamnesa</Label>
                                            <Textarea
                                                id="anamnesa"
                                                name="anamnesa"
                                                value={formData.anamnesa}
                                                onChange={handleInputChange}
                                                rows={6}
                                                className="mt-1 border-input bg-background"
                                            />
                                        </div>
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
                                        {/* Ringkasan dari Perawat */}
                                        {so_perawat?.tableData && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Ringkasan Perawat</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {(() => {
                                                        const td = so_perawat.tableData as any;
                                                        const kel = Array.isArray(td?.keluhanList) ? td.keluhanList : [];
                                                        const htt = Array.isArray(td?.httItems) ? td.httItems : [];
                                                        return (
                                                            <div className="space-y-4">
                                                                {kel.length > 0 && (
                                                                    <div>
                                                                        <Label>Daftar Keluhan</Label>
                                                                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                                                                            {kel.map((it: any, idx: number) => (
                                                                                <li key={idx}>
                                                                                    {it.keluhan} — {it.durasi}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {htt.length > 0 && (
                                                                    <div>
                                                                        <Label>Head To Toe</Label>
                                                                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                                                                            {htt.map((it: any, idx: number) => (
                                                                                <li key={idx}>
                                                                                    {it.pemeriksaan} / {it.subPemeriksaan} — {it.detail}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {so_perawat?.summernote && (
                                                                    <div>
                                                                        <Label>Catatan Perawat</Label>
                                                                        <div className="prose mt-1 max-w-none text-sm whitespace-pre-wrap">
                                                                            {so_perawat.summernote}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </CardContent>
                                            </Card>
                                        )}
                                        {/* Vital Signs */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Tanda Vital</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenVital(!openVital)}>
                                                    {openVital ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openVital ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                        <div>
                                                            <Label htmlFor="sistol">Sistol (mmHg)</Label>
                                                            <Input
                                                                id="sistol"
                                                                name="sistol"
                                                                value={formData.sistol}
                                                                onChange={handleInputChange}
                                                                placeholder="120"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="distol">Diastol (mmHg)</Label>
                                                            <Input
                                                                id="distol"
                                                                name="distol"
                                                                value={formData.distol}
                                                                onChange={handleInputChange}
                                                                placeholder="80"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="tensi">Tensi</Label>
                                                            <Input id="tensi" name="tensi" value={formData.tensi} readOnly />
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
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* Antropometri */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Antropometri</CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setOpenAntropometri(!openAntropometri)}
                                                >
                                                    {openAntropometri ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openAntropometri ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent>
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
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* Alergi */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Alergi</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenAlergi(!openAlergi)}>
                                                    {openAlergi ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openAlergi ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent>
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
                                                                    <SelectItem value="Lingkungan">Lingkungan</SelectItem>
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
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* GCS */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Glasgow Coma Scale (GCS)</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenGcs(!openGcs)}>
                                                    {openGcs ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openGcs ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent>
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                        <div>
                                                            <Label htmlFor="eye">Eye Response</Label>
                                                            <Select value={formData.eye} onValueChange={(value) => handleSelectChange('eye', value)}>
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
                                                                value={formData.verbal}
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
                                                                value={formData.motorik}
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
                                                </CardContent>
                                            </div>
                                        </Card>

                                        {/* HTT */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Head To Toe (HTT)</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenHtt(!openHtt)}>
                                                    {openHtt ? '▼' : '▶'}
                                                </Button>
                                            </CardHeader>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openHtt ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <CardContent>
                                                    <div>
                                                        <Label htmlFor="htt">Pemeriksaan HTT</Label>
                                                        <Textarea
                                                            id="htt"
                                                            name="htt"
                                                            value={formData.htt}
                                                            onChange={handleInputChange}
                                                            rows={4}
                                                            className="mt-1 border-input bg-background"
                                                            placeholder="Masukkan hasil pemeriksaan head to toe..."
                                                        />
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
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Assessment</CardTitle>
                                            </CardHeader>
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
        </AppLayout>
    );
}

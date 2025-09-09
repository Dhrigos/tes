import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface PatientData {
    nomor_rm: string;
    nama: string;
    nomor_register: string;
    jenis_kelamin: string;
    penjamin: string;
    tanggal_lahir: string;
    umur: string;
    no_bpjs: string;
}

interface RefTACC {
    kdTacc: string;
    nmTacc: string;
    alasanTacc: string[];
}

interface Subspesialis {
    kode: string;
    nama: string;
}

interface Sarana {
    kode: string;
    nama: string;
}

interface Spesialis {
    kode: string;
    nama: string;
}

interface PageProps {
    pelayanan: PatientData;
    Ref_TACC: RefTACC[];
    subspesialis: Subspesialis[];
    sarana: Sarana[];
    spesialis: Spesialis[];
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelayanan', href: '/pelayanan' },
    { title: 'Rujukan', href: '' },
];

export default function Rujukan() {
    const { pelayanan, Ref_TACC, subspesialis, sarana, spesialis } = usePage().props as unknown as PageProps;

    const [activeTab, setActiveTab] = useState('jenis-rujukan');
    const [formData, setFormData] = useState({
        // Step 1
        jenis_rujukan: '',
        tujuan_rujukan: '',

        // Step 2
        opsi_rujukan: '',

        // Step 3 - Rujukan Khusus
        igd_rujukan_khusus: '',
        subspesialis_khusus: '',
        tanggal_rujukan_khusus: '',
        tujuan_rujukan_khusus: '',

        // Step 3 - Spesialis
        aktifkan_sarana: false,
        sarana: '',
        kategori_rujukan: '',
        alasan_rujukan: '',
        spesialis: '',
        sub_spesialis: '',
        tanggal_rujukan: '',
        tujuan_rujukan_spesialis: '',
    });

    const [subSpesialisOptions, setSubSpesialisOptions] = useState<Subspesialis[]>([]);
    const [alasanRujukanOptions, setAlasanRujukanOptions] = useState<string[]>([]);
    const [tujuanRujukanKhususOptions, setTujuanRujukanKhususOptions] = useState<{ kdppk: string; nmppk: string }[]>([]);
    const [tujuanRujukanSpesialisOptions, setTujuanRujukanSpesialisOptions] = useState<{ kdppk: string; nmppk: string }[]>([]);
    const isSubspesialisKhususEnabled = useMemo(
        () => formData.igd_rujukan_khusus === 'THA' || formData.igd_rujukan_khusus === 'HEM',
        [formData.igd_rujukan_khusus],
    );
    const [saranaQuery, setSaranaQuery] = useState('');
    const saranaOptions = useMemo(() => {
        const q = saranaQuery.trim().toLowerCase();
        const filtered = q ? sarana.filter((s) => s.nama.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q)) : sarana;
        return filtered.slice(0, 5);
    }, [sarana, saranaQuery]);
    const [spesialisQuery, setSpesialisQuery] = useState('');
    const spesialisOptions = useMemo(() => {
        const q = spesialisQuery.trim().toLowerCase();
        return q ? spesialis.filter((s) => s.nama.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q)) : spesialis;
    }, [spesialis, spesialisQuery]);
    const limitedSpesialis = useMemo(() => spesialisOptions.slice(0, 5), [spesialisOptions]);
    const limitedSubSpesialis = useMemo(() => subSpesialisOptions.slice(0, 5), [subSpesialisOptions]);
    const [subspesialisKhususQuery, setSubspesialisKhususQuery] = useState('');
    const subspesialisKhususOptions = useMemo(() => {
        const q = subspesialisKhususQuery.trim().toLowerCase();
        return q ? subspesialis.filter((s) => s.nama.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q)) : subspesialis;
    }, [subspesialis, subspesialisKhususQuery]);
    const limitedSubspesialisKhusus = useMemo(() => subspesialisKhususOptions.slice(0, 5), [subspesialisKhususOptions]);

    // Prevent empty detail screen: force user to choose opsi terlebih dahulu
    useEffect(() => {
        if (activeTab === 'detail-rujukan' && !formData.opsi_rujukan) {
            setActiveTab('opsi-rujukan');
        }
    }, [activeTab, formData.opsi_rujukan]);

    // Handle input changes
    const handleInputChange = (name: string, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle jenis rujukan change
    const handleJenisRujukanChange = (value: string) => {
        handleInputChange('jenis_rujukan', value);
        handleInputChange('tujuan_rujukan', '');
        handleInputChange('opsi_rujukan', '');
    };

    // Handle tujuan rujukan change
    const handleTujuanRujukanChange = (value: string) => {
        handleInputChange('tujuan_rujukan', value);
        handleInputChange('opsi_rujukan', '');
    };

    // Handle spesialis change (fetch subspesialis from API to match Blade logic)
    const handleSpesialisChange = async (value: string) => {
        handleInputChange('spesialis', value);
        handleInputChange('sub_spesialis', '');

        try {
            const res = await fetch(`/api/get-subspesialis/${value}`);
            if (!res.ok) throw new Error('Gagal mengambil subspesialis');
            const data = (await res.json()) as Subspesialis[];
            setSubSpesialisOptions(data);
        } catch (e) {
            setSubSpesialisOptions([]);
        }
    };

    // Handle kategori rujukan change
    const handleKategoriRujukanChange = (value: string) => {
        handleInputChange('kategori_rujukan', value);

        // Get alasan rujukan options
        const kategori = Ref_TACC.find((k) => k.kdTacc === value);
        if (kategori) {
            setAlasanRujukanOptions(kategori.alasanTacc);
        } else {
            setAlasanRujukanOptions([]);
        }
    };

    // Handle aktifkan sarana change
    const handleAktifkanSaranaChange = (checked: boolean) => {
        handleInputChange('aktifkan_sarana', checked);
        if (!checked) {
            handleInputChange('sarana', '');
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Record<string, unknown> = {
                nomor_rm: pelayanan.nomor_rm,
                no_rawat: pelayanan.nomor_register,
                penjamin: pelayanan.penjamin,
                tujuan_rujukan: formData.tujuan_rujukan,
                opsi_rujukan: formData.opsi_rujukan,
            };

            if (formData.opsi_rujukan === 'spesialis') {
                payload['sarana'] = formData.aktifkan_sarana ? formData.sarana || null : null;
                payload['kategori_rujukan'] = formData.kategori_rujukan;
                payload['alasanTacc'] = formData.alasan_rujukan || null;
                payload['sub_spesialis'] = formData.sub_spesialis;
                payload['tanggal_rujukan'] = formData.tanggal_rujukan;
                payload['tujuan_rujukan_spesialis'] = formData.tujuan_rujukan_spesialis;
            }

            if (formData.opsi_rujukan === 'rujukan_khusus') {
                payload['igd_rujukan_khusus'] = formData.igd_rujukan_khusus;
                payload['subspesialis_khusus'] = formData.subspesialis_khusus || null;
                payload['tanggal_rujukan_khusus'] = formData.tanggal_rujukan_khusus;
                payload['tujuan_rujukan_khusus'] = formData.tujuan_rujukan_khusus;
            }

            const res = await fetch('/pelayana_rujuk/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Gagal menyimpan data rujukan');
            }
            const data = await res.json();
            if (data?.success === false) {
                throw new Error(data?.message || 'Gagal menyimpan data rujukan');
            }
            window.location.href = `/rujukan/cetak/${pelayanan.nomor_register}`;
        } catch (error: any) {
            alert(error?.message || 'Terjadi kesalahan dalam menyimpan data!');
        }
    };

    const formatTanggal = (raw: string) => {
        if (!raw) return '';
        const [y, m, d] = raw.split('-');
        return `${d}-${m}-${y}`;
    };

    const handleCariProviderSpesialis = async () => {
        const spes = formData.sub_spesialis;
        const sar = formData.sarana || '0';
        const tgl = formatTanggal(formData.tanggal_rujukan);
        if (!spes || !sar || !tgl) {
            alert('Harap isi Sub Spesialis, Sarana, dan Tanggal Rujukan terlebih dahulu.');
            return;
        }
        try {
            const res = await fetch(`/api/pcare/provide_rujuk/${spes}/${sar}/${tgl}`);
            if (!res.ok) throw new Error('Gagal mengambil data provider');
            const json = await res.json();
            const list = (json?.data?.list || []) as Array<{ kdppk: string; nmppk: string }>;
            setTujuanRujukanSpesialisOptions(list);
        } catch (e: any) {
            alert(e?.message || 'Terjadi kesalahan saat mengambil data provider.');
        }
    };

    const handleCariProviderKhusus = async () => {
        const tujuan = formData.igd_rujukan_khusus;
        const subkhusus = formData.subspesialis_khusus;
        const nobpjs = pelayanan.no_bpjs || '0';
        const tgl = formatTanggal(formData.tanggal_rujukan_khusus);
        if (!tujuan || !nobpjs || !tgl) {
            alert('Harap isi Spesialis, No BPJS, dan Tanggal Rujukan terlebih dahulu.');
            return;
        }
        let url = '';
        if (subkhusus) {
            url = `/api/pcare/provide_rujuk_husus_subspesialis/${subkhusus}/${tujuan}/${nobpjs}/${tgl}`;
        } else {
            url = `/api/pcare/provide_rujuk_husus/${tujuan}/${nobpjs}/${tgl}`;
        }
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Gagal mengambil data provider');
            const json = await res.json();
            const list = (json?.data?.list || []) as Array<{ kdppk: string; nmppk: string }>;
            setTujuanRujukanKhususOptions(list);
        } catch (e: any) {
            alert(e?.message || 'Terjadi kesalahan saat mengambil data provider.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelayanan Rujuk" />

            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pelayanan Rujuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Patient Information */}
                        <div className="mb-6 rounded-lg border border-border bg-card p-4">
                            <h3 className="mb-3 text-lg font-semibold text-card-foreground">Informasi Pasien</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium">Nomor RM</Label>
                                    <Input value={pelayanan.nomor_rm || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nama</Label>
                                    <Input value={pelayanan.nama || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nomor Rawat</Label>
                                    <Input value={pelayanan.nomor_register || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Jenis Kelamin</Label>
                                    <Input value={pelayanan.jenis_kelamin || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Penjamin</Label>
                                    <Input value={pelayanan.penjamin || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Tanggal Lahir</Label>
                                    <Input value={pelayanan.tanggal_lahir || ''} readOnly />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Umur</Label>
                                    <Input value={pelayanan.umur || ''} readOnly />
                                </div>
                                <div className="hidden">
                                    <Input type="hidden" value={pelayanan.no_bpjs || ''} readOnly />
                                </div>
                            </div>
                        </div>

                        {/* Rujukan Form */}
                        <form onSubmit={handleSubmit}>
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="jenis-rujukan">Jenis Rujukan</TabsTrigger>
                                    <TabsTrigger value="opsi-rujukan">Opsi Rujukan</TabsTrigger>
                                    <TabsTrigger value="detail-rujukan">Detail Rujukan</TabsTrigger>
                                </TabsList>

                                <TabsContent value="jenis-rujukan">
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <Label htmlFor="jenis_rujukan">Jenis Rujukan</Label>
                                            <Select value={formData.jenis_rujukan} onValueChange={handleJenisRujukanChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Jenis Rujukan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sehat">Sehat</SelectItem>
                                                    <SelectItem value="sakit">Sakit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="tujuan_rujukan">Tujuan Rujukan</Label>
                                            <Select
                                                value={formData.tujuan_rujukan}
                                                onValueChange={handleTujuanRujukanChange}
                                                disabled={!formData.jenis_rujukan}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Tujuan Rujukan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formData.jenis_rujukan === 'sehat' && (
                                                        <SelectItem value="develop" disabled>
                                                            Develop
                                                        </SelectItem>
                                                    )}
                                                    {formData.jenis_rujukan === 'sakit' && (
                                                        <>
                                                            <SelectItem value="horizontal">Horizontal</SelectItem>
                                                            <SelectItem value="vertikal">Vertikal</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                onClick={() => setActiveTab('opsi-rujukan')}
                                                disabled={!formData.jenis_rujukan || !formData.tujuan_rujukan}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="opsi-rujukan">
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <Label htmlFor="opsi_rujukan">Opsi Rujukan</Label>
                                            <Select
                                                value={formData.opsi_rujukan}
                                                onValueChange={(value) => handleInputChange('opsi_rujukan', value)}
                                                disabled={!formData.tujuan_rujukan}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Opsi Rujukan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formData.tujuan_rujukan === 'vertikal' && (
                                                        <>
                                                            <SelectItem value="rujukan_khusus">Rujukan Khusus</SelectItem>
                                                            <SelectItem value="spesialis">Spesialis</SelectItem>
                                                        </>
                                                    )}
                                                    {formData.tujuan_rujukan === 'horizontal' && (
                                                        <>
                                                            <SelectItem value="opsi_horizontal_1">Pelayanan Tindakan Non-Kapitasi</SelectItem>
                                                            <SelectItem value="opsi_horizontal_2">Pelayanan Laboratorium</SelectItem>
                                                            <SelectItem value="opsi_horizontal_3">Pelayanan Program</SelectItem>
                                                            <SelectItem value="opsi_horizontal_4">Rujukan Kacamata</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex justify-between">
                                            <Button type="button" variant="outline" onClick={() => setActiveTab('jenis-rujukan')}>
                                                Previous
                                            </Button>
                                            <Button type="button" onClick={() => setActiveTab('detail-rujukan')} disabled={!formData.opsi_rujukan}>
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="detail-rujukan">
                                    <div className="mt-4 space-y-6">
                                        {/* Rujukan Khusus */}
                                        {formData.opsi_rujukan === 'rujukan_khusus' && (
                                            <div className="space-y-4 rounded-lg border p-4">
                                                <h3 className="text-lg font-semibold">Rujukan Khusus</h3>

                                                <div>
                                                    <Label htmlFor="igd_rujukan_khusus">Tujuan</Label>
                                                    <Select
                                                        value={formData.igd_rujukan_khusus}
                                                        onValueChange={(value) => handleInputChange('igd_rujukan_khusus', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Tujuan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="IGD">IGD</SelectItem>
                                                            <SelectItem value="HDL">HDL</SelectItem>
                                                            <SelectItem value="JIW">JIW</SelectItem>
                                                            <SelectItem value="KLT">KLT</SelectItem>
                                                            <SelectItem value="PAR">PAR</SelectItem>
                                                            <SelectItem value="KEM">KEM</SelectItem>
                                                            <SelectItem value="RAT">RAT</SelectItem>
                                                            <SelectItem value="HIV">HIV</SelectItem>
                                                            <SelectItem value="THA">THA</SelectItem>
                                                            <SelectItem value="HEM">HEM</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="subspesialis_khusus">Subspesialis Khusus</Label>
                                                    <Select
                                                        value={formData.subspesialis_khusus}
                                                        onValueChange={(value) => handleInputChange('subspesialis_khusus', value)}
                                                        disabled={!isSubspesialisKhususEnabled}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Subspesialis Khusus" />
                                                        </SelectTrigger>
                                                        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                                                            <div className="p-2">
                                                                <div className="relative">
                                                                    <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                                    <Input
                                                                        placeholder="Cari subspesialis berdasarkan kode atau nama..."
                                                                        value={subspesialisKhususQuery}
                                                                        onChange={(e) => setSubspesialisKhususQuery(e.target.value)}
                                                                        className="mb-2 pl-8"
                                                                        onKeyDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                {subspesialisKhususQuery && (
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Ditemukan {subspesialisKhususOptions.length} subspesialis
                                                                        </p>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSubspesialisKhususQuery('')}
                                                                            className="h-6 px-2 text-xs"
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                        >
                                                                            Reset
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {limitedSubspesialisKhusus.map((item) => (
                                                                <SelectItem key={item.kode} value={item.kode}>
                                                                    {item.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="tanggal_rujukan_khusus">Tanggal Rujukan</Label>
                                                    <Input
                                                        type="date"
                                                        id="tanggal_rujukan_khusus"
                                                        value={formData.tanggal_rujukan_khusus}
                                                        onChange={(e) => handleInputChange('tanggal_rujukan_khusus', e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="tujuan_rujukan_khusus">Tujuan Rujukan</Label>
                                                    <Select
                                                        value={formData.tujuan_rujukan_khusus}
                                                        onValueChange={(value) => handleInputChange('tujuan_rujukan_khusus', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Tujuan Rujukan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {tujuanRujukanKhususOptions.map((item) => (
                                                                <SelectItem key={item.kdppk} value={item.kdppk}>
                                                                    {item.nmppk} ({item.kdppk})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button type="button" onClick={handleCariProviderKhusus}>
                                                    <i className="fas fa-search"></i> Cari Provider
                                                </Button>
                                            </div>
                                        )}

                                        {/* Spesialis */}
                                        {formData.opsi_rujukan === 'spesialis' && (
                                            <div className="space-y-4 rounded-lg border p-4">
                                                <h3 className="text-lg font-semibold">Spesialis</h3>

                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="aktifkan_sarana"
                                                        checked={formData.aktifkan_sarana}
                                                        onChange={(e) => handleAktifkanSaranaChange(e.target.checked)}
                                                        className="form-checkbox"
                                                    />
                                                    <Label htmlFor="aktifkan_sarana">Aktifkan Pilihan Sarana</Label>
                                                </div>

                                                {formData.aktifkan_sarana && (
                                                    <div>
                                                        <Label htmlFor="sarana">Sarana</Label>
                                                        <Select value={formData.sarana} onValueChange={(value) => handleInputChange('sarana', value)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Sarana" />
                                                            </SelectTrigger>
                                                            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                                                                <div className="p-2">
                                                                    <div className="relative">
                                                                        <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                                        <Input
                                                                            placeholder="Cari sarana berdasarkan kode atau nama..."
                                                                            value={saranaQuery}
                                                                            onChange={(e) => setSaranaQuery(e.target.value)}
                                                                            className="mb-2 pl-8"
                                                                            onKeyDown={(e) => e.stopPropagation()}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                    {saranaQuery && (
                                                                        <div className="mb-2 flex items-center justify-between">
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Ditemukan {saranaOptions.length} sarana
                                                                            </p>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setSaranaQuery('')}
                                                                                className="h-6 px-2 text-xs"
                                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                            >
                                                                                Reset
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <SelectItem value="tidak ada">tidak ada</SelectItem>
                                                                {saranaOptions.length > 0 ? (
                                                                    saranaOptions.map((item, idx) => (
                                                                        <SelectItem key={`${item.kode}-${idx}`} value={item.kode}>
                                                                            <div className="flex flex-col">
                                                                                <div className="font-medium" title={item.nama}>
                                                                                    {item.nama.length > 40
                                                                                        ? `${item.nama.substring(0, 40)}...`
                                                                                        : item.nama}
                                                                                </div>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-2 text-center text-muted-foreground">
                                                                        {saranaQuery ? 'Tidak ada sarana ditemukan' : 'Tidak ada data sarana'}
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                <div>
                                                    <Label htmlFor="kategori_rujukan">Kategori Rujukan</Label>
                                                    <Select value={formData.kategori_rujukan} onValueChange={handleKategoriRujukanChange}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Kategori" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Ref_TACC.map((kategori) => (
                                                                <SelectItem key={kategori.kdTacc} value={kategori.kdTacc}>
                                                                    {kategori.nmTacc}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="alasan_rujukan">Alasan Rujukan Spesialis</Label>
                                                    <Select
                                                        value={formData.alasan_rujukan}
                                                        onValueChange={(value) => handleInputChange('alasan_rujukan', value)}
                                                        disabled={!formData.kategori_rujukan}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Alasan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {alasanRujukanOptions.map((alasan, index) => (
                                                                <SelectItem key={index} value={alasan}>
                                                                    {alasan}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="spesialis">Spesialis</Label>
                                                    <Select value={formData.spesialis} onValueChange={handleSpesialisChange}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Spesialis" />
                                                        </SelectTrigger>
                                                        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                                                            <div className="p-2">
                                                                <div className="relative">
                                                                    <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                                    <Input
                                                                        placeholder="Cari spesialis berdasarkan kode atau nama..."
                                                                        value={spesialisQuery}
                                                                        onChange={(e) => setSpesialisQuery(e.target.value)}
                                                                        className="mb-2 pl-8"
                                                                        onKeyDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                {spesialisQuery && (
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Ditemukan {spesialisOptions.length} spesialis
                                                                        </p>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSpesialisQuery('')}
                                                                            className="h-6 px-2 text-xs"
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                        >
                                                                            Reset
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {limitedSpesialis.map((item) => (
                                                                <SelectItem key={item.kode} value={item.kode}>
                                                                    {item.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="sub_spesialis">Sub Spesialis</Label>
                                                    <Select
                                                        value={formData.sub_spesialis}
                                                        onValueChange={(value) => handleInputChange('sub_spesialis', value)}
                                                        disabled={!formData.spesialis}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Sub Spesialis" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {limitedSubSpesialis.map((item) => (
                                                                <SelectItem key={item.kode} value={item.kode}>
                                                                    {item.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="tanggal_rujukan">Tanggal Rujukan</Label>
                                                    <Input
                                                        type="date"
                                                        id="tanggal_rujukan"
                                                        value={formData.tanggal_rujukan}
                                                        onChange={(e) => handleInputChange('tanggal_rujukan', e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="tujuan_rujukan_spesialis">Tujuan Rujukan</Label>
                                                    <Select
                                                        value={formData.tujuan_rujukan_spesialis}
                                                        onValueChange={(value) => handleInputChange('tujuan_rujukan_spesialis', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Tujuan Rujukan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {tujuanRujukanSpesialisOptions.map((item) => (
                                                                <SelectItem key={item.kdppk} value={item.kdppk}>
                                                                    {item.nmppk} ({item.kdppk})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button type="button" onClick={handleCariProviderSpesialis}>
                                                    <i className="fas fa-search"></i> Cari Provider
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <Button type="button" variant="outline" onClick={() => setActiveTab('opsi-rujukan')}>
                                                Previous
                                            </Button>
                                            <Button type="submit">Submit</Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

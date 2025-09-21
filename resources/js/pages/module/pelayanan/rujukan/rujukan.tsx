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
import { Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';

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
    existingRujukan?: any;
    isKia?: boolean;
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
    const { pelayanan, Ref_TACC, subspesialis, sarana, spesialis, existingRujukan, isKia } = usePage().props as unknown as PageProps;

    const [activeTab, setActiveTab] = useState('jenis-rujukan');
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
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

    // Load existing rujukan data if available
    useEffect(() => {
        if (existingRujukan) {
            console.log('Loading existing rujukan data:', existingRujukan);
            setFormData({
                jenis_rujukan: existingRujukan.jenis_rujukan || '',
                tujuan_rujukan: existingRujukan.tujuan_rujukan || '',
                opsi_rujukan: existingRujukan.opsi_rujukan || '',
                igd_rujukan_khusus: existingRujukan.igd_rujukan_khusus || '',
                subspesialis_khusus: existingRujukan.subspesialis_khusus || '',
                tanggal_rujukan_khusus: existingRujukan.tanggal_rujukan_khusus || '',
                tujuan_rujukan_khusus: existingRujukan.tujuan_rujukan_khusus || '',
                aktifkan_sarana: !!existingRujukan.sarana,
                sarana: existingRujukan.sarana || '',
                kategori_rujukan: existingRujukan.kategori_rujukan || '',
                alasan_rujukan: existingRujukan.alasanTacc || '',
                spesialis: existingRujukan.spesialis || '',
                sub_spesialis: existingRujukan.sub_spesialis || '',
                tanggal_rujukan: existingRujukan.tanggal_rujukan || '',
                tujuan_rujukan_spesialis: existingRujukan.tujuan_rujukan_spesialis || '',
            });

            // Show toast if data exists
            toast.success('Data rujukan sudah tersimpan di database. Anda dapat mengedit atau mencetak ulang.');
        }
    }, [existingRujukan]);

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

    // Fungsi untuk print document dengan iframe (sama seperti di permintaan)
    const printDocument = (url: string) => {
        try {
            // Buat iframe tersembunyi untuk print
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            
            document.body.appendChild(iframe);
            
            iframe.onload = () => {
                try {
                    // Tunggu sebentar untuk memastikan konten terload
                    setTimeout(() => {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                        
                        // Deteksi kapan print dialog ditutup
                        let printCompleted = false;
                        
                        const cleanup = () => {
                            if (!printCompleted && document.body.contains(iframe)) {
                                printCompleted = true;
                                setTimeout(() => {
                                    if (document.body.contains(iframe)) {
                                        document.body.removeChild(iframe);
                                    }
                                }, 2000); // Tunggu 2 detik setelah print
                            }
                        };
                        
                        // Event listener untuk mendeteksi print dialog
                        iframe.contentWindow?.addEventListener('afterprint', cleanup);
                        iframe.contentWindow?.addEventListener('beforeprint', () => {
                            console.log('Print dialog opened');
                        });
                        
                        // Fallback jika event tidak terdeteksi - tunggu lebih lama
                        setTimeout(() => {
                            if (!printCompleted) {
                                cleanup();
                            }
                        }, 5000); // Fallback setelah 5 detik
                    }, 1000);
                } catch (e) {
                    console.error('Print error:', e);
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }
            };
            
            iframe.onerror = () => {
                console.error('Failed to load print document');
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                setErrorMessage('Gagal memuat dokumen untuk dicetak');
                setErrorOpen(true);
            };
            
            iframe.src = url;
        } catch (error) {
            console.error('Print setup error:', error);
            setErrorMessage('Gagal menyiapkan dokumen untuk dicetak');
            setErrorOpen(true);
        }
    };

    // Fungsi untuk menyimpan data ke database
    const saveRujukanData = async () => {
        try {
            const payload: Record<string, unknown> = {
                nomor_rm: pelayanan.nomor_rm,
                no_rawat: pelayanan.nomor_register,
                penjamin: pelayanan.penjamin,
                jenis_rujukan: formData.jenis_rujukan,
                tujuan_rujukan: formData.tujuan_rujukan,
                opsi_rujukan: formData.opsi_rujukan,
            };

            if (formData.opsi_rujukan === 'spesialis') {
                payload['sarana'] = formData.aktifkan_sarana ? formData.sarana || null : null;
                payload['kategori_rujukan'] = formData.kategori_rujukan;
                payload['alasanTacc'] = formData.alasan_rujukan || null;
                payload['spesialis'] = formData.spesialis;
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

            console.log('Saving rujukan data:', payload);

            const res = await fetch('/pelayanan/rujukan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                let json: any = null;
                try {
                    json = await res.json();
                } catch (_) {}
                
                if (json?.success) {
                    return { success: true, data: json.data };
                }
                
                return { success: true, data: null };
            }
            
            let message = 'Gagal menyimpan data rujukan';
            try {
                const err = await res.json();
                message = err?.message || message;
            } catch (_) {
                try {
                    const text = await res.text();
                    if (text && !/^<!DOCTYPE/i.test(text.trim())) message = text;
                } catch (_) {}
            }
            throw new Error(message);
        } catch (error: any) {
            console.error('Save error:', error);
            throw error;
        }
    };

    // Handle simpan saja (database)
    const handleSimpan = async () => {
        try {
            await saveRujukanData();
            toast.success('Rujukan berhasil disimpan ke database!');
            setShowConfirmModal(false);
        } catch (error: any) {
            toast.error('Gagal menyimpan rujukan: ' + (error?.message || 'Unknown error'));
        }
    };

    // Handle simpan + print
    const handlePrint = async () => {
        try {
            await saveRujukanData();
            toast.success('Rujukan disimpan dan sedang dicetak!');
            setShowConfirmModal(false);
            
            // Print document dengan delay untuk memastikan data tersimpan
            setTimeout(() => {
                // Coba dengan route alias tanpa prefix
                const printUrl = `/rujukan/cetak/${pelayanan.nomor_register}`;               
                printDocument(printUrl);
            }, 1000); // Tambah delay lebih lama
        } catch (error: any) {
            toast.error('Gagal menyimpan dan mencetak rujukan: ' + (error?.message || 'Unknown error'));
        }
    };

    // Handle form submission - tampilkan modal konfirmasi
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const formatTanggal = (raw: string) => {
        // Backend expects Y-m-d; input type="date" already provides this
        return raw || '';
    };

    const handleCariProviderSpesialis = async () => {
        const spes = formData.sub_spesialis;
        const sar = formData.sarana || '0';
        const tgl = formatTanggal(formData.tanggal_rujukan);
        if (!spes || !sar || !tgl) {
            toast.error('Harap isi Sub Spesialis, Sarana, dan Tanggal Rujukan terlebih dahulu.');
            return;
        }
        try {
            const res = await fetch(
                `/api/pelayanan-rujukan/get-faskes-rujukan-subspesialis?subspesialis=${encodeURIComponent(spes)}&sarana=${encodeURIComponent(sar)}&tgl=${encodeURIComponent(tgl)}`,
            );
            let json: any = null;
            try {
                json = await res.json();
            } catch (_) {}
            if (!res.ok || json?.status === 'error') {
                throw new Error(json?.message || 'Gagal mengambil data provider');
            }
            const list = (json?.data?.list || []) as Array<{ kdppk: string; nmppk: string }>;
            setTujuanRujukanSpesialisOptions(list);
            toast.success(`Berhasil! Ditemukan ${list.length} provider.`);
        } catch (e: any) {
            toast.error(e?.message || 'Terjadi kesalahan saat mengambil data provider.');
        }
    };

    const handleCariProviderKhusus = async () => {
        const tujuan = formData.igd_rujukan_khusus;
        const subkhusus = formData.subspesialis_khusus;
        const nobpjs = pelayanan.no_bpjs || '0';
        const tgl = formatTanggal(formData.tanggal_rujukan_khusus);
        if (!tujuan || !nobpjs || !tgl) {
            toast.error('Harap isi Spesialis, No BPJS, dan Tanggal Rujukan terlebih dahulu.');
            return;
        }
        let url = '';
        if (subkhusus) {
            url = `/api/pelayanan-rujukan/get-faskes-rujukan-khusus-subspesialis?khusus=${encodeURIComponent(tujuan)}&subspesialis=${encodeURIComponent(subkhusus)}&nokartu=${encodeURIComponent(nobpjs)}&tgl=${encodeURIComponent(tgl)}`;
        } else {
            url = `/api/pelayanan-rujukan/get-faskes-rujukan-khusus?khusus=${encodeURIComponent(tujuan)}&nokartu=${encodeURIComponent(nobpjs)}&tgl=${encodeURIComponent(tgl)}`;
        }
        try {
            const res = await fetch(url);
            let json: any = null;
            try {
                json = await res.json();
            } catch (_) {}
            if (!res.ok || json?.status === 'error') {
                throw new Error(json?.message || 'Gagal mengambil data provider');
            }
            const list = (json?.data?.list || []) as Array<{ kdppk: string; nmppk: string }>;
            setTujuanRujukanKhususOptions(list);
            toast.success(`Berhasil! Ditemukan ${list.length} provider.`);
        } catch (e: any) {
            toast.error(e?.message || 'Terjadi kesalahan saat mengambil data provider.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelayanan Rujuk" />

            <div className="space-y-6 p-6">
                {errorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setErrorOpen(false)}></div>
                        <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg">
                            <h3 className="mb-2 text-lg font-semibold text-card-foreground">Terjadi Kesalahan</h3>
                            <p className="mb-4 text-sm text-muted-foreground">{errorMessage}</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setErrorOpen(false)}>
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Konfirmasi Simpan/Print */}
                <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Rujukan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Pilih aksi yang ingin dilakukan dengan data rujukan ini:
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button 
                                    onClick={handleSimpan}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <i className="fas fa-save mr-2"></i>
                                    Simpan ke Database
                                </Button>
                                <Button 
                                    onClick={handlePrint}
                                    className="w-full"
                                >
                                    <i className="fas fa-print mr-2"></i>
                                    Simpan & Print
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Batal
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Pelayanan Rujuk</span>
                            {existingRujukan && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Data tersimpan di database</span>
                                </div>
                            )}
                        </CardTitle>
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
                                                        className="dark:[&::-webkit-calendar-picker-indicator]:invert"
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
                                                        className="dark:[&::-webkit-calendar-picker-indicator]:invert"
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
            <Toaster position="top-right" />
        </AppLayout>
    );
}

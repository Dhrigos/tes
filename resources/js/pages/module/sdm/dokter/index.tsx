'use client';

import LaravoltIndonesiaExample from '@/components/LaravoltIndonesiaExample';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit, Eye, Plus, Search, Stethoscope, Trash2, User, UserCheck, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Dokter {
    id: number;
    nama?: string;
    jadwals?: Array<{
        hari: string;
        jam_mulai: string | null;
        jam_selesai: string | null;
        kuota: number;
        aktif: boolean;
    }>;
    nik?: string;
    npwp?: string;
    poli?: number;
    kode: string;
    kode_satu?: string;
    tgl_masuk?: string;
    status_pegawaian?: number;
    sip?: string;
    exp_spri?: string;
    str?: string;
    exp_str?: string;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    alamat?: string;
    rt?: string;
    rw?: string;
    kode_pos?: string;
    kewarganegaraan?: string;
    seks?: 'L' | 'P';
    agama?: number;
    pendidikan?: number;
    goldar?: number;
    pernikahan?: number;
    telepon?: string;
    provinsi_kode?: string;
    kabupaten_kode?: string;
    kecamatan_kode?: string;
    desa_kode?: string;
    suku?: number;
    bahasa?: number;
    bangsa?: number;
    verifikasi?: number;
    users?: number;
    user_id_input?: number;
    user_name_input?: string;
    foto?: string;
    // Relasi
    namapoli?: {
        id: number;
        nama: string;
        kode?: string;
    };
    namastatuspegawai?: {
        id: number;
        nama: string;
    };
    // Data untuk editing alamat
    provinsi_data?: {
        id: number;
        name: string;
        code: string;
    };
    kabupaten_data?: {
        id: number;
        name: string;
        code: string;
    };
    kecamatan_data?: {
        id: number;
        name: string;
        code: string;
    };
    desa_data?: {
        id: number;
        name: string;
        code: string;
    };
}

interface PageProps {
    dokters: {
        data: Dokter[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totalDokter: number;
    dokterVerifikasi: number;
    dokterBelumVerifikasi: number;
    dokterBulanIni: number;
    poli: Array<{ id: number; nama: string }>;
    posker: Array<{ id: number; nama: string }>;
    provinsi: Array<{ id: number; name: string; code: string }>;
    kelamin: Array<{ id: number; nama: string }>;
    goldar: Array<{ id: number; nama: string; rhesus?: string }>;
    pernikahan: Array<{ id: number; nama: string }>;
    agama: Array<{ id: number; nama: string }>;
    pendidikan: Array<{ id: number; nama: string }>;
    suku: Array<{ id: number; nama: string }>;
    bangsa: Array<{ id: number; nama: string }>;
    bahasa: Array<{ id: number; nama: string }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Modul SDM', href: '' },
    { title: 'Data Dokter', href: '' },
];

export default function DokterIndex() {
    const {
        dokters,
        totalDokter,
        dokterVerifikasi,
        dokterBelumVerifikasi,
        dokterBulanIni,
        poli,
        posker,
        provinsi,
        kelamin,
        goldar,
        pernikahan,
        agama,
        pendidikan,
        suku,
        bangsa,
        bahasa,
        flash,
        errors,
    } = usePage().props as unknown as PageProps & {
        errors?: any;
    };

    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'show'>('create');
    const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const isReadOnly = modalMode === 'show';
    // Verifikasi modal state
    const [verifOpen, setVerifOpen] = useState(false);
    const [verifDokter, setVerifDokter] = useState<Dokter | null>(null);
    type PendidikanItem = {
        jenjang: string;
        institusi?: string;
        tahun_lulus?: string;
        nomor_ijazah?: string;
        file_ijazah?: File | null;
    };
    type PelatihanItem = {
        nama_pelatihan: string;
        penyelenggara?: string;
        tanggal_mulai?: string;
        tanggal_selesai?: string;
        nomor_sertifikat?: string;
        file_sertifikat?: File | null;
    };
    const [pendidikans, setPendidikans] = useState<PendidikanItem[]>([
        { jenjang: '', institusi: '', tahun_lulus: '', nomor_ijazah: '', file_ijazah: null },
    ]);
    const [pelatihans, setPelatihans] = useState<PelatihanItem[]>([]);
    // Mulai tanpa baris pelatihan (opsional)
    useEffect(() => {
        setPelatihans([]);
    }, []);

    // State untuk data dari API eksternal
    const [externalDokterData, setExternalDokterData] = useState<any>(null);
    const [isLoadingExternal, setIsLoadingExternal] = useState(false);
    const [externalSearchQuery, setExternalSearchQuery] = useState('');

    // Saran dokter dari /api/get_dokter
    const [dokterOptions, setDokterOptions] = useState<Array<{ kode: string; nama: string }>>([]);
    const [isLoadingDokter, setIsLoadingDokter] = useState(false);
    const [showDokterList, setShowDokterList] = useState(false);
    const [isNamaFocused, setIsNamaFocused] = useState(false);
    const namaRef = useRef<HTMLInputElement | null>(null);
    const lastPickedNameRef = useRef<string>('');

    const defaultPosisiDokter = posker.find((p) => (p.nama || '').toLowerCase().includes('dokter'))?.id.toString() || '';
    // Helper pendidikan dinamis: gunakan urutan daftar `pendidikan` dari server; abaikan entri level-0 (nama mengandung "tidak")
    const isLevelZeroName = (name?: string) => {
        const n = (name || '').toLowerCase();
        return !n || n.includes('tidak');
    };
    const buildEducationChainFromList = (highestIdOrName?: string) => {
        const items = pendidikan || [];
        if (!highestIdOrName)
            return [] as Array<{ jenjang: string; institusi?: string; tahun_lulus?: string; nomor_ijazah?: string; file_ijazah?: File | null }>;
        let targetIndex = items.findIndex((p) => p.id.toString() === highestIdOrName);
        if (targetIndex === -1) {
            const needle = highestIdOrName.toLowerCase();
            targetIndex = items.findIndex((p) => (p.nama || '').toLowerCase() === needle);
        }
        if (targetIndex === -1)
            return [] as Array<{ jenjang: string; institusi?: string; tahun_lulus?: string; nomor_ijazah?: string; file_ijazah?: File | null }>;
        let startIndex = 0;
        while (startIndex <= targetIndex && isLevelZeroName(items[startIndex]?.nama)) startIndex++;
        const chain: Array<{ jenjang: string; institusi?: string; tahun_lulus?: string; nomor_ijazah?: string; file_ijazah?: File | null }> = [];
        for (let i = startIndex; i <= targetIndex; i++) {
            const name = items[i]?.nama;
            if (!isLevelZeroName(name)) {
                chain.push({ jenjang: name, institusi: '', tahun_lulus: '', nomor_ijazah: '', file_ijazah: null });
            }
        }
        return chain;
    };

    const [formData, setFormData] = useState({
        nama: '',
        kode: '',
        poli: '',
        nik: '',
        npwp: '',
        kode_satu: '',
        str: '',
        exp_str: '',
        sip: '',
        exp_spri: '',
        tgl_masuk: '',
        status_pegawaian: defaultPosisiDokter,
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        rt: '',
        rw: '',
        kode_pos: '',
        alamat: '',
        seks: '',
        goldar: '',
        pernikahan: '',
        kewarganegaraan: '',
        agama: '',
        pendidikan: '',
        telepon: '',
        suku: '',
        bangsa: '',
        bahasa: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        foto: null as File | null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Auto-search dokter eksternal ketika user mengetik
    // Autocomplete dokter dari /api/get_dokter berdasarkan input nama (hanya saat input fokus)
    useEffect(() => {
        const q = (formData.nama || '').trim();
        // Jangan tampilkan list jika input tidak fokus, pendek, atau sama dengan pilihan terakhir
        if (!isNamaFocused || q.length < 2 || q === lastPickedNameRef.current) {
            setDokterOptions([]);
            setShowDokterList(false);
            return;
        }
        const timeoutId = setTimeout(async () => {
            try {
                setIsLoadingDokter(true);
                const res = await fetch('/api/get_dokter');
                const json = await res.json();
                if (json && json.status === 'success' && Array.isArray(json.data)) {
                    // Optional filter di client agar list relevan dengan ketikan
                    const needle = q.toLowerCase();
                    const filtered = (json.data as Array<{ kode: string; nama: string }>)
                        .filter((d) => d.nama?.toLowerCase().includes(needle) || d.kode?.toLowerCase().includes(needle))
                        .slice(0, 10);
                    setDokterOptions(filtered);
                    setShowDokterList(true);
                } else {
                    setDokterOptions([]);
                    setShowDokterList(false);
                }
            } catch (e) {
                setDokterOptions([]);
                setShowDokterList(false);
            } finally {
                setIsLoadingDokter(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [formData.nama, isNamaFocused]);

    const stats = [
        { label: 'Total Dokter', value: totalDokter, icon: Users, color: 'bg-blue-500' },
        { label: 'Terverifikasi', value: dokterVerifikasi, icon: UserCheck, color: 'bg-green-500' },
        { label: 'Belum Verifikasi', value: dokterBelumVerifikasi, icon: User, color: 'bg-red-500' },
        { label: 'Bulan Ini', value: dokterBulanIni, icon: Stethoscope, color: 'bg-purple-500' },
    ];

    const filteredDokters = dokters.data.filter(
        (dokter: Dokter) =>
            (dokter.user_name_input || '').toLowerCase().includes(search.toLowerCase()) ||
            dokter.kode.toLowerCase().includes(search.toLowerCase()) ||
            (dokter.namapoli?.nama || '').toLowerCase().includes(search.toLowerCase()),
    );

    // Helper functions
    const resetForm = () => {
        setFormData({
            nama: '',
            kode: '',
            poli: '',
            nik: '',
            npwp: '',
            kode_satu: '',
            str: '',
            exp_str: '',
            sip: '',
            exp_spri: '',
            tgl_masuk: '',
            status_pegawaian: defaultPosisiDokter,
            provinsi: '',
            kabupaten: '',
            kecamatan: '',
            desa: '',
            rt: '',
            rw: '',
            kode_pos: '',
            alamat: '',
            seks: '',
            goldar: '',
            pernikahan: '',
            kewarganegaraan: '',
            agama: '',
            pendidikan: '',
            telepon: '',
            suku: '',
            bangsa: '',
            bahasa: '',
            tempat_lahir: '',
            tanggal_lahir: '',
            foto: null,
        });
        setImagePreview(null);
        setCurrentStep(1);
    };

    // Fungsi untuk mencari dokter dari API eksternal
    const searchExternalDokter = async (nama: string) => {
        if (!nama.trim()) {
            setExternalDokterData(null);
            return;
        }

        setIsLoadingExternal(true);
        try {
            const params = new URLSearchParams({ nama, offset: '0', limit: '10' });
            const response = await fetch(`/sdm/dokter/search?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();
                setExternalDokterData(data);
            } else {
                setExternalDokterData(null);
            }
        } catch (error) {
            setExternalDokterData(null);
        } finally {
            setIsLoadingExternal(false);
        }
    };

    // Tidak ada pengisian otomatis saat ini; hanya menampilkan hasil

    const fillFormWithDokter = (dokter: Dokter) => {
        setFormData({
            nama: dokter.nama || dokter.user_name_input || '',
            kode: dokter.kode,
            poli: dokter.poli?.toString() || '',
            nik: dokter.nik || '',
            npwp: dokter.npwp || '',
            kode_satu: dokter.kode_satu || '',
            str: dokter.str || '',
            exp_str: dokter.exp_str || '',
            sip: dokter.sip || '',
            exp_spri: dokter.exp_spri || '',
            tgl_masuk: dokter.tgl_masuk || '',
            status_pegawaian: dokter.status_pegawaian?.toString() || '',
            provinsi: dokter.provinsi_data?.code || dokter.provinsi_data?.id.toString() || '',
            kabupaten: dokter.kabupaten_data?.code || dokter.kabupaten_data?.id.toString() || '',
            kecamatan: dokter.kecamatan_data?.code || dokter.kecamatan_data?.id.toString() || '',
            desa: dokter.desa_data?.code || dokter.desa_data?.id.toString() || '',
            rt: dokter.rt || '',
            rw: dokter.rw || '',
            kode_pos: dokter.kode_pos || '',
            alamat: dokter.alamat || '',
            seks: dokter.seks || '',
            goldar: dokter.goldar?.toString() || '',
            pernikahan: dokter.pernikahan?.toString() || '',
            kewarganegaraan: dokter.kewarganegaraan || '',
            agama: dokter.agama?.toString() || '',
            pendidikan: dokter.pendidikan?.toString() || '',
            telepon: dokter.telepon || '',
            suku: dokter.suku?.toString() || '',
            bangsa: dokter.bangsa?.toString() || '',
            bahasa: dokter.bahasa?.toString() || '',
            tempat_lahir: dokter.tempat_lahir || '',
            tanggal_lahir: dokter.tanggal_lahir || '',
            foto: null,
        });
        setImagePreview(dokter.foto ? `/storage/dokter/${dokter.foto}` : null);
        setCurrentStep(1);
    };

    // Modal handlers
    const handleAdd = () => {
        setModalMode('create');
        setSelectedDokter(null);
        resetForm();
        setModalOpen(true);
        // Reset data eksternal
        setExternalDokterData(null);
        setExternalSearchQuery('');
    };

    const handleEdit = (dokter: Dokter) => {
        setModalMode('edit');
        setSelectedDokter(dokter);
        fillFormWithDokter(dokter);
        setModalOpen(true);
        // Reset data eksternal
        setExternalDokterData(null);
        setExternalSearchQuery('');
    };

    const handleShow = (dokter: Dokter) => {
        setModalMode('show');
        setSelectedDokter(dokter);
        fillFormWithDokter(dokter);
        setModalOpen(true);
        // Reset data eksternal
        setExternalDokterData(null);
        setExternalSearchQuery('');
    };
    // Verifikasi handlers
    const handleOpenVerifikasi = (dokter: Dokter) => {
        setVerifDokter(dokter);
        const selectedPendidikanId = dokter.pendidikan?.toString() || formData.pendidikan || '';
        const chain = buildEducationChainFromList(selectedPendidikanId);
        setPendidikans(chain.length ? chain : [{ jenjang: '', institusi: '', tahun_lulus: '', nomor_ijazah: '', file_ijazah: null }]);
        setPelatihans([]);
        setVerifOpen(true);
    };
    const addPendidikan = () =>
        setPendidikans((prev) => [...prev, { jenjang: '', institusi: '', tahun_lulus: '', nomor_ijazah: '', file_ijazah: null }]);
    const removePendidikan = (idx: number) => setPendidikans((prev) => prev.filter((_, i) => i !== idx));
    const updatePendidikan = (idx: number, key: keyof PendidikanItem, value: string | File | null) => {
        setPendidikans((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
    };
    const addPelatihan = () =>
        setPelatihans((prev) => [
            ...prev,
            { nama_pelatihan: '', penyelenggara: '', tanggal_mulai: '', tanggal_selesai: '', nomor_sertifikat: '', file_sertifikat: null },
        ]);
    const removePelatihan = (idx: number) => setPelatihans((prev) => prev.filter((_, i) => i !== idx));
    const updatePelatihan = (idx: number, key: keyof PelatihanItem, value: string | File | null) => {
        setPelatihans((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
    };
    const submitVerifikasi = () => {
        if (!verifDokter) return;
        const formData = new FormData();
        formData.append('dokter_id', String(verifDokter.id));
        pendidikans.forEach((p, i) => {
            formData.append(`pendidikans[${i}][jenjang]`, p.jenjang);
            if (p.institusi) formData.append(`pendidikans[${i}][institusi]`, p.institusi);
            if (p.tahun_lulus) formData.append(`pendidikans[${i}][tahun_lulus]`, p.tahun_lulus);
            if (p.nomor_ijazah) formData.append(`pendidikans[${i}][nomor_ijazah]`, p.nomor_ijazah);
            if (p.file_ijazah instanceof File) formData.append(`pendidikans[${i}][file_ijazah]`, p.file_ijazah);
        });
        pelatihans.forEach((p, i) => {
            formData.append(`pelatihans[${i}][nama_pelatihan]`, p.nama_pelatihan);
            if (p.penyelenggara) formData.append(`pelatihans[${i}][penyelenggara]`, p.penyelenggara);
            if (p.tanggal_mulai) formData.append(`pelatihans[${i}][tanggal_mulai]`, p.tanggal_mulai);
            if (p.tanggal_selesai) formData.append(`pelatihans[${i}][tanggal_selesai]`, p.tanggal_selesai);
            if (p.nomor_sertifikat) formData.append(`pelatihans[${i}][nomor_sertifikat]`, p.nomor_sertifikat);
            if (p.file_sertifikat instanceof File) formData.append(`pelatihans[${i}][file_sertifikat]`, p.file_sertifikat);
        });
        router.post('/sdm/dokter/verifikasi', formData, {
            onSuccess: () => {
                toast.success('Verifikasi dokter berhasil disimpan');
                setVerifOpen(false);
                setVerifDokter(null);
            },
            onError: () => toast.error('Gagal menyimpan verifikasi'),
        });
    };

    // Form handlers
    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, foto: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (modalMode === 'show') return;

        const url = modalMode === 'edit' ? `/sdm/dokter/${selectedDokter?.id}` : '/sdm/dokter';

        const submitData = new FormData();
        if (modalMode === 'edit') {
            submitData.append('_method', 'PUT');
        }

        // Append all form fields
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'foto' && value instanceof File) {
                submitData.append(key, value);
            } else if (key !== 'foto' && value !== null) {
                submitData.append(key, value.toString());
            }
        });
        // Kirim juga kode wilayah sesuai backend bila diperlukan
        if (formData.provinsi) submitData.append('provinsi_kode', formData.provinsi);
        if (formData.kabupaten) submitData.append('kabupaten_kode', formData.kabupaten);
        if (formData.kecamatan) submitData.append('kecamatan_kode', formData.kecamatan);
        if (formData.desa) submitData.append('desa_kode', formData.desa);

        router.post(url, submitData, {
            onSuccess: () => {
                toast.success(modalMode === 'edit' ? 'Data dokter berhasil diperbarui!' : 'Data dokter berhasil ditambahkan!');
                setModalOpen(false);
                setSelectedDokter(null);
                resetForm();
            },
            onError: (errors) => {
                toast.error('Terjadi kesalahan saat menyimpan data!');
                console.error(errors);
            },
        });
    };

    const handleDelete = (dokter: Dokter) => {
        if (confirm(`Apakah Anda yakin ingin menghapus dokter ${dokter.user_name_input || dokter.kode}?`)) {
            router.delete(`/sdm/dokter/${dokter.id}`, {
                onSuccess: () => {
                    toast.success('Data dokter berhasil dihapus!');
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat menghapus data!');
                },
            });
        }
    };

    // Helper functions for formatting
    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getJenisKelamin = (jk: string | undefined) => {
        if (jk === 'L') return 'Laki-laki';
        if (jk === 'P') return 'Perempuan';
        return '-';
    };

    // Step navigation
    const steps = [
        { id: 1, label: 'Data Dasar' },
        { id: 2, label: 'Data Profesi' },
        { id: 3, label: 'Kontak & Status' },
    ];

    const nextStep = () => {
        if (currentStep < steps.length) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Modal title and actions
    const getModalTitle = () => {
        switch (modalMode) {
            case 'create':
                return 'Tambah Data Dokter';
            case 'edit':
                return 'Edit Data Dokter';
            case 'show':
                return `Detail Dokter - ${selectedDokter?.nama || selectedDokter?.user_name_input || 'N/A'}`;
            default:
                return 'Data Dokter';
        }
    };

    // Jadwal handlers
    const [jadwalOpen, setJadwalOpen] = useState(false);
    const [jadwalDokter, setJadwalDokter] = useState<Dokter | null>(null);
    type JadwalItem = { hari: string; jam_mulai: string; jam_selesai: string; kuota: string; aktif: boolean };
    const [jadwalItems, setJadwalItems] = useState<JadwalItem[]>([]);
    const [syncKodePoli, setSyncKodePoli] = useState('');
    const [syncTanggal, setSyncTanggal] = useState('');
    const [syncLoading, setSyncLoading] = useState(false);
    const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const getHariIndonesia = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDay(); // 0=Sunday
        const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return map[day] || '';
    };
    const syncJadwalFromWS = async () => {
        if (!syncKodePoli || !syncTanggal) {
            toast.error('Isi kode poli dan tanggal');
            return;
        }
        try {
            setSyncLoading(true);
            const res = await fetch(`/api/get_dokter_ws/${encodeURIComponent(syncKodePoli)}/${encodeURIComponent(syncTanggal)}`);
            const json = await res.json();
            if (json?.status !== 'success' || !Array.isArray(json.data)) {
                toast.error(json?.message || 'Gagal sinkron jadwal');
                return;
            }
            // Ambil range jadwal pertama jika ada, map ke satu hari (tanpa hari spesifik, user bisa pilih)
            const hariDefault = getHariIndonesia(syncTanggal);
            const mapped = (json.data as Array<{ kode: number | string; nama: string; jadwal: string; kuota: number }>).map((d) => {
                const [mulai, selesai] = (d.jadwal || '').split('-');
                return {
                    hari: hariDefault,
                    jam_mulai: (mulai || '').trim(),
                    jam_selesai: (selesai || '').trim(),
                    kuota: String(d.kuota ?? 0),
                    aktif: true,
                } as JadwalItem;
            });
            // Update item yang sesuai hariDefault; jika multi baris, tetap update hari yang sama (ambil pertama)
            setJadwalItems((prev) => {
                const next = [...prev];
                if (mapped.length > 0) {
                    const upd = mapped[0];
                    const idx = next.findIndex((it) => it.hari === upd.hari);
                    if (idx >= 0) {
                        next[idx] = upd;
                    } else {
                        next.push(upd);
                    }
                }
                return next;
            });
            toast.success('Jadwal tersinkron dari WS');
            // auto save setelah sinkron
            postJadwalItems(mapped);
        } catch (e) {
            toast.error('Kesalahan jaringan saat sinkron');
        } finally {
            setSyncLoading(false);
        }
    };
    const addJadwal = () => setJadwalItems((prev) => [...prev, { hari: '', jam_mulai: '', jam_selesai: '', kuota: '0', aktif: true }]);
    const removeJadwal = (idx: number) => setJadwalItems((prev) => prev.filter((_, i) => i !== idx));
    const updateJadwal = (idx: number, key: keyof JadwalItem, value: string | boolean) => {
        setJadwalItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value as any } : it)));
    };
    const openJadwalModal = (dokter: Dokter) => {
        setJadwalDokter(dokter);
        // Inisialisasi Senin..Minggu
        const base = weekDays.map((h) => ({ hari: h, jam_mulai: '08:00', jam_selesai: '17:00', kuota: '0', aktif: false }) as JadwalItem);
        // Timpa dengan data DB jika ada
        (dokter.jadwals || []).forEach((j) => {
            const idx = weekDays.findIndex((h) => h === (j.hari || ''));
            if (idx >= 0) {
                base[idx] = {
                    hari: weekDays[idx],
                    jam_mulai: j.jam_mulai || '',
                    jam_selesai: j.jam_selesai || '',
                    kuota: String(j.kuota ?? 0),
                    aktif: !!j.aktif,
                };
            }
        });
        setJadwalItems(base);
        // set default untuk sinkron: tanggal hari ini, kode poli dari dokter
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setSyncTanggal(`${yyyy}-${mm}-${dd}`);
        } catch {}
        // ambil kode poli dari relasi namapoli (bukan id). fallback ke field poli jika perlu
        const poliCode = (dokter.namapoli?.kode || dokter.poli?.toString?.() || '').toString();
        setSyncKodePoli(poliCode);
        setJadwalOpen(true);
    };
    const submitJadwal = () => {
        if (!jadwalDokter) return;
        postJadwalItems(jadwalItems);
    };

    const postJadwalItems = (items: JadwalItem[]) => {
        if (!jadwalDokter) return;
        const payload = new FormData();
        payload.append('dokter_id', String(jadwalDokter.id));
        items.forEach((it, i) => {
            payload.append(`items[${i}][hari]`, it.hari);
            if (it.jam_mulai) payload.append(`items[${i}][jam_mulai]`, it.jam_mulai);
            if (it.jam_selesai) payload.append(`items[${i}][jam_selesai]`, it.jam_selesai);
            payload.append(`items[${i}][kuota]`, it.kuota || '0');
            payload.append(`items[${i}][aktif]`, it.aktif ? '1' : '0');
        });
        router.post('/sdm/dokter/jadwal', payload, {
            onSuccess: () => {
                toast.success('Jadwal dokter tersimpan');
                setJadwalOpen(false);
                setJadwalDokter(null);
                router.reload({ only: ['dokters'] });
            },
            onError: () => toast.error('Gagal menyimpan jadwal'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Dokter - Modul SDM" />
            <div className="space-y-6 p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="rounded-2xl shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                                <stat.icon className={`h-6 w-6 rounded-md p-1 text-white ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Daftar Dokter</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Cari dokter..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 pl-10"
                                />
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Dokter
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Poli</TableHead>
                                    <TableHead>No. SIP</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Status Verifikasi</TableHead>
                                    <TableHead>Status Pegawaian</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDokters.length > 0 ? (
                                    filteredDokters.map((dokter) => (
                                        <TableRow key={dokter.id}>
                                            <TableCell className="font-medium">{dokter.kode}</TableCell>
                                            <TableCell>{dokter.nama || dokter.user_name_input || '-'}</TableCell>
                                            <TableCell>{dokter.namapoli?.nama || '-'}</TableCell>
                                            <TableCell>{dokter.sip || '-'}</TableCell>
                                            <TableCell>{dokter.telepon || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={dokter.verifikasi === 2 ? 'default' : 'secondary'}>
                                                    {dokter.verifikasi === 2 ? 'Terverifikasi' : 'Belum Verifikasi'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{dokter.namastatuspegawai?.nama || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleShow(dokter)} title="Lihat Detail">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {dokter.verifikasi === 2 && (
                                                        <Button size="sm" variant="outline" onClick={() => handleEdit(dokter)} title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {dokter.verifikasi === 2 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openJadwalModal(dokter)}
                                                            title="Atur Jadwal"
                                                        >
                                                            Jadwal
                                                        </Button>
                                                    )}
                                                    {dokter.verifikasi === 1 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenVerifikasi(dokter)}
                                                            title="Verifikasi"
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(dokter)} title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                                            Tidak ada data dokter
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Modal Tambah Dokter */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent
                        className="flex max-h-[90vh] w-[95vw] !max-w-5xl flex-col rounded-lg md:w-[80vw] lg:w-[70vw]"
                        aria-describedby={undefined}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between">
                            <DialogTitle className="text-xl font-semibold">
                                {modalMode === 'create' ? 'Tambah Dokter' : modalMode === 'edit' ? 'Edit Dokter' : 'Detail Dokter'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="overflow-x-auto px-4 py-3">
                                <div className="flex items-center justify-center">
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                        {steps.map((step, idx, arr) => (
                                            <div key={step.id} className="flex items-center">
                                                <div
                                                    className={`flex items-center transition-colors ${
                                                        currentStep >= step.id
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                                                            currentStep >= step.id
                                                                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                                                                : 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                                                        }`}
                                                    >
                                                        {step.id}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium">{step.label}</span>
                                                </div>

                                                {idx < arr.length - 1 && (
                                                    <div
                                                        className={`mx-3 h-0.5 w-12 transition-colors ${
                                                            currentStep > step.id ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* STEP 1: Nama, NIK, NPWP, Poli, Kode Dokter, Foto, TTL */}
                                {currentStep === 1 && (
                                    <div className="flex flex-col gap-6 lg:flex-row">
                                        {/* Foto (samakan dengan pasien) */}
                                        <div className="space-y-4 lg:w-1/3">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed">
                                                    {imagePreview ? (
                                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="hidden"
                                                                id="dokter-foto"
                                                                disabled={isReadOnly}
                                                            />
                                                            <label htmlFor="dokter-foto" className="cursor-pointer">
                                                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">Upload Foto</p>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Nama di bawah foto */}
                                                <div className="mt-4 w-full">
                                                    <Label htmlFor="nama">Nama</Label>
                                                    <div className="relative space-y-2">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                id="nama"
                                                                value={formData.nama}
                                                                onChange={(e) => {
                                                                    handleInputChange('nama', e.target.value);
                                                                    setExternalSearchQuery(e.target.value);
                                                                }}
                                                                onFocus={() => setIsNamaFocused(true)}
                                                                onBlur={() => setTimeout(() => setIsNamaFocused(false), 120)}
                                                                ref={namaRef}
                                                                placeholder="Nama"
                                                                disabled={isReadOnly}
                                                            />
                                                        </div>

                                                        {showDokterList && dokterOptions.length > 0 && (
                                                            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-zinc-50/95 shadow backdrop-blur dark:bg-zinc-800/95">
                                                                {isLoadingDokter && <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>}
                                                                {!isLoadingDokter &&
                                                                    dokterOptions.map((d) => (
                                                                        <button
                                                                            key={d.kode}
                                                                            type="button"
                                                                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-zinc-100 focus:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700 dark:active:bg-zinc-600"
                                                                            onClick={() => {
                                                                                setFormData((prev) => ({ ...prev, nama: d.nama, kode: d.kode }));
                                                                                setShowDokterList(false);
                                                                                setIsNamaFocused(false);
                                                                                lastPickedNameRef.current = d.nama;
                                                                                setTimeout(() => namaRef.current?.focus(), 0);
                                                                            }}
                                                                        >
                                                                            <div className="font-medium text-zinc-800 dark:text-zinc-100">
                                                                                {d.nama}
                                                                            </div>
                                                                            <div className="text-xs text-zinc-600 dark:text-zinc-300">
                                                                                Kode: {d.kode}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* NIK di bawah nama */}
                                                <div className="mt-4 w-full">
                                                    <Label htmlFor="nik">Nomor NIK</Label>
                                                    <Input
                                                        id="nik"
                                                        value={formData.nik}
                                                        onChange={(e) => handleInputChange('nik', e.target.value)}
                                                        placeholder="Nomor NIK"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>

                                                {/* TTL di bawah nama */}
                                                <div className="mt-4 w-full">
                                                    <Label htmlFor="tempat_lahir">Tempat & Tanggal Lahir</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input
                                                            id="tempat_lahir"
                                                            value={formData.tempat_lahir}
                                                            onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                                                            placeholder="Tempat"
                                                            disabled={isReadOnly}
                                                        />
                                                        <Input
                                                            id="tanggal_lahir"
                                                            type="date"
                                                            value={formData.tanggal_lahir}
                                                            onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identitas + TTL */}
                                        <div className="space-y-4 md:space-y-6 lg:w-2/3 lg:border-l lg:pl-6">
                                            <h6 className="mb-4 text-base font-semibold">Informasi Pribadi</h6>
                                            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="kode">Kode Dokter</Label>
                                                    <Input
                                                        id="kode"
                                                        value={formData.kode}
                                                        onChange={(e) => handleInputChange('kode', e.target.value)}
                                                        placeholder="Kode Dokter"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="poli">Poli</Label>
                                                    <Select
                                                        value={formData.poli}
                                                        onValueChange={(value) => handleInputChange('poli', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- Pilih Poli ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {poli.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="npwp">Nomor NPWP</Label>
                                                    <Input
                                                        id="npwp"
                                                        value={formData.npwp}
                                                        onChange={(e) => handleInputChange('npwp', e.target.value)}
                                                        placeholder="Nomor NPWP"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="kode_satu">ID Satu Sehat</Label>
                                                    <Input
                                                        id="kode_satu"
                                                        value={formData.kode_satu}
                                                        onChange={(e) => handleInputChange('kode_satu', e.target.value)}
                                                        placeholder="ID Satu Sehat"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                            </div>
                                            {/* STR & SIP pada baris terpisah, jarak kecil */}
                                            <div className="grid grid-cols-1 gap-2">
                                                <div>
                                                    <Label>Nomor STR & Expired</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Input
                                                            className="col-span-2"
                                                            value={formData.str}
                                                            onChange={(e) => handleInputChange('str', e.target.value)}
                                                            placeholder="Nomor STR"
                                                            disabled={isReadOnly}
                                                        />
                                                        <Input
                                                            type="date"
                                                            value={formData.exp_str}
                                                            onChange={(e) => handleInputChange('exp_str', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Nomor SIP & Expired</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Input
                                                            className="col-span-2"
                                                            value={formData.sip}
                                                            onChange={(e) => handleInputChange('sip', e.target.value)}
                                                            placeholder="Nomor SIP"
                                                            disabled={isReadOnly}
                                                        />
                                                        <Input
                                                            type="date"
                                                            value={formData.exp_spri}
                                                            onChange={(e) => handleInputChange('exp_spri', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Alamat */}
                                {currentStep === 2 && (
                                    <div className="flex">
                                        {/* Left Column - Address (match pasien layout) */}
                                        <div className="w-1/2 space-y-4 pr-5">
                                            <div>
                                                <h3 className="mb-3 text-base font-semibold">Alamat Lengkap</h3>
                                                <div className="space-y-3">
                                                    <div className={isReadOnly ? 'pointer-events-none opacity-90' : ''}>
                                                        <LaravoltIndonesiaExample
                                                            provinces={provinsi}
                                                            selectedProvince={formData.provinsi}
                                                            selectedRegency={formData.kabupaten}
                                                            selectedDistrict={formData.kecamatan}
                                                            selectedVillage={formData.desa}
                                                            onProvinceChange={(value) => handleInputChange('provinsi', value)}
                                                            onRegencyChange={(value) => handleInputChange('kabupaten', value)}
                                                            onDistrictChange={(value) => handleInputChange('kecamatan', value)}
                                                            onVillageChange={(value) => handleInputChange('desa', value)}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-6 gap-3">
                                                        <div className="col-span-2">
                                                            <Label htmlFor="rt">RT</Label>
                                                            <Input
                                                                id="rt"
                                                                value={formData.rt}
                                                                onChange={(e) => handleInputChange('rt', e.target.value)}
                                                                placeholder="001"
                                                                disabled={isReadOnly}
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Label htmlFor="rw">RW</Label>
                                                            <Input
                                                                id="rw"
                                                                value={formData.rw}
                                                                onChange={(e) => handleInputChange('rw', e.target.value)}
                                                                placeholder="002"
                                                                disabled={isReadOnly}
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Label htmlFor="kode_pos">Kode Pos</Label>
                                                            <Input
                                                                id="kode_pos"
                                                                value={formData.kode_pos}
                                                                onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                                                                placeholder="Kode Pos"
                                                                disabled={isReadOnly}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="alamat">Alamat</Label>
                                                        <Textarea
                                                            id="alamat"
                                                            value={formData.alamat}
                                                            onChange={(e) => handleInputChange('alamat', e.target.value)}
                                                            placeholder="Masukkan alamat"
                                                            rows={3}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Right Column - kosong agar mirip struktur pasien (bisa diisi nanti) */}
                                        <div className="w-1/2 border-l pl-5">
                                            <h3 className="mb-3 text-base font-semibold">Informasi Status & Kerja</h3>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="seks">Jenis Kelamin</Label>
                                                    <Select
                                                        value={formData.seks}
                                                        onValueChange={(value) => handleInputChange('seks', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Jenis Kelamin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="L">Laki-laki</SelectItem>
                                                            <SelectItem value="P">Perempuan</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="goldar">Golongan Darah</Label>
                                                    <Select
                                                        value={formData.goldar}
                                                        onValueChange={(value) => handleInputChange('goldar', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {goldar.map((g) => (
                                                                <SelectItem key={g.id} value={g.id.toString()}>
                                                                    {g.nama}
                                                                    {g.rhesus && g.rhesus.toLowerCase() !== 'tidak ada' ? ` ${g.rhesus}` : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="pernikahan">Status Pernikahan</Label>
                                                    <Select
                                                        value={formData.pernikahan}
                                                        onValueChange={(value) => handleInputChange('pernikahan', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pernikahan.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="kewarganegaraan">Kewarganegaraan</Label>
                                                    <Select
                                                        value={formData.kewarganegaraan}
                                                        onValueChange={(value) => handleInputChange('kewarganegaraan', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Indonesia">Indonesia</SelectItem>
                                                            <SelectItem value="Asing">Asing</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="status_pegawaian">Posisi Kerja</Label>
                                                    <Select
                                                        value={
                                                            formData.status_pegawaian ||
                                                            posker.find((p) => (p.nama || '').toLowerCase().includes('dokter'))?.id.toString() ||
                                                            ''
                                                        }
                                                        onValueChange={(value) => handleInputChange('status_pegawaian', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- Pilih Posisi ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {posker.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="tgl_masuk">Mulai Kerja Sejak</Label>
                                                    <Input
                                                        id="tgl_masuk"
                                                        type="date"
                                                        value={formData.tgl_masuk}
                                                        onChange={(e) => handleInputChange('tgl_masuk', e.target.value)}
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="pendidikan">Pendidikan</Label>
                                                    <Select
                                                        value={formData.pendidikan}
                                                        onValueChange={(value) => handleInputChange('pendidikan', value)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="--- pilih ---" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pendidikan.map((p) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                                    {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="telepon">Telepon</Label>
                                                    <Input
                                                        id="telepon"
                                                        value={formData.telepon}
                                                        onChange={(e) => handleInputChange('telepon', e.target.value)}
                                                        placeholder="Telepon"
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Sisanya (Profesi + Demografis) */}
                                {currentStep === 3 && (
                                    <div className="space-y-4 md:space-y-6">
                                        {/* Demografis */}
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="agama">Agama</Label>
                                                <Select
                                                    value={formData.agama}
                                                    onValueChange={(value) => handleInputChange('agama', value)}
                                                    disabled={isReadOnly}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="--- pilih ---" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {agama.map((a) => (
                                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                                {a.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="suku">Suku</Label>
                                                <Select
                                                    value={formData.suku}
                                                    onValueChange={(value) => handleInputChange('suku', value)}
                                                    disabled={isReadOnly}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Suku" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {suku.map((s) => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                                {s.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="bangsa">Bangsa</Label>
                                                <Select
                                                    value={formData.bangsa}
                                                    onValueChange={(value) => handleInputChange('bangsa', value)}
                                                    disabled={isReadOnly}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Bangsa" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {bangsa.map((b) => (
                                                            <SelectItem key={b.id} value={b.id.toString()}>
                                                                {b.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="bahasa">Bahasa</Label>
                                                <Select
                                                    value={formData.bahasa}
                                                    onValueChange={(value) => handleInputChange('bahasa', value)}
                                                    disabled={isReadOnly}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Bahasa" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {bahasa.map((b) => (
                                                            <SelectItem key={b.id} value={b.id.toString()}>
                                                                {b.nama}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : setModalOpen(false))}
                            >
                                Kembali
                            </Button>

                            {currentStep < steps.length && (
                                <Button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
                                    Lanjut
                                </Button>
                            )}

                            {currentStep === steps.length && !isReadOnly && (
                                <Button type="submit" onClick={handleSubmit}>
                                    Simpan
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Verifikasi Dokter */}
                <Dialog open={verifOpen} onOpenChange={setVerifOpen}>
                    <DialogContent
                        className="flex max-h-[90vh] w-[95vw] !max-w-5xl flex-col rounded-lg md:w-[80vw] lg:w-[70vw]"
                        aria-describedby={undefined}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between">
                            <DialogTitle className="text-xl font-semibold">
                                Verifikasi Dokter {verifDokter?.nama || verifDokter?.user_name_input || ''}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 space-y-8 overflow-y-auto p-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold">Jenjang Pendidikan</h3>
                                    <Button size="sm" variant="outline" onClick={addPendidikan}>
                                        Tambah
                                    </Button>
                                </div>
                                {pendidikans.map((p, idx) => (
                                    <div key={idx} className="grid grid-cols-1 items-end gap-3 md:grid-cols-6">
                                        <div className="md:col-span-2">
                                            <Label>Jenjang</Label>
                                            <Input
                                                value={p.jenjang}
                                                onChange={(e) => updatePendidikan(idx, 'jenjang', e.target.value)}
                                                placeholder="S.Ked/Spesialis"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Institusi</Label>
                                            <Input
                                                value={p.institusi || ''}
                                                onChange={(e) => updatePendidikan(idx, 'institusi', e.target.value)}
                                                placeholder="Universitas"
                                            />
                                        </div>
                                        <div>
                                            <Label>Tahun Lulus</Label>
                                            <Input
                                                value={p.tahun_lulus || ''}
                                                onChange={(e) => updatePendidikan(idx, 'tahun_lulus', e.target.value)}
                                                placeholder="YYYY"
                                            />
                                        </div>
                                        <div>
                                            <Label>No. Ijazah</Label>
                                            <Input
                                                value={p.nomor_ijazah || ''}
                                                onChange={(e) => updatePendidikan(idx, 'nomor_ijazah', e.target.value)}
                                                placeholder="Nomor"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <Label>File Ijazah (opsional)</Label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => updatePendidikan(idx, 'file_ijazah', e.target.files?.[0] || null)}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <Button type="button" variant="destructive" size="sm" onClick={() => removePendidikan(idx)}>
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold">Sertifikat Pelatihan</h3>
                                    <Button size="sm" variant="outline" onClick={addPelatihan}>
                                        Tambah
                                    </Button>
                                </div>
                                {pelatihans.map((p, idx) => (
                                    <div key={idx} className="grid grid-cols-1 items-end gap-3 md:grid-cols-6">
                                        <div className="md:col-span-2">
                                            <Label>Nama Pelatihan</Label>
                                            <Input
                                                value={p.nama_pelatihan}
                                                onChange={(e) => updatePelatihan(idx, 'nama_pelatihan', e.target.value)}
                                                placeholder="Nama pelatihan"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Penyelenggara</Label>
                                            <Input
                                                value={p.penyelenggara || ''}
                                                onChange={(e) => updatePelatihan(idx, 'penyelenggara', e.target.value)}
                                                placeholder="Institusi"
                                            />
                                        </div>
                                        <div>
                                            <Label>Tgl Mulai</Label>
                                            <Input
                                                type="date"
                                                value={p.tanggal_mulai || ''}
                                                onChange={(e) => updatePelatihan(idx, 'tanggal_mulai', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Tgl Selesai</Label>
                                            <Input
                                                type="date"
                                                value={p.tanggal_selesai || ''}
                                                onChange={(e) => updatePelatihan(idx, 'tanggal_selesai', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>No. Sertifikat</Label>
                                            <Input
                                                value={p.nomor_sertifikat || ''}
                                                onChange={(e) => updatePelatihan(idx, 'nomor_sertifikat', e.target.value)}
                                                placeholder="Nomor"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <Label>File Sertifikat (opsional)</Label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => updatePelatihan(idx, 'file_sertifikat', e.target.files?.[0] || null)}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <Button type="button" variant="destructive" size="sm" onClick={() => removePelatihan(idx)}>
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setVerifOpen(false)}>
                                Batal
                            </Button>
                            <Button type="button" onClick={submitVerifikasi}>
                                Simpan Verifikasi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Jadwal Dokter */}
                <Dialog open={jadwalOpen} onOpenChange={setJadwalOpen}>
                    <DialogContent
                        className="flex max-h-[90vh] w-[95vw] !max-w-4xl flex-col rounded-lg md:w-[80vw] lg:w-[60vw]"
                        aria-describedby={undefined}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between">
                            <DialogTitle className="text-xl font-semibold">
                                Jadwal Dokter {jadwalDokter?.nama || jadwalDokter?.user_name_input || ''}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {jadwalItems.map((it, idx) => (
                                <div key={idx} className="grid grid-cols-1 items-end gap-3 md:grid-cols-6">
                                    <div>
                                        <Label>Hari</Label>
                                        <div className="py-2">{it.hari}</div>
                                    </div>
                                    <div>
                                        <Label>Jam Mulai</Label>
                                        <Input type="time" value={it.jam_mulai} onChange={(e) => updateJadwal(idx, 'jam_mulai', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Jam Selesai</Label>
                                        <Input
                                            type="time"
                                            value={it.jam_selesai}
                                            onChange={(e) => updateJadwal(idx, 'jam_selesai', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Kuota/Hari</Label>
                                        <Input type="number" min={0} value={it.kuota} onChange={(e) => updateJadwal(idx, 'kuota', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Aktif</Label>
                                        <Select value={it.aktif ? '1' : '0'} onValueChange={(v) => updateJadwal(idx, 'aktif', v === '1')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Aktif</SelectItem>
                                                <SelectItem value="0">Nonaktif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <Button type="button" variant="destructive" size="sm" onClick={() => removeJadwal(idx)}>
                                            Hapus
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {/* Tombol tambah baris dihapus sesuai permintaan */}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setJadwalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="button" onClick={syncJadwalFromWS} disabled={syncLoading}>
                                {syncLoading ? 'Sinkron...' : 'Sinkron WS'}
                            </Button>
                            <Button type="button" onClick={submitJadwal}>
                                Simpan Jadwal
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

'use client';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';

type Kelamin = { id: number; nama: string };
type Goldar = { id: number; nama: string; rhesus: string };
type Pernikahan = { id: number; nama: string };

type Props = {
    kelamin: Kelamin[];
    goldar: Goldar[];
    pernikahan: Pernikahan[];
    flash?: {
        success?: string;
        error?: string;
        nomor_antrian?: string | null;
        no_rm?: string | null;
        tanggal_daftar?: string | null;
        poli_nama?: string | null;
        dokter_nama?: string | null;
        penjamin?: 'umum' | 'bpjs' | null;
    };
    errors?: {
        [key: string]: string;
    };
};

export default function Pendaftaran({ kelamin, goldar, pernikahan, flash }: Props) {
    const [openModal, setOpenModal] = useState<'bpjs' | 'umum' | 'baru' | null>(null);
    const [baruStep, setBaruStep] = useState(1);
    const [now, setNow] = useState<Date>(new Date());

    const [nama, setNama] = useState('');
    const [nik, setNik] = useState('');
    const [tglLahir, setTglLahir] = useState('');
    const [kelaminValue, setKelaminValue] = useState<string>('');
    const [telepon, setTelepon] = useState('');
    const [alamat, setAlamat] = useState('');
    const [goldarValue, setGoldarValue] = useState<string>('');
    const [pernikahanValue, setPernikahanValue] = useState<string>('');
    const [foto, setFoto] = useState<File | null>(null);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('10:30');
    const [selectedPoli, setSelectedPoli] = useState<string | undefined>();
    const [selectedDokter, setSelectedDokter] = useState<string | undefined>();
    const [poliList, setPoliList] = useState<Array<{ id: string; nama: string }>>([]);
    const [dokterList, setDokterList] = useState<Array<{ id: string; nama: string }>>([]);
    const [dokterLoading, setDokterLoading] = useState<boolean>(false);
    const [dokterError, setDokterError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; nama: string; no_rm: string; nik?: string; no_bpjs?: string }>>([]);
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
    const [selectedPasien, setSelectedPasien] = useState<{ id: number; nama: string; no_rm: string } | null>(null);
    const [selectedPasienId, setSelectedPasienId] = useState<string | undefined>();

    const [openPrintModal, setOpenPrintModal] = useState(false);
    const [hasilAntrian, setHasilAntrian] = useState<string | null>(null);

    const nameRef = useRef<HTMLInputElement>(null);

    const poliOptions = poliList.map((p) => p.nama);
    const dokterOptions = dokterList.map((d) => d.nama);

    const cards = [
        { id: 'bpjs', title: 'Daftar Antrian BPJS', color: 'green', description: 'Daftar antrian pasien BPJS' },
        { id: 'umum', title: 'Daftar Antrian Umum', color: 'blue', description: 'Daftar antrian pasien Umum' },
    ];

    const { errors } = usePage<Props>().props;
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (errors && Object.values(errors).length > 0) {
            Object.values(errors).forEach((err) => toast.error(err));
        }
    }, [flash, errors]);

    useEffect(() => {
        const intervalId = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(intervalId);
    }, []);

    const formatTanggalIndo = (date?: Date) => {
        if (!date) return '';
        try {
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return '';
        }
    };

    // Load master poli saat mount
    useEffect(() => {
        fetch('/api/master/poli')
            .then((r) => r.json())
            .then((data) => {
                const items = Array.isArray(data) ? data : data?.data || [];
                setPoliList(items.map((it: any) => ({ id: String(it.id || it.value || it.kode || it.uuid || it), nama: String(it.nama || it.text || it.name || it) })));
            })
            .catch(() => {});
    }, []);

    // Fetch dokter by poli + jadwal (hari + jam) sesuai backend
    useEffect(() => {
        if (!selectedPoli || !selectedDate || !selectedTime) return;
        const hari = selectedDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const jam = selectedTime;
        setDokterLoading(true);
        setDokterError(null);
        fetch('/api/master/dokter/by-poli', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ poli_id: Number(selectedPoli), hari, jam }),
        })
            .then((r) => r.json())
            .then((res) => {
                const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                setDokterList(
                    arr.map((it: any) => ({
                        id: String(it.id || it.user_id || it.kode || it.uuid || it),
                        nama: String(it?.namauser?.name || it?.nama || it?.name || 'Dokter'),
                    }))
                );
                setDokterLoading(false);
            })
            .catch(() => {
                setDokterList([]);
                setDokterError('Gagal memuat dokter.');
                setDokterLoading(false);
            });
    }, [selectedPoli, selectedDate, selectedTime]);

    // Pencarian pasien saat user mengetik nama/nik/bpjs
    useEffect(() => {
        if (!isSearchOpen) {
            return;
        }
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const controller = new AbortController();
        const t = setTimeout(() => {
            const url = `/api/master/pasien/search?search=${encodeURIComponent(searchQuery.trim())}&limit=10`;
            fetch(url, { signal: controller.signal })
                .then((r) => r.json())
                .then((res) => {
                    const arr = (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) as Array<any>;
                    // Deduplikasi berdasarkan id atau kombinasi no_rm+nik
                    const uniqMap = new Map<string, any>();
                    for (const it of arr) {
                        const key = String(it.id ?? `${it.no_rm ?? ''}-${it.nik ?? ''}`);
                        if (!uniqMap.has(key)) uniqMap.set(key, it);
                    }
                    setSearchResults(Array.from(uniqMap.values()) as any);
                })
                .catch(() => {});
        }, 400);
        return () => {
            controller.abort();
            clearTimeout(t);
        };
    }, [searchQuery]);

    const handleSubmitAmbilAntrian = (penjamin: 'umum' | 'bpjs') => (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime || !selectedPoli) {
            toast.error('Tanggal, jam, dan poli wajib diisi.');
            return;
        }
        if (!selectedPasien) {
            toast.error('Silakan pilih pasien dari hasil pencarian.');
            return;
        }

        const form = new FormData();
        form.append('penjamin', penjamin);
        form.append('search', searchQuery);
        form.append('pasien_id', String(selectedPasien.id));
        form.append('pasien_nama', selectedPasien.nama);
        form.append('pasien_no_rm', selectedPasien.no_rm);
        form.append('poli_id', String(selectedPoli));
        if (selectedDokter) form.append('dokter_id', String(selectedDokter));
        form.append('tanggal', format(selectedDate, 'yyyy-MM-dd'));
        form.append('jam', selectedTime);

        router.post(route('pendaftaran-online.ambil-antrian'), form, {
            onSuccess: (page) => {
                const f = (page.props as any).flash || {};
                const antrian = f.nomor_antrian ?? null;
                if (antrian) {
                    setHasilAntrian(antrian);
        setOpenModal(null);
                    setOpenPrintModal(true);
                }
            },
        });
    };

    const handleSubmitPasienBaru = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nama', nama);
        formData.append('nik', nik);
        formData.append('tgl_lahir', tglLahir);
        formData.append('kelamin', kelaminValue);
        formData.append('telepon', telepon);
        formData.append('alamat', alamat);
        formData.append('goldar', goldarValue);
        formData.append('pernikahan', pernikahanValue);
        if (foto) formData.append('foto', foto);

        router.post(route('pendaftaran-online.add'), formData, {
            onSuccess: (page) => {
                const flashData = page.props.flash as { nomor_antrian?: string | null } | undefined;
                const antrian = flashData?.nomor_antrian ?? null;

                if (antrian) {
                    setHasilAntrian(antrian);
                    setOpenModal(null);
                    setOpenPrintModal(true); // buka modal cetak
                }

                // Clear form
                setNama('');
                setNik('');
                setTglLahir('');
                setKelaminValue('');
                setTelepon('');
                setAlamat('');
                setGoldarValue('');
                setPernikahanValue('');
                setFoto(null);
                setBaruStep(1);
            },
            onError: (err) => {
                console.error('Error submit:', err);
            },
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="mx-auto max-w-6xl">
                {/* Realtime Tanggal & Jam - satu baris, center */
                }
                <div className="mb-6 grid grid-cols-12 p-3">
                    <div className="col-span-12 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
                        <p className="mb-1 text-center text-sm font-medium text-muted-foreground">{(usePage().props as any)?.web_setting?.nama ?? (usePage().props as any)?.name ?? 'Klinik'}</p>
                        <p className="text-center text-2xl font-semibold">
                                {`${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`}
                            </p>
                    </div>
                </div>
                {/* Cards */}
                <div className="grid grid-cols-12 justify-center gap-6">
                    {cards.map((card, idx) => (
                        <div
                            key={card.id}
                            className={`${idx < 2 ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-6 md:col-start-4'} rounded-2xl border border-border bg-card p-8 md:p-10 text-center text-card-foreground shadow-md transition-transform hover:scale-105`}
                        >
                            <h2
                                className={`mb-5 text-2xl font-semibold ${card.color === 'green' ? 'text-green-600' : card.color === 'blue' ? 'text-blue-600' : 'text-cyan-600'}`}
                            >
                                {card.title}
                            </h2>
                            <p className="mb-6 text-base">{card.description}</p>
                            <Button
                                onClick={() => setOpenModal(card.id as any)}
                                className={`w-full py-6 text-lg ${card.color === 'green' ? 'bg-green-500 hover:bg-green-600' : card.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                            >
                                Daftar
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Form Modals */}
                <Dialog open={!!openModal} onOpenChange={() => setOpenModal(null)}>
                    <DialogContent className="bg-card text-card-foreground !max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {openModal === 'bpjs' ? 'Form Daftar BPJS' : openModal === 'umum' ? 'Form Daftar Umum' : 'Form Pasien Baru'}
                            </DialogTitle>
                        </DialogHeader>
                        {openModal === 'bpjs' && (
                            <p className="text-sm text-muted-foreground">
                                Lengkapi data di bawah untuk mengambil nomor antrian layanan BPJS. Kolom bertanda * wajib diisi.
                            </p>
                        )}
                        {openModal === 'umum' && (
                            <p className="text-sm text-muted-foreground">
                                Masukkan data singkat untuk mengambil nomor antrian layanan Umum. Kolom bertanda * wajib diisi.
                            </p>
                        )}
                        {openModal === 'baru' && (
                            <p className="text-sm text-muted-foreground">
                                Isi data pasien baru melalui 3 langkah berikut. Anda dapat kembali ke langkah sebelumnya jika perlu.
                            </p>
                        )}

                        {/* === BPJS === */}
                        {openModal === 'bpjs' && (
                            <form className="mt-4" onSubmit={handleSubmitAmbilAntrian('bpjs')}>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-4">
                                <div>
                                            <div className="relative">
                                                <div className={`${isSearchOpen ? 'rounded-xl border border-border shadow-lg' : ''} w-full`}>
                                                    <Command className={`w-full`}>
                                                        <CommandInput
                                                            placeholder={selectedPasien ? `Terpilih: ${selectedPasien.nama}` : "Cari Nama / NIK / No. BPJS *"}
                                                            value={searchQuery}
                                                            onFocus={() => setIsSearchOpen(true)}
                                                            onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
                                                            onValueChange={(v) => { setSearchQuery(v); setSelectedPasien(null); setIsSearchOpen(true); }}
                                                        />
                                                        {selectedPasien && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPasien(null);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                        {isSearchOpen && (
                                                            <CommandList>
                                                                {(!searchQuery || searchQuery.trim().length < 2) ? (
                                                                    <CommandEmpty>Ketik minimal 2 karakter untuk mencari.</CommandEmpty>
                                                                ) : (
                                                                    <>
                                                                        {searchResults.length === 0 ? (
                                                                            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                                                                        ) : (
                                                                            <CommandGroup heading="Hasil">
                                                                                {searchResults.map((p) => (
                                                                                    <CommandItem
                                                                                        key={p.id}
                                                                                        value={`${p.nama} ${p.no_rm}`}
                                                                                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                                                        onSelect={() => {
                                                                                            setSelectedPasien({ id: p.id, nama: p.nama, no_rm: p.no_rm });
                                                                                            setSearchQuery(`${p.nama}`);
                                                                                            setSearchResults([]);
                                                                                            setTimeout(() => setIsSearchOpen(false), 0);
                                                                                        }}
                                                                                    >
                                                                                        <div className="flex w-full items-center justify-between gap-3">
                                                                                            <span className="truncate max-w-[70%]">{p.nama} ({p.no_rm})</span>
                                                                                            <span className="shrink-0 text-xs text-muted-foreground font-mono">{p.nik || p.no_bpjs || ''}</span>
                                                                                        </div>
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </CommandList>
                                                        )}
                                                    </Command>
                                                </div>
                                            </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start px-4 py-2 text-left">
                                                {selectedDate ? formatTanggalIndo(selectedDate) : 'Pilih Tanggal'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-2">
                                            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                                        </PopoverContent>
                                    </Popover>
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        step={60}
                                        className="w-full rounded-md border px-2 py-1 text-center"
                                    />
                                </div>
                                <p className="-mt-2 text-xs text-muted-foreground">Pilih tanggal dan perkiraan jam kedatangan.</p>

                                        <Select value={selectedPoli} onValueChange={(v) => { setSelectedPoli(v); setSelectedDokter(undefined); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Poli" />
                                    </SelectTrigger>
                                    <SelectContent>
                                                {poliList.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="-mt-2 text-xs text-muted-foreground">Pilih tujuan layanan/poli yang dituju.</p>
                                <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={dokterLoading ? 'Memuat dokter...' : 'Pilih Dokter'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                            {dokterList.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.nama}
                                            </SelectItem>
                                        ))}
                                            {!dokterLoading && dokterList.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada dokter tersedia pada waktu ini</div>
                                            )}
                                    </SelectContent>
                                </Select>
                                <p className="-mt-2 text-xs text-muted-foreground">Opsional: pilih dokter jika tersedia.</p>

                                <div className="mt-2 flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setOpenModal(null)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" className="bg-green-500 hover:bg-green-600">
                                        Ambil Antrian BPJS
                                    </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-4">
                                        <p className="mb-2 text-sm font-semibold">Ringkasan</p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Penjamin</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">BPJS</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Pasien</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium truncate">{selectedPasien?.nama || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">No RM</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">{selectedPasien?.no_rm || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Tanggal</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">{selectedDate ? formatTanggalIndo(selectedDate) : '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Jam</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">{selectedTime || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Poli</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium truncate">{poliList.find(x => x.id === selectedPoli)?.nama || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Dokter</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium truncate">{dokterList.find(x => x.id === selectedDokter)?.nama || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* === Umum === */}
                        {openModal === 'umum' && (
                            <form className="mt-4" onSubmit={handleSubmitAmbilAntrian('umum')}>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-4">
                                <div>
                                            <div className="relative">
                                                <div className={`${isSearchOpen ? 'rounded-xl border border-border shadow-lg' : ''} w-full`}>
                                                    <Command className={`w-full`}>
                                                        <CommandInput
                                                            placeholder={selectedPasien ? `Terpilih: ${selectedPasien.nama}` : "Cari Nama / NIK *"}
                                                            value={searchQuery}
                                                            onFocus={() => setIsSearchOpen(true)}
                                                            onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
                                                            onValueChange={(v) => { setSearchQuery(v); setSelectedPasien(null); setIsSearchOpen(true); }}
                                                        />
                                                        {selectedPasien && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPasien(null);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                        {isSearchOpen && (
                                                            <CommandList>
                                                                {(!searchQuery || searchQuery.trim().length < 2) ? (
                                                                    <CommandEmpty>Ketik minimal 2 karakter untuk mencari.</CommandEmpty>
                                                                ) : (
                                                                    <>
                                                                        {searchResults.length === 0 ? (
                                                                            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                                                                        ) : (
                                                                            <CommandGroup heading="Hasil">
                                                                                {searchResults.map((p) => (
                                                                                    <CommandItem
                                                                                        key={p.id}
                                                                                        value={`${p.nama} ${p.no_rm}`}
                                                                                        onSelect={() => {
                                                                                            
                                                                                            setSelectedPasien({ id: p.id, nama: p.nama, no_rm: p.no_rm });
                                                                                            setSearchQuery(`${p.nama}`);
                                                                                            setSearchResults([]);
                                                                                            setTimeout(() => setIsSearchOpen(false), 0);
                                                                                        }}
                                                                                    >
                                                                                        <div className="flex w-full items-center justify-between gap-3">
                                                                                            <span className="truncate max-w-[70%]">{p.nama} ({p.no_rm})</span>
                                                                                            <span className="shrink-0 text-xs text-muted-foreground font-mono">{p.nik || ''}</span>
                                                                                        </div>
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </CommandList>
                                                        )}
                                                    </Command>
                                                </div>
                                            </div>
                                </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start px-4 py-2 text-left">
                                                        {selectedDate ? formatTanggalIndo(selectedDate) : 'Pilih Tanggal'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-2">
                                                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                                                </PopoverContent>
                                            </Popover>
                                            <input
                                                type="time"
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                step={60}
                                                className="w-full rounded-md border px-2 py-1 text-center"
                                            />
                                </div>
                                        <Select value={selectedPoli} onValueChange={(v) => { setSelectedPoli(v); setSelectedDokter(undefined); }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Poli" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {poliList.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={dokterLoading ? 'Memuat dokter...' : 'Pilih Dokter'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dokterList.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.nama}
                                                    </SelectItem>
                                                ))}
                                                {!dokterLoading && dokterList.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada dokter tersedia pada waktu ini</div>
                                                )}
                                            </SelectContent>
                                        </Select>

                                <div className="mt-2 flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setOpenModal(null)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                                        Ambil Antrian Umum
                                    </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-4">
                                        <p className="mb-2 text-sm font-semibold">Ringkasan</p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Penjamin</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">Umum</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Pasien</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium truncate">{selectedPasien?.nama || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">No RM</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">{selectedPasien?.no_rm || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Tanggal</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">{selectedDate ? formatTanggalIndo(selectedDate) : '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Jam</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium">{selectedTime || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Poli</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium truncate">{poliList.find(x => x.id === selectedPoli)?.nama || '-'}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="w-28 md:w-32 text-muted-foreground">Dokter</span>
                                                <span className="w-3 text-center">:</span>
                                                <span className="font-medium truncate">{dokterList.find(x => x.id === selectedDokter)?.nama || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* === Pasien Baru === */}
                        {openModal === 'baru' && (
                            <form className="mt-4 space-y-4" onSubmit={handleSubmitPasienBaru}>
                                {/* Stepper */}
                                <div className="mb-4 flex items-center justify-center gap-2">
                                    {[1, 2, 3].map((s, idx) => (
                                        <div key={s} className="flex items-center">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-base font-bold ${baruStep === s ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-gray-300 bg-gray-200 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                                            >
                                                {s}
                                            </div>
                                            {idx < 2 && <div className="mx-2 h-1 w-8 rounded bg-gray-300 dark:bg-gray-600"></div>}
                                        </div>
                                    ))}
                                </div>

                                {baruStep === 1 && (
                                    <>
                                        <Input placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
                                        <Input placeholder="NIK" value={nik} onChange={(e) => setNik(e.target.value)} type="text" />
                                        <Input
                                            type="date"
                                            placeholder="Tanggal Lahir"
                                            value={tglLahir}
                                            onChange={(e) => setTglLahir(e.target.value)}
                                        />
                                        <Select value={kelaminValue} onValueChange={setKelaminValue}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Kelamin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kelamin.map((k) => (
                                                    <SelectItem key={k.id} value={String(k.id)}>
                                                        {k.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="mt-2 flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setOpenModal(null)}>
                                                Batal
                                            </Button>
                                            <Button type="button" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setBaruStep(2)}>
                                                Lanjut
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {baruStep === 2 && (
                                    <>
                                        <Input placeholder="Nomor Telepon" type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} />
                                        <Input placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
                                        <div className="mt-2 flex justify-between gap-2">
                                            <Button variant="outline" onClick={() => setBaruStep(1)}>
                                                Kembali
                                            </Button>
                                            <Button type="button" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setBaruStep(3)}>
                                                Lanjut
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {baruStep === 3 && (
                                    <>
                                        <Select value={goldarValue} onValueChange={setGoldarValue}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Golongan Darah" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {goldar.map((g) => (
                                                    <SelectItem key={g.id} value={String(g.id)}>
                                                        {g.nama}
                                                        {g.rhesus && g.rhesus !== 'Tidak Ada' ? ` ${g.rhesus}` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={pernikahanValue} onValueChange={setPernikahanValue}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status Pernikahan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pernikahan.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                                        />
                                        <div className="mt-2 flex justify-between gap-2">
                                            <Button variant="outline" onClick={() => setBaruStep(2)}>
                                                Kembali
                                            </Button>
                                            <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600">
                                                Daftar
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* === Modal Print Antrian (DIPISAH) === */}
                <Dialog open={openPrintModal} onOpenChange={setOpenPrintModal}>
                    <DialogContent className="rounded-lg bg-card p-6 text-card-foreground shadow-lg sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">Nomor Antrian Anda</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 text-center">
                            <p className="mb-2 text-lg">Nomor Antrian:</p>
                            <p className="mb-4 text-3xl font-bold">{hasilAntrian}</p>
                            <div className="space-y-1 text-sm">
                                {flash?.no_rm && <p>No RM: <span className="font-semibold">{flash.no_rm}</span></p>}
                                {flash?.tanggal_daftar && <p>Tanggal Daftar: <span className="font-semibold">{flash.tanggal_daftar}</span></p>}
                                {(flash?.poli_nama || flash?.dokter_nama) && (
                                    <p>
                                        Poli/Dokter: <span className="font-semibold">{flash?.poli_nama || '-'}{flash?.dokter_nama ? `, ${flash.dokter_nama}` : ''}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-center gap-2">
                                {/* Cetak / Download PDF */}
                                <Button
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => {
                                        const params = new URLSearchParams({
                                            no_rm: String(flash?.no_rm ?? ''),
                                            nomor_antrian: String(hasilAntrian ?? ''),
                                            tanggal_daftar: String(flash?.tanggal_daftar ?? ''),
                                            poli: String(flash?.poli_nama ?? ''),
                                            dokter: String(flash?.dokter_nama ?? ''),
                                        });
                                        window.open(route('pendaftaran-online.cetak-antrian') + `?${params.toString()}`, '_blank');
                                    }}
                                >
                                    Cetak
                                </Button>

                                <Button variant="outline" onClick={() => setOpenPrintModal(false)}>
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="fixed bottom-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <Toaster position="top-right" />
        </div>
    );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';

// ----------------- Config Satu Sehat -----------------
function ConfigSatuSehat() {
    const [formData, setFormData] = useState({
        client_id: '',
        org_id: '',
        client_secret: '',
        SECRET_KEY: '',
        SATUSEHAT_BASE_URL: '',
    });
    const [loading, setLoading] = useState(false);

    // Load data saat komponen dimount
    useEffect(() => {
        fetchSatuSehatData();
    }, []);

    const fetchSatuSehatData = async () => {
        try {
            const response = await fetch('/api/web-settings/show', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.set_sehat) {
                    setFormData({
                        client_id: data.data.set_sehat.client_id || '',
                        org_id: data.data.set_sehat.org_id || '',
                        client_secret: data.data.set_sehat.client_secret || '',
                        SECRET_KEY: data.data.set_sehat.SECRET_KEY || '',
                        SATUSEHAT_BASE_URL: data.data.set_sehat.SATUSEHAT_BASE_URL || '',
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching Satu Sehat data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/web-settings/set-satusehat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Client ID</label>
                    <Input
                        name="client_id"
                        type="text"
                        value={formData.client_id}
                        onChange={handleChange}
                        placeholder="Masukkan Client ID"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Organization ID</label>
                    <Input name="org_id" type="text" value={formData.org_id} onChange={handleChange} placeholder="Masukkan Org ID" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Client Secret</label>
                    <Input
                        name="client_secret"
                        type="password"
                        value={formData.client_secret}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Secret Key</label>
                    <Input name="SECRET_KEY" type="password" value={formData.SECRET_KEY} onChange={handleChange} placeholder="••••••••" required />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium">Satu Sehat Base URL</label>
                    <Input
                        name="SATUSEHAT_BASE_URL"
                        type="url"
                        value={formData.SATUSEHAT_BASE_URL}
                        onChange={handleChange}
                        placeholder="https://api.satusehat.kemkes.go.id"
                        required
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Config Satu Sehat'}
                </Button>
            </div>
        </form>
    );
}

// ----------------- Config BPJS -----------------
function ConfigBPJS() {
    const [formData, setFormData] = useState({
        CONSID: '',
        SECRET_KEY: '',
        USERNAME: '',
        PASSWORD: '',
        KPFK: '',
        APP_CODE: '',
        USER_KEY: '',
        BASE_URL: '',
        SERVICE: '',
        SERVICE_ANTREAN: '',
    });
    const [loading, setLoading] = useState(false);

    // Load data saat komponen dimount
    useEffect(() => {
        fetchBPJSData();
    }, []);

    const fetchBPJSData = async () => {
        try {
            const response = await fetch('/api/web-settings/show', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.set_bpjs) {
                    setFormData({
                        CONSID: data.data.set_bpjs.CONSID || '',
                        SECRET_KEY: data.data.set_bpjs.SECRET_KEY || '',
                        USERNAME: data.data.set_bpjs.USERNAME || '',
                        PASSWORD: data.data.set_bpjs.PASSWORD || '',
                        KPFK: data.data.set_bpjs.KPFK || '',
                        APP_CODE: data.data.set_bpjs.APP_CODE || '',
                        USER_KEY: data.data.set_bpjs.USER_KEY || '',
                        BASE_URL: data.data.set_bpjs.BASE_URL || '',
                        SERVICE: data.data.set_bpjs.SERVICE || '',
                        SERVICE_ANTREAN: data.data.set_bpjs.SERVICE_ANTREAN || '',
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching BPJS data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/web-settings/set-bpjs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Cons ID</label>
                    <Input name="CONSID" type="text" value={formData.CONSID} onChange={handleChange} placeholder="Masukkan Cons ID" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Secret Key</label>
                    <Input name="SECRET_KEY" type="password" value={formData.SECRET_KEY} onChange={handleChange} placeholder="••••••••" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Username</label>
                    <Input name="USERNAME" type="text" value={formData.USERNAME} onChange={handleChange} placeholder="Masukkan Username" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Password</label>
                    <Input name="PASSWORD" type="password" value={formData.PASSWORD} onChange={handleChange} placeholder="••••••••" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">KPFK (Kode Apotek)</label>
                    <Input name="KPFK" type="text" value={formData.KPFK} onChange={handleChange} placeholder="Masukkan Kode Apotek" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">App Code</label>
                    <Input name="APP_CODE" type="text" value={formData.APP_CODE} onChange={handleChange} placeholder="Masukkan App Code" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">User Key</label>
                    <Input name="USER_KEY" type="password" value={formData.USER_KEY} onChange={handleChange} placeholder="••••••••" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Base URL</label>
                    <Input
                        name="BASE_URL"
                        type="url"
                        value={formData.BASE_URL}
                        onChange={handleChange}
                        placeholder="https://apijkn.bpjs-kesehatan.go.id"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Service URL</label>
                    <Input name="SERVICE" type="url" value={formData.SERVICE} onChange={handleChange} placeholder="URL Service" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Service Antrean URL</label>
                    <Input
                        name="SERVICE_ANTREAN"
                        type="url"
                        value={formData.SERVICE_ANTREAN}
                        onChange={handleChange}
                        placeholder="URL Service Antrean"
                        required
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Config BPJS'}
                </Button>
            </div>
        </form>
    );
}

// ----------------- Config Gudang -----------------
function ConfigGudang() {
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [externalDatabases, setExternalDatabases] = useState<any[]>([]);

    // Load data saat komponen dimount
    useEffect(() => {
        fetchGudangData();
    }, []);

    const fetchGudangData = async () => {
        try {
            const response = await fetch('/api/web-settings/show', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setEnabled(data.data.setting?.is_gudangutama_active ?? true);
                    setExternalDatabases(data.data.external_databases || []);
                }
            }
        } catch (error) {
            console.error('Error fetching gudang data:', error);
        }
    };

    const handleToggleChange = async (checked: boolean) => {
        setLoading(true);
        try {
            const response = await fetch('/api/web-settings/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    toggle_type: 'toggleGudangutama',
                    value: checked,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setEnabled(checked);
                toast.success(data.message);

                if (checked) {
                    // Refresh data external databases
                    fetchGudangData();
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengubah pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDisable = async () => {
        if (window.confirm('Apakah Anda yakin ingin menonaktifkan fitur gudang?')) {
            await handleToggleChange(false);
        }
    };

    const handleSetActiveGudang = async (databaseId: string) => {
        try {
            const response = await fetch('/api/web-settings/set-active-gudang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    gudang_utama_id: databaseId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchGudangData(); // Refresh data
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengatur gudang utama');
        }
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <span className="font-medium">Aktifkan Fitur Gudang</span>
                <Switch checked={enabled} onCheckedChange={handleToggleChange} disabled={loading} />
            </div>

            {enabled && externalDatabases.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium">Pilih Gudang Utama:</h4>
                    <div className="space-y-2">
                        {externalDatabases.map((db) => (
                            <div key={db.id} className="flex items-center justify-between rounded border p-2">
                                <span>
                                    {db.name} ({db.database})
                                </span>
                                <Button size="sm" variant={db.active ? 'default' : 'outline'} onClick={() => handleSetActiveGudang(db.database)}>
                                    {db.active ? 'Aktif' : 'Pilih'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!enabled && (
                <Button variant="destructive" onClick={handleConfirmDisable}>
                    Konfirmasi Nonaktifkan
                </Button>
            )}
        </div>
    );
}

// ----------------- Harga Jual -----------------
function HargaJual() {
    // State untuk Setting Harga Jual Utama (Gudang Utama)
    const [hargaJualUtama1, setHargaJualUtama1] = useState('');
    const [hargaJualUtama2, setHargaJualUtama2] = useState('');
    const [hargaJualUtama3, setHargaJualUtama3] = useState('');

    // State untuk Setting Harga Jual (Per Klinik)
    const [hargaJual1, setHargaJual1] = useState('');
    const [hargaJual2, setHargaJual2] = useState('');
    const [hargaJual3, setHargaJual3] = useState('');
    const [embalasePoin, setEmbalasePoin] = useState('');

    // Load data dari backend
    useEffect(() => {
        fetchAndUpdateSettings();
    }, []);

    const fetchAndUpdateSettings = async () => {
        try {
            const response = await fetch('/api/setting-harga-jual/get-settings', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const { settingHargaJual, settingHargaJualUtama } = data;

            if (settingHargaJualUtama) {
                setHargaJualUtama1(settingHargaJualUtama.harga_jual_1 || '');
                setHargaJualUtama2(settingHargaJualUtama.harga_jual_2 || '');
                setHargaJualUtama3(settingHargaJualUtama.harga_jual_3 || '');
            }

            if (settingHargaJual) {
                setHargaJual1(settingHargaJual.harga_jual_1 || '');
                setHargaJual2(settingHargaJual.harga_jual_2 || '');
                setHargaJual3(settingHargaJual.harga_jual_3 || '');
                setEmbalasePoin(settingHargaJual.embalase_poin || '');
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    const handleManualSync = async () => {
        const success = await fetchAndUpdateSettings();
        if (success) {
            toast.success('Data berhasil disinkronkan');
        } else {
            toast.error('Gagal melakukan sinkronisasi');
        }
    };

    const handleSubmitUtama = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/setting-harga-jual-utama', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    harga_jual_1: hargaJualUtama1,
                    harga_jual_2: hargaJualUtama2,
                    harga_jual_3: hargaJualUtama3,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('Setting Harga Jual Utama berhasil disimpan');
        } catch (error) {
            toast.error('Gagal menyimpan Setting Harga Jual Utama');
        }
    };

    const handleSubmitKlinik = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/setting-harga-jual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    harga_jual_1: hargaJual1,
                    harga_jual_2: hargaJual2,
                    harga_jual_3: hargaJual3,
                    embalase_poin: embalasePoin,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('Embalase Poin berhasil disimpan');
        } catch (error) {
            toast.error('Gagal menyimpan Embalase Poin');
        }
    };

    return (
        <div className="space-y-6 p-4">
            {/* Setting Harga Jual Utama */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="mb-4 text-lg font-semibold">Setting Harga Jual Utama</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Pengaturan harga dari Gudang Utama</p>

                    <form onSubmit={handleSubmitUtama} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Harga Jual 1 (BPJS)</label>
                                <Input placeholder="0" value={hargaJualUtama1} onChange={(e) => setHargaJualUtama1(e.target.value)} type="number" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Harga Jual 2 (Asuransi)</label>
                                <Input placeholder="0" value={hargaJualUtama2} onChange={(e) => setHargaJualUtama2(e.target.value)} type="number" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Harga Jual 3 (Umum)</label>
                                <Input placeholder="0" value={hargaJualUtama3} onChange={(e) => setHargaJualUtama3(e.target.value)} type="number" />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit">Simpan Harga Utama</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Setting Harga Jual Per Klinik */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="mb-4 text-lg font-semibold">Setting Harga Jual</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        Harga jual disinkronkan dari Setting Utama. Hanya embalase yang dapat diubah.
                    </p>

                    <form onSubmit={handleSubmitKlinik} className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 1 (BPJS)</label>
                                    <Input
                                        placeholder="Disinkronkan dari Setting Utama"
                                        value={hargaJual1}
                                        readOnly
                                        disabled
                                        type="number"
                                        className="cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 2 (Asuransi)</label>
                                    <Input
                                        placeholder="Disinkronkan dari Setting Utama"
                                        value={hargaJual2}
                                        readOnly
                                        disabled
                                        type="number"
                                        className="cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 3 (Umum)</label>
                                    <Input
                                        placeholder="Disinkronkan dari Setting Utama"
                                        value={hargaJual3}
                                        readOnly
                                        disabled
                                        type="number"
                                        className="cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Embalase (per poin)</label>
                                    <Input
                                        placeholder="0"
                                        value={embalasePoin}
                                        onChange={(e) => setEmbalasePoin(e.target.value)}
                                        type="number"
                                        className="border-blue-300 focus:border-blue-500 dark:border-blue-600 dark:focus:border-blue-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleManualSync} className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Sinkron
                            </Button>
                            <Button type="submit">Simpan Embalase Poin</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// ----------------- Payment -----------------
function Payment() {
    const [banks, setBanks] = useState<{ id: number; bank: string; norek: string }[]>([]);
    const [bank, setBank] = useState('');
    const [norek, setNorek] = useState('');

    const handleAdd = () => {
        if (!bank || !norek) return;
        const newBank = {
            id: Date.now(),
            bank,
            norek,
        };
        setBanks([...banks, newBank]);
        setBank('');
        setNorek('');
    };

    const handleDelete = (id: number) => {
        setBanks(banks.filter((b) => b.id !== id));
    };

    return (
        <div className="pt-4">
            <Card className="p-4">
                <CardContent className="space-y-4 pt-4">
                    {/* Form tambah data */}
                    <div className="mb-4 flex gap-2">
                        <Input placeholder="Nama Bank" value={bank} onChange={(e) => setBank(e.target.value)} />
                        <Input placeholder="No. Rekening" value={norek} onChange={(e) => setNorek(e.target.value)} />
                        <Button onClick={handleAdd}>Tambah</Button>
                    </div>

                    {/* Tabel data */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bank</TableHead>
                                <TableHead>No. Rekening</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {banks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        Belum ada data
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banks.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>{b.bank}</TableCell>
                                        <TableCell>{b.norek}</TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>
                                                Hapus
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// ----------------- Advanced -----------------
function Advanced() {
    const [logo, setLogo] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nama: '',
        kode_klinik: '',
        alamat: '',
    });
    const [loading, setLoading] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Load data saat komponen dimount
    useEffect(() => {
        fetchAdvancedData();
    }, []);

    const fetchAdvancedData = async () => {
        try {
            const response = await fetch('/api/web-settings/show', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.setting) {
                    setFormData({
                        nama: data.data.setting.nama || '',
                        kode_klinik: data.data.setting.kode_klinik || '',
                        alamat: data.data.setting.alamat || '',
                    });

                    if (data.data.setting.profile_image) {
                        setPreview(`/setting/${data.data.setting.profile_image}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching advanced data:', error);
        }
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setLogo(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('nama', formData.nama);
            formDataToSend.append('kode_klinik', formData.kode_klinik);
            formDataToSend.append('alamat', formData.alamat);

            if (logo) {
                formDataToSend.append('profile_image', logo);
            }

            const response = await fetch('/api/web-settings/update', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formDataToSend,
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setLogo(null); // Reset file input
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="col-span-2 flex flex-col items-center justify-center">
                <label className="mb-2 block text-sm font-medium">Logo Klinik</label>
                <div
                    className="mb-2 flex h-48 w-48 cursor-pointer items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={handleLogoClick}
                    style={{ border: 'none' }}
                >
                    {preview ? (
                        <img src={preview} alt="Preview Logo Klinik" className="h-44 w-44 rounded-full object-cover" />
                    ) : (
                        <img src="/icon/default.webp" alt="Default Logo Klinik" className="h-32 w-32 rounded-full object-cover opacity-60" />
                    )}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Nama Klinik</label>
                    <Input name="nama" type="text" value={formData.nama} onChange={handleChange} placeholder="Masukkan Nama Klinik" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Kode Aplikasi Klinik</label>
                    <Input
                        name="kode_klinik"
                        type="text"
                        value={formData.kode_klinik}
                        onChange={handleChange}
                        placeholder="Masukkan Kode Aplikasi"
                        required
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium">Alamat Klinik</label>
                    <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleChange}
                        className="min-h-[80px] w-full resize-y rounded border p-2"
                        placeholder="Masukkan Alamat Klinik"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
            </div>
        </form>
    );
}
export { Advanced, ConfigBPJS, ConfigGudang, ConfigSatuSehat, HargaJual, Payment };

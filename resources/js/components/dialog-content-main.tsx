'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
    const [enabledSS, setEnabledSS] = useState<boolean>(true);

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

    // Prefill toggle dari Inertia props
    const { props } = usePage<any>();
    useEffect(() => {
        const isActive = props?.web_setting?.is_satusehat_active;
        if (typeof isActive !== 'undefined') {
            setEnabledSS(Boolean(isActive));
        }
    }, [props?.web_setting?.is_satusehat_active]);

    const handleToggleChangeSS = async (checked: boolean) => {
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
                    toggle_type: 'toggleSatusehat',
                    value: checked,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setEnabledSS(checked);
                toast.success(data.message || 'Status Satu Sehat diperbarui');
            } else {
                toast.error(data.message || 'Gagal memperbarui status Satu Sehat');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengubah pengaturan Satu Sehat');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enabledSS) return;
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
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <span className="font-medium">Aktifkan Satu Sehat</span>
                <Switch checked={enabledSS} onCheckedChange={handleToggleChangeSS} disabled={loading} />
            </div>
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    disabled={!enabledSS || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Organization ID</label>
                                <Input
                                    name="org_id"
                                    type="text"
                                    value={formData.org_id}
                                    onChange={handleChange}
                                    placeholder="Masukkan Org ID"
                                    required
                                    disabled={!enabledSS || loading}
                                />
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
                                    disabled={!enabledSS || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Secret Key</label>
                                <Input
                                    name="SECRET_KEY"
                                    type="password"
                                    value={formData.SECRET_KEY}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={!enabledSS || loading}
                                />
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
                                    disabled={!enabledSS || loading}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading || !enabledSS}>
                                {loading ? 'Menyimpan...' : 'Simpan Config Satu Sehat'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// ----------------- Config BPJS -----------------
function ConfigBPJS() {
    const [formData, setFormData] = useState({
        CONSID: '',
        KPFK: '',
        SECRET_KEY: '',
        USER_KEY: '',
        USERNAME: '',
        PASSWORD: '',
        MOBILE_JKN_USER: '',
        MOBILE_JKN_PASS: '',
    });
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState<boolean>(true);

    // Prefill dari Inertia props (dibagikan via HandleInertiaRequests)
    const { props } = usePage<any>();
    useEffect(() => {
        const bpjs = props?.set_bpjs;
        if (bpjs) {
            setFormData({
                CONSID: bpjs.CONSID || '',
                KPFK: bpjs.KPFK || '',
                SECRET_KEY: bpjs.SECRET_KEY || '',
                USER_KEY: bpjs.USER_KEY || '',
                USERNAME: bpjs.USERNAME || '',
                PASSWORD: bpjs.PASSWORD || '',
                MOBILE_JKN_USER: bpjs.MOBILE_JKN_USER || '',
                MOBILE_JKN_PASS: bpjs.MOBILE_JKN_PASS || '',
            });
        }
    }, [props?.set_bpjs]);

    // Prefill toggle BPJS dari web_setting props
    useEffect(() => {
        const isActive = props?.web_setting?.is_bpjs_active;
        if (typeof isActive !== 'undefined') {
            setEnabled(Boolean(isActive));
        }
    }, [props?.web_setting?.is_bpjs_active]);

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
                    toggle_type: 'toggleBPJS',
                    value: checked,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setEnabled(checked);
                toast.success(data.message || 'Status BPJS diperbarui');
            } else {
                toast.error(data.message || 'Gagal memperbarui status BPJS');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengubah pengaturan BPJS');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enabled) return;
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
                toast.success(data.message || 'Konfigurasi BPJS berhasil disimpan');
            } else {
                toast.error(data.message || 'Gagal menyimpan konfigurasi BPJS');
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
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <span className="font-medium">Aktifkan BPJS</span>
                <Switch checked={enabled} onCheckedChange={handleToggleChange} disabled={loading} />
            </div>
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Cons ID</label>
                                <Input
                                    name="CONSID"
                                    type="text"
                                    value={formData.CONSID}
                                    onChange={handleChange}
                                    placeholder="Masukkan Cons ID"
                                    required
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">KPFK (Kode Apotek)</label>
                                <Input
                                    name="KPFK"
                                    type="text"
                                    value={formData.KPFK}
                                    onChange={handleChange}
                                    placeholder="Masukkan Kode Apotek"
                                    required
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Secret Key</label>
                                <Input
                                    name="SECRET_KEY"
                                    type="password"
                                    value={formData.SECRET_KEY}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">User Key</label>
                                <Input
                                    name="USER_KEY"
                                    type="password"
                                    value={formData.USER_KEY}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Username</label>
                                <Input
                                    name="USERNAME"
                                    type="text"
                                    value={formData.USERNAME}
                                    onChange={handleChange}
                                    placeholder="Masukkan Username"
                                    required
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Password</label>
                                <Input
                                    name="PASSWORD"
                                    type="password"
                                    value={formData.PASSWORD}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Mobile JKN Username</label>
                                <Input
                                    name="MOBILE_JKN_USER"
                                    type="text"
                                    value={formData.MOBILE_JKN_USER}
                                    onChange={handleChange}
                                    placeholder="Masukkan Username Mobile JKN"
                                    disabled={!enabled || loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Mobile JKN Password</label>
                                <Input
                                    name="MOBILE_JKN_PASS"
                                    type="password"
                                    value={formData.MOBILE_JKN_PASS}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    disabled={!enabled || loading}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading || !enabled}>
                                {loading ? 'Menyimpan...' : 'Simpan Config BPJS'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
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
                    setEnabled(Boolean(data.data.setting?.is_gudangutama_active ?? true));
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
                {/* Toggle harus selalu tampil, tidak tergantung enabled */}
                <Switch checked={enabled} onCheckedChange={handleToggleChange} disabled={loading} />
            </div>
        </div>
    );
}

// ----------------- Harga Jual -----------------
function HargaJual() {
    // Helper: normalize value untuk input; jangan sembunyikan nilai 0
    const clearZeroValue = (value: any) => {
        if (value === null || typeof value === 'undefined') {
            return '';
        }
        return String(value);
    };

    // State untuk Setting Harga Jual Utama (Gudang Utama)
    const [hargaJualUtama1, setHargaJualUtama1] = useState('');
    const [hargaJualUtama2, setHargaJualUtama2] = useState('');
    const [hargaJualUtama3, setHargaJualUtama3] = useState('');
    const [settingWaktuUtama, setSettingWaktuUtama] = useState('');
    const [satuanWaktuUtama, setSatuanWaktuUtama] = useState('');

    // State untuk Setting Harga Jual (Per Klinik)
    const [hargaJual1, setHargaJual1] = useState('');
    const [hargaJual2, setHargaJual2] = useState('');
    const [hargaJual3, setHargaJual3] = useState('');
    const [embalasePoin, setEmbalasePoin] = useState('');
    const [settingWaktu, setSettingWaktu] = useState('');
    const [satuanWaktu, setSatuanWaktu] = useState('');

    // State untuk status gudang utama
    const [isGudangUtama, setIsGudangUtama] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load data dari backend
    useEffect(() => {
        fetchWebSettings();
        fetchAndUpdateSettings();
    }, []);

    // Clear harga jual ketika status gudang utama berubah
    useEffect(() => {
        if (!isGudangUtama) {
            // Clear semua state secara immediate
            setHargaJualUtama1('');
            setHargaJualUtama2('');
            setHargaJualUtama3('');
            setHargaJual1('');
            setHargaJual2('');
            setHargaJual3('');
            setEmbalasePoin('');
            setSettingWaktuUtama('');
            setSatuanWaktuUtama('');
        }
    }, [isGudangUtama]);

    // Render jika gudang utama ATAU ada nilai (termasuk "0") pada salah satu harga
    const shouldRenderHargaJual = Boolean(
        isGudangUtama || [hargaJual1, hargaJual2, hargaJual3].some((v) => v !== '')
    );

    const fetchWebSettings = async () => {
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
                    const newGudangStatus = Boolean(data.data.setting?.is_gudangutama_active ?? false);

                    // Jika status gudang utama berubah
                    if (newGudangStatus !== isGudangUtama) {
                        setIsGudangUtama(newGudangStatus);

                        // Jika gudang utama dinonaktifkan, clear semua harga jual dan embalase
                        if (!newGudangStatus) {
                            setHargaJualUtama1('');
                            setHargaJualUtama2('');
                            setHargaJualUtama3('');
                            setHargaJual1('');
                            setHargaJual2('');
                            setHargaJual3('');
                            setEmbalasePoin('');
                            setSettingWaktuUtama('');
                            setSatuanWaktuUtama('');
                        }

                        // Refresh data setelah status berubah
                        fetchAndUpdateSettings();
                    } else {
                        setIsGudangUtama(newGudangStatus);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching web settings:', error);
        }
    };

    const fetchAndUpdateSettings = async () => {
        try {
            // Clear state terlebih dahulu untuk mencegah nilai lama tertampil
            if (!isGudangUtama) {
                setHargaJual1('');
                setHargaJual2('');
                setHargaJual3('');
                setEmbalasePoin('');
            }

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

            // Debug: log data yang diterima
            // console.debug('Data from backend:', { settingHargaJual, settingHargaJualUtama });

            if (settingHargaJualUtama) {
                setHargaJualUtama1(clearZeroValue(settingHargaJualUtama.harga_jual_1));
                setHargaJualUtama2(clearZeroValue(settingHargaJualUtama.harga_jual_2));
                setHargaJualUtama3(clearZeroValue(settingHargaJualUtama.harga_jual_3));
                setSettingWaktuUtama(clearZeroValue(settingHargaJualUtama.setting_waktu));
                setSatuanWaktuUtama(settingHargaJualUtama.satuan_waktu || '');
            }

            if (settingHargaJual && (settingHargaJual.harga_jual_1 || settingHargaJual.harga_jual_2 || settingHargaJual.harga_jual_3)) {
                setHargaJual1(clearZeroValue(settingHargaJual.harga_jual_1));
                setHargaJual2(clearZeroValue(settingHargaJual.harga_jual_2));
                setHargaJual3(clearZeroValue(settingHargaJual.harga_jual_3));
                setEmbalasePoin(clearZeroValue(settingHargaJual.embalase_poin));
                setSettingWaktu(clearZeroValue(settingHargaJual.setting_waktu));
                setSatuanWaktu(settingHargaJual.satuan_waktu || '');
            } else {
                // Jika tidak ada data harga jual yang valid, clear state
                setHargaJual1('');
                setHargaJual2('');
                setHargaJual3('');
                setEmbalasePoin('');
                setSettingWaktu('');
                setSatuanWaktu('');
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    const handleManualSync = async () => {
        try {
            const response = await fetch('/api/setting-harga-jual/sync-from-utama', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await response.json();

            if (data.success) {
                // Update state dengan data yang baru disinkronkan
                const { settingHargaJual, settingHargaJualUtama } = data;

                if (settingHargaJualUtama) {
                    setHargaJualUtama1(clearZeroValue(settingHargaJualUtama.harga_jual_1));
                    setHargaJualUtama2(clearZeroValue(settingHargaJualUtama.harga_jual_2));
                    setHargaJualUtama3(clearZeroValue(settingHargaJualUtama.harga_jual_3));
                    setSettingWaktuUtama(clearZeroValue(settingHargaJualUtama.setting_waktu));
                    setSatuanWaktuUtama(settingHargaJualUtama.satuan_waktu || '');
                }

                if (settingHargaJual && (settingHargaJual.harga_jual_1 || settingHargaJual.harga_jual_2 || settingHargaJual.harga_jual_3)) {
                    setHargaJual1(clearZeroValue(settingHargaJual.harga_jual_1));
                    setHargaJual2(clearZeroValue(settingHargaJual.harga_jual_2));
                    setHargaJual3(clearZeroValue(settingHargaJual.harga_jual_3));
                    // Embalase tidak diubah saat sinkronisasi
                    setEmbalasePoin(clearZeroValue(settingHargaJual.embalase_poin) || embalasePoin);
                    setSettingWaktu(clearZeroValue(settingHargaJual.setting_waktu));
                    setSatuanWaktu(settingHargaJual.satuan_waktu || '');
                } else {
                    // Jika tidak ada data harga jual yang valid, clear state
                    setHargaJual1('');
                    setHargaJual2('');
                    setHargaJual3('');
                }

                toast.success(data.message || 'Data berhasil disinkronkan dari Gudang Utama');
            } else {
                toast.error(data.message || 'Gagal melakukan sinkronisasi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat melakukan sinkronisasi');
        }
    };

    const handleSubmitUtama = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                harga_jual_1: hargaJualUtama1,
                harga_jual_2: hargaJualUtama2,
                harga_jual_3: hargaJualUtama3,
                setting_waktu: settingWaktuUtama,
                satuan_waktu: satuanWaktuUtama,
            };

            const response = await fetch('/api/setting-harga-jual-utama', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            const raw = await response.clone().text();
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data: any = null;
            try { data = JSON.parse(raw); } catch (_) {}
            toast.success(data?.message || 'Setting Harga Jual Utama berhasil disimpan');
        } catch (error: any) {
            console.error('[DEBUG] Error saving utama:', error);
            toast.error(`Gagal menyimpan Setting Harga Jual Utama: ${error?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitKlinik = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                harga_jual_1: hargaJual1,
                harga_jual_2: hargaJual2,
                harga_jual_3: hargaJual3,
                embalase_poin: embalasePoin,
                setting_waktu: settingWaktu,
                satuan_waktu: satuanWaktu,
            };

            const response = await fetch('/api/setting-harga-jual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            const raw = await response.clone().text();
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data: any = null;
            try { data = JSON.parse(raw); } catch (_) {}
            toast.success(data?.message || 'Embalase Poin berhasil disimpan');
        } catch (error) {
            toast.error('Gagal menyimpan Embalase Poin');
        }
    };

    return (
        <div className="space-y-6 p-4">
            {/* Status Gudang Utama */}
            {Boolean(isGudangUtama) && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center">
                        <svg className="mr-3 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Status: Gudang Utama Aktif</h4>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                Klinik ini dapat mengatur harga jual utama yang akan disinkronkan ke klinik lain.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Setting Harga Jual Utama - Hanya untuk Gudang Utama */}
            {Boolean(isGudangUtama) && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="mb-4 text-lg font-semibold">Setting Harga Jual Utama</h3>
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            Pengaturan persentase markup harga jual dari Gudang Utama. Nilai dalam persen (%) dari harga dasar obat. Embalase diatur
                            per klinik.
                        </p>

                        <form onSubmit={handleSubmitUtama} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 1 (BPJS)</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="10"
                                            value={isGudangUtama ? hargaJualUtama1 : ''}
                                            onChange={(e) => setHargaJualUtama1(e.target.value)}
                                            type="number"
                                            disabled={loading || !isGudangUtama}
                                            min="0"
                                            max="1000"
                                            step="0.01"
                                        />
                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">%</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 2 (Asuransi)</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="15"
                                            value={isGudangUtama ? hargaJualUtama2 : ''}
                                            onChange={(e) => setHargaJualUtama2(e.target.value)}
                                            type="number"
                                            disabled={loading || !isGudangUtama}
                                            min="0"
                                            max="1000"
                                            step="0.01"
                                        />
                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">%</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 3 (Umum)</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="20"
                                            value={isGudangUtama ? hargaJualUtama3 : ''}
                                            onChange={(e) => setHargaJualUtama3(e.target.value)}
                                            type="number"
                                            disabled={loading || !isGudangUtama}
                                            min="0"
                                            max="1000"
                                            step="0.01"
                                        />
                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">%</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3>Setting Waktu Harga</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input placeholder="Pilih waktu" type="number" value={settingWaktuUtama} onChange={(e) => setSettingWaktuUtama(e.target.value)} />
                                    <Select value={satuanWaktuUtama} onValueChange={setSatuanWaktuUtama}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih satuan waktu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Minggu">Minggu</SelectItem>
                                            <SelectItem value="Bulan">Bulan</SelectItem>
                                            <SelectItem value="Tahun">Tahun</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Menyimpan...' : 'Simpan Harga Utama'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Setting Harga Jual Per Klinik */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="mb-4 text-lg font-semibold">Setting Harga Jual</h3>
                    {isGudangUtama ? (
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            Sebagai Gudang Utama, persentase harga jual sudah diatur di atas. Embalase (biaya tambahan) diatur per klinik di sini.
                        </p>
                    ) : (
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            Persentase harga jual disinkronkan dari Gudang Utama. Lakukan sinkronisasi untuk mendapatkan harga terbaru, dan atur
                            embalase sesuai kebutuhan klinik.
                        </p>
                    )}

                    {!isGudangUtama && !hargaJual1 && !hargaJual2 && !hargaJual3 && (
                        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                            <div className="flex items-center">
                                <svg className="mr-3 h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502 1.667 1.732 2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">Belum Ada Data Harga Jual</h4>
                                    <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                                        Klinik ini bukan Gudang Utama. Silakan lakukan sinkronisasi untuk mendapatkan harga jual dari Gudang Utama.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isGudangUtama && (hargaJual1 || hargaJual2 || hargaJual3) && (
                        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                            <div className="flex items-center">
                                <svg className="mr-3 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Data Harga Jual Tersedia</h4>
                                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                        Harga jual sudah disinkronkan dari Gudang Utama. Anda dapat mengatur embalase sesuai kebutuhan klinik.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmitKlinik} className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 1 (BPJS)</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Disinkronkan dari Setting Utama"
                                            value={shouldRenderHargaJual ? hargaJual1 : ''}
                                            readOnly
                                            disabled
                                            type="text"
                                            className="cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                        />
                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">%</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 2 (Asuransi)</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Disinkronkan dari Setting Utama"
                                            value={shouldRenderHargaJual ? hargaJual2 : ''}
                                            readOnly
                                            disabled
                                            type="text"
                                            className="cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                        />
                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Harga Jual 3 (Umum)</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Disinkronkan dari Setting Utama"
                                            value={shouldRenderHargaJual ? hargaJual3 : ''}
                                            readOnly
                                            disabled
                                            type="text"
                                            className="cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                        />
                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">%</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Embalase (per poin)</label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                                        <Input
                                            placeholder="1000"
                                            value={embalasePoin}
                                            onChange={(e) => setEmbalasePoin(e.target.value)}
                                            type="number"
                                            className="border-blue-300 pl-10 focus:border-blue-500 dark:border-blue-600 dark:focus:border-blue-400"
                                            min="0"
                                            step="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3>Setting Waktu Harga</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input placeholder="Pilih waktu" type="number" value={settingWaktu} onChange={(e) => setSettingWaktu(e.target.value)} />
                                <Select value={satuanWaktu} onValueChange={setSatuanWaktu}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih satuan waktu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Minggu">Minggu</SelectItem>
                                        <SelectItem value="Bulan">Bulan</SelectItem>
                                        <SelectItem value="Tahun">Tahun</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            <Button type="submit">Simpan Pengaturan</Button>
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
        kode_group_klinik: '',
        alamat: '',
    });
    const [loading, setLoading] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Prefill dari Inertia props (dibagikan via HandleInertiaRequests)
    const { props } = usePage<any>();
    useEffect(() => {
        const setting = props?.web_setting;
        if (setting) {
            setFormData({
                nama: setting.nama || '',
                kode_klinik: setting.kode_klinik || '',
                kode_group_klinik: setting.kode_group_klinik || '',
                alamat: setting.alamat || '',
            });

            if (setting.profile_image) {
                setPreview(`/setting/${setting.profile_image}`);
            }
        }
    }, [props?.web_setting]);

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
            formDataToSend.append('kode_group_klinik', formData.kode_group_klinik);
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <div>
                    <label className="block text-sm font-medium">Kode Group Klinik</label>
                    <Input
                        name="kode_group_klinik"
                        type="text"
                        value={formData.kode_group_klinik}
                        onChange={handleChange}
                        placeholder="Masukkan Kode Group Klinik"
                    />
                </div>
                <div className="col-span-1 md:col-span-3">
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

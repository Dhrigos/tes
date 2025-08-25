'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Province {
    id: number;
    name: string;
    code: string;
}

interface Regency {
    id: number;
    name: string;
    code: string;
    province_code: string;
}

interface District {
    id: number;
    name: string;
    code: string;
    city_code: string;
}

interface Village {
    id: number;
    name: string;
    code: string;
    district_code: string;
}

interface LaravoltIndonesiaProps {
    provinces: Province[];
    selectedProvince?: string;
    selectedRegency?: string;
    selectedDistrict?: string;
    selectedVillage?: string;
    onProvinceChange: (value: string) => void;
    onRegencyChange: (value: string) => void;
    onDistrictChange: (value: string) => void;
    onVillageChange: (value: string) => void;
    // Configurable endpoints
    kabupatenEndpoint?: string;
    kecamatanEndpoint?: string;
    desaEndpoint?: string;
}

export default function LaravoltIndonesiaExample({
    provinces,
    selectedProvince,
    selectedRegency,
    selectedDistrict,
    selectedVillage,
    onProvinceChange,
    onRegencyChange,
    onDistrictChange,
    onVillageChange,
    kabupatenEndpoint = '/pasien/kabupaten',
    kecamatanEndpoint = '/pasien/kecamatan',
    desaEndpoint = '/pasien/desa',
}: LaravoltIndonesiaProps) {
    const [regencies, setRegencies] = useState<Regency[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [loading, setLoading] = useState(false);
    const norm = (v: any) => String(v ?? '').trim();

    // Normalisasi nilai terpilih menjadi code yang valid agar Select tidak fallback ke item pertama
    const normalizedProvinceValue = useMemo(() => {
        if (!selectedProvince) return '' as unknown as string;
        const province = provinces.find((p) => norm(p.code) === norm(selectedProvince) || norm(p.id) === norm(selectedProvince));
        return province ? province.code : (selectedProvince as string);
    }, [selectedProvince, provinces]);

    const normalizedRegencyValue = useMemo(() => {
        if (!selectedRegency) return '' as unknown as string;
        const regency = regencies.find((r) => norm(r.code) === norm(selectedRegency) || norm(r.id) === norm(selectedRegency));
        return regency ? regency.code : (selectedRegency as string);
    }, [selectedRegency, regencies]);

    const normalizedDistrictValue = useMemo(() => {
        if (!selectedDistrict) return '' as unknown as string;
        const district = districts.find((d) => norm(d.code) === norm(selectedDistrict) || norm(d.id) === norm(selectedDistrict));
        return district ? district.code : (selectedDistrict as string);
    }, [selectedDistrict, districts]);

    const normalizedVillageValue = useMemo(() => {
        if (!selectedVillage) return '' as unknown as string;
        const village = villages.find((v) => norm(v.code) === norm(selectedVillage) || norm(v.id) === norm(selectedVillage));
        return village ? village.code : (selectedVillage as string);
    }, [selectedVillage, villages]);

    const isRegencyReady = useMemo(() => {
        if (!selectedRegency) return true;
        return regencies.some((r) => norm(r.code) === norm(selectedRegency) || norm(r.id) === norm(selectedRegency));
    }, [selectedRegency, regencies]);

    const isDistrictReady = useMemo(() => {
        if (!selectedDistrict) return true;
        return districts.some((d) => norm(d.code) === norm(selectedDistrict) || norm(d.id) === norm(selectedDistrict));
    }, [selectedDistrict, districts]);

    const isVillageReady = useMemo(() => {
        if (!selectedVillage) return true;
        return villages.some((v) => norm(v.code) === norm(selectedVillage) || norm(v.id) === norm(selectedVillage));
    }, [selectedVillage, villages]);

    // Sync up selected values to their normalized code once options are ready
    useEffect(() => {
        if (!selectedProvince) return;
        const normalized = normalizedProvinceValue;
        if (normalized && norm(normalized) !== norm(selectedProvince)) {
            onProvinceChange(normalized);
        }
    }, [normalizedProvinceValue, selectedProvince]);

    useEffect(() => {
        if (!selectedRegency || !isRegencyReady) return;
        const normalized = normalizedRegencyValue;
        if (normalized && norm(normalized) !== norm(selectedRegency)) {
            onRegencyChange(normalized);
        }
    }, [normalizedRegencyValue, isRegencyReady, selectedRegency]);

    useEffect(() => {
        if (!selectedDistrict || !isDistrictReady) return;
        const normalized = normalizedDistrictValue;
        if (normalized && norm(normalized) !== norm(selectedDistrict)) {
            onDistrictChange(normalized);
        }
    }, [normalizedDistrictValue, isDistrictReady, selectedDistrict]);

    useEffect(() => {
        if (!selectedVillage || !isVillageReady) return;
        const normalized = normalizedVillageValue;
        if (normalized && norm(normalized) !== norm(selectedVillage)) {
            onVillageChange(normalized);
        }
    }, [normalizedVillageValue, isVillageReady, selectedVillage]);

    // Load regencies when province changes
    useEffect(() => {
        if (selectedProvince) {
            setLoading(true);
            // Find province by code to get ID for API call
            const province = provinces.find((p) => norm(p.code) === norm(selectedProvince) || norm(p.id) === norm(selectedProvince));
            // console.log('[Wilayah] Province change:', { selectedProvince, foundProvince: province });
            if (province) {
                fetch(`${kabupatenEndpoint}/${province.id}`)
                    .then((response) => response.json())
                    .then((data) => {
                        // Normalize to ensure code exists
                        const normalized = (data as any[]).map((r) => ({
                            ...r,
                            code: norm(r.code ?? r.kode ?? r.id),
                        }));
                        setRegencies(normalized as Regency[]);
                        // console.log('[Wilayah] Regencies loaded:', { count: normalized.length, selectedRegency });
                        setDistricts([]);
                        setVillages([]);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.error('Error loading regencies:', error);
                        setLoading(false);
                    });
            } else {
                setRegencies([]);
                setDistricts([]);
                setVillages([]);
                setLoading(false);
            }
        } else {
            setRegencies([]);
            setDistricts([]);
            setVillages([]);
        }
    }, [selectedProvince, provinces, kabupatenEndpoint]);

    // Load data for editing when component mounts with existing selections
    useEffect(() => {
        if (selectedProvince && selectedRegency && selectedDistrict && selectedVillage) {
            // Load all data for editing
            const loadDataForEditing = async () => {
                try {
                    setLoading(true);

                    // Load regencies
                    const province = provinces.find((p) => norm(p.code) === norm(selectedProvince) || norm(p.id) === norm(selectedProvince));
                    if (province) {
                        const resKab = await fetch(`${kabupatenEndpoint}/${province.id}`);
                        const dataKab = await resKab.json();
                        const normalizedKab = (dataKab as any[]).map((r) => ({
                            ...r,
                            code: norm(r.code ?? r.kode ?? r.id),
                        }));
                        setRegencies(normalizedKab as Regency[]);

                        // Load districts
                        const resKec = await fetch(`${kecamatanEndpoint}/${selectedRegency}`);
                        const dataKec = await resKec.json();
                        const normalizedKec = (dataKec as any[]).map((d) => ({
                            ...d,
                            code: norm(d.code ?? d.kode ?? d.id),
                        }));
                        setDistricts(normalizedKec as District[]);

                        // Load villages
                        const resDesa = await fetch(`${desaEndpoint}/${selectedDistrict}`);
                        const dataDesa = await resDesa.json();
                        const normalizedDesa = (dataDesa as any[]).map((v) => ({
                            ...v,
                            code: norm(v.code ?? v.kode ?? v.id),
                        }));
                        setVillages(normalizedDesa as Village[]);
                    }
                } catch (error) {
                    console.error('Error loading data for editing:', error);
                } finally {
                    setLoading(false);
                }
            };

            loadDataForEditing();
        }
    }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, provinces, kabupatenEndpoint, kecamatanEndpoint, desaEndpoint]);

    // Load districts when regency changes
    useEffect(() => {
        if (!selectedRegency) {
            setDistricts([]);
            setVillages([]);
            return;
        }

        const run = async () => {
            try {
                // Pastikan regencies tersedia. Jika belum, coba muat berdasar province atau infer dari kode kabupaten
                let availableRegencies = regencies;
                let didFetchRegencies = false;

                if (availableRegencies.length === 0) {
                    // Cari province dari selectedProvince (jika ada)
                    let province = undefined as Province | undefined;
                    if (selectedProvince) {
                        province = provinces.find((p) => norm(p.code) === norm(selectedProvince) || norm(p.id) === norm(selectedProvince));
                    }

                    // Jika province belum diketahui, coba infer dari prefix kode kabupaten (contoh: 5106 -> province 51)
                    if (!province) {
                        const inferredProvinceCode = String(selectedRegency).slice(0, 2);
                        province = provinces.find((p) => norm(p.code) === norm(inferredProvinceCode));
                        if (province) {
                            // console.log('[Wilayah] Province inferred from regency prefix:', {
                            //     selectedRegency,
                            //     inferredProvinceCode,
                            //     foundProvince: province,
                            // });
                        }
                    }

                    if (province) {
                        setLoading(true);
                        try {
                            const resKab = await fetch(`${kabupatenEndpoint}/${province.id}`);
                            const dataKab = await resKab.json();
                            availableRegencies = (dataKab as any[]).map((r) => ({
                                ...r,
                                code: norm(r.code ?? r.kode ?? r.id),
                            })) as Regency[];
                            setRegencies(availableRegencies);
                            didFetchRegencies = true;
                            // console.log('[Wilayah] Regencies loaded on-demand:', {
                            //     count: availableRegencies.length,
                            //     selectedRegency,
                            // });
                        } catch (e) {
                            console.error('Error loading regencies (on-demand):', e);
                        } finally {
                            setLoading(false);
                        }
                    } else {
                        // console.log('[Wilayah] Regency change skipped: gagal menentukan province untuk memuat regencies', {
                        //     selectedRegency,
                        //     selectedProvince,
                        // });
                        return;
                    }
                }

                const searchKey = norm(normalizedRegencyValue || selectedRegency);
                const regency = availableRegencies.find((r) => norm(r.code) === searchKey || norm(r.id) === searchKey);

                // console.log('[Wilayah] Regency change:', {
                //     selectedRegency,
                //     searchKey,
                //     regenciesCount: availableRegencies.length,
                //     sample: availableRegencies[0],
                //     foundRegency: regency,
                //     didFetchRegencies,
                // });

                setLoading(true);
                if (regency) {
                    try {
                        const res = await fetch(`${kecamatanEndpoint}/${regency.id}`);
                        const data = await res.json();
                        const normalized = (data as any[]).map((d) => ({
                            ...d,
                            code: norm(d.code ?? d.kode ?? d.id),
                        }));
                        setDistricts(normalized as District[]);
                        // console.log('[Wilayah] Districts loaded:', { count: normalized.length, selectedDistrict });
                        setVillages([]);
                    } catch (error) {
                        console.error('Error loading districts:', error);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setDistricts([]);
                    setVillages([]);
                    setLoading(false);
                }
            } catch (e) {
                console.error('Unexpected error handling regency change:', e);
            }
        };

        run();
    }, [selectedRegency, regencies, normalizedRegencyValue, selectedProvince, provinces]);
    // Load villages when district changes
    useEffect(() => {
        if (!selectedDistrict) {
            setVillages([]);
            return;
        }

        if (districts.length === 0) {
            // console.log('[Wilayah] District change skipped: districts belum ter-load', { selectedDistrict });
            return;
        }

        // Find district by code to get ID for API call
        const searchKey = norm(selectedDistrict);
        const district = districts.find((d) => norm(d.code) === searchKey || norm(d.id) === searchKey);
        // console.log('[Wilayah] District change:', { selectedDistrict, foundDistrict: district });

        if (district) {
            setLoading(true);
            fetch(`${desaEndpoint}/${district.id}`)
                .then((response) => response.json())
                .then((data) => {
                    // Normalize to ensure code exists
                    const normalized = (data as any[]).map((v) => ({
                        ...v,
                        code: norm(v.code ?? v.kode ?? v.id),
                    }));
                    setVillages(normalized as Village[]);
                    // console.log('[Wilayah] Villages loaded:', { count: normalized.length, selectedVillage });
                })
                .catch((error) => {
                    console.error('Error loading villages:', error);
                })
                .finally(() => setLoading(false));
        } else {
            setVillages([]);
        }
    }, [selectedDistrict, districts]);

    // Prefetch chain for edit mode when initial values exist (run once)
    const bootstrappedRef = useRef(false);
    useEffect(() => {
        const provinceExists = !!selectedProvince;
        if (!provinceExists) return;
        if (bootstrappedRef.current) return;

        const bootstrap = async () => {
            try {
                setLoading(true);
                // Resolve province (lenient match)
                const province = provinces.find((p) => norm(p.code) === norm(selectedProvince) || norm(p.id) === norm(selectedProvince));
                // console.log('[Bootstrap] Start with:', {
                //     selectedProvince,
                //     selectedRegency,
                //     selectedDistrict,
                //     selectedVillage,
                //     foundProvince: province,
                // });
                if (!province) return;

                // Always ensure regencies correspond to current province
                let regenciesData = regencies;
                if (regenciesData.length === 0) {
                    const resKab = await fetch(`/pasien/kabupaten/${province.id}`);
                    const dataKab = await resKab.json();
                    regenciesData = (dataKab as any[]).map((r) => ({ ...r, code: r.code ?? r.kode ?? String(r.id) }));
                    setRegencies(regenciesData as Regency[]);
                    // console.log('[Bootstrap] Loaded regencies:', { count: regenciesData.length });
                }

                // If a regency is selected but not present in options, refetch for safety
                const regencySelected = !!selectedRegency;
                const regency = regencySelected
                    ? regenciesData.find((r: any) => norm(r.code) === norm(selectedRegency) || norm(r.id) === norm(selectedRegency))
                    : null;
                // console.log('[Bootstrap] Match regency:', { selectedRegency, foundRegency: regency });

                // Ensure districts are loaded when a valid regency is identified
                let districtsData = districts;
                const needDistricts =
                    !!regency &&
                    (!districtsData.length ||
                        (selectedDistrict &&
                            !districtsData.some((d: any) => norm(d.code) === norm(selectedDistrict) || norm(d.id) === norm(selectedDistrict))));
                if (needDistricts) {
                    const resKec = await fetch(`/pasien/kecamatan/${regency.id}`);
                    const dataKec = await resKec.json();
                    districtsData = (dataKec as any[]).map((d) => ({ ...d, code: d.code ?? d.kode ?? String(d.id) }));
                    setDistricts(districtsData as District[]);
                    // console.log('[Bootstrap] Loaded districts:', { count: districtsData.length });
                }

                // Ensure villages are loaded when a valid district is identified
                const district = selectedDistrict
                    ? districtsData.find((d: any) => norm(d.code) === norm(selectedDistrict) || norm(d.id) === norm(selectedDistrict))
                    : null;
                // console.log('[Bootstrap] Match district:', { selectedDistrict, foundDistrict: district });

                const needVillages =
                    !!district &&
                    (!villages.length ||
                        (selectedVillage &&
                            !villages.some((v: any) => norm(v.code) === norm(selectedVillage) || norm(v.id) === norm(selectedVillage))));
                if (needVillages) {
                    const resDesa = await fetch(`/pasien/desa/${district.id}`);
                    const dataDesa = await resDesa.json();
                    const villagesData = (dataDesa as any[]).map((v) => ({ ...v, code: v.code ?? v.kode ?? String(v.id) }));
                    setVillages(villagesData as Village[]);
                    // console.log('[Bootstrap] Loaded villages:', { count: villagesData.length });
                }
            } catch (e) {
                console.error('Bootstrap wilayah gagal:', e);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
        bootstrappedRef.current = true;
    }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, provinces]);

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Provinsi */}
            <div>
                <Label htmlFor="provinsi">Provinsi</Label>
                <Select key={`prov-${provinces.length}-${normalizedProvinceValue}`} value={normalizedProvinceValue} onValueChange={onProvinceChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.code}>
                                {province.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Kabupaten/Kota */}
            <div>
                <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
                <Select
                    key={`kab-${regencies.length}-${normalizedRegencyValue}`}
                    value={isRegencyReady ? normalizedRegencyValue : ''}
                    onValueChange={onRegencyChange}
                    disabled={!selectedProvince || loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={loading || !isRegencyReady ? 'Loading...' : 'Pilih Kabupaten/Kota'} />
                    </SelectTrigger>
                    <SelectContent>
                        {regencies.map((regency) => (
                            <SelectItem key={regency.id} value={regency.code}>
                                {regency.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Kecamatan */}
            <div>
                <Label htmlFor="kecamatan">Kecamatan</Label>
                <Select
                    key={`kec-${districts.length}-${normalizedDistrictValue}`}
                    value={isDistrictReady ? normalizedDistrictValue : ''}
                    onValueChange={onDistrictChange}
                    disabled={!selectedRegency || loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={loading || !isDistrictReady ? 'Loading...' : 'Pilih Kecamatan'} />
                    </SelectTrigger>
                    <SelectContent>
                        {districts.map((district) => (
                            <SelectItem key={district.id} value={district.code}>
                                {district.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desa/Kelurahan */}
            <div>
                <Label htmlFor="desa">Desa/Kelurahan</Label>
                <Select
                    key={`des-${villages.length}-${normalizedVillageValue}`}
                    value={isVillageReady ? normalizedVillageValue : ''}
                    onValueChange={onVillageChange}
                    disabled={!selectedDistrict || loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={loading || !isVillageReady ? 'Loading...' : 'Pilih Desa/Kelurahan'} />
                    </SelectTrigger>
                    <SelectContent>
                        {villages.map((village) => (
                            <SelectItem key={village.id} value={village.code}>
                                {village.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

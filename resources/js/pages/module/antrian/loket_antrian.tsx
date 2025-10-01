import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';

interface AntrianData {
    antrian: string;
    loket: string;
    loket_nama: string;
    loket_key: string; // Key untuk tracking perpindahan loket (A, B, C)
    status_display: string;
    tujuan?: string; // Tujuan untuk text-to-speech
    created_at: string;
}

interface LoketStatus {
    nomor: string;
    label: string;
    icon: string;
}

interface LoketAntrianProps {
    settings?: {
        nama: string;
    };
}

export default function LoketAntrian({ settings }: LoketAntrianProps) {
    const [currentTime, setCurrentTime] = useState<string>('00:00:00');
    const [currentDate, setCurrentDate] = useState<string>('');
    const [displayedQueueNumber, setDisplayedQueueNumber] = useState<string>('--');
    const [displayedStatus, setDisplayedStatus] = useState<string>('MENUNGGU PANGGILAN');
    const [autoAnnounce, setAutoAnnounce] = useState<boolean>(true); // Default ON
    const [allQueues, setAllQueues] = useState<AntrianData[]>([]);
    const [loketStatuses, setLoketStatuses] = useState<Record<string, LoketStatus>>({});
    const [displayedQueues, setDisplayedQueues] = useState<string[]>([]); // Track per loket (A-001-A, A-001-B)
    const [announcedQueues, setAnnouncedQueues] = useState<string[]>([]); // Track nomor antrian yang sudah di-announce per loket (A-001-A, A-001-B)
    const [forceAnnounceQueue, setForceAnnounceQueue] = useState<string | null>(null); // Nomor antrian yang harus di-announce paksa
    const [isDisplayingQueue, setIsDisplayingQueue] = useState<boolean>(false); // Flag untuk mencegah reset saat TTS
    const [lastAnnouncedTime, setLastAnnouncedTime] = useState<Record<string, number>>({}); // Track waktu terakhir announce per antrian-loket

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstLoad = useRef<boolean>(true); // Flag untuk detect first load/refresh

    // Update waktu dan tanggal
    const updateDateTime = () => {
        const now = new Date();
        
        // Format waktu: HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        setCurrentTime(`${hours}:${minutes}:${seconds}`);

        // Format tanggal: DD Bulan YYYY
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        setCurrentDate(now.toLocaleDateString('id-ID', options));
    };

    // Fetch data antrian dari API
    const fetchQueues = async () => {
        try {
            const response = await fetch('/api/antrian/data', {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('❌ API response not OK:', response.status, response.statusText);
                return;
            }
            
            const data = await response.json();
            
            // Check if there's a force announce request
            if (data.force_announce_data) {
                setForceAnnounceQueue(data.force_announce_data.antrian);
            }
            
            if (data.success) {
                if (Array.isArray(data.data)) {
                    // Convert data format untuk tampilan monitor
                    const queues: AntrianData[] = [];
                    
                    data.data.forEach((loket: any) => {
                        if (loket.sedang_dilayani) {
                            // Ambil prefix dari nomor antrian (A-001 → A, K-002 → K)
                            const antrianPrefix = loket.sedang_dilayani.antrian.split('-')[0] || loket.loket_nama;
                            
                            // Tentukan tujuan berdasarkan nama loket
                            let tujuan = '';
                            if (loket.loket_nama === 'A') {
                                tujuan = 'loket pendaftaran';
                            } else if (loket.loket_nama === 'B') {
                                tujuan = 'ruang pemeriksaan';
                            } else if (loket.loket_nama === 'C') {
                                tujuan = 'ruang pemeriksaan';
                            } else {
                                tujuan = `loket ${loket.loket_nama}`;
                            }
                            
                            const queueData = {
                                antrian: loket.sedang_dilayani.antrian,
                                loket: antrianPrefix, // Prefix antrian untuk display (A atau K)
                                loket_nama: loket.loket_nama, // Nama loket untuk tracking (A, B, C)
                                loket_key: loket.loket_nama, // Key untuk tracking perpindahan loket
                                status_display: `SILAHKAN MENUJU ${tujuan.toUpperCase()}`,
                                tujuan: tujuan, // Untuk text-to-speech
                                created_at: loket.sedang_dilayani.created_at || new Date().toISOString()
                            };
                            queues.push(queueData);
                        }
                    });
                    
                    // Inject force announce queue jika ada
                    if (data.force_announce_data) {
                        const forceQueue: AntrianData = {
                            antrian: data.force_announce_data.antrian,
                            loket: data.force_announce_data.antrian.split('-')[0],
                            loket_nama: data.force_announce_data.loket_key,
                            loket_key: data.force_announce_data.loket_key,
                            status_display: `SILAHKAN MENUJU ${data.force_announce_data.tujuan.toUpperCase()}`,
                            tujuan: data.force_announce_data.tujuan,
                            created_at: new Date().toISOString()
                        };
                        
                        // Tambahkan ke queues jika belum ada
                        const exists = queues.some(q => q.antrian === forceQueue.antrian && q.loket_key === forceQueue.loket_key);
                        if (!exists) {
                            queues.unshift(forceQueue); // Tambahkan di awal array
                        }
                    }
                    
                    setAllQueues(queues);
                    
                    // Update status loket
                    const statuses: Record<string, LoketStatus> = {};
                    data.data.forEach((loket: any) => {
                        // Gunakan nama loket langsung (A, B, C, K)
                        const loketKey = loket.loket_nama;
                        statuses[loketKey] = {
                            nomor: loket.sedang_dilayani?.antrian || '--',
                            label: loket.sedang_dilayani ? 'Sedang Dilayani' : 'Siap Melayani',
                            icon: loket.sedang_dilayani ? 
                                '<i class="fas fa-user-nurse mr-1"></i>' : 
                                '<i class="fas fa-check-circle mr-1"></i>'
                        };
                    });
                    setLoketStatuses(statuses);
                } else {
                }
            } else {
                console.error('❌ API returned success: false', data);
            }
        } catch (error) {
            // Silent error
        }
    };

    // Periksa dan tampilkan antrian baru
    const checkAndDisplayNewQueues = () => {
        // Jika sedang menampilkan antrian, jangan proses yang baru
        if (isDisplayingQueue) {
            return;
        }

        if (allQueues.length === 0) {
            setDisplayedQueueNumber('--');
            setDisplayedStatus('TIDAK ADA ANTRIAN');
            return;
        }

        // Filter antrian yang belum ditampilkan
        // Key menggunakan loket_key (A, B, C) bukan loket (prefix antrian)
        // ATAU antrian yang harus di-force announce
        const newQueues = allQueues.filter(queue => {
            const key = `${queue.antrian}-${queue.loket_key}`;
            const isNewQueue = !displayedQueues.includes(key);
            const isForceAnnounce = forceAnnounceQueue === queue.antrian;
            
            return isNewQueue || isForceAnnounce; // Bypass filter jika force announce
        });

        if (newQueues.length === 0) {
            if (!isDisplayingQueue) {
                setDisplayedQueueNumber('--');
                setDisplayedStatus('MENUNGGU PANGGILAN');
            }
            return;
        }

        // Ambil antrian pertama yang belum ditampilkan
        const queueToDisplay = newQueues[0];
        
        // Set flag: sedang menampilkan antrian
        setIsDisplayingQueue(true);
        
        // 1. Tampilkan nomor antrian DULU
        setDisplayedQueueNumber(queueToDisplay.antrian);
        setDisplayedStatus(queueToDisplay.status_display);

        // 2. Tandai antrian ini sudah ditampilkan (per loket)
        const queueKey = `${queueToDisplay.antrian}-${queueToDisplay.loket_key}`;
        setDisplayedQueues(prev => [...prev, queueKey]);

        // 3. Cek apakah kombinasi antrian-loket ini sudah pernah di-announce
        const isAlreadyAnnounced = announcedQueues.includes(queueKey);
        
        // 4. Cek apakah ini force announce (dari button "Panggil Ulang")
        const shouldForceAnnounce = forceAnnounceQueue === queueToDisplay.antrian;
        
        // 5. Cek cooldown - minimal 30 detik sejak announce terakhir untuk kombinasi antrian-loket ini
        const now = Date.now();
        const lastTime = lastAnnouncedTime[queueKey] || 0;
        const cooldownPassed = (now - lastTime) > 30000; // 30 detik

        // 6. Skip TTS jika ini first load (refresh)
        if (isFirstLoad.current) {
            // Tandai sebagai sudah ditampilkan tapi jangan announce
            if (!isAlreadyAnnounced) {
                setAnnouncedQueues(prev => [...prev, queueKey]);
            }
            setLastAnnouncedTime(prev => ({
                ...prev,
                [queueKey]: Date.now()
            }));
            setIsDisplayingQueue(false);
            return;
        }

        // 7. Umumkan antrian jika:
        // - Auto announce aktif DAN
        // - (belum pernah di-announce ATAU force announce) DAN
        // - (cooldown sudah lewat ATAU force announce)
        if (autoAnnounce && (!isAlreadyAnnounced || shouldForceAnnounce) && (cooldownPassed || shouldForceAnnounce)) {
            // Tandai kombinasi antrian-loket ini sudah di-announce (jika belum)
            if (!isAlreadyAnnounced) {
                setAnnouncedQueues(prev => [...prev, queueKey]);
            }
            
            // Reset force announce flag
            if (shouldForceAnnounce) {
                setForceAnnounceQueue(null);
            }
            
            // Update waktu announce terakhir untuk kombinasi antrian-loket ini
            setLastAnnouncedTime(prev => ({
                ...prev,
                [queueKey]: Date.now()
            }));
            
            announceQueue(queueToDisplay, () => {
                // Callback setelah TTS selesai
                // Tunggu 10 detik lagi sebelum reset
                setTimeout(() => {
                    setDisplayedQueueNumber('--');
                    setDisplayedStatus('MENUNGGU PANGGILAN');
                    setIsDisplayingQueue(false); // Reset flag
                }, 10000); // 10 detik untuk display + TTS
            });
        } else {
            // Jika sudah pernah di-announce atau auto announce OFF, reset setelah 5 detik
            setTimeout(() => {
                setDisplayedQueueNumber('--');
                setDisplayedStatus('MENUNGGU PANGGILAN');
                setIsDisplayingQueue(false); // Reset flag
            }, 5000);
        }
    };

    // Fungsi untuk mengumumkan antrian
    const announceQueue = (queue: AntrianData, onComplete?: () => void) => {
        // Pisahkan prefix (huruf) dan nomor
        const match = queue.antrian.match(/^([A-Z]+)[-]?(\d+)$/);
        let announcementText = '';
        
        // Gunakan tujuan dari queue data, atau fallback ke loket_nama
        const tujuan = queue.tujuan || `loket ${queue.loket_nama}`;
        
        if (match) {
            const prefix = match[1]; // A, B, C, K, dll
            const number = match[2]; // 001, 002, dll
            
            // Konversi nomor ke format yang lebih natural
            const numericValue = parseInt(number, 10);
            
            // Buat teks pengumuman yang lebih natural dengan tujuan yang jelas
            announcementText = `Nomor antrian ${prefix} ${numericValue}, silakan menuju ${tujuan}`;
        } else {
            // Fallback jika format tidak sesuai
            announcementText = `Nomor antrian ${queue.antrian}, silakan menuju ${tujuan}`;
        }

        // Gunakan browser native speech synthesis (lebih reliable)
        if ('speechSynthesis' in window) {
            // Hentikan pengumuman sebelumnya
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(announcementText);
            utterance.lang = 'id-ID';
            utterance.rate = 0.85;  // Kecepatan bicara
            utterance.pitch = 1;    // Nada suara
            utterance.volume = 1;   // Volume maksimal

            // Event handlers
            utterance.onend = () => {
                // Panggil callback setelah TTS selesai
                if (onComplete) {
                    onComplete();
                }
            };
            utterance.onerror = (error) => {
                console.error('❌ Speech error:', error);
                // Panggil callback meski error
                if (onComplete) {
                    onComplete();
                }
            };

            // Cari voice Indonesia yang tersedia
            const voices = window.speechSynthesis.getVoices();
            const indonesianVoice = voices.find(voice => 
                voice.lang === 'id-ID' || 
                voice.lang.startsWith('id') ||
                voice.name.toLowerCase().includes('indonesia')
            );

            if (indonesianVoice) {
                utterance.voice = indonesianVoice;
            }

            // Speak dengan delay kecil untuk memastikan voices sudah loaded
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 100);
        } else {
            console.error('❌ No speech synthesis available in this browser');
        }
    };

    // Setup auto-refresh dengan countdown (1 detik untuk responsif)
    const setupAutoRefresh = () => {
        countdownRef.current = setInterval(() => {
            fetchQueues();
        }, 1000); // Refresh setiap 1 detik
    };

    // Effect untuk auto announce
    useEffect(() => {
        if (autoAnnounce) {
            const interval = setInterval(() => {
                checkAndDisplayNewQueues();
            }, 5000);
            
            intervalRef.current = interval;
            checkAndDisplayNewQueues(); // Periksa segera
            
            return () => clearInterval(interval);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setDisplayedQueueNumber('--');
            setDisplayedStatus('MENUNGGU PANGGILAN');
        }
    }, [autoAnnounce, allQueues, displayedQueues, announcedQueues, forceAnnounceQueue]);

    // Effect untuk setup awal
    useEffect(() => {
        updateDateTime();
        fetchQueues();
        
        // Update waktu setiap detik
        const timeInterval = setInterval(updateDateTime, 1000);
        
        // Setup auto-refresh
        setupAutoRefresh();
        
        // Set auto announce default ON (tidak perlu localStorage)
        setAutoAnnounce(true);

        // Set isFirstLoad menjadi false setelah 3 detik
        // Ini untuk skip TTS saat refresh/pertama kali load
        setTimeout(() => {
            isFirstLoad.current = false;
        }, 3000);

        // Load voices untuk text-to-speech
        if ('speechSynthesis' in window) {
            // Load voices immediately
            const loadVoices = () => {
                window.speechSynthesis.getVoices();
            };
            
            // Load voices immediately
            loadVoices();
            
            // Also listen for voices changed event (for some browsers)
            window.speechSynthesis.onvoiceschanged = loadVoices;
        } else {
            console.error('❌ Speech synthesis not supported in this browser');
        }

        return () => {
            clearInterval(timeInterval);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return (
        <>
            <Head title="Monitor Antrian Pasien" />
            
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-2">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-teal-800 mb-2 tracking-wide">
                        SISTEM ANTRIAN PASIEN
                    </h1>
                    <h3 className="text-xl md:text-2xl text-teal-600 font-medium">
                        {settings?.nama || 'Klinik'}
                    </h3>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Current Queue Section - Left Side */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4">
                                <h2 className="text-2xl md:text-3xl font-bold text-center">
                                    NOMOR ANTRIAN YANG DIPANGGIL
                                </h2>
                            </div>
                            
                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8 text-center">
                                <div className="bg-white rounded-lg p-6 mx-auto max-w-md shadow-lg">
                                    <div className="text-6xl md:text-8xl font-bold text-red-500 mb-4">
                                        {displayedQueueNumber}
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-teal-700">
                                        {displayedStatus}
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-lg p-4 mt-6 inline-block">
                                    <div className="text-lg md:text-xl mb-2">
                                        <i className="far fa-clock mr-2"></i>
                                        {currentTime}
                                    </div>
                                    <div className="text-lg md:text-xl">
                                        <i className="far fa-calendar-alt mr-2"></i>
                                        {currentDate}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Loket Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {['A', 'B', 'C'].map((loket) => (
                                <div key={loket} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-3 text-center">
                                        <h3 className="text-xl font-bold">LOKET {loket}</h3>
                                    </div>
                                    <div className="p-4 text-center">
                                        <div className="text-3xl md:text-4xl font-bold text-teal-600 mb-2">
                                            {loketStatuses[loket]?.nomor || '--'}
                                        </div>
                                        <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                                            <span dangerouslySetInnerHTML={{ 
                                                __html: loketStatuses[loket]?.icon || '<i class="fas fa-check-circle mr-1"></i>' 
                                            }} />
                                            {loketStatuses[loket]?.label || 'Siap Melayani'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Information Section - Right Side */}
                    <div className="space-y-4">
                        {/* Video/Information Card */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-3 text-center">
                                <h3 className="text-xl font-bold">
                                    <i className="fas fa-video mr-2"></i>
                                    INFORMASI
                                </h3>
                            </div>
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <div className="text-gray-500 text-center">
                                    <i className="fas fa-play-circle text-4xl mb-2"></i>
                                    <p>Video Informasi</p>
                                </div>
                            </div>
                        </div>

                        {/* Announcement Card */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-3 text-center">
                                <h3 className="text-xl font-bold">
                                    <i className="fas fa-bullhorn mr-2"></i>
                                    PENGUMUMAN
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded">
                                    <h4 className="font-bold text-teal-700 mb-2">
                                        <i className="fas fa-info-circle mr-1"></i>
                                        Perhatian
                                    </h4>
                                    <p className="text-sm text-gray-700">
                                        Mohon perhatikan nomor antrian Anda. Pastikan Anda berada di area 
                                        tunggu saat nomor Anda mendekati giliran.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

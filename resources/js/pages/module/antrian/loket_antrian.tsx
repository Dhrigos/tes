import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';

interface AntrianData {
    antrian: string;
    loket: string;
    loket_nama: string;
    status_display: string;
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
    const [autoAnnounce, setAutoAnnounce] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(10);
    const [allQueues, setAllQueues] = useState<AntrianData[]>([]);
    const [loketStatuses, setLoketStatuses] = useState<Record<string, LoketStatus>>({});
    const [displayedQueues, setDisplayedQueues] = useState<string[]>([]);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
            
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (data.success) {
                if (Array.isArray(data.data)) {
                    // Convert data format untuk tampilan monitor
                    const queues: AntrianData[] = [];
                    
                    data.data.forEach((loket: any) => {
                        if (loket.sedang_dilayani) {
                            queues.push({
                                antrian: loket.sedang_dilayani.antrian,
                                loket: loket.loket_nama.slice(-1), // Ambil huruf terakhir (A, B, C)
                                loket_nama: loket.loket_nama,
                                status_display: `SILAHKAN KE ${loket.loket_nama}`,
                                created_at: loket.sedang_dilayani.created_at || new Date().toISOString()
                            });
                        }
                    });
                    
                    setAllQueues(queues);
                    
                    // Update status loket
                    const statuses: Record<string, LoketStatus> = {};
                    data.data.forEach((loket: any) => {
                        const loketKey = loket.loket_nama.slice(-1);
                        statuses[loketKey] = {
                            nomor: loket.sedang_dilayani?.antrian || '--',
                            label: loket.sedang_dilayani ? 'Sedang Dilayani' : 'Siap Melayani',
                            icon: loket.sedang_dilayani ? 
                                '<i class="fas fa-user-nurse mr-1"></i>' : 
                                '<i class="fas fa-check-circle mr-1"></i>'
                        };
                    });
                    setLoketStatuses(statuses);
                }
            }
        } catch (error) {
            console.error('Error fetching queue data:', error);
        }
    };

    // Periksa dan tampilkan antrian baru
    const checkAndDisplayNewQueues = () => {
        if (allQueues.length === 0) {
            setDisplayedQueueNumber('--');
            setDisplayedStatus('TIDAK ADA ANTRIAN');
            return;
        }

        // Filter antrian yang belum ditampilkan
        const newQueues = allQueues.filter(queue => {
            const key = `${queue.antrian}-${queue.loket}`;
            return !displayedQueues.includes(key);
        });

        if (newQueues.length === 0) {
            setDisplayedQueueNumber('--');
            setDisplayedStatus('MENUNGGU PANGGILAN');
            return;
        }

        // Ambil antrian pertama yang belum ditampilkan
        const queueToDisplay = newQueues[0];
        
        // Tampilkan antrian
        setDisplayedQueueNumber(queueToDisplay.antrian);
        setDisplayedStatus(queueToDisplay.status_display);

        // Tandai antrian ini sudah ditampilkan
        const queueKey = `${queueToDisplay.antrian}-${queueToDisplay.loket}`;
        setDisplayedQueues(prev => [...prev, queueKey]);

        // Umumkan antrian jika auto announce aktif
        if (autoAnnounce) {
            announceQueue(queueToDisplay);
        }
    };

    // Fungsi untuk mengumumkan antrian
    const announceQueue = (queue: AntrianData) => {
        const announcementText = `Nomor Antrian ${queue.antrian}, silakan menuju ${queue.loket_nama}`;

        // Hentikan pengumuman sebelumnya jika masih berjalan
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(announcementText);
            utterance.lang = 'id-ID';
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 1;

            window.speechSynthesis.speak(utterance);
        }
    };

    // Setup auto-refresh dengan countdown
    const setupAutoRefresh = () => {
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchQueues();
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
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
    }, [autoAnnounce, allQueues, displayedQueues]);

    // Effect untuk setup awal
    useEffect(() => {
        updateDateTime();
        fetchQueues();
        
        // Update waktu setiap detik
        const timeInterval = setInterval(updateDateTime, 1000);
        
        // Setup auto-refresh
        setupAutoRefresh();
        
        // Load auto announce setting dari localStorage
        const savedAutoAnnounce = localStorage.getItem('autoAnnounce') === 'true';
        setAutoAnnounce(savedAutoAnnounce);

        return () => {
            clearInterval(timeInterval);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Handle auto announce toggle
    const handleAutoAnnounceToggle = (checked: boolean) => {
        setAutoAnnounce(checked);
        localStorage.setItem('autoAnnounce', checked.toString());
        
        if (!checked) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        }
    };

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
                                    <div className="text-lg md:text-xl mb-2">
                                        <i className="far fa-calendar-alt mr-2"></i>
                                        {currentDate}
                                    </div>
                                    <div className="text-sm">
                                        Update otomatis dalam {countdown} detik
                                    </div>
                                </div>

                                {/* Auto-announce toggle */}
                                <div className="mt-4">
                                    <label className="flex items-center justify-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoAnnounce}
                                            onChange={(e) => handleAutoAnnounceToggle(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                        <span className="text-white">Pengumuman Otomatis</span>
                                    </label>
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

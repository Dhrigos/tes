import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Volume2, VolumeX, Clock, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueData {
    loket_id: number;
    loket_nama: string;
    poli_nama: string;
    current_serving: {
        antrian: string;
        nomor_rm: string;
        pasien: {
            nama: string;
        };
    } | null;
    waiting_queues: Array<{
        antrian: string;
        nomor_rm: string;
        pasien: {
            nama: string;
        };
    }>;
    total_today: number;
    last_called: {
        antrian: string;
        nomor_rm: string;
        pasien: {
            nama: string;
        };
    } | null;
}

interface MonitorProps {
    lokets: Array<{
        id: number;
        nama: string;
        poli: {
            nama: string;
        } | null;
    }>;
    currentTime: string;
    currentDate: string;
}

export default function QueueDisplay({ lokets, currentTime, currentDate }: MonitorProps) {
    const [queueData, setQueueData] = useState<QueueData[]>([]);
    const [currentTimeState, setCurrentTimeState] = useState(currentTime);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [lastAnnouncement, setLastAnnouncement] = useState<string>('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Fetch queue data from API
    const fetchQueueData = async () => {
        try {
            const response = await fetch('/api/antrian/data');
            const result = await response.json();
            
            if (result.success) {
                setQueueData(result.data);
                setCurrentTimeState(result.timestamp);
                
                // Check for new announcements
                checkForNewAnnouncements(result.data);
            }
        } catch (error) {
            console.error('Error fetching queue data:', error);
        }
    };

    // Check for new queue calls to announce
    const checkForNewAnnouncements = (data: QueueData[]) => {
        data.forEach(loket => {
            if (loket.current_serving && loket.current_serving.antrian !== lastAnnouncement) {
                if (voiceEnabled) {
                    announceQueue(loket.current_serving.antrian, loket.loket_nama);
                }
                setLastAnnouncement(loket.current_serving.antrian);
            }
        });
    };

    // Text-to-speech announcement
    const announceQueue = (queueNumber: string, loketName: string) => {
        if ('speechSynthesis' in window) {
            // Cancel previous speech
            window.speechSynthesis.cancel();
            
            const text = `Nomor antrian ${queueNumber}, silakan menuju ${loketName}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 0.8;
            utterance.volume = 0.8;
            
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Manual queue calling
    const callQueue = async (loketId: number, stage: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/antrian/panggil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    loket_id: loketId,
                    stage: stage
                })
            });

            const result = await response.json();
            
            if (result.success && result.queue) {
                if (voiceEnabled) {
                    announceQueue(result.queue.nomor_antrian, result.queue.loket_nama);
                }
                // Refresh data immediately
                fetchQueueData();
            } else {
                alert(result.message || 'Tidak ada antrian yang dapat dipanggil');
            }
        } catch (error) {
            console.error('Error calling queue:', error);
            alert('Terjadi kesalahan saat memanggil antrian');
        } finally {
            setLoading(false);
        }
    };

    // Setup auto-refresh
    useEffect(() => {
        fetchQueueData(); // Initial fetch
        
        intervalRef.current = setInterval(() => {
            fetchQueueData();
        }, 10000); // Refresh every 10 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (speechRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Update time every second
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCurrentTimeState(new Date().toLocaleTimeString('id-ID'));
        }, 1000);

        return () => clearInterval(timeInterval);
    }, []);

    const getLoketStage = (loketName: string) => {
        const name = loketName.toLowerCase();
        if (name.includes('a') || name.includes('pendaftaran')) return 'registration';
        if (name.includes('b') || name.includes('perawat')) return 'nurse';
        return 'doctor';
    };

    const getStageLabel = (stage: string) => {
        switch (stage) {
            case 'registration': return 'Pendaftaran';
            case 'nurse': return 'Perawat';
            case 'doctor': return 'Dokter';
            default: return 'Pelayanan';
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'registration': return 'bg-blue-500';
            case 'nurse': return 'bg-green-500';
            case 'doctor': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <>
            <Head title="Monitor Antrian" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Monitor Antrian Pasien
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                {currentDate}
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                                    {currentTimeState}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Waktu Sekarang
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                                <Switch
                                    checked={voiceEnabled}
                                    onCheckedChange={setVoiceEnabled}
                                />
                                <span className="text-sm">Suara</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue Display Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {queueData.map((loket) => {
                        const stage = getLoketStage(loket.loket_nama);
                        const stageLabel = getStageLabel(stage);
                        const stageColor = getStageColor(stage);
                        
                        return (
                            <Card key={loket.loket_id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className={cn("text-white", stageColor)}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl font-bold">
                                                {loket.loket_nama}
                                            </CardTitle>
                                            <p className="text-sm opacity-90">
                                                {loket.poli_nama} - {stageLabel}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            <Users className="h-4 w-4 mr-1" />
                                            {loket.total_today}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="p-6">
                                    {/* Currently Serving */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                                            <Activity className="h-5 w-5 mr-2 text-green-500" />
                                            Sedang Dilayani
                                        </h3>
                                        
                                        {loket.current_serving ? (
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                                                    {loket.current_serving.antrian}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {loket.current_serving.pasien?.nama || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    RM: {loket.current_serving.nomor_rm}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    Tidak ada yang dilayani
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Waiting Queue */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                                            <Clock className="h-5 w-5 mr-2 text-orange-500" />
                                            Antrian Menunggu
                                        </h3>
                                        
                                        {loket.waiting_queues.length > 0 ? (
                                            <div className="space-y-2">
                                                {loket.waiting_queues.slice(0, 3).map((queue, index) => (
                                                    <div key={index} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="font-semibold text-orange-700 dark:text-orange-300">
                                                                {queue.antrian}
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                                {queue.pasien?.nama || 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {loket.waiting_queues.length > 3 && (
                                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                                        +{loket.waiting_queues.length - 3} antrian lainnya
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    Tidak ada antrian menunggu
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Call Next Button */}
                                    <Button
                                        onClick={() => callQueue(loket.loket_id, stage)}
                                        disabled={loading}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {loading ? 'Memanggil...' : 'Panggil Antrian Selanjutnya'}
                                    </Button>

                                    {/* Last Called */}
                                    {loket.last_called && (
                                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                                            Terakhir dipanggil: {loket.last_called.antrian}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Auto-refresh indicator */}
                <div className="fixed bottom-4 right-4">
                    <Badge variant="outline" className="bg-white/90 dark:bg-gray-800/90">
                        <Activity className="h-3 w-3 mr-1 animate-pulse" />
                        Auto-refresh setiap 10 detik
                    </Badge>
                </div>
            </div>
        </>
    );
}

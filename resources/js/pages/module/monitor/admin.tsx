import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Users, 
    Clock, 
    Activity, 
    TrendingUp, 
    Settings, 
    Monitor,
    RefreshCw,
    BarChart3,
    Calendar,
    UserCheck,
    UserX,
    Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueStats {
    total_registered: number;
    waiting_registration: number;
    with_nurse: number;
    with_doctor: number;
    completed: number;
    average_waiting_time: number;
}

interface LoketData {
    id: number;
    nama: string;
    poli: {
        nama: string;
    } | null;
    current_queue_count: number;
    total_served_today: number;
    average_service_time: number;
}

interface AdminProps {
    auth: {
        user: any;
    };
    lokets: LoketData[];
    stats: QueueStats;
}

export default function Admin({ auth, lokets, stats }: AdminProps) {
    const [queueStats, setQueueStats] = useState<QueueStats>(stats);
    const [loketData, setLoketData] = useState<LoketData[]>(lokets);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch real-time statistics
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/antrian/stats');
            const result = await response.json();
            
            if (result.success) {
                setQueueStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Reset daily queues
    const resetDailyQueues = async () => {
        if (!confirm('Apakah Anda yakin ingin mereset antrian harian? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/antrian/reset-daily', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Antrian harian berhasil direset');
                fetchStats();
            } else {
                alert(result.message || 'Gagal mereset antrian');
            }
        } catch (error) {
            console.error('Error resetting queues:', error);
            alert('Terjadi kesalahan saat mereset antrian');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh stats
    useEffect(() => {
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
        title: string;
        value: number;
        icon: any;
        color: string;
        subtitle?: string;
    }) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-full", color)}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Admin Antrian
                    </h2>
                    <div className="flex space-x-2">
                        <Button
                            onClick={fetchStats}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => window.open('/loket-antrian', '_blank')}
                            variant="outline"
                            size="sm"
                        >
                            <Monitor className="h-4 w-4 mr-2" />
                            Monitor Display
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Admin Antrian" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <StatCard
                            title="Total Terdaftar"
                            value={queueStats.total_registered}
                            icon={Users}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Menunggu Pendaftaran"
                            value={queueStats.waiting_registration}
                            icon={UserCheck}
                            color="bg-orange-500"
                        />
                        <StatCard
                            title="Dengan Perawat"
                            value={queueStats.with_nurse}
                            icon={Activity}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="Dengan Dokter"
                            value={queueStats.with_doctor}
                            icon={UserX}
                            color="bg-purple-500"
                        />
                        <StatCard
                            title="Selesai"
                            value={queueStats.completed}
                            icon={TrendingUp}
                            color="bg-emerald-500"
                        />
                        <StatCard
                            title="Rata-rata Tunggu"
                            value={queueStats.average_waiting_time}
                            icon={Timer}
                            color="bg-red-500"
                            subtitle="menit"
                        />
                    </div>

                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="lokets">Manajemen Loket</TabsTrigger>
                            <TabsTrigger value="reports">Laporan</TabsTrigger>
                            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            {/* Loket Performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <BarChart3 className="h-5 w-5 mr-2" />
                                        Performa Loket Hari Ini
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {loketData.map((loket) => (
                                            <Card key={loket.id} className="border-l-4 border-l-blue-500">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-semibold">{loket.nama}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {loket.poli?.nama || 'Umum'}
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary">
                                                            {loket.current_queue_count} antri
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Dilayani hari ini:</span>
                                                            <span className="font-medium">{loket.total_served_today}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Rata-rata layanan:</span>
                                                            <span className="font-medium">{loket.average_service_time} mnt</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Settings className="h-5 w-5 mr-2" />
                                        Aksi Cepat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Button
                                            onClick={() => window.open('/loket-antrian', '_blank')}
                                            className="h-20 flex-col"
                                            variant="outline"
                                        >
                                            <Monitor className="h-8 w-8 mb-2" />
                                            Buka Monitor Display
                                        </Button>
                                        <Button
                                            onClick={resetDailyQueues}
                                            disabled={loading}
                                            className="h-20 flex-col"
                                            variant="outline"
                                        >
                                            <RefreshCw className="h-8 w-8 mb-2" />
                                            Reset Antrian Harian
                                        </Button>
                                        <Button
                                            onClick={() => window.open('/pendaftaran-online', '_blank')}
                                            className="h-20 flex-col"
                                            variant="outline"
                                        >
                                            <UserCheck className="h-8 w-8 mb-2" />
                                            Pendaftaran Online
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="lokets" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manajemen Loket</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">
                                        Kelola loket pelayanan melalui menu Data Master → Umum → Loket
                                    </p>
                                    <Button
                                        onClick={() => window.location.href = '/datamaster/umum/loket'}
                                        variant="outline"
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Buka Manajemen Loket
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="reports" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        Laporan Antrian
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="report-date">Tanggal Laporan</Label>
                                                <Input
                                                    id="report-date"
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => window.location.href = '/laporan/antrian'}
                                                variant="outline"
                                            >
                                                <BarChart3 className="h-4 w-4 mr-2" />
                                                Lihat Laporan Detail
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pengaturan Sistem Antrian</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Pengaturan Umum</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label>Auto-refresh Monitor</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Monitor akan refresh otomatis setiap 10 detik
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">Aktif</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label>Voice Announcements</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Pengumuman suara saat memanggil antrian
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">Tersedia</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label>Daily Reset</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Reset otomatis nomor antrian setiap tengah malam
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">Terjadwal</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

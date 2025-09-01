import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

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

interface PageProps {
  pelayanan: PatientData;
  norawat: string;
  errors?: Record<string, string>;
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Pelayanan', href: '/pelayanan' },
  { title: 'Permintaan', href: '' },
];

export default function Permintaan() {
  const { pelayanan, errors, flash, norawat } = usePage().props as unknown as PageProps;
  
  const [activeTab, setActiveTab] = useState('jenis-permintaan');
  const [formData, setFormData] = useState({
    jenis_permintaan: '',
    // Add other form fields as needed
  });
  
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);
  
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(
      '/pelayanan/permintaan',
      { nomor_register: pelayanan.nomor_register, ...formData },
      { preserveScroll: true }
    );
  };
  
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permintaan Pasien" />
      
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Permintaan Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Patient Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Informasi Pasien</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nomor RM</Label>
                  <Input 
                    value={pelayanan.nomor_rm || ''} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Nama</Label>
                  <Input 
                    value={pelayanan.nama || ''} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Nomor Rawat</Label>
                  <Input 
                    value={pelayanan.nomor_register || ''} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Jenis Kelamin</Label>
                  <Input 
                    value={pelayanan.jenis_kelamin || ''} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Penjamin</Label>
                  <Input 
                    value={pelayanan.penjamin || ''} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Tanggal Lahir</Label>
                  <Input 
                    value={pelayanan.tanggal_lahir || ''} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Umur</Label>
                  <Input 
                    value={pelayanan.umur || ''} 
                    readOnly 
                  />
                </div>
              </div>
            </div>

            {/* Permintaan Form */}
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="jenis-permintaan">Jenis Permintaan</TabsTrigger>
                  <TabsTrigger value="detail-permintaan">Detail Permintaan</TabsTrigger>
                  <TabsTrigger value="konfirmasi">Konfirmasi</TabsTrigger>
                </TabsList>
                
                <TabsContent value="jenis-permintaan">
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="jenis_permintaan">Jenis Permintaan</Label>
                      <Select 
                        value={formData.jenis_permintaan} 
                        onValueChange={(value) => handleInputChange('jenis_permintaan', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis Permintaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="radiologi">Radiologi</SelectItem>
                          <SelectItem value="laboratorium">Laboratorium</SelectItem>
                          <SelectItem value="surat_sakit">Surat Sakit</SelectItem>
                          <SelectItem value="surat_sehat">Surat Sehat</SelectItem>
                          <SelectItem value="surat_kematian">Surat Kematian</SelectItem>
                          <SelectItem value="skdp">SKDP</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors?.jenis_permintaan && (
                        <p className="text-sm text-red-500 mt-1">{errors.jenis_permintaan}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={() => setActiveTab('detail-permintaan')}
                        disabled={!formData.jenis_permintaan}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="detail-permintaan">
                  <div className="space-y-4 mt-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Detail Permintaan</h3>
                      <p>Silakan tambahkan detail permintaan berdasarkan jenis yang dipilih.</p>
                      <p className="mt-2">Jenis permintaan yang dipilih: <strong>{formData.jenis_permintaan}</strong></p>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab('jenis-permintaan')}>
                        Previous
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setActiveTab('konfirmasi')}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="konfirmasi">
                  <div className="space-y-6 mt-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Konfirmasi Data Permintaan</h3>
                      
                      <div className="mb-3">
                        <Label className="font-medium">Jenis Permintaan:</Label>
                        <p>{formData.jenis_permintaan}</p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-4">
                        Pastikan data yang dimasukkan sudah benar sebelum mengirim permintaan.
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab('detail-permintaan')}>
                        Previous
                      </Button>
                      <Button type="submit">
                        Submit Permintaan
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

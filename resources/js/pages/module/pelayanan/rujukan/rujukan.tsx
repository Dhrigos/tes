import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
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

interface RefTACC {
  kdTacc: string;
  nmTacc: string;
  alasanTacc: string[];
}

interface Subspesialis {
  kode: string;
  nama: string;
}

interface Sarana {
  kode: string;
  nama: string;
}

interface Spesialis {
  kode: string;
  nama: string;
}

interface PageProps {
  pelayanan: PatientData;
  Ref_TACC: RefTACC[];
  subspesialis: Subspesialis[];
  sarana: Sarana[];
  spesialis: Spesialis[];
  errors?: Record<string, string>;
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Pelayanan', href: '/pelayanan' },
  { title: 'Rujukan', href: '' },
];

export default function Rujukan() {
  const { pelayanan, Ref_TACC, subspesialis, sarana, spesialis } = usePage().props as unknown as PageProps;
  
  const [activeTab, setActiveTab] = useState('jenis-rujukan');
  const [formData, setFormData] = useState({
    // Step 1
    jenis_rujukan: '',
    tujuan_rujukan: '',
    
    // Step 2
    opsi_rujukan: '',
    
    // Step 3 - Rujukan Khusus
    igd_rujukan_khusus: '',
    subspesialis_khusus: '',
    tanggal_rujukan_khusus: '',
    tujuan_rujukan_khusus: '',
    
    // Step 3 - Spesialis
    aktifkan_sarana: false,
    sarana: '',
    kategori_rujukan: '',
    alasan_rujukan: '',
    spesialis: '',
    sub_spesialis: '',
    tanggal_rujukan: '',
    tujuan_rujukan_spesialis: '',
  });
  
  const [subSpesialisOptions, setSubSpesialisOptions] = useState<Subspesialis[]>([]);
  const [alasanRujukanOptions, setAlasanRujukanOptions] = useState<string[]>([]);
  
  // Handle input changes
  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle jenis rujukan change
  const handleJenisRujukanChange = (value: string) => {
    handleInputChange('jenis_rujukan', value);
    handleInputChange('tujuan_rujukan', '');
    handleInputChange('opsi_rujukan', '');
  };
  
  // Handle tujuan rujukan change
  const handleTujuanRujukanChange = (value: string) => {
    handleInputChange('tujuan_rujukan', value);
    handleInputChange('opsi_rujukan', '');
  };
  
  // Handle spesialis change
  const handleSpesialisChange = (value: string) => {
    handleInputChange('spesialis', value);
    handleInputChange('sub_spesialis', '');
    
    // Filter subspesialis based on selected spesialis
    const filtered = subspesialis.filter(item => item.kode.startsWith(value));
    setSubSpesialisOptions(filtered);
  };
  
  // Handle kategori rujukan change
  const handleKategoriRujukanChange = (value: string) => {
    handleInputChange('kategori_rujukan', value);
    
    // Get alasan rujukan options
    const kategori = Ref_TACC.find(k => k.kdTacc === value);
    if (kategori) {
      setAlasanRujukanOptions(kategori.alasanTacc);
    } else {
      setAlasanRujukanOptions([]);
    }
  };
  
  // Handle aktifkan sarana change
  const handleAktifkanSaranaChange = (checked: boolean) => {
    handleInputChange('aktifkan_sarana', checked);
    if (!checked) {
      handleInputChange('sarana', '');
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
    console.log('Form submitted:', formData);
  };
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pelayanan Rujuk" />
      
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pelayanan Rujuk</CardTitle>
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
                <div className="hidden">
                  <Input 
                    type="hidden"
                    value={pelayanan.no_bpjs || ''} 
                    readOnly 
                  />
                </div>
              </div>
            </div>

            {/* Rujukan Form */}
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="jenis-rujukan">Jenis Rujukan</TabsTrigger>
                  <TabsTrigger value="opsi-rujukan">Opsi Rujukan</TabsTrigger>
                  <TabsTrigger value="detail-rujukan">Detail Rujukan</TabsTrigger>
                </TabsList>
                
                <TabsContent value="jenis-rujukan">
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="jenis_rujukan">Jenis Rujukan</Label>
                      <Select 
                        value={formData.jenis_rujukan} 
                        onValueChange={handleJenisRujukanChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis Rujukan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sehat">Sehat</SelectItem>
                          <SelectItem value="sakit">Sakit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="tujuan_rujukan">Tujuan Rujukan</Label>
                      <Select 
                        value={formData.tujuan_rujukan} 
                        onValueChange={handleTujuanRujukanChange}
                        disabled={!formData.jenis_rujukan}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Tujuan Rujukan" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.jenis_rujukan === 'sehat' && (
                            <SelectItem value="develop" disabled>Develop</SelectItem>
                          )}
                          {formData.jenis_rujukan === 'sakit' && (
                            <>
                              <SelectItem value="horizontal">Horizontal</SelectItem>
                              <SelectItem value="vertikal">Vertikal</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={() => setActiveTab('opsi-rujukan')}
                        disabled={!formData.jenis_rujukan || !formData.tujuan_rujukan}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="opsi-rujukan">
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="opsi_rujukan">Opsi Rujukan</Label>
                      <Select 
                        value={formData.opsi_rujukan} 
                        onValueChange={(value) => handleInputChange('opsi_rujukan', value)}
                        disabled={!formData.tujuan_rujukan}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Opsi Rujukan" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.tujuan_rujukan === 'vertikal' && (
                            <>
                              <SelectItem value="rujukan_khusus">Rujukan Khusus</SelectItem>
                              <SelectItem value="spesialis">Spesialis</SelectItem>
                            </>
                          )}
                          {formData.tujuan_rujukan === 'horizontal' && (
                            <>
                              <SelectItem value="opsi_horizontal_1">Pelayanan Tindakan Non-Kapitasi</SelectItem>
                              <SelectItem value="opsi_horizontal_2">Pelayanan Laboratorium</SelectItem>
                              <SelectItem value="opsi_horizontal_3">Pelayanan Program</SelectItem>
                              <SelectItem value="opsi_horizontal_4">Rujukan Kacamata</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab('jenis-rujukan')}>
                        Previous
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setActiveTab('detail-rujukan')}
                        disabled={!formData.opsi_rujukan}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="detail-rujukan">
                  <div className="space-y-6 mt-4">
                    {/* Rujukan Khusus */}
                    {formData.opsi_rujukan === 'rujukan_khusus' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold">Rujukan Khusus</h3>
                        
                        <div>
                          <Label htmlFor="igd_rujukan_khusus">Tujuan</Label>
                          <Select 
                            value={formData.igd_rujukan_khusus} 
                            onValueChange={(value) => handleInputChange('igd_rujukan_khusus', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Tujuan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IGD">IGD</SelectItem>
                              <SelectItem value="HDL">HDL</SelectItem>
                              <SelectItem value="JIW">JIW</SelectItem>
                              <SelectItem value="KLT">KLT</SelectItem>
                              <SelectItem value="PAR">PAR</SelectItem>
                              <SelectItem value="KEM">KEM</SelectItem>
                              <SelectItem value="RAT">RAT</SelectItem>
                              <SelectItem value="HIV">HIV</SelectItem>
                              <SelectItem value="THA">THA</SelectItem>
                              <SelectItem value="HEM">HEM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="subspesialis_khusus">Subspesialis Khusus</Label>
                          <Select 
                            value={formData.subspesialis_khusus} 
                            onValueChange={(value) => handleInputChange('subspesialis_khusus', value)}
                            disabled={!(formData.igd_rujukan_khusus === 'THA' || formData.igd_rujukan_khusus === 'HEM')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Subspesialis Khusus" />
                            </SelectTrigger>
                            <SelectContent>
                              {subspesialis.map((item) => (
                                <SelectItem key={item.kode} value={item.kode}>
                                  {item.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="tanggal_rujukan_khusus">Tanggal Rujukan</Label>
                          <Input 
                            type="date" 
                            id="tanggal_rujukan_khusus" 
                            value={formData.tanggal_rujukan_khusus} 
                            onChange={(e) => handleInputChange('tanggal_rujukan_khusus', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="tujuan_rujukan_khusus">Tujuan Rujukan</Label>
                          <Select 
                            value={formData.tujuan_rujukan_khusus} 
                            onValueChange={(value) => handleInputChange('tujuan_rujukan_khusus', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Tujuan Rujukan" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Options will be populated dynamically */}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button type="button">
                          <i className="fas fa-search"></i> Cari Provider
                        </Button>
                      </div>
                    )}
                    
                    {/* Spesialis */}
                    {formData.opsi_rujukan === 'spesialis' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold">Spesialis</h3>
                        
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="aktifkan_sarana" 
                            checked={formData.aktifkan_sarana}
                            onChange={(e) => handleAktifkanSaranaChange(e.target.checked)}
                            className="form-checkbox"
                          />
                          <Label htmlFor="aktifkan_sarana">Aktifkan Pilihan Sarana</Label>
                        </div>
                        
                        {formData.aktifkan_sarana && (
                          <div>
                            <Label htmlFor="sarana">Sarana</Label>
                            <Select 
                              value={formData.sarana} 
                              onValueChange={(value) => handleInputChange('sarana', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Sarana" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tidak ada">tidak ada</SelectItem>
                                {sarana.map((item) => (
                                  <SelectItem key={item.kode} value={item.kode}>
                                    {item.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="kategori_rujukan">Kategori Rujukan</Label>
                          <Select 
                            value={formData.kategori_rujukan} 
                            onValueChange={handleKategoriRujukanChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {Ref_TACC.map((kategori) => (
                                <SelectItem key={kategori.kdTacc} value={kategori.kdTacc}>
                                  {kategori.nmTacc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="alasan_rujukan">Alasan Rujukan Spesialis</Label>
                          <Select 
                            value={formData.alasan_rujukan} 
                            onValueChange={(value) => handleInputChange('alasan_rujukan', value)}
                            disabled={!formData.kategori_rujukan}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Alasan" />
                            </SelectTrigger>
                            <SelectContent>
                              {alasanRujukanOptions.map((alasan, index) => (
                                <SelectItem key={index} value={alasan}>
                                  {alasan}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="spesialis">Spesialis</Label>
                          <Select 
                            value={formData.spesialis} 
                            onValueChange={handleSpesialisChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Spesialis" />
                            </SelectTrigger>
                            <SelectContent>
                              {spesialis.map((item) => (
                                <SelectItem key={item.kode} value={item.kode}>
                                  {item.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="sub_spesialis">Sub Spesialis</Label>
                          <Select 
                            value={formData.sub_spesialis} 
                            onValueChange={(value) => handleInputChange('sub_spesialis', value)}
                            disabled={!formData.spesialis}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Sub Spesialis" />
                            </SelectTrigger>
                            <SelectContent>
                              {subSpesialisOptions.map((item) => (
                                <SelectItem key={item.kode} value={item.kode}>
                                  {item.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="tanggal_rujukan">Tanggal Rujukan</Label>
                          <Input 
                            type="date" 
                            id="tanggal_rujukan" 
                            value={formData.tanggal_rujukan} 
                            onChange={(e) => handleInputChange('tanggal_rujukan', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="tujuan_rujukan_spesialis">Tujuan Rujukan</Label>
                          <Select 
                            value={formData.tujuan_rujukan_spesialis} 
                            onValueChange={(value) => handleInputChange('tujuan_rujukan_spesialis', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Tujuan Rujukan" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Options will be populated dynamically */}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button type="button">
                          <i className="fas fa-search"></i> Cari Provider
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab('opsi-rujukan')}>
                        Previous
                      </Button>
                      <Button type="submit">
                        Submit
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

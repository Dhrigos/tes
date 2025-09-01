import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
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
}

interface SoapDokterData {
  no_rawat?: string;
  sistol?: string;
  distol?: string;
  tensi?: string;
  suhu?: string;
  nadi?: string;
  rr?: string;
  tinggi?: string;
  berat?: string;
  spo2?: string;
  lingkar_perut?: string;
  nilai_bmi?: string;
  status_bmi?: string;
  jenis_alergi?: string;
  alergi?: string;
  eye?: string;
  verbal?: string;
  motorik?: string;
  htt?: string;
  anamnesa?: string;
  assesmen?: string;
  expertise?: string;
  evaluasi?: string;
  plan?: string;
  tableData?: any[];
}

interface GcsEye {
  id: number;
  nama: string;
  skor: string;
}

interface GcsVerbal {
  id: number;
  nama: string;
  skor: string;
}

interface GcsMotorik {
  id: number;
  nama: string;
  skor: string;
}

interface GcsKesadaran {
  id: number;
  nama: string;
  skor: string;
}

interface HttPemeriksaan {
  id: number;
  nama: string;
  htt_subpemeriksaans: Array<{
    id: number;
    nama: string;
  }>;
}

interface Icd10 {
  kode: string;
  nama: string;
}

interface Icd9 {
  kode: string;
  nama: string;
}

interface PageProps {
  pelayanan: PatientData;
  soap_dokter?: SoapDokterData;
  gcs_eye: GcsEye[];
  gcs_verbal: GcsVerbal[];
  gcs_motorik: GcsMotorik[];
  gcs_kesadaran: GcsKesadaran[];
  htt_pemeriksaan: HttPemeriksaan[];
  icd10: Icd10[];
  icd9: Icd9[];
  norawat: string;
  errors?: Record<string, string>;
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Pelayanan', href: '/pelayanan/so-dokter' },
  { title: 'SOAP Dokter', href: '/pelayanan/so-dokter' },
  { title: 'Pemeriksaan', href: '' },
];

export default function PemeriksaanSoapDokter() {
  const { pelayanan, soap_dokter, gcs_eye, gcs_verbal, gcs_motorik, gcs_kesadaran, 
          htt_pemeriksaan, icd10, icd9, norawat, errors } = usePage().props as unknown as PageProps;
  
  // Debug logging
  console.log('PemeriksaanSoapDokter component loaded');
  console.log('Props received:', { pelayanan, soap_dokter, norawat, errors });
  
  const [activeTab, setActiveTab] = useState('subyektif');
  const [formData, setFormData] = useState<SoapDokterData>({
    no_rawat: soap_dokter?.no_rawat || '',
    sistol: soap_dokter?.sistol || '',
    distol: soap_dokter?.distol || '',
    tensi: soap_dokter?.tensi || '',
    suhu: soap_dokter?.suhu || '',
    nadi: soap_dokter?.nadi || '',
    rr: soap_dokter?.rr || '',
    tinggi: soap_dokter?.tinggi || '',
    berat: soap_dokter?.berat || '',
    spo2: soap_dokter?.spo2 || '',
    lingkar_perut: soap_dokter?.lingkar_perut || '',
    nilai_bmi: soap_dokter?.nilai_bmi || '',
    status_bmi: soap_dokter?.status_bmi || '',
    jenis_alergi: soap_dokter?.jenis_alergi || '',
    alergi: soap_dokter?.alergi || '',
    eye: soap_dokter?.eye || '',
    verbal: soap_dokter?.verbal || '',
    motorik: soap_dokter?.motorik || '',
    htt: soap_dokter?.htt || '',
    anamnesa: soap_dokter?.anamnesa || '',
    assesmen: soap_dokter?.assesmen || '',
    expertise: soap_dokter?.expertise || '',
    evaluasi: soap_dokter?.evaluasi || '',
    plan: soap_dokter?.plan || '',
    tableData: soap_dokter?.tableData || [],
  });

  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (formData.tinggi && formData.berat) {
      const tinggi = parseFloat(formData.tinggi);
      const berat = parseFloat(formData.berat);
      
      if (tinggi > 0 && berat > 0) {
        const bmi = berat / Math.pow(tinggi / 100, 2);
        setFormData(prev => ({
          ...prev,
          nilai_bmi: bmi.toFixed(2)
        }));
      }
    }
  }, [formData.tinggi, formData.berat]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      no_rawat: pelayanan.nomor_register,
    };

    try {
      if (soap_dokter && norawat) {
        router.put(`/pelayanan/soap-dokter/${norawat}`, payload, {
          onSuccess: () => {
            toast.success('SOAP Dokter berhasil diperbarui');
            router.visit('/pelayanan/soap-dokter');
          },
          onError: (errors) => {
            toast.error('Gagal memperbarui SOAP Dokter');
          }
        });
      } else {
        router.post('/pelayanan/soap-dokter', payload, {
          onSuccess: () => {
            toast.success('SOAP Dokter berhasil disimpan');
            router.visit('/pelayanan/soap-dokter');
          },
          onError: (errors) => {
            toast.error('Gagal menyimpan SOAP Dokter');
          }
        });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleBack = () => {
    router.visit('/pelayanan/so-dokter');
  };

  // Determine if this is edit mode
  const isEditMode = soap_dokter && Object.keys(soap_dokter).length > 0;
  const pageTitle = isEditMode ? 'Edit SOAP Dokter' : 'Pemeriksaan SOAP Dokter';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="SOAP Dokter - Pemeriksaan" />
      
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Patient Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Informasi Pasien</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">No. RM</Label>
                  <p className="font-medium">{pelayanan.nomor_rm || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nama Pasien</Label>
                  <p className="font-medium">{pelayanan.nama || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Jenis Kelamin</Label>
                  <p className="font-medium">{pelayanan.jenis_kelamin || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Umur</Label>
                  <p className="font-medium">{pelayanan.umur || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Penjamin</Label>
                  <p className="font-medium">{pelayanan.penjamin || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tanggal Lahir</Label>
                  <p className="font-medium">{pelayanan.tanggal_lahir || '-'}</p>
                </div>
              </div>
            </div>

            {/* SOAP Form */}
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="subyektif">Subyektif</TabsTrigger>
                  <TabsTrigger value="objektif">Objektif</TabsTrigger>
                  <TabsTrigger value="assesmen">Assesmen</TabsTrigger>
                  <TabsTrigger value="plan">Plan</TabsTrigger>
                </TabsList>

                {/* Subyektif Tab */}
                <TabsContent value="subyektif" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="anamnesa">Anamnesa</Label>
                      <Textarea
                        id="anamnesa"
                        name="anamnesa"
                        value={formData.anamnesa}
                        onChange={handleInputChange}
                        rows={6}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Objektif Tab */}
                <TabsContent value="objektif" className="mt-4">
                  <div className="space-y-6">
                    {/* Vital Signs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Vital Signs</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="sistol">Sistol (mmHg)</Label>
                            <Input
                              id="sistol"
                              name="sistol"
                              value={formData.sistol}
                              onChange={handleInputChange}
                              placeholder="120"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distol">Diastol (mmHg)</Label>
                            <Input
                              id="distol"
                              name="distol"
                              value={formData.distol}
                              onChange={handleInputChange}
                              placeholder="80"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tensi">Tensi</Label>
                            <Input
                              id="tensi"
                              name="tensi"
                              value={formData.tensi}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="suhu">Suhu (°C)</Label>
                            <Input
                              id="suhu"
                              name="suhu"
                              value={formData.suhu}
                              onChange={handleInputChange}
                              placeholder="36.5"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="nadi">Nadi (/menit)</Label>
                            <Input
                              id="nadi"
                              name="nadi"
                              value={formData.nadi}
                              onChange={handleInputChange}
                              placeholder="80"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rr">RR (/menit)</Label>
                            <Input
                              id="rr"
                              name="rr"
                              value={formData.rr}
                              onChange={handleInputChange}
                              placeholder="20"
                            />
                          </div>
                          <div>
                            <Label htmlFor="spo2">SpO2 (%)</Label>
                            <Input
                              id="spo2"
                              name="spo2"
                              value={formData.spo2}
                              onChange={handleInputChange}
                              placeholder="98"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lingkar_perut">Lingkar Perut (cm)</Label>
                            <Input
                              id="lingkar_perut"
                              name="lingkar_perut"
                              value={formData.lingkar_perut}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Antropometri */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Antropometri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="tinggi">Tinggi Badan (cm)</Label>
                            <Input
                              id="tinggi"
                              name="tinggi"
                              value={formData.tinggi}
                              onChange={handleInputChange}
                              placeholder="170"
                            />
                          </div>
                          <div>
                            <Label htmlFor="berat">Berat Badan (kg)</Label>
                            <Input
                              id="berat"
                              name="berat"
                              value={formData.berat}
                              onChange={handleInputChange}
                              placeholder="70"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nilai_bmi">Nilai BMI</Label>
                            <Input
                              id="nilai_bmi"
                              name="nilai_bmi"
                              value={formData.nilai_bmi}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="status_bmi">Status BMI</Label>
                            <Input
                              id="status_bmi"
                              name="status_bmi"
                              value={formData.status_bmi}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alergi */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Alergi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="jenis_alergi">Jenis Alergi</Label>
                            <Select value={formData.jenis_alergi} onValueChange={(value) => handleSelectChange('jenis_alergi', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis alergi" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                                <SelectItem value="Obat">Obat</SelectItem>
                                <SelectItem value="Makanan">Makanan</SelectItem>
                                <SelectItem value="Lingkungan">Lingkungan</SelectItem>
                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="alergi">Detail Alergi</Label>
                            <Input
                              id="alergi"
                              name="alergi"
                              value={formData.alergi}
                              onChange={handleInputChange}
                              placeholder="Sebutkan detail alergi..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* GCS */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Glasgow Coma Scale (GCS)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="eye">Eye Response</Label>
                            <Select value={formData.eye} onValueChange={(value) => handleSelectChange('eye', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Eye Response" />
                              </SelectTrigger>
                              <SelectContent>
                                {gcs_eye.map((item) => (
                                  <SelectItem key={item.id} value={item.skor}>
                                    {item.skor} - {item.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="verbal">Verbal Response</Label>
                            <Select value={formData.verbal} onValueChange={(value) => handleSelectChange('verbal', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Verbal Response" />
                              </SelectTrigger>
                              <SelectContent>
                                {gcs_verbal.map((item) => (
                                  <SelectItem key={item.id} value={item.skor}>
                                    {item.skor} - {item.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="motorik">Motor Response</Label>
                            <Select value={formData.motorik} onValueChange={(value) => handleSelectChange('motorik', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Motor Response" />
                              </SelectTrigger>
                              <SelectContent>
                                {gcs_motorik.map((item) => (
                                  <SelectItem key={item.id} value={item.skor}>
                                    {item.skor} - {item.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* HTT */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Head To Toe (HTT)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label htmlFor="htt">Pemeriksaan HTT</Label>
                          <Textarea
                            id="htt"
                            name="htt"
                            value={formData.htt}
                            onChange={handleInputChange}
                            rows={4}
                            className="mt-1"
                            placeholder="Masukkan hasil pemeriksaan head to toe..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Assesmen Tab */}
                <TabsContent value="assesmen" className="mt-4">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Assessment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="assesmen">Diagnosis / Assessment</Label>
                          <Textarea
                            id="assesmen"
                            name="assesmen"
                            value={formData.assesmen}
                            onChange={handleInputChange}
                            rows={6}
                            className="mt-1"
                            placeholder="Masukkan diagnosis atau assessment pasien..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="expertise">Expertise / Konsultasi</Label>
                          <Textarea
                            id="expertise"
                            name="expertise"
                            value={formData.expertise}
                            onChange={handleInputChange}
                            rows={4}
                            className="mt-1"
                            placeholder="Masukkan expertise atau konsultasi yang diperlukan..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="evaluasi">Evaluasi</Label>
                          <Textarea
                            id="evaluasi"
                            name="evaluasi"
                            value={formData.evaluasi}
                            onChange={handleInputChange}
                            rows={4}
                            className="mt-1"
                            placeholder="Masukkan evaluasi kondisi pasien..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Plan Tab */}
                <TabsContent value="plan" className="mt-4">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Plan Tindakan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label htmlFor="plan">Rencana Tindakan / Terapi</Label>
                          <Textarea
                            id="plan"
                            name="plan"
                            value={formData.plan}
                            onChange={handleInputChange}
                            rows={8}
                            className="mt-1"
                            placeholder="Masukkan rencana tindakan, terapi, atau pengobatan untuk pasien..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.visit('/pelayanan/soap-dokter')}
                >
                  Kembali
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Update SOAP' : 'Simpan SOAP'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

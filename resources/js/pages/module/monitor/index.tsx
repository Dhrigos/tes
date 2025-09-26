import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageProps } from '@/types';

interface AntrianProps extends PageProps {
  general_poly: number;
  dental_poly: number;
  kia_poly: number;
}

export default function Index({ general_poly, dental_poly, kia_poly }: AntrianProps) {
  return (
    <>
      <Head title="Monitor Antrian" />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-6">SISTEM ANTRIAN PASIEN</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="text-center">POLI UMUM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Nomor Antrian</p>
                <p className="text-5xl font-bold">{general_poly}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-green-600 text-white">
              <CardTitle className="text-center">POLI GIGI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Nomor Antrian</p>
                <p className="text-5xl font-bold">{dental_poly}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-purple-600 text-white">
              <CardTitle className="text-center">POLI KIA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Nomor Antrian</p>
                <p className="text-5xl font-bold">{kia_poly}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
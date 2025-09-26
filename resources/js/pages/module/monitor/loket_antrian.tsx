import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageProps } from '@/types';

interface LoketAntrianProps extends PageProps {
  loket_data: {
    [key: string]: {
      nomor: string;
      nama: string;
    };
  };
}

export default function LoketAntrian({ loket_data }: LoketAntrianProps) {
  return (
    <>
      <Head title="Monitor Antrian Loket" />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-6">SISTEM ANTRIAN LOKET</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(loket_data).map(([loket, data]) => (
            <Card key={loket} className="shadow-lg">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="text-center">LOKET {loket}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">Nomor Antrian</p>
                  <p className="text-5xl font-bold">{data.nomor}</p>
                  <p className="text-xl mt-4">{data.nama}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GcsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('gcs_eyes')->insert([
            [ 'nama' => 'MEMBUKA MATA SECARA SPONTAN', 'skor' => 4 ],
            [ 'nama' => 'MEMBUKA MATA DENGAN PERINTAH', 'skor' => 3 ],
            [ 'nama' => 'MEMBUKA MATA SETELAH DIBERIKAN RANGSANGAN NYERI', 'skor' => 2 ],
            [ 'nama' => 'TIDAK MEMBUKA MATA', 'skor' => 1 ],
        ]);

        DB::table('gcs_verbals')->insert([
            [ 'nama' => 'ORIENTASI BAIK', 'skor' => 5 ],
            [ 'nama' => 'BINGUNG, BERBICARA MENGACAU', 'skor' => 4 ],
            [ 'nama' => 'KATA TIDAK SESUAI/TIDAK TEPAT', 'skor' => 3 ],
            [ 'nama' => 'MERESPON DENGAN MENGERANG', 'skor' => 2 ],
            [ 'nama' => 'TIDAK ADA RESPON VERBAL', 'skor' => 1 ],
        ]);

        DB::table('gcs_motoriks')->insert([
            [ 'nama' => 'MENGIKUTI / MEMATUHI PERINTAH', 'skor' => 6 ],
            [ 'nama' => 'MELOKALISIR NYERI', 'skor' => 5 ],
            [ 'nama' => 'MENARIK DIRI TERHADAP RANGSANGAN NYERI', 'skor' => 4 ],
            [ 'nama' => 'FLEXI ABNORMAL', 'skor' => 3 ],
            [ 'nama' => 'EKSTENSI ABNORMAL', 'skor' => 2 ],
            [ 'nama' => 'TIDAK ADA GERAKAN / RESPON', 'skor' => 1 ],
        ]);

        DB::table('gcs_kesadarans')->insert([
            [ 'nama' => 'COMPOS MENTIS', 'skor' => 15, 'kode' => '01' ],
            [ 'nama' => 'COMPOS MENTIS', 'skor' => 14, 'kode' => '01' ],
            [ 'nama' => 'APATIS', 'skor' => 13, 'kode' => '00' ],
            [ 'nama' => 'APATIS', 'skor' => 12, 'kode' => '00' ],
            [ 'nama' => 'DELIRIUM', 'skor' => 11, 'kode' => '03' ],
            [ 'nama' => 'DELIRIUM', 'skor' => 10, 'kode' => '03' ],
            [ 'nama' => 'SOMNOLEN', 'skor' => 9, 'kode' => '02' ],
            [ 'nama' => 'SOMNOLEN', 'skor' => 7, 'kode' => '02' ],
            [ 'nama' => 'SOPOR', 'skor' => 6, 'kode' => '03' ],
            [ 'nama' => 'SOPOR', 'skor' => 5, 'kode' => '03' ],
            [ 'nama' => 'SEMI COMA', 'skor' => 4, 'kode' => '03' ],
            [ 'nama' => 'KOMA', 'skor' => 3, 'kode' => '04' ],
        ]);
    }
}



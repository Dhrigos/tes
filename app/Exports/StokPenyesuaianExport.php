<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Collection;

class StokPenyesuaianExport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * The raw rows to export
     */
    protected Collection $rows;

    /**
     * @param  iterable|array  $rows  Array/Collection of rows to export
     */
    public function __construct($rows)
    {
        $this->rows = collect($rows);
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection(): Collection
    {
        return $this->rows;
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Kode Obat/Alkes',
            'Nama Obat/Alkes',
            'Qty Sebelum',
            'Qty Mutasi',
            'Qty Sesudah',
            'Jenis Penyesuaian',
            'Alasan',
            'Tanggal',
            'Jam',
            'Petugas',
            'Tipe',
        ];
    }

    /**
     * @param  mixed  $row
     * @return array<int, mixed>
     */
    public function map($row): array
    {
        $item = is_array($row) ? $row : (method_exists($row, 'toArray') ? $row->toArray() : (array) $row);

        $kode = $item['kode_obat'] ?? '-';
        $nama = $item['nama_obat'] ?? '-';
        $qtySebelum = $item['qty_sebelum'] ?? '-';
        $qtyMutasi = $item['qty_mutasi'] ?? '-';
        $qtySesudah = $item['qty_sesudah'] ?? '-';
        $jenis = $item['jenis_penyesuaian'] ?? '-';
        $alasan = $item['alasan'] ?? '-';

        $sourceDateTime = $item['tanggal'] ?? $item['created_at'] ?? '';
        $tanggal = '';
        $jam = '';
        if ($sourceDateTime) {
            $s = (string) $sourceDateTime;
            if (strpos($s, 'T') !== false) {
                [$d, $t] = explode('T', $s, 2);
                $tanggal = substr($d, 0, 10);
                $jam = substr((string) $t, 0, 5);
            } elseif (strpos($s, ' ') !== false) {
                [$d, $t] = explode(' ', $s, 2);
                $tanggal = substr($d, 0, 10);
                $jam = substr((string) $t, 0, 5);
            } else {
                $tanggal = substr($s, 0, 10);
            }
        }
        $jamFinal = isset($item['jam']) ? substr((string) $item['jam'], 0, 5) : $jam;

        $petugas = $item['user_input_name'] ?? '-';
        $tipe = $item['jenis_gudang'] ?? ($item['tipe'] ?? '-');

        return [
            $kode,
            $nama,
            $qtySebelum,
            $qtyMutasi,
            $qtySesudah,
            $jenis,
            $alasan,
            $tanggal,
            $jamFinal,
            $petugas,
            $tipe,
        ];
    }
}

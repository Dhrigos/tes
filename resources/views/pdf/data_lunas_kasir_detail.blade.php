<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Laporan Kasir Detail</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.2;
            margin: 10px;
            padding: 0;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        table.items th,
        table.items td {
            border: 1px solid #000;
            padding: 2px;
            font-size: 10px;
            height: 26px;
        }

        table.items th {
            text-align: center;
            background-color: #f2f2f2;
        }
    </style>
</head>

<body>
    <div style="text-align:center;">
        <div style="font-weight:bold; font-size:18px;">{{ $namaKlinik }}</div>
        <div>{!! nl2br(e($alamatKlinik)) !!}</div>
    </div>
    <hr>
    <div style="font-weight:bold; margin:6px 0;">LAPORAN KASIR DETAIL</div>
    <div>Dicetak: {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }} | Periode: {{ $tanggal_awal }} s/d {{ $tanggal_akhir }} | Poli: {{ $poli ?? 'Semua Poli' }}</div>

    <table class="items">
        <thead>
            <tr>
                <th>No</th>
                <th>Invoice</th>
                <th>No Rawat</th>
                <th>No RM</th>
                <th>Tindakan/Obat</th>
                <th>Harga</th>
                <th>Pelaksana</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th>Diskon</th>
                <th>Total</th>
                <th>Poli</th>
                <th>Dokter</th>
                <th>Penjamin</th>
                <th>Tanggal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($data as $i => $row)
            <tr>
                <td>{{ $row['no'] ?? ($i + 1) }}</td>
                <td>{{ $row['kode_faktur'] ?? '-' }}</td>
                <td>{{ $row['no_rawat'] ?? '-' }}</td>
                <td>{{ $row['no_rm'] ?? '-' }}</td>
                <td>{{ $row['nama_obat_tindakan'] ?? '-' }}</td>
                <td style="text-align:right;">{{ $row['harga_obat_tindakan'] ?? '-' }}</td>
                <td>{{ $row['pelaksana'] ?? '-' }}</td>
                <td style="text-align:center;">{{ $row['qty'] ?? '-' }}</td>
                <td style="text-align:right;">{{ $row['subtotal'] ?? '-' }}</td>
                <td>{{ !empty($row['nama_diskon']) ? ($row['nama_diskon'] . ' (' . ($row['harga_diskon'] ?? 0) . ')') : '-' }}</td>
                <td style="text-align:right;">{{ $row['total'] ?? '-' }}</td>
                <td>{{ $row['kasir']['poli'] ?? '-' }}</td>
                <td>{{ $row['kasir']['dokter'] ?? '-' }}</td>
                <td>{{ $row['kasir']['penjamin'] ?? '-' }}</td>
                <td>{{ isset($row['tanggal']) ? (explode('T', $row['tanggal'])[0] ?? $row['tanggal']) : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>
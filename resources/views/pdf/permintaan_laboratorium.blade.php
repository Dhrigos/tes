<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Resep Dokter</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            margin: 0mm;
            padding: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 8px;
        }

        .clinic-name {
            font-size: 14px;
            font-weight: bold;
        }

        .clinic-info {
            font-size: 10px;
        }

        .divider {
            border-top: 1px solid #000;
            margin: 5px 0;
        }

        .document-title {
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0;
            text-align: center;
        }

        .content {
            margin-top: 5px;
            margin-bottom: 10px;
        }

        .content-table {
            border-collapse: collapse;
            width: 100%;
        }

        .content-table thead tr {
            border-bottom: 2px solid #000;
            /* garis bawah header */
        }

        .content-table tbody tr {
            border-bottom: 1px solid #ddd;
            /* garis bawah antar baris */
        }

        .content-table th,
        .content-table td {
            padding: 8px 12px;
            text-align: left;
            border: none;
            /* hilangkan border vertikal */
        }


        .resep-line {
            margin-bottom: 3px;
            font-size: 9px;
        }

        .note-table {
            width: 100%;
            margin-bottom: 5px;
            margin-top: 25px;
        }

        .note-table td {
            padding: 1px 0;
            vertical-align: top;
            border: none;
        }

        .note-label {
            width: 10px;
        }

        .note-separator {
            width: 10px;
            text-align: center;
        }

        .footer {
            position: fixed;
            bottom: 5px;
            width: 100%;
        }

        .signature-table {
            width: 180%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 120px;
            margin: 0 auto;
            margin-top: 40px;
        }

        .page-break {
            page-break-after: always;
        }

        .info-table {
            width: 100%;
            margin-bottom: 5px;
        }

        .info-table td {
            padding: 1px 0;
            vertical-align: top;
            border: none;
        }

        .info-label {
            width: 70px;
        }

        .info-separator {
            width: 10px;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="clinic-name">{{ $namaKlinik }}</div>
        <div class="clinic-info">
            {!! nl2br(e($alamatKlinik)) !!}
        </div>
    </div>

    <div class="divider"></div>

    <div class="document-title">PERMINTAAN PEMERIKSAAN LABORATORIUM</div>

    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Dokter</td>
            <td class="info-separator">:</td>
            <td>{{ $dokter_pengirim }} [{{ $poli }}]</td>
        </tr>

        <tr>
            <td class="info-label">Pasien</td>
            <td class="info-separator">:</td>
            <td>{{ $nama_pasien }}</td>
        </tr>

        <tr>
            <td class="info-label">Jenkel / Tgl Lahir</td>
            <td class="info-separator">:</td>
            <td>{{ $jenis_kelamin }} ({{ $tanggal_lahir }})</td>
        </tr>

        <tr>
            <td class="info-label">Alamat</td>
            <td class="info-separator">:</td>
            <td>{{ $alamat }}</td>
        </tr>

        <tr>
            <td class="info-label">Jenis Penjamin</td>
            <td class="info-separator">:</td>
            <td>{{ $penjamin }}</td>
        </tr>
    </table>

    <div class="content">
        <table class="content-table">
            <thead>
                <tr>
                    <th style="width: 10%;">No</th>
                    <th style="width: 90%;">Nama Pemeriksaan</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($labData as $index => $pemeriksaan)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $pemeriksaan }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Tgl Pemeriksaan</td>
            <td class="info-separator">:</td>
            <td>{{ \Carbon\Carbon::parse($tanggal)->format('d-m-Y H:i') }}</td>
        </tr>

        <tr>
            <td class="info-label">Diagnosa Klinis</td>
            <td class="info-separator">:</td>
            <td>{{ $diagnosa }}</td>
        </tr>

        <tr>
            <td class="info-label">Catatan Dokter</td>
            <td class="info-separator">:</td>
            <td>{!! nl2br(e($catatan)) !!}</td>
        </tr>
    </table>

    <div class="footer">
        <table class="signature-table">
            <tr>
                <td style="font-weight: bold;">Dokter Pengirim</td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td style="height: 20px;"></td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td>
                    <div class="signature-line"></div>
                </td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td>{{ $dokter_pengirim ?? auth()->user()->name ?? 'Petugas' }}</td>
                <td></td>
                <td></td>
            </tr>
        </table>
    </div>

    @if($auto_print ?? false)
    <script>
        // Auto print saat halaman selesai load
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500); // Delay 500ms untuk memastikan halaman selesai render
        };
    </script>
    @endif
</body>

</html>
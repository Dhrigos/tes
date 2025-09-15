<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Surat Rujukan FKTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 10px;
            /* Kurangi margin agar cukup di satu halaman */
            font-size: 11px;
            /* Kurangi ukuran font jika perlu */

        }

        .header {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
        }

        .box {
            border: 1px solid black;
            padding: 10px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table td {
            padding: 5px;
            vertical-align: top;
        }

        .barcode {
            text-align: right;
        }

        .right {
            text-align: right;
        }

        .bold {
            font-weight: bold;
        }

        .border-box {
            display: inline-block;
            border: 1px solid black;
            padding: 2px 5px;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            /* Agar sejajar dengan teks di sebelahnya */
        }
    </style>

</head>

<body>
    <!-- Header -->

    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 5px;">
        <!-- Logo BPJS di Kiri -->
        <div style="width: 50%; display: flex; align-items: center;">
            <img src="https://www.pngkey.com/png/detail/643-6432142_bpjs-logo-png-logo-bpjs-kesehatan-png.png"
                alt="BPJS Logo"
                style="height: 50px;">
        </div>

        <!-- Informasi Wilayah di Kanan, tetapi Teks Rata Kiri -->
        <div style="width: 30%; text-align: left; font-size: 12px; margin-left: auto;">
            <div style="display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 10px; align-items: center;">
                <strong>Kedeputian Wilayah</strong>
                <span>:-</span>
                <br>
                <strong>Kantor Cabang</strong>
                <span>: -</span>
            </div>
        </div>
    </div>



    <div class="header">
        <p><strong>Surat Rujukan FKTP</strong></p>
    </div>
    <!-- Kotak Besar -->
    <div class="box" style="border: 1px solid black; padding: 5px; margin-top: 10px;">

        <div class="box" style="border: 1px solid black; padding: 5px;">
            <table class="table" style="width: 100%;">
                <tr>
                    <!-- Kolom Informasi di Kiri -->
                    <td style="width: 70%; vertical-align: top;">
                        <table style="width: 100%;">
                            <tr>
                                <td>No. Rujukan</td>
                                <td>: {{ $no_rujukan }}</td>
                            </tr>
                            <tr>
                                <td>FKTP</td>
                                <td>: {{ $fktp ?? 'Klinik Balaraja ' }}</td>
                            </tr>
                            <tr>
                                <td>Kabupaten / Kota</td>
                                <td>: {{ '-' }}</td>
                            </tr>
                        </table>
                    </td>

                    <!-- Kolom Barcode di Kanan -->
                    <td style="width: 30%; text-align: right; vertical-align: top;">
                        @php
                        $noRujukan = $no_rujukan ?? '000000000000';
                        $barcodeHtml = null;
                        if (class_exists(\Picqer\Barcode\BarcodeGeneratorHTML::class)) {
                        $generator = new \Picqer\Barcode\BarcodeGeneratorHTML();
                        $barcodeHtml = $generator->getBarcode($noRujukan, $generator::TYPE_CODE_128);
                        }
                        @endphp
                        <div style="display: inline-block;">
                            @if ($barcodeHtml)
                            {!! $barcodeHtml !!}
                            @else
                            <div style="font-size: 10px; text-align: right;">No. Rujukan: {{ $noRujukan }}</div>
                            @endif
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <!-- Informasi Tujuan -->
        <p><strong>Kepada Yth. TS Dokter</strong> : {{ $subspesialis }}</p>
        <p><strong>Di</strong> : {{ $lokasi }}</p>

        <p><strong>Mohon pemeriksaan dan penanganan lebih lanjut pasien :</strong></p>

        <!-- Informasi Pasien -->
        <table class="table" style="width: 100%;">
            <tr>
                @php
                use Carbon\Carbon;
                $tanggalLahir = $tanggal_lahir ?? '2000-01-01'; // Default jika null
                $umur = Carbon::parse($tanggalLahir)->age;
                @endphp
                <td>Nama</td>
                <td>: <strong>{{ $nama_pasien }}</strong></td>
                <td>Umur : {{ $umur }}</td>
                <td>Tahun: {{ date('d-M-Y', strtotime($tanggal_lahir)) }}</td>
            </tr>
            <tr>
                <td>No. Kartu BPJS</td>
                <td>: {{ $no_bpjs }}</td>
                <td>Status :
                    <span class="border-box" style="display: inline-block; vertical-align: middle; margin-right: 20px;">3</span>
                    <span style="vertical-align: middle;">Utama/Tanggungan</span>
                </td>
                <td>
                    <span class="border-box" style="display: inline-block; vertical-align: middle;">L</span>
                    <span style="margin-left: 10px; vertical-align: middle;">(L/P)</span>
                </td>
            </tr>
            <tr>
                <td>Diagnosa</td>
                @php
                $diagnosaText = '-';
                if (is_object($diagnosa) && isset($diagnosa->nama_icd10)) {
                $kode = isset($diagnosa->kode_icd10) ? $diagnosa->kode_icd10 : '';
                $diagnosaText = trim($diagnosa->nama_icd10 . ($kode ? ' (' . $kode . ')' : ''));
                } elseif (is_string($diagnosa)) {
                $diagnosaText = $diagnosa;
                }
                @endphp
                <td colspan="2">: {{ $diagnosaText }}</td>
            </tr>
            <tr>
                <td>Telah diberikan</td>
                <td colspan="2">: {{ '-' }}</td>
            </tr>
            <tr>
                <td>Catatan</td>
                <td colspan="2">: {{ '-' }}</td>
            </tr>
        </table>

        <!-- Tanggal Kunjungan -->
        <p><strong>Atas bantuannya, diucapkan terima kasih.</strong></p>
        <p><strong>Tgl. Rencana Berkunjung</strong> : {{ date('d-M-Y', strtotime($tanggal_rujukan)) }}</p>

        <!-- Tanda Tangan -->
        <div style="width: 350%; display: flex; justify-content: space-between; margin-top: 10px;">
            <!-- Bagian Kiri (Kosong untuk keseimbangan) -->
            <div style="width: 50%;"></div>

            <!-- Bagian Kanan (Tanda Tangan) -->
            <div style="width: 50%; text-align: center;">
                <p style="margin-bottom: 5px;">Salam sejawat,</p>
                <p style="margin-bottom: 50px;">{{ \Carbon\Carbon::now()->format('d F Y') }}</p>
                <hr style="width: 5%; margin: 0 auto 10px; border: 1px solid black;">
                <p style="font-weight: bold;">{{ $dokter_pengirim ?? 'Tenaga Medis 450181' }}</p>

            </div>
        </div>

    </div>

    </div>
</body>

</html>
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily queue reset at midnight
Schedule::command('queue:reset-daily')
    ->daily()
    ->at('00:01')
    ->description('Reset daily queue numbers at midnight');

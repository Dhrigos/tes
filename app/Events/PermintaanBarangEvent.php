<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PermintaanBarangEvent
{
    use Dispatchable, SerializesModels;

    public $data;
    public $eventType;
    public $kodeKlinik;
    public $isGudangUtama;

    /**
     * Create a new event instance.
     */
    public function __construct($data, $eventType, $kodeKlinik, $isGudangUtama = false)
    {
        $this->data = $data;
        $this->eventType = $eventType;
        $this->kodeKlinik = $kodeKlinik;
        $this->isGudangUtama = $isGudangUtama;
    }
}

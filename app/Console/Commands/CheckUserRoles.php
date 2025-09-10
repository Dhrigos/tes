<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Module\Master\Data\Manajemen\Posker;
use App\Models\Module\SDM\Staff;
use Illuminate\Console\Command;

class CheckUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:check-roles {user_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check user roles and posker data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        
        if ($userId) {
            $this->checkSpecificUser($userId);
        } else {
            $this->checkAllUsers();
        }
    }

    private function checkSpecificUser($userId)
    {
        $user = User::find($userId);
        
        if (!$user) {
            $this->error("User with ID {$userId} not found!");
            return;
        }

        $this->info("=== CHECKING USER: {$user->name} (ID: {$user->id}) ===");
        
        // Check staff record
        $staff = Staff::where('users', $user->id)->first();
        
        if (!$staff) {
            $this->warn("No staff record found for user {$user->name}");
            $this->info("Roles will default to: Admin");
            return;
        }

        $this->info("Staff ID: {$staff->id}");
        $this->info("Staff Status Pegawaian: " . ($staff->status_pegawaian ?? 'NULL'));

        if (!$staff->status_pegawaian) {
            $this->warn("No status_pegawaian set for staff");
            $this->info("Roles will default to: Admin");
            return;
        }

        // Check posker
        $posker = Posker::with('roles')->find($staff->status_pegawaian);
        
        if (!$posker) {
            $this->warn("Posker with ID {$staff->status_pegawaian} not found");
            $this->info("Roles will default to: Admin");
            return;
        }

        $this->info("Posker ID: {$posker->id}");
        $this->info("Posker Name: {$posker->nama}");
        
        if (!$posker->roles || $posker->roles->isEmpty()) {
            $this->warn("No roles assigned to posker {$posker->nama}");
            $this->info("Roles will default to: Admin");
            return;
        }

        $this->info("Posker Roles:");
        foreach ($posker->roles as $role) {
            $this->line("  - {$role->name} (ID: {$role->id})");
        }

        // Get final roles
        $roles = $user->getRolesFromPosker();
        $this->info("Final User Roles: " . implode(', ', $roles));
    }

    private function checkAllUsers()
    {
        $this->info("=== CHECKING ALL USERS ===");
        
        $users = User::all();
        
        $this->table(
            ['ID', 'Name', 'Username', 'Staff ID', 'Posker ID', 'Posker Name', 'Roles'],
            $users->map(function ($user) {
                $staff = Staff::where('users', $user->id)->first();
                $posker = $staff && $staff->status_pegawaian ? 
                    Posker::with('roles')->find($staff->status_pegawaian) : null;
                
                $roles = $user->getRolesFromPosker();
                
                return [
                    $user->id,
                    $user->name,
                    $user->username,
                    $staff ? $staff->id : 'N/A',
                    $posker ? $posker->id : 'N/A',
                    $posker ? $posker->nama : 'N/A',
                    implode(', ', $roles)
                ];
            })
        );
    }
}

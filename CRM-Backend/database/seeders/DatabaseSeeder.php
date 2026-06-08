<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Llamamos a nuestro seeder del Super Admin
        $this->call([
            SuperAdminSeeder::class,
        ]);
    }
}
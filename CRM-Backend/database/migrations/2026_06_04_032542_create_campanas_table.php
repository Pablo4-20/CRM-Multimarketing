<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campanas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Único campo que necesitamos
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campanas');
    }
};
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('email')->nullable(); // Puede estar vacío si no lo tienen
            $table->string('telefono')->nullable(); // Puede estar vacío
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('clientes');
    }
};
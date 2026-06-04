<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('clientes', function (Blueprint $table) {
            // Agregamos las llaves foráneas. Son 'nullable' para que los clientes importados 
            // masivamente puedan estar "Sin asignar" inicialmente.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('campana_id')->nullable()->constrained('campanas')->nullOnDelete();
            $table->foreignId('estado_id')->nullable()->constrained('estados')->nullOnDelete();
        });
    }

    public function down(): void {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['campana_id']);
            $table->dropForeign(['estado_id']);
            $table->dropColumn(['user_id', 'campana_id', 'estado_id']);
        });
    }
};
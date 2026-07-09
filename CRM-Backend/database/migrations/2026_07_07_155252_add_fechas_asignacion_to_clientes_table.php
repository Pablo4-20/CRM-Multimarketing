<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('clientes', function (Blueprint $table) {
            $table->timestamp('fecha_asignacion')->nullable()->after('estado_id');
            $table->timestamp('fecha_reasignacion')->nullable()->after('fecha_asignacion');
        });
    }

    public function down(): void {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn(['fecha_asignacion', 'fecha_reasignacion']);
        });
    }
};
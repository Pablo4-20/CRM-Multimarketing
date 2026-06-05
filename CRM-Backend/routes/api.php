<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB; // <-- IMPORTANTE: Agregado para usar DB::table
use App\Models\Cliente; // <-- IMPORTANTE: Agregado para contar clientes
use App\Models\Campana; // <-- IMPORTANTE: Agregado para contar campañas
use App\Models\Estado;  // <-- IMPORTANTE: Agregado para contar estados
use App\Models\User;    // <-- IMPORTANTE: Agregado para contar usuarios
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CampanaController;
use App\Http\Controllers\EstadoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\DashboardController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

//login
Route::post('/login', [AuthController::class, 'login']);

//Gestion de usuarios 
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

// Gestión de campañas
Route::get('/campanas', [CampanaController::class, 'index']);
Route::post('/campanas', [CampanaController::class, 'store']);
Route::post('/campanas/masivo', [CampanaController::class, 'storeMasivo']); // Ruta especial
Route::put('/campanas/{id}', [CampanaController::class, 'update']);
Route::delete('/campanas/{id}', [CampanaController::class, 'destroy']);

// Gestión de estados
Route::get('/estados', [EstadoController::class, 'index']);
Route::post('/estados', [EstadoController::class, 'store']);
Route::post('/estados/masivo', [EstadoController::class, 'storeMasivo']); // Ruta especial
Route::put('/estados/{id}', [EstadoController::class, 'update']);
Route::delete('/estados/{id}', [EstadoController::class, 'destroy']);

// Gestión de clientes
Route::get('/clientes', [ClienteController::class, 'index']);
Route::post('/clientes', [ClienteController::class, 'store']);
Route::post('/clientes/masivo', [ClienteController::class, 'storeMasivo']); // Ruta especial
Route::put('/clientes/{id}', [ClienteController::class, 'update']);
Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);

// Asignaciones masivas
Route::get('/asignaciones/datos', [AsignacionController::class, 'getDatosModal']);
Route::post('/asignaciones/procesar', [AsignacionController::class, 'asignarMasivo']);
Route::post('/asignaciones/desasignar', [AsignacionController::class, 'desasignarMasivo']);

// Rutas para el rol Agente
Route::get('/agente/clientes/{user_id}', [ClienteController::class, 'getPorAgente']);
Route::post('/agente/clientes/{id}/comentarios', [ClienteController::class, 'addComentario']);

// Ruta del Dashboard
Route::get('/dashboard-stats', function () {
    try {
        // Agrupamos los clientes por el agente asignado
        // CORRECCIÓN: Volvemos a usar 'user_id' que es tu columna real en la base de datos
        $agentesData = DB::table('clientes')
            ->join('users', 'clientes.user_id', '=', 'users.id') 
            ->select('users.name', DB::raw('count(clientes.id) as value'))
            ->groupBy('users.id', 'users.name')
            ->get();

        return response()->json([
            'clientes' => Cliente::count(),
            'campanas' => Campana::count(),
            'estados' => Estado::count(),
            'usuarios' => User::count(),
            'agentes_chart' => $agentesData 
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error al obtener datos',
            'message' => $e->getMessage()
        ], 500);
    }
});
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB; 
use App\Models\Cliente; 
use App\Models\Campana; 
use App\Models\Estado;  
use App\Models\User;    
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
Route::post('/users/masivo', [UserController::class, 'storeMasivo']);
// ---> NUEVA RUTA PARA OBTENER ACTIVIDAD DEL AGENTE <---
Route::get('/users/{id}/actividad', [UserController::class, 'getActividad']);

// Gestión de campañas
Route::get('/campanas', [CampanaController::class, 'index']);
Route::post('/campanas', [CampanaController::class, 'store']);
Route::post('/campanas/masivo', [CampanaController::class, 'storeMasivo']); 
Route::put('/campanas/{id}', [CampanaController::class, 'update']);
Route::delete('/campanas/{id}', [CampanaController::class, 'destroy']);

// Gestión de estados
Route::get('/estados', [EstadoController::class, 'index']);
Route::post('/estados', [EstadoController::class, 'store']);
Route::post('/estados/masivo', [EstadoController::class, 'storeMasivo']); 
Route::put('/estados/{id}', [EstadoController::class, 'update']);
Route::delete('/estados/{id}', [EstadoController::class, 'destroy']);

// Gestión de clientes
Route::get('/clientes', [ClienteController::class, 'index']);
Route::post('/clientes', [ClienteController::class, 'store']);
Route::post('/clientes/masivo', [ClienteController::class, 'storeMasivo']); 
Route::put('/clientes/{id}', [ClienteController::class, 'update']);
Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
Route::get('/clientes/{id}', [ClienteController::class, 'show']);

// ---> NUEVAS RUTAS PARA EDITAR Y ELIMINAR COMENTARIOS <---
Route::put('/comentarios/{id}', [ClienteController::class, 'updateComentario']);
Route::delete('/comentarios/{id}', [ClienteController::class, 'destroyComentario']);

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
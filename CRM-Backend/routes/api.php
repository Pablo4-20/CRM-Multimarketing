<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CampanaController;
use App\Http\Controllers\EstadoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AsignacionController;

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

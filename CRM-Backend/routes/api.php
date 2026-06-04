<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CampanaController;

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
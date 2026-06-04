<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validar que envíen correo y contraseña
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Buscar al usuario por correo
        $user = User::where('email', $request->email)->first();

        // 3. Verificar si existe y si la contraseña coincide
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas. Verifica tu correo o contraseña.'], 401);
        }

        // 4. Verificar que el usuario esté activo
        if ($user->status !== 'Activo') {
            return response()->json(['message' => 'Esta cuenta está inactiva. Contacta al administrador.'], 403);
        }

        // 5. Crear el token de acceso
        $token = $user->createToken('auth_token')->plainTextToken;

        // 6. Devolver los datos al frontend
        return response()->json([
            'message' => '¡Hola '.$user->name.'!',
            'token' => $token,
            'user' => $user
        ]);
    }
}
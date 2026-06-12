<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
// use App\Models\Client; // Descomentarás esto cuando tengas tu modelo de Clientes

class UserController extends Controller
{
    // 1. Obtener todos los usuarios
    public function index()
    {
        $users = User::orderBy('id', 'desc')->get();
        return response()->json($users);
    }

    // 2. Crear un nuevo usuario
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:super-admin,admin,agente',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Encriptamos la contraseña
            'role' => $request->role,
            'status' => 'Activo',
        ]);

        return response()->json(['message' => 'Usuario creado exitosamente', 'user' => $user], 201);
    }

    // 3. Crear usuarios de forma masiva (Desde Excel)
    public function storeMasivo(Request $request)
    {
        $request->validate([
            'usuarios' => 'required|array',
            'usuarios.*.name' => 'required|string|max:255',
            'usuarios.*.email' => 'required|email|max:255',
            'usuarios.*.password' => 'required|string|min:6',
            'usuarios.*.role' => 'required|string'
        ]);

        $nuevosUsuarios = [];
        $errores = [];

        foreach ($request->usuarios as $index => $uData) {
            $email = trim($uData['email']);

            // Evitar colisiones de correos duplicados
            if (User::where('email', $email)->exists()) {
                $errores[] = "Fila " . ($index + 2) . ": El correo '{$email}' ya está registrado.";
                continue;
            }

            // Homologar y validar roles válidos
            $rol = strtolower(trim($uData['role']));
            if (!in_array($rol, ['super-admin', 'admin', 'agente'])) {
                $rol = 'agente'; // Rol por defecto si hay errores de escritura
            }

            $user = User::create([
                'name' => trim($uData['name']),
                'email' => $email,
                'password' => Hash::make($uData['password']), // Encriptación segura
                'role' => $rol,
                'status' => 'Activo', // Estado por defecto
            ]);

            $nuevosUsuarios[] = $user;
        }

        // Si hubo errores de duplicados y no se pudo registrar ningún usuario
        if (count($errores) > 0 && count($nuevosUsuarios) === 0) {
            return response()->json([
                'errors' => ['usuarios' => [implode(' | ', $errores)]]
            ], 422);
        }

        return response()->json([
            'message' => 'Carga masiva procesada correctamente',
            'data' => $nuevosUsuarios,
            'warnings' => $errores
        ], 201);
    }

    // 4. Editar un usuario
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|in:super-admin,admin,agente',
            'status' => 'required|in:Activo,Inactivo'
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->status = $request->status;

        // Si envían una nueva contraseña, la actualizamos
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json(['message' => 'Usuario actualizado', 'user' => $user]);
    }

    // 5. Eliminar y Transferir Datos
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Verificamos si se envió un ID para transferir los clientes
        $transferToUserId = $request->input('transfer_to_user_id');

        if ($transferToUserId) {
            // Validamos que el usuario destino exista
            $transferUser = User::find($transferToUserId);
            
            if ($transferUser) {
                // 1. Transferimos todos los clientes del usuario a eliminar al nuevo usuario
                \App\Models\Cliente::where('user_id', $user->id)
                                   ->update(['user_id' => $transferUser->id]);
                                   
                // 2. Transferimos TODO EL HISTORIAL (comentarios) al nuevo usuario
                \App\Models\Comentario::where('user_id', $user->id)
                                      ->update(['user_id' => $transferUser->id]);
            }
        } else {
            // Si no se transfiere a nadie, los clientes quedan sin asignar
            \App\Models\Cliente::where('user_id', $user->id)
                               ->update(['user_id' => null]);
                               
            // Nota: Si no hay transferencia, los comentarios se eliminarán o quedarán huérfanos
            // dependiendo de cómo hayas configurado la base de datos (onDelete cascade).
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado y todo su historial transferido correctamente']);
    }

    // 6. Obtener actividad de un usuario específico
    public function getActividad($id) {
        // Obtenemos todos los comentarios/gestiones hechos por este usuario
        // y cargamos la relación 'cliente' para saber a quién le comentó
        $actividad = \App\Models\Comentario::with('cliente')
            ->where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($actividad);
    }
}
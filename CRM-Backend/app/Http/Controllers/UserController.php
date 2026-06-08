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

    // 3. Editar un usuario
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

    // 4. Eliminar y Transferir Datos
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
}
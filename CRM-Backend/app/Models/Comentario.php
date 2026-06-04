<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comentario extends Model
{
    use HasFactory;
    protected $fillable = ['cliente_id', 'user_id', 'texto'];

    // Para saber quién escribió el comentario
    public function user() {
        return $this->belongsTo(User::class);
    }
}
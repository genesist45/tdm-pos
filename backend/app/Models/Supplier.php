<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'supplier_name',
        'email',
        'phone',
        'region',
        'province',
        'city',
        'barangay',
        'postal_code',
        'company_description'
    ];
} 
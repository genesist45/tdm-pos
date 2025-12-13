<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'total_amount',
        'items',
        'amount_received',
        'change'
    ];

    protected $casts = [
        'items' => 'array',
        'total_amount' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'change' => 'decimal:2'
    ];
}

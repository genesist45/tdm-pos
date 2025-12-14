<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DamagedItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_no',
        'item_name',
        'quantity_returned',
        'return_reason',
        'other_reason',
        'return_date',
        'processed_by'
    ];

    protected $casts = [
        'return_date' => 'date',
        'quantity_returned' => 'integer'
    ];
}

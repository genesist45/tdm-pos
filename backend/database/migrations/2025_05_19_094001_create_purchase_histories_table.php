<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_histories', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_id')->unique();
            $table->decimal('total_amount', 10, 2);
            $table->json('items'); // Store items as JSON
            $table->decimal('amount_received', 10, 2);
            $table->decimal('change', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_histories');
    }
};

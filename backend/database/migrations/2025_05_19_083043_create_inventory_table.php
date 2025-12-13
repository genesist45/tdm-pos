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
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->string('category');
            $table->integer('quantity');
            $table->decimal('price', 10, 2);
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->string('stock_status');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->timestamps();
        }); 
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};

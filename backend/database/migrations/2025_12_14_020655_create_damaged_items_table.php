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
        Schema::create('damaged_items', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->comment('Original Sales Invoice / Receipt No.');
            $table->unsignedBigInteger('item_id')->nullable()->comment('Reference to inventory item');
            $table->string('item_name')->comment('Item Code / Name');
            $table->integer('quantity_returned')->comment('Quantity Returned');
            $table->decimal('item_price', 10, 2)->nullable()->comment('Price per item');
            $table->decimal('refund_amount', 10, 2)->nullable()->comment('Total refund amount');
            $table->enum('return_type', ['damaged_item', 'good_item'])->default('damaged_item')->comment('Type of return');
            $table->string('return_reason')->comment('Reason for Return');
            $table->string('other_reason')->nullable()->comment('Other reason description');
            $table->date('return_date')->comment('Date of Return');
            $table->string('processed_by')->comment('Staff Who Processed It');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('damaged_items');
    }
};

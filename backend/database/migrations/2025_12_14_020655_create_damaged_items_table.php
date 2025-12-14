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
            $table->string('item_name')->comment('Item Code / Name');
            $table->integer('quantity_returned')->comment('Quantity Returned');
            $table->enum('return_reason', ['Damaged', 'Expired', 'Wrong Item', 'Defective', 'Other'])->comment('Reason for Return');
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

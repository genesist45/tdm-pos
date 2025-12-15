<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PurchaseHistoryController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DamagedItemController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Inventory Routes
Route::apiResource('inventory', InventoryController::class);
Route::get('/inventory-active', [InventoryController::class, 'getActiveItems']);
Route::patch('/inventory/{id}/toggle-active', [InventoryController::class, 'toggleActive']);

// Category Routes
Route::apiResource('categories', CategoryController::class);

// Purchase History Routes
Route::get('/purchase-history', [PurchaseHistoryController::class, 'index']);
Route::post('/purchase-history', [PurchaseHistoryController::class, 'store']);
Route::get('/purchase-history/{id}', [PurchaseHistoryController::class, 'show']);
Route::get('/purchase-history/receipt/{receiptNo}', [PurchaseHistoryController::class, 'getByReceiptNo']);
Route::delete('/purchase-history/{id}', [PurchaseHistoryController::class, 'destroy']);

// Damaged Items Routes
Route::apiResource('damaged-items', DamagedItemController::class);
Route::get('/damaged-items-refunds', [DamagedItemController::class, 'getTotalRefunds']);
Route::post('/damaged-items-max-quantity', [DamagedItemController::class, 'getMaxQuantity']);

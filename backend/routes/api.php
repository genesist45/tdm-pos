<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PurchaseHistoryController;
use App\Http\Controllers\CategoryController;

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

// Supplier Routes
Route::apiResource('suppliers', SupplierController::class);

// Inventory Routes
Route::apiResource('inventory', InventoryController::class);

// Category Routes
Route::apiResource('categories', CategoryController::class);

// Purchase History Routes
Route::get('/purchase-history', [PurchaseHistoryController::class, 'index']);
Route::post('/purchase-history', [PurchaseHistoryController::class, 'store']);
Route::get('/purchase-history/{id}', [PurchaseHistoryController::class, 'show']);
Route::delete('/purchase-history/{id}', [PurchaseHistoryController::class, 'destroy']);

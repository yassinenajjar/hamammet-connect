<?php

use App\Http\Controllers\Api\MunicipalServiceController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/reports', [ReportController::class, 'index']);
Route::get('/reports/{report}', [ReportController::class, 'show']);
Route::patch('/reports/{report}', [ReportController::class, 'update']);
Route::get('/services', [MunicipalServiceController::class, 'index']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

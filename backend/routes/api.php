<?php

use App\Http\Controllers\Api\MunicipalServiceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReportAssistantController;
use App\Models\Report;
use App\Models\User;
use App\Models\Category;
use Illuminate\Support\Facades\Route;

Route::get('/services', [MunicipalServiceController::class, 'index']);
Route::get('/public/statistics', function () {
    return response()->json([
        'citizens' => User::query()->where('role', 'citizen')->distinct('id')->count('id'),
        'reports' => Report::query()->count(),
        'resolved' => Report::query()->where('status', 'resolved')->count(),
    ]);
});
Route::get('/categories', function () {
    return response()->json(Category::query()->where('active', true)->orderBy('name')->get(['id', 'name', 'key', 'municipal_service_id']));
});
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/reports', [ReportController::class, 'create'])->middleware('throttle:8,1');
Route::post('/report-assistant/messages', [ReportAssistantController::class, 'respond'])->middleware('throttle:10,1');
Route::post('/anonymous/reports/{report}/access', [ReportController::class, 'track'])->middleware('throttle:10,1');
Route::get('/reports/{report}/evidence/{evidence}', [ReportController::class, 'evidence'])->middleware('signed')->name('reports.evidence');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/my/reports', [ReportController::class, 'mine']);
    Route::get('/my/reports/{report}', [ReportController::class, 'mineShow']);
});

Route::prefix('staff')->middleware(['auth:sanctum', 'can:staff-access'])->group(function (): void {
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/{report}', [ReportController::class, 'show']);
    Route::patch('/reports/{report}/status', [ReportController::class, 'update']);
    Route::patch('/reports/{report}/urgency', [ReportController::class, 'setUrgency']);
    Route::post('/reports/{report}/assignments', [ReportController::class, 'assign']);
    Route::post('/reports/{report}/notes', [ReportController::class, 'addNote']);
    Route::get('/dashboard/statistics', function () {
        return response()->json([
            'total' => Report::query()->count(),
            'new' => Report::query()->where('status', 'new')->count(),
            'critical' => Report::query()->where('urgency', 'critical')->whereNotIn('status', ['resolved', 'rejected'])->count(),
            'resolved' => Report::query()->where('status', 'resolved')->count(),
        ]);
    });
});

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MunicipalServiceResource;
use App\Models\MunicipalService;
use Illuminate\Http\JsonResponse;

class MunicipalServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = MunicipalService::query()->orderBy('name')->get();

        return response()->json(MunicipalServiceResource::collection($services)->resolve());
    }
}

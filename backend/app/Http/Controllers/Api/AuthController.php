<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => mb_strtolower($validated['email']),
            'password' => $validated['password'],
            'role' => 'citizen',
        ]);

        return response()->json($this->tokenResponse($user), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => mb_strtolower($validated['email']), 'password' => $validated['password']])) {
            throw ValidationException::withMessages(['email' => ['Les identifiants sont incorrects.']]);
        }

        $user = User::query()->where('email', mb_strtolower($validated['email']))->firstOrFail();

        return response()->json($this->tokenResponse($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnexion effectuée.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->userData($request->user())]);
    }

    private function tokenResponse(User $user): array
    {
        return [
            'data' => $this->userData($user),
            'token' => $user->createToken('hammamet-connect', ['*'], now()->addDays(30))->plainTextToken,
        ];
    }

    private function userData(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role];
    }
}

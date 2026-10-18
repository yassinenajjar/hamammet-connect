<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', 'string', 'max:100', Rule::exists('categories', 'name')->where('active', true)],
            'location' => ['nullable', 'string', 'max:200', 'required_without:latitude'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'tracking_secret' => ['nullable', 'prohibited'],
            'urgency' => ['prohibited'],
            'status' => ['prohibited'],
            'reporter_id' => ['prohibited'],
            'importance' => ['prohibited'],
            'website' => ['prohibited'],
            'evidence' => ['sometimes', 'array', 'max:5'],
            'evidence.*' => ['array:ticket'],
            'evidence.*.ticket' => ['required', 'string', 'max:4096'],
        ];
    }
}

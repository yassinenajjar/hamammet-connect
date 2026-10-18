<?php

namespace App\Http\Requests;

use App\Models\Report;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(Report::STATUSES)],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
            'staff_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}

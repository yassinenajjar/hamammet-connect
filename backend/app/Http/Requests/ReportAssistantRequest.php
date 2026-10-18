<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReportAssistantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'messages' => ['required', 'array', 'min:1', 'max:30'],
            'messages.*' => ['required', 'array:role,content'],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'min:1', 'max:1500'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $messages = $this->input('messages', []);

            if (! is_array($messages) || $messages === []) {
                return;
            }

            foreach ($messages as $index => $message) {
                $expectedRole = $index % 2 === 0 ? 'user' : 'assistant';

                if (! is_array($message) || ($message['role'] ?? null) !== $expectedRole) {
                    $validator->errors()->add('messages', 'La conversation doit alterner entre citoyen et assistant.');

                    return;
                }
            }

            if (end($messages)['role'] !== 'user') {
                $validator->errors()->add('messages', 'Le dernier message doit provenir du citoyen.');
            }
        }];
    }
}

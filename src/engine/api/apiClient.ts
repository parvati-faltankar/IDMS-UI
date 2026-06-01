// Base HTTP client for all engine API calls
// All service API files import from here

import type { ServiceResponse } from '../types/services';

const getBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
};

const getAuthHeader = (): Record<string, string> => {
  // Placeholder: replace with actual auth token retrieval once auth is implemented
  const token = (typeof window !== 'undefined' && window.localStorage.getItem('auth-token')) ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function engineRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<ServiceResponse<T>> {
  const url = `${getBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-Id': crypto.randomUUID(),
    ...getAuthHeader(),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    return {
      success: false,
      status: 'Failed',
      errors: [
        {
          code: 'NETWORK_ERROR',
          message:
            networkError instanceof Error
              ? networkError.message
              : 'Engine backend is not reachable. Please check the API connection.',
        },
      ],
      warnings: [],
      data: {} as T,
      nextAction: 'Stop',
      requiresUserIntervention: false,
      retryable: true,
    };
  }

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = (await response.json()) as Record<string, unknown>;
    } catch {
      // response body may not be JSON
    }
    return {
      success: false,
      status: 'Failed',
      errors: [
        {
          code: `HTTP_${response.status}`,
          message:
            typeof errorBody['message'] === 'string'
              ? errorBody['message']
              : `Request failed with status ${response.status}`,
        },
      ],
      warnings: [],
      data: {} as T,
      nextAction: response.status >= 500 ? 'Retry' : 'Stop',
      requiresUserIntervention: response.status === 422 || response.status === 400,
      retryable: response.status >= 500,
    };
  }

  const data = (await response.json()) as ServiceResponse<T>;
  return data;
}

export async function engineGet<T>(path: string): Promise<ServiceResponse<T>> {
  return engineRequest<T>('GET', path);
}

export async function enginePost<T>(path: string, body: unknown): Promise<ServiceResponse<T>> {
  return engineRequest<T>('POST', path, body);
}

export async function enginePut<T>(path: string, body: unknown): Promise<ServiceResponse<T>> {
  return engineRequest<T>('PUT', path, body);
}

export async function engineDelete<T>(path: string): Promise<ServiceResponse<T>> {
  return engineRequest<T>('DELETE', path);
}

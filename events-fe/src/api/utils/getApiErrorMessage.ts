type ApiErrorMessageOverrides = Record<string, string>;

type ApiErrorResponse = {
  status?: number;
  data?: {
    message?: unknown;
  };
};

function getApiErrorResponse(error: unknown): ApiErrorResponse | null {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('response' in error) ||
    typeof (error as { response?: unknown }).response !== 'object'
  ) {
    return null;
  }

  return (error as { response?: ApiErrorResponse }).response ?? null;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
  overrides: ApiErrorMessageOverrides = {}
) {
  const response = getApiErrorResponse(error);
  const apiMessage =
    response?.data && typeof response.data.message === 'string' ? response.data.message : null;

  if (apiMessage && overrides[apiMessage]) {
    return overrides[apiMessage];
  }

  if (response?.status === 401) {
    return 'Sesija nije validna ili browser blokira prijavu. Prijavite se ponovo.';
  }

  if (response?.status === 403) {
    return 'Nemate dozvolu za ovu akciju.';
  }

  if (apiMessage) {
    return apiMessage;
  }

  return fallbackMessage;
}

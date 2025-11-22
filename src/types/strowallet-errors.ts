export enum StrowalletErrorCode {
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_CUSTOMER = 'DUPLICATE_CUSTOMER',
  INVALID_KYC = 'INVALID_KYC',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CARD_BLOCKED = 'CARD_BLOCKED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface StrowalletError {
  code: StrowalletErrorCode;
  message: string;
  originalError?: any;
  retryable: boolean;
}

export const parseStrowalletError = (error: any): StrowalletError => {
  const errorMessage = error?.message || '';
  
  // Parse error codes from API responses
  if (errorMessage.includes('email') && errorMessage.includes('exists')) {
    return {
      code: StrowalletErrorCode.DUPLICATE_EMAIL,
      message: 'Un compte avec cet email existe déjà',
      originalError: error,
      retryable: false,
    };
  }
  
  if (errorMessage.includes('customer') && errorMessage.includes('exists')) {
    return {
      code: StrowalletErrorCode.DUPLICATE_CUSTOMER,
      message: 'Un profil client existe déjà pour cet utilisateur',
      originalError: error,
      retryable: false,
    };
  }
  
  if (errorMessage.includes('KYC') || errorMessage.includes('document') || errorMessage.includes('verification')) {
    return {
      code: StrowalletErrorCode.INVALID_KYC,
      message: 'Documents KYC invalides ou incomplets',
      originalError: error,
      retryable: false,
    };
  }
  
  if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
    return {
      code: StrowalletErrorCode.INSUFFICIENT_FUNDS,
      message: 'Fonds insuffisants dans votre wallet',
      originalError: error,
      retryable: false,
    };
  }
  
  if (errorMessage.includes('blocked') || errorMessage.includes('suspended')) {
    return {
      code: StrowalletErrorCode.CARD_BLOCKED,
      message: 'Cette carte est bloquée ou suspendue',
      originalError: error,
      retryable: false,
    };
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
    return {
      code: StrowalletErrorCode.NETWORK_ERROR,
      message: 'Erreur réseau. Vérifiez votre connexion',
      originalError: error,
      retryable: true,
    };
  }
  
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      code: StrowalletErrorCode.VALIDATION_ERROR,
      message: 'Données invalides. Vérifiez vos informations',
      originalError: error,
      retryable: false,
    };
  }
  
  return {
    code: StrowalletErrorCode.UNKNOWN_ERROR,
    message: errorMessage || 'Une erreur inattendue est survenue',
    originalError: error,
    retryable: true,
  };
};

export const getErrorMessage = (error: StrowalletError): string => {
  return error.message;
};

export const shouldRetry = (error: StrowalletError): boolean => {
  return error.retryable;
};

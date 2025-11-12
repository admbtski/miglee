/**
 * Toast Manager - Centralized toast notifications with auto-logging
 * Integrates with sonner for UI and devLogger for debugging
 */

import { toast as sonnerToast } from 'sonner';
import { devLogger } from './dev-logger';

type ToastType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'loading'
  | 'promise';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
  // Developer options
  logData?: any;
  logCategory?:
    | 'query'
    | 'mutation'
    | 'subscription'
    | 'auth'
    | 'api'
    | 'general';
  silent?: boolean; // Don't show toast, only log
}

interface PromiseToastOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: any) => string);
  description?: string;
  duration?: number;
  logData?: any;
  logCategory?: ToastOptions['logCategory'];
}

class ToastManager {
  // Basic toast methods
  success(message: string, options: ToastOptions = {}) {
    const {
      silent = false,
      logData,
      logCategory = 'general',
      ...toastOptions
    } = options;

    // Log to console
    devLogger.success(message, {
      category: logCategory,
      data: logData,
    });

    // Show toast
    if (!silent) {
      return sonnerToast.success(message, toastOptions);
    }
  }

  error(message: string, options: ToastOptions = {}) {
    const {
      silent = false,
      logData,
      logCategory = 'general',
      ...toastOptions
    } = options;

    // Log to console
    devLogger.error(message, {
      category: logCategory,
      data: logData,
      error: logData instanceof Error ? logData : undefined,
    });

    // Show toast
    if (!silent) {
      return sonnerToast.error(message, toastOptions);
    }
  }

  info(message: string, options: ToastOptions = {}) {
    const {
      silent = false,
      logData,
      logCategory = 'general',
      ...toastOptions
    } = options;

    // Log to console
    devLogger.info(message, {
      category: logCategory,
      data: logData,
    });

    // Show toast
    if (!silent) {
      return sonnerToast.info(message, toastOptions);
    }
  }

  warning(message: string, options: ToastOptions = {}) {
    const {
      silent = false,
      logData,
      logCategory = 'general',
      ...toastOptions
    } = options;

    // Log to console
    devLogger.warning(message, {
      category: logCategory,
      data: logData,
    });

    // Show toast
    if (!silent) {
      return sonnerToast.warning(message, toastOptions);
    }
  }

  loading(message: string, options: Omit<ToastOptions, 'silent'> = {}) {
    const { logData, logCategory = 'general', ...toastOptions } = options;

    // Log to console
    devLogger.info(message, {
      category: logCategory,
      data: logData,
    });

    // Show loading toast
    return sonnerToast.loading(message, toastOptions);
  }

  // Promise toast - automatically handles loading, success, and error states
  promise<T>(promise: Promise<T>, options: PromiseToastOptions<T>): Promise<T> {
    const { logData, logCategory = 'general', ...toastOptions } = options;
    const startTime = Date.now();

    // Log promise start
    devLogger.info(options.loading, {
      category: logCategory,
      data: logData,
    });

    // Show promise toast
    sonnerToast.promise(promise, toastOptions);

    // Handle promise resolution/rejection with logging
    return promise
      .then((data) => {
        const duration = Date.now() - startTime;
        const successMessage =
          typeof options.success === 'function'
            ? options.success(data)
            : options.success;

        devLogger.success(successMessage, {
          category: logCategory,
          data: data,
          duration,
        });

        return data;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        const errorMessage =
          typeof options.error === 'function'
            ? options.error(error)
            : options.error;

        devLogger.error(errorMessage, {
          category: logCategory,
          error,
          duration,
        });

        throw error;
      });
  }

  // Dismiss toast
  dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId);
  }

  // Specialized methods for common operations

  // Query operations
  querySuccess(
    queryName: string,
    options: Omit<ToastOptions, 'logCategory'> = {}
  ) {
    this.success(`${queryName} loaded successfully`, {
      ...options,
      logCategory: 'query',
      duration: options.duration ?? 2000,
    });
  }

  queryError(
    queryName: string,
    error: unknown,
    options: Omit<ToastOptions, 'logCategory'> = {}
  ) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.error(`Failed to load ${queryName}`, {
      ...options,
      description: errorMessage,
      logCategory: 'query',
      logData: error,
      duration: options.duration ?? 5000,
    });
  }

  // Mutation operations
  mutationSuccess(
    action: string,
    options: Omit<ToastOptions, 'logCategory'> = {}
  ) {
    this.success(action, {
      ...options,
      logCategory: 'mutation',
      duration: options.duration ?? 3000,
    });
  }

  mutationError(
    action: string,
    error: unknown,
    options: Omit<ToastOptions, 'logCategory'> = {}
  ) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.error(`Failed: ${action}`, {
      ...options,
      description: errorMessage,
      logCategory: 'mutation',
      logData: error,
      duration: options.duration ?? 5000,
    });
  }

  // Auth operations
  authSuccess(
    message: string,
    options: Omit<ToastOptions, 'logCategory'> = {}
  ) {
    this.success(message, {
      ...options,
      logCategory: 'auth',
      duration: options.duration ?? 3000,
    });
  }

  authError(
    message: string,
    error: unknown,
    options: Omit<ToastOptions, 'logCategory'> = {}
  ) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.error(message, {
      ...options,
      description: errorMessage,
      logCategory: 'auth',
      logData: error,
      duration: options.duration ?? 5000,
    });
  }

  // Subscription operations
  subscriptionConnected(topic: string) {
    devLogger.subscriptionConnected(topic);
    // Silent by default - only log
  }

  subscriptionError(topic: string, error: unknown) {
    this.error(`Connection error: ${topic}`, {
      logCategory: 'subscription',
      logData: error,
      duration: 4000,
    });
  }

  subscriptionDisconnected(topic: string) {
    this.warning(`Disconnected: ${topic}`, {
      logCategory: 'subscription',
      duration: 3000,
    });
  }

  // Network operations
  networkError(message: string = 'Network error occurred') {
    this.error(message, {
      description: 'Please check your internet connection',
      logCategory: 'api',
      duration: 5000,
    });
  }

  // Permission operations
  permissionDenied(action: string) {
    this.error('Permission denied', {
      description: `You don't have permission to ${action}`,
      logCategory: 'auth',
      duration: 4000,
    });
  }

  // Validation errors
  validationError(message: string, fields?: string[]) {
    this.error(message, {
      description: fields ? `Invalid fields: ${fields.join(', ')}` : undefined,
      logCategory: 'general',
      duration: 4000,
    });
  }

  // Copy to clipboard
  copied(label: string = 'Copied to clipboard') {
    this.success(label, {
      duration: 2000,
    });
  }

  // File operations
  fileUploaded(filename: string) {
    this.success('File uploaded', {
      description: filename,
      duration: 3000,
    });
  }

  fileUploadError(filename: string, error: unknown) {
    this.error('Upload failed', {
      description: filename,
      logData: error,
      duration: 4000,
    });
  }
}

// Singleton instance
export const toastManager = new ToastManager();

// Shorter alias
export const toast = toastManager;

// Global window access for easy debugging
if (typeof window !== 'undefined') {
  (window as any).toast = toastManager;
}

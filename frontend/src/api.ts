import Swal from 'sweetalert2';
import { navigate } from 'svelte-routing';

interface RequestOptions extends RequestInit {
    hideErrorAlert?: boolean; // Set to true if a component wants to handle the error UI itself
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    // If body is FormData, we shouldn't set Content-Type manually so the browser boundary works
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api${endpoint}`, {
            ...options,
            headers
        });

        // 401 Unauthorized handling (skip for login endpoints to allow normal error handling)
        if ((response.status === 401 || response.status === 403) && !endpoint.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            navigate('/login');
            return null;
        }

        const data = await response.json();

        // Handle logical backend errors (success: false) or HTTP status errors
        if (!response.ok || !data.success) {
            const errorMessage = data.error || data.message || 'An unexpected error occurred.';
            
            if (!options.hideErrorAlert) {
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Ok'
                });
            }
            throw new Error(errorMessage);
        }

        return data;
    } catch (error: any) {
        if (!options.hideErrorAlert) {
            // Only show generic network error if we didn't already throw a specific message above
            if (error.message === 'Failed to fetch') {
                Swal.fire({
                    title: 'Network Error',
                    text: 'Unable to connect to the server. Please check your connection.',
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Ok'
                });
            }
        }
        throw error;
    }
}

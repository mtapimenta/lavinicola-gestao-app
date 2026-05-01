import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';

// API base URL - adjust if needed
const API_BASE_URL = '/gestao/api.php';

interface UseAPIOptions {
  action: string;
  method?: 'GET' | 'POST';
  data?: Record<string, any>;
  params?: Record<string, string | number | undefined | null>;
  skip?: boolean;
}

interface UseAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para fazer chamadas autenticadas à API PHP
 * Gerencia token JWT automaticamente
 */
export function useAPI<T = any>({
  action,
  method = 'GET',
  data,
  params,
  skip = false,
}: UseAPIOptions): UseAPIResult<T> {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      let url = `${API_BASE_URL}?action=${action}`;
      if (params) {
        const extra = Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
        if (extra) url += `&${extra}`;
      }
      let response;

      if (method === 'POST') {
        response = await axios.post(url, data, config);
      } else {
        response = await axios.get(url, config);
      }

      setResult(response.data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage = 
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Erro ao carregar dados';
      setError(errorMessage as string);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, skip, JSON.stringify(params)]);

  return {
    data: result,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Função auxiliar para fazer login e armazenar token
 */
export async function loginAPI(email: string, password: string): Promise<{ token: string; user: any } | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}?action=login`, {
      email,
      password,
    });

    if (response.data.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      return {
        token: response.data.token,
        user: response.data.user,
      };
    }

    return null;
  } catch (err) {
    const axiosError = err as AxiosError;
    console.error('Login error:', axiosError.response?.data || axiosError.message);
    return null;
  }
}

/**
 * Função auxiliar para fazer logout
 */
export function logoutAPI(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Função auxiliar para obter token armazenado
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

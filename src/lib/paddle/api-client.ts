import { createHmac } from 'crypto';

export type PaddleEnvironment = 'sandbox' | 'production';

export interface PaddleApiConfig {
  apiKey: string;
  environment: PaddleEnvironment;
}

export class PaddleApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: PaddleApiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Paddle API error: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Paddle API request failed:', error);
      throw error;
    }
  }

  async getCustomerByEmail(email: string) {
    return this.request(`/customers?email=${encodeURIComponent(email)}`);
  }

  async getCustomerById(customerId: string) {
    return this.request(`/customers/${customerId}`);
  }

  async getTransaction(transactionId: string) {
    return this.request(`/transactions/${transactionId}`);
  }

  async verifyWebhookSignature(signature: string, body: string, webhookSecret: string): Promise<boolean> {
    try {
      const [timestamp, receivedHmac] = signature.split(';').map(part => part.split('=')[1]);
      const payload = `${timestamp}:${body}`;
      const computedHmac = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
      
      return computedHmac === receivedHmac;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

// Create singleton instances for both environments
const getPaddleApiClient = (environment: PaddleEnvironment = 'sandbox'): PaddleApiClient => {
  const apiKey = environment === 'sandbox' 
    ? process.env.PADDLE_SANDBOX_API_KEY 
    : process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error(`Missing Paddle API key for ${environment} environment`);
  }

  return new PaddleApiClient({
    apiKey,
    environment,
  });
};

export const paddleSandboxClient = getPaddleApiClient('sandbox');
export const paddleProductionClient = getPaddleApiClient('production');

// Helper function to get the appropriate client based on environment
export const getPaddleClient = (): PaddleApiClient => {
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as PaddleEnvironment || 'sandbox';
  return environment === 'sandbox' ? paddleSandboxClient : paddleProductionClient;
}; 
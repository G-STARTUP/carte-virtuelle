import { apiGet, apiPost, apiPut } from "@/lib/api";

export interface CreateCustomerData {
  first_name: string;
  last_name: string;
  customer_email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  id_type?: string;
  id_number?: string;
  id_image?: string;
  user_photo?: string;
  house_number?: string;
}

export interface CreateCardData {
  amount: number;
  customer_email: string;
  name_on_card: string;
  currency?: string;
  card_type?: string;
}

export interface UpdateCustomerData {
  customer_id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  id_image?: string;
  user_photo?: string;
}

export class StrowalletClient {
  async createCustomer(data: CreateCustomerData) {
    const result = await apiPost('/customer?action=create', data);
    
    if (!result.success) {
      throw new Error(result.error || 'Operation failed');
    }

    return result;
  }

  async createCard(data: CreateCardData) {
    const result = await apiPost('/cards?action=create', data);
    
    if (!result.success) {
      throw new Error(result.error || 'Operation failed');
    }

    return result;
  }

  async getCardDetails(cardId: string) {
    const result = await apiGet(`/cards?action=details&card_id=${cardId}`);

    if (!result.success) {
      throw new Error(result.error || 'Failed to get card details');
    }

    return result;
  }

  async getUserCards() {
    const result = await apiGet('/cards?action=list');
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get cards');
    }

    return result.cards || [];
  }

  async getUserCustomer() {
    const result = await apiGet('/customer?action=get');
    
    // Return null if customer not found (not an error)
    if (!result.success && result.error?.includes('not found')) {
      return null;
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get customer');
    }

    return result.customer;
  }

  async getCardTransactions(cardId: string) {
    const result = await apiGet(`/cards?action=transactions&card_id=${cardId}`);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get transactions');
    }

    return result.transactions || [];
  }

  async fundCard(cardId: string, amount: number) {
    const result = await apiPost('/fund?action=fund_card', {
      card_id: cardId,
      amount
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fund card');
    }

    return result;
  }

  async updateCustomer(data: UpdateCustomerData) {
    const result = await apiPut('/customer?action=update', data);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update customer');
    }

    return result;
  }
}

export const strowalletClient = new StrowalletClient();

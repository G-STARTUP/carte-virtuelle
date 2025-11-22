import { supabase } from "@/integrations/supabase/client";

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
  private async callFunction(functionName: string, data: any) {
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: data,
    });

    if (error) {
      throw new Error(error.message || `Failed to call ${functionName}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Operation failed');
    }

    return result;
  }

  async createCustomer(data: CreateCustomerData) {
    return this.callFunction('create-strowallet-customer', data);
  }

  async createCard(data: CreateCardData) {
    return this.callFunction('create-strowallet-card', data);
  }

  async getCardDetails(cardId: string) {
    const { data: result, error } = await supabase.functions.invoke('get-card-details', {
      body: { card_id: cardId },
    });

    if (error) {
      throw new Error(error.message || 'Failed to get card details');
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to get card details');
    }

    return result;
  }

  async getUserCards() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('strowallet_cards')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUserCustomer() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('strowallet_customers')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getCardTransactions(cardId: string) {
    const { data, error } = await supabase
      .from('card_transactions')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async fundCard(cardId: string, amount: number) {
    const { data: result, error } = await supabase.functions.invoke('fund-strowallet-card', {
      body: { card_id: cardId, amount },
    });

    if (error) {
      throw new Error(error.message || 'Failed to fund card');
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to fund card');
    }

    return result;
  }

  async updateCustomer(data: UpdateCustomerData) {
    // Update local database with new URLs
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.first_name) updateData.first_name = data.first_name;
    if (data.last_name) updateData.last_name = data.last_name;
    if (data.phone_number) updateData.phone_number = data.phone_number;
    if (data.id_image) updateData.id_image_url = data.id_image;
    if (data.user_photo) updateData.user_photo_url = data.user_photo;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error: dbError } = await supabase
      .from('strowallet_customers')
      .update(updateData)
      .eq('customer_id', data.customer_id)
      .eq('user_id', user.user.id);

    if (dbError) throw dbError;

    // Update Strowallet API if basic info changed
    if (data.first_name || data.last_name || data.phone_number) {
      const { data: result, error } = await supabase.functions.invoke('update-strowallet-customer', {
        body: {
          customer_id: data.customer_id,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to update customer');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to update customer');
      }

      return result;
    }

    return { success: true };
  }
}

export const strowalletClient = new StrowalletClient();

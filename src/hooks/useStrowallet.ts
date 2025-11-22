import { useState, useCallback } from "react";
import { strowalletClient, CreateCustomerData, CreateCardData, UpdateCustomerData } from "@/lib/strowallet";
import { toast } from "sonner";
import { parseStrowalletError, shouldRetry, getErrorMessage } from "@/types/strowallet-errors";

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500; // 1.5 seconds

export const useStrowallet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withRetry = async <T,>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> => {
    try {
      return await operation();
    } catch (err: any) {
      const parsedError = parseStrowalletError(err);
      
      if (shouldRetry(parsedError) && retryCount < MAX_RETRIES) {
        toast.info(`Tentative ${retryCount + 1}/${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return withRetry(operation, retryCount + 1);
      }
      
      throw parsedError;
    }
  };

  const createCustomer = useCallback(async (data: CreateCustomerData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await withRetry(() => strowalletClient.createCustomer(data));
      toast.success("Client Strowallet créé avec succès!");
      return result;
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCard = useCallback(async (data: CreateCardData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await withRetry(() => strowalletClient.createCard(data));
      toast.success("Carte virtuelle créée avec succès!");
      return result;
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCardDetails = useCallback(async (cardId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await withRetry(() => strowalletClient.getCardDetails(cardId));
      return result;
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await withRetry(() => strowalletClient.getUserCards());
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await withRetry(() => strowalletClient.getUserCustomer());
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCardTransactions = useCallback(async (cardId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await withRetry(() => strowalletClient.getCardTransactions(cardId));
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fundCard = useCallback(async (cardId: string, amount: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await withRetry(() => strowalletClient.fundCard(cardId, amount));
      toast.success("Carte rechargée avec succès!");
      return result;
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(async (data: UpdateCustomerData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await withRetry(() => strowalletClient.updateCustomer(data));
      toast.success("Profil KYC mis à jour avec succès!");
      return result;
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCustomer,
    createCard,
    getCardDetails,
    getUserCards,
    getUserCustomer,
    getCardTransactions,
    fundCard,
    updateCustomer,
  };
};

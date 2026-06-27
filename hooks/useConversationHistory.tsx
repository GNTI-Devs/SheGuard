import { useState, useEffect } from 'react';
import { useStorage, ConversationRecord } from '@/services/storage';

export function useConversationHistory() {
  const storage = useStorage();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await storage.getConversations();
      // Sort by start date descending (most recent first)
      data.sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [storage]);

  const addConversation = async (record: ConversationRecord) => {
    try {
      await storage.saveConversation(record);
      // Refresh local list
      await loadConversations();
    } catch (e) {
      console.error('Failed to add conversation record:', e);
      throw e;
    }
  };

  return {
    conversations,
    loading,
    addConversation,
    refreshConversations: loadConversations,
  };
}

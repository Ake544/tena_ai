import api from './api';

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export const chatService = {
  async sendMessage(message: string): Promise<string> {
    const res = await api.post('/chat/message', { message });
    return res.data.response;
  },

  async getHistory(): Promise<ChatMessage[]> {
    const res = await api.get('/chat/history');
    return res.data.messages;
  },
};

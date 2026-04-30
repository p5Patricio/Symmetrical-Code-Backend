export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  error?: string;
}

export interface WebhookRequest {
  channel: 'web' | 'whatsapp';
  userId: string;
  message: string;
  timestamp: string;
}

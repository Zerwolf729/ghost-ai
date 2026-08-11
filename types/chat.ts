import { ChatMessage } from "@/types/tasks";

export interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isWorking: boolean;
}

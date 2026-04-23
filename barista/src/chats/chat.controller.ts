import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Get,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import sendChatDto from './dtos/chat.dtos';
 const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL;
 
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatService: ChatService) {}
  @Post('message/:thread')
  async chatWithAgent(
    @Param('thread') threadId: string,
    @Body() { query }: sendChatDto,
  ) {
    if (!threadId) throw new BadRequestException();
    if (!query) throw new BadRequestException('Query is required');
    // return this.chatService.chatWithAgent({ query, thread_id: threadId });
    try {
      const result = await this.chatService.chatWithAgent({ 
        query, 
        thread_id: threadId 
      });
      
      console.log('Sending response:', result);
      return result;
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }
 @Get('test')
  async test() {
    const result = await this.chatService.chatWithAgent({
      query: "Say 'Ollama is working'",
      thread_id: 'test'
    });
    return result;
  }

  @Get('test-ollama')
  async testOllama() {
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    const data = await response.json();
    return {
      success: true,
      ollama_url: OLLAMA_BASE_URL,
      models: data.models,
      message: 'Connected to Ollama successfully!'
    };
  } catch (error) {
    return {
      success: false,
      ollama_url: OLLAMA_BASE_URL,
      error: error.message,
      message: 'Failed to connect to Ollama'
    };
  }
}

@Get('performance')
async getPerformance() {
  const start = Date.now();
  
  // Test Ollama speed
  const testPrompt = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: 'Say "OK"',
      stream: false,
      options: { num_predict: 5 }
    })
  });
  
  const end = Date.now();
  
  return {
    response: testPrompt.json(),
    ollama_latency_ms: end - start,
    model: OLLAMA_MODEL,
    timestamp: new Date().toISOString()
  };
}
}
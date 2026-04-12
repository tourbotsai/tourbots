import OpenAI, { NotFoundError } from 'openai';
import { ResponseStreamParams } from 'openai/lib/responses/ResponseStream';
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';

// Tour navigation functions for virtual tours
export const TOUR_NAVIGATION_FUNCTIONS = [
  {
    type: 'function',
    function: {
      name: 'navigate_to_area',
      description: 'Navigate the virtual tour to a specific area when user asks to see something',
      parameters: {
        type: 'object',
        properties: {
          area_name: {
            type: 'string',
            description: 'Name of the area to navigate to (e.g., "leg area", "cardio", "weights")'
          },
          sweep_id: {
            type: 'string',
            description: 'Matterport sweep ID for this area'
          },
          position: {
            type: 'object',
            description: 'Exact position coordinates if available',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' }
            }
          },
          rotation: {
            type: 'object',
            description: 'Camera rotation for optimal viewing',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          },
          reason: {
            type: 'string',
            description: 'Why navigating here (for user feedback)'
          }
        },
        required: ['area_name', 'sweep_id', 'reason']
      }
    }
  }
];

export class OpenAIService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      project: process.env.OPENAI_PROJECT,
    });
  }

  async createResponse(args: ResponseCreateParamsNonStreaming) {
    return await this.openai.responses.create(args);
  }

  async createResponseAndPoll(args: ResponseCreateParamsNonStreaming) {
    let response = await this.openai.responses.create(args);
    let tries = 0;
    
    while (tries < 120) {
      if (response.status === 'completed' || response.status === 'failed' || response.status === 'incomplete') {
        return response;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await this.getResponse(response.id);
      tries++;
    }
    
    throw new Error('Response not completed');
  }


  async getResponse(id: string) {
    return await this.openai.responses.retrieve(id, {
      include: ['file_search_call.results', 'message.input_image.image_url']
    });
  }

  async deleteResponse(id: string) {
    try {
      return await this.openai.responses.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) return;
      throw error;
    }
  }

  async streamResponse(args: ResponseStreamParams) {
    try {
      const stream = await this.openai.responses.stream(args);
      
      // Add error handling
      const enhancedStream = stream.on('error', (error) => {
        console.error('OpenAI stream error:', error);
      });
      
      return enhancedStream;
    } catch (error) {
      console.error('Error creating OpenAI stream:', error);
      throw error;
    }
  }

  // Extract function calls from response
  extractFunctionCalls(response: any): Array<{ name: string; arguments: string }> {
    const functionCalls: Array<{ name: string; arguments: string }> = [];

    if (response.output && Array.isArray(response.output)) {
      response.output.forEach((item: any) => {
        // Check for function_call type with name and arguments directly on the item
        if (item.type === 'function_call' && item.name && item.arguments) {
          functionCalls.push({
            name: item.name,
            arguments: item.arguments
          });
        }
        // Legacy check for nested function_call structure
        else if (item.type === 'function_call' && item.function_call && item.function_call.name && item.function_call.arguments) {
          functionCalls.push({
            name: item.function_call.name,
            arguments: item.function_call.arguments
          });
        }
        // Alternative structure check
        else if (item.type === 'function' && item.name && item.arguments) {
          functionCalls.push({
            name: item.name,
            arguments: item.arguments
          });
        }
        // Log when function call structure is unexpected
        else if (item.type === 'function_call') {
          console.warn('Function call missing name or arguments:', item);
        }
      });
    }

    return functionCalls;
  }

  async createFile(file: File, purpose: 'assistants' | 'user_data' = 'assistants') {
    return await this.openai.files.create({
      file,
      purpose,
    });
  }

  async deleteFile(id: string) {
    return await this.openai.files.delete(id);
  }

  async createChatCompletion(params: any) {
    return await this.openai.chat.completions.create(params);
  }

  async getThreadMessagesFromResponses(id: string) {
    return await this.openai.responses.inputItems.list(id, {
      include: ['file_search_call.results', 'message.input_image.image_url']
    });
  }

  // Vector Store Methods
  async createVectorStore(name: string) {
    return await this.openai.vectorStores.create({
      name: name,
    });
  }

  async getVectorStore(vectorStoreId: string) {
    return await this.openai.vectorStores.retrieve(vectorStoreId);
  }

  async deleteVectorStore(vectorStoreId: string) {
    return await this.openai.vectorStores.delete(vectorStoreId);
  }

  async createVectorStoreFile(vectorStoreId: string, fileId: string) {
    return await this.openai.vectorStores.files.createAndPoll(
      vectorStoreId,
      { file_id: fileId },
    );
  }

  async uploadVectorStoreFile(vectorStoreId: string, file: File) {
    const { id: fileId } = await this.createFile(file);
    return await this.createVectorStoreFile(vectorStoreId, fileId);
  }

  async deleteVectorStoreFile(vectorStoreId: string, fileId: string, deleteFileCompletely: boolean = false) {
    try {
      // First, try to remove the file from the vector store
      // Based on research, the method should be 'delete', not 'del'
      const vectorStoreResult = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!vectorStoreResult.ok) {
        throw new Error(`Failed to delete from vector store: ${vectorStoreResult.statusText}`);
      }

      const vectorStoreDeletionResult = await vectorStoreResult.json();

      // If requested, also delete the file completely from OpenAI storage
      // This helps with the known bug where files remain in vector store until file is deleted
      if (deleteFileCompletely) {
        try {
          await this.deleteFile(fileId);
        } catch (fileDeleteError) {
          console.warn('Failed to delete file from OpenAI storage:', fileDeleteError);
          // Continue anyway as vector store deletion might have worked
        }
      }

      return vectorStoreDeletionResult;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { deleted: true, id: fileId };
      }
      console.error('Error deleting vector store file:', error);
      throw error;
    }
  }

  async switchVectorStoreFile(
    fileId: string,
    oldVectorStoreId: string,
    newVectorStoreId: string,
  ) {
    await this.deleteVectorStoreFile(oldVectorStoreId, fileId);
    return await this.createVectorStoreFile(newVectorStoreId, fileId);
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService(); 
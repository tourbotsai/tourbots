/**
 * Stream helper utilities for Server-Sent Events (SSE)
 * Used across all chatbot implementations for consistent streaming
 */

/**
 * Convert ReadableStream to async iterable
 * Allows for-await-of loops over stream data
 */
export async function* readableStreamAsyncIterable<T>(
  stream: ReadableStream<T>
): AsyncIterableIterator<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Iterate over a response body reader with proper decoding
 * Handles partial UTF-8 characters correctly
 */
export async function* iterateReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncIterableIterator<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Flush any remaining buffer
        if (buffer.length > 0) {
          yield buffer;
        }
        break;
      }
      
      // Decode chunk (stream: true preserves incomplete sequences)
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          yield line;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse SSE data lines into structured events
 * Handles "data: " prefix and JSON parsing
 */
export function parseSSEEvent(line: string): any | null {
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  try {
    return JSON.parse(line.slice(6));
  } catch (error) {
    console.error('Failed to parse SSE event:', line, error);
    return null;
  }
}

/**
 * Create a ReadableStream that handles SSE formatting
 * Automatically adds "data: " prefix and "\n\n" suffix
 */
export function createSSEStream(
  source: AsyncIterableIterator<any>
): ReadableStream {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const data of source) {
          const formatted = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(formatted));
        }
        controller.close();
      } catch (error) {
        console.error('SSE stream error:', error);
        const errorEvent = `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    }
  });
}

/**
 * Frontend hook for consuming SSE streams
 * Manages connection lifecycle and error handling
 */
export function useSSEStream(
  url: string,
  body: any,
  onMessage: (data: any) => void,
  onError?: (error: Error) => void
) {
  return async () => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage(data);
            } catch (parseError) {
              console.error('Failed to parse SSE message:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE stream error:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      if (reader) {
        reader.releaseLock();
      }
    }
  };
}

/**
 * Retry logic for failed streams
 * Implements exponential backoff
 */
export class StreamRetryManager {
  private maxRetries: number;
  private baseDelay: number;
  private retryCount: number = 0;
  
  constructor(maxRetries: number = 3, baseDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }
  
  shouldRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }
  
  async getDelay(): Promise<number> {
    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    this.retryCount++;
    return delay;
  }
  
  reset() {
    this.retryCount = 0;
  }
  
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    while (true) {
      try {
        const result = await fn();
        this.reset();
        return result;
      } catch (error) {
        if (!this.shouldRetry()) {
          throw error;
        }
        
        const delay = await this.getDelay();
        if (onRetry && error instanceof Error) {
          onRetry(this.retryCount, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

import { openAIService } from './openai-service';

export const createStream = async (args: any) => {
  try {
    return await openAIService.streamResponse(args);
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
};

export const createResponse = async (args: any) => {
  try {
    return await openAIService.createResponse(args);
  } catch (error) {
    console.error('Error creating OpenAI response:', error);
    throw error;
  }
};

export const createResponseAndPoll = async (args: any) => {
  try {
    return await openAIService.createResponseAndPoll(args);
  } catch (error) {
    console.error('Error creating and polling OpenAI response:', error);
    throw error;
  }
};

export const getResponse = async (id: string) => {
  try {
    return await openAIService.getResponse(id);
  } catch (error) {
    console.error('Error getting OpenAI response:', error);
    throw error;
  }
};

export const deleteResponse = async (id: string) => {
  try {
    return await openAIService.deleteResponse(id);
  } catch (error) {
    console.error('Error deleting OpenAI response:', error);
    throw error;
  }
};

// Vector Store Wrappers
export const createVectorStore = async (name: string) => {
  try {
    return await openAIService.createVectorStore(name);
  } catch (error) {
    console.error('Error creating vector store:', error);
    throw error;
  }
};

export const getVectorStore = async (vectorStoreId: string) => {
  try {
    return await openAIService.getVectorStore(vectorStoreId);
  } catch (error) {
    console.error('Error getting vector store:', error);
    throw error;
  }
};

export const deleteVectorStore = async (vectorStoreId: string) => {
  try {
    return await openAIService.deleteVectorStore(vectorStoreId);
  } catch (error) {
    console.error('Error deleting vector store:', error);
    throw error;
  }
};

export const uploadVectorStoreFile = async (vectorStoreId: string, file: File) => {
  try {
    return await openAIService.uploadVectorStoreFile(vectorStoreId, file);
  } catch (error) {
    console.error('Error uploading file to vector store:', error);
    throw error;
  }
};

// Delete file from vector store
export const deleteVectorStoreFile = async (vectorStoreId: string, fileId: string, deleteFileCompletely: boolean = false) => {
  try {
    return await openAIService.deleteVectorStoreFile(vectorStoreId, fileId, deleteFileCompletely);
  } catch (error) {
    console.error('Error deleting file from vector store:', error);
    throw error;
  }
};

// export const switchVectorStoreFile = async (
//   fileId: string,
//   oldVectorStoreId: string,
//   newVectorStoreId: string,
// ) => {
//   try {
//     return await openAIService.switchVectorStoreFile(fileId, oldVectorStoreId, newVectorStoreId);
//   } catch (error) {
//     console.error('Error switching file between vector stores:', error);
//     throw error;
//   }
// }; 
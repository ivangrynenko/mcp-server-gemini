#!/usr/bin/env node
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as readline from 'readline';
import * as fs from 'fs/promises';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: any }>;
}

// MCP Server for Gemini with stdio transport
class GeminiMCPServer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private visionModel: any;
  private chatSessions: Map<string, any> = new Map();
  private rl: readline.Interface;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro-preview-05-06' });
    this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro-preview-05-06' });
    
    // Set up stdio communication
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    this.rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line) as MCPRequest;
        const response = await this.handleRequest(request);
        // Don't send a response for notifications
        if (response !== null) {
          console.log(JSON.stringify(response));
        }
      } catch (error) {
        const errorResponse: MCPResponse = {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        };
        console.log(JSON.stringify(errorResponse));
      }
    });
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    // Handle notifications (they don't require a response)
    if (request.method.startsWith('notifications/')) {
      // Notifications don't get responses in MCP
      return null as any; // We'll handle this in the line handler
    }
    
    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      
      case 'tools/list':
        return this.handleToolsList(request);
        
      case 'tools/call':
        return this.handleToolsCall(request);
      
      case 'resources/list':
      case 'prompts/list':
        // These methods are not implemented but should return empty lists
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
      
      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
    }
  }

  handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'gemini-2.5-pro-mcp-server',
          version: '2.5.0'
        },
        capabilities: {
          tools: {}
        }
      }
    };
  }

  handleToolsList(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: [
          // Text Generation
          {
            name: 'generate_text',
            description: 'Generate text using Google Gemini',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The prompt for text generation'
                },
                temperature: {
                  type: 'number',
                  description: 'Temperature for generation (0.0 to 1.0)',
                  minimum: 0,
                  maximum: 1,
                  default: 0.7
                },
                maxTokens: {
                  type: 'number',
                  description: 'Maximum number of tokens to generate',
                  default: 1000
                }
              },
              required: ['prompt']
            }
          },
          
          // Image Analysis
          {
            name: 'analyze_image',
            description: 'Analyze an image and answer questions about it',
            inputSchema: {
              type: 'object',
              properties: {
                imagePath: {
                  type: 'string',
                  description: 'Path to the image file'
                },
                imageBase64: {
                  type: 'string',
                  description: 'Base64 encoded image data (alternative to imagePath)'
                },
                prompt: {
                  type: 'string',
                  description: 'Question or instruction about the image',
                  default: 'Describe this image in detail'
                }
              },
              oneOf: [
                { required: ['imagePath', 'prompt'] },
                { required: ['imageBase64', 'prompt'] }
              ]
            }
          },
          
          {
            name: 'extract_text_from_image',
            description: 'Extract text (OCR) from an image',
            inputSchema: {
              type: 'object',
              properties: {
                imagePath: {
                  type: 'string',
                  description: 'Path to the image file'
                },
                imageBase64: {
                  type: 'string',
                  description: 'Base64 encoded image data (alternative to imagePath)'
                }
              },
              oneOf: [
                { required: ['imagePath'] },
                { required: ['imageBase64'] }
              ]
            }
          },
          
          {
            name: 'compare_images',
            description: 'Compare multiple images and describe differences/similarities',
            inputSchema: {
              type: 'object',
              properties: {
                images: {
                  type: 'array',
                  description: 'Array of image paths or base64 strings',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      base64: { type: 'string' }
                    }
                  },
                  minItems: 2,
                  maxItems: 5
                },
                prompt: {
                  type: 'string',
                  description: 'Specific comparison instruction',
                  default: 'Compare these images and describe their similarities and differences'
                }
              },
              required: ['images']
            }
          },
          
          // Code Generation
          {
            name: 'generate_code',
            description: 'Generate code in a specific programming language',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Description of what the code should do'
                },
                language: {
                  type: 'string',
                  description: 'Programming language (e.g., python, javascript, typescript, java, go, rust)',
                  default: 'python'
                },
                framework: {
                  type: 'string',
                  description: 'Optional framework/library to use (e.g., react, django, express)'
                }
              },
              required: ['prompt']
            }
          },
          
          {
            name: 'explain_code',
            description: 'Analyze and explain code',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The code to analyze'
                },
                language: {
                  type: 'string',
                  description: 'Programming language (optional, will be detected if not provided)'
                }
              },
              required: ['code']
            }
          },
          
          {
            name: 'refactor_code',
            description: 'Suggest improvements and refactor code',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The code to refactor'
                },
                language: {
                  type: 'string',
                  description: 'Programming language'
                },
                goals: {
                  type: 'array',
                  description: 'Refactoring goals (e.g., "improve readability", "optimize performance", "add type safety")',
                  items: { type: 'string' }
                }
              },
              required: ['code']
            }
          },
          
          {
            name: 'convert_code',
            description: 'Convert code from one language to another',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The source code'
                },
                sourceLanguage: {
                  type: 'string',
                  description: 'Source programming language'
                },
                targetLanguage: {
                  type: 'string',
                  description: 'Target programming language'
                }
              },
              required: ['code', 'targetLanguage']
            }
          },
          
          // Chat Conversation
          {
            name: 'chat',
            description: 'Have a conversation with context memory',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Your message'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID to maintain context (defaults to "default")',
                  default: 'default'
                },
                systemPrompt: {
                  type: 'string',
                  description: 'Optional system prompt to set context (only used on first message)'
                }
              },
              required: ['message']
            }
          },
          
          {
            name: 'clear_chat_history',
            description: 'Clear conversation history for a session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID to clear (defaults to "default")',
                  default: 'default'
                }
              }
            }
          },
          
          {
            name: 'summarize_conversation',
            description: 'Get a summary of the conversation',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID to summarize (defaults to "default")',
                  default: 'default'
                }
              }
            }
          },
          
          // Content Creation
          {
            name: 'translate_text',
            description: 'Translate text between languages',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to translate'
                },
                targetLanguage: {
                  type: 'string',
                  description: 'Target language (e.g., "Spanish", "French", "Japanese", "zh-CN")'
                },
                sourceLanguage: {
                  type: 'string',
                  description: 'Source language (optional, will be detected if not provided)'
                }
              },
              required: ['text', 'targetLanguage']
            }
          },
          
          {
            name: 'summarize_text',
            description: 'Create a summary of text',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to summarize'
                },
                style: {
                  type: 'string',
                  enum: ['brief', 'detailed', 'bullet-points', 'executive'],
                  description: 'Summary style',
                  default: 'brief'
                },
                maxLength: {
                  type: 'number',
                  description: 'Maximum length in words (optional)'
                }
              },
              required: ['text']
            }
          },
          
          {
            name: 'rewrite_text',
            description: 'Rewrite text in a different style or tone',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to rewrite'
                },
                style: {
                  type: 'string',
                  description: 'Target style (e.g., "formal", "casual", "technical", "simple", "creative")'
                },
                targetAudience: {
                  type: 'string',
                  description: 'Target audience (e.g., "children", "professionals", "academics")'
                }
              },
              required: ['text', 'style']
            }
          },
          
          {
            name: 'generate_structured_data',
            description: 'Generate structured data (JSON, YAML, CSV, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Description of the data to generate'
                },
                format: {
                  type: 'string',
                  enum: ['json', 'yaml', 'csv', 'xml', 'toml'],
                  description: 'Output format',
                  default: 'json'
                },
                schema: {
                  type: 'object',
                  description: 'Optional schema or example structure'
                }
              },
              required: ['prompt']
            }
          },
          
          // Safety & Moderation
          {
            name: 'check_content_safety',
            description: 'Analyze content for safety issues',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Content to analyze'
                },
                categories: {
                  type: 'array',
                  description: 'Specific categories to check',
                  items: {
                    type: 'string',
                    enum: ['harassment', 'hate', 'sexual', 'dangerous', 'medical', 'deception']
                  }
                }
              },
              required: ['content']
            }
          },
          
          {
            name: 'moderate_text',
            description: 'Filter and clean inappropriate content',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to moderate'
                },
                level: {
                  type: 'string',
                  enum: ['strict', 'moderate', 'lenient'],
                  description: 'Moderation level',
                  default: 'moderate'
                }
              },
              required: ['text']
            }
          }
        ]
      }
    };
  }

  async handleToolsCall(request: MCPRequest): Promise<MCPResponse> {
    const toolName = request.params?.name;
    const args = request.params?.arguments || {};

    try {
      switch (toolName) {
        // Text Generation
        case 'generate_text':
          return await this.generateText(request.id, args);
        
        // Image Analysis
        case 'analyze_image':
          return await this.analyzeImage(request.id, args);
        case 'extract_text_from_image':
          return await this.extractTextFromImage(request.id, args);
        case 'compare_images':
          return await this.compareImages(request.id, args);
        
        // Code Generation
        case 'generate_code':
          return await this.generateCode(request.id, args);
        case 'explain_code':
          return await this.explainCode(request.id, args);
        case 'refactor_code':
          return await this.refactorCode(request.id, args);
        case 'convert_code':
          return await this.convertCode(request.id, args);
        
        // Chat Conversation
        case 'chat':
          return await this.chat(request.id, args);
        case 'clear_chat_history':
          return await this.clearChatHistory(request.id, args);
        case 'summarize_conversation':
          return await this.summarizeConversation(request.id, args);
        
        // Content Creation
        case 'translate_text':
          return await this.translateText(request.id, args);
        case 'summarize_text':
          return await this.summarizeText(request.id, args);
        case 'rewrite_text':
          return await this.rewriteText(request.id, args);
        case 'generate_structured_data':
          return await this.generateStructuredData(request.id, args);
        
        // Safety & Moderation
        case 'check_content_safety':
          return await this.checkContentSafety(request.id, args);
        case 'moderate_text':
          return await this.moderateText(request.id, args);
        
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: `Unknown tool: ${toolName}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  // Text Generation
  private async generateText(id: string | number, args: any): Promise<MCPResponse> {
    const { prompt, temperature = 0.7, maxTokens = 1000 } = args;
    
    if (!prompt) {
      return this.errorResponse(id, -32602, 'Missing prompt parameter');
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    });
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: result.response.text()
        }]
      }
    };
  }

  // Image Analysis Methods
  private async analyzeImage(id: string | number, args: any): Promise<MCPResponse> {
    const { imagePath, imageBase64, prompt = 'Describe this image in detail' } = args;
    
    let imageData;
    if (imagePath) {
      const imageBuffer = await fs.readFile(imagePath);
      imageData = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: this.getMimeType(imagePath)
        }
      };
    } else if (imageBase64) {
      imageData = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg' // Default, could be improved
        }
      };
    } else {
      return this.errorResponse(id, -32602, 'Missing image data');
    }

    const result = await this.visionModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          imageData
        ]
      }]
    });

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: result.response.text()
        }]
      }
    };
  }

  private async extractTextFromImage(id: string | number, args: any): Promise<MCPResponse> {
    const modifiedArgs = {
      ...args,
      prompt: 'Extract all text from this image. Provide only the extracted text without any additional commentary.'
    };
    return this.analyzeImage(id, modifiedArgs);
  }

  private async compareImages(id: string | number, args: any): Promise<MCPResponse> {
    const { images, prompt = 'Compare these images and describe their similarities and differences' } = args;
    
    if (!images || images.length < 2) {
      return this.errorResponse(id, -32602, 'At least 2 images required');
    }

    const imageParts = await Promise.all(images.map(async (img: any) => {
      if (img.path) {
        const imageBuffer = await fs.readFile(img.path);
        return {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: this.getMimeType(img.path)
          }
        };
      } else if (img.base64) {
        return {
          inlineData: {
            data: img.base64,
            mimeType: 'image/jpeg'
          }
        };
      }
    }));

    const result = await this.visionModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          ...imageParts
        ]
      }]
    });

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: result.response.text()
        }]
      }
    };
  }

  // Code Generation Methods
  private async generateCode(id: string | number, args: any): Promise<MCPResponse> {
    const { prompt, language = 'python', framework } = args;
    
    const fullPrompt = `Generate ${language} code${framework ? ` using ${framework}` : ''} for the following requirement:\n\n${prompt}\n\nProvide only the code with appropriate comments. Use best practices and proper error handling.`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async explainCode(id: string | number, args: any): Promise<MCPResponse> {
    const { code, language } = args;
    
    const fullPrompt = `Explain the following${language ? ` ${language}` : ''} code in detail:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nProvide a comprehensive explanation including what it does, how it works, and any important considerations.`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async refactorCode(id: string | number, args: any): Promise<MCPResponse> {
    const { code, language, goals = [] } = args;
    
    const goalsList = goals.length > 0 ? `\nRefactoring goals: ${goals.join(', ')}` : '';
    const fullPrompt = `Refactor the following${language ? ` ${language}` : ''} code${goalsList}:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nProvide the refactored code with explanations of the changes made.`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async convertCode(id: string | number, args: any): Promise<MCPResponse> {
    const { code, sourceLanguage, targetLanguage } = args;
    
    const fullPrompt = `Convert the following code from ${sourceLanguage || 'the source language'} to ${targetLanguage}:\n\n\`\`\`${sourceLanguage || ''}\n${code}\n\`\`\`\n\nProvide the converted code maintaining the same functionality and using idiomatic ${targetLanguage} patterns.`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  // Chat Conversation Methods
  private async chat(id: string | number, args: any): Promise<MCPResponse> {
    const { message, sessionId = 'default', systemPrompt } = args;
    
    if (!this.chatSessions.has(sessionId)) {
      const chatSession = this.model.startChat({
        history: systemPrompt ? [{
          role: 'user',
          parts: [{ text: `System: ${systemPrompt}` }]
        }, {
          role: 'model',
          parts: [{ text: 'Understood. I will follow these instructions.' }]
        }] : []
      });
      this.chatSessions.set(sessionId, chatSession);
    }
    
    const chat = this.chatSessions.get(sessionId);
    const result = await chat.sendMessage(message);
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: result.response.text()
        }]
      }
    };
  }

  private async clearChatHistory(id: string | number, args: any): Promise<MCPResponse> {
    const { sessionId = 'default' } = args;
    
    this.chatSessions.delete(sessionId);
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: `Chat history cleared for session: ${sessionId}`
        }]
      }
    };
  }

  private async summarizeConversation(id: string | number, args: any): Promise<MCPResponse> {
    const { sessionId = 'default' } = args;
    
    const chat = this.chatSessions.get(sessionId);
    if (!chat) {
      return this.errorResponse(id, -32602, 'No chat history found for this session');
    }
    
    // Get the chat history and create a summary
    const result = await chat.sendMessage('Please provide a concise summary of our conversation so far.');
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: result.response.text()
        }]
      }
    };
  }

  // Content Creation Methods
  private async translateText(id: string | number, args: any): Promise<MCPResponse> {
    const { text, targetLanguage, sourceLanguage } = args;
    
    const fullPrompt = `Translate the following text${sourceLanguage ? ` from ${sourceLanguage}` : ''} to ${targetLanguage}. Provide only the translation without any additional explanation:\n\n${text}`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async summarizeText(id: string | number, args: any): Promise<MCPResponse> {
    const { text, style = 'brief', maxLength } = args;
    
    const styleInstructions: { [key: string]: string } = {
      'brief': 'Provide a brief summary in 2-3 sentences',
      'detailed': 'Provide a detailed summary covering all main points',
      'bullet-points': 'Provide a summary using bullet points',
      'executive': 'Provide an executive summary suitable for business readers'
    };
    
    const lengthInstruction = maxLength ? ` in no more than ${maxLength} words` : '';
    const fullPrompt = `${styleInstructions[style]}${lengthInstruction} of the following text:\n\n${text}`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async rewriteText(id: string | number, args: any): Promise<MCPResponse> {
    const { text, style, targetAudience } = args;
    
    const audienceInstruction = targetAudience ? ` for ${targetAudience}` : '';
    const fullPrompt = `Rewrite the following text in a ${style} style${audienceInstruction}:\n\n${text}`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async generateStructuredData(id: string | number, args: any): Promise<MCPResponse> {
    const { prompt, format = 'json', schema } = args;
    
    const schemaInstruction = schema ? `\n\nFollow this schema:\n${JSON.stringify(schema, null, 2)}` : '';
    const fullPrompt = `Generate ${format.toUpperCase()} data for: ${prompt}${schemaInstruction}\n\nProvide only the ${format} data without any markdown code blocks or additional explanation.`;
    
    const result = await this.generateText(id, { prompt: fullPrompt });
    
    // Try to validate JSON if format is JSON
    if (format === 'json' && result.result) {
      try {
        const text = result.result.content[0].text;
        JSON.parse(text); // Validate JSON
      } catch (e) {
        // If validation fails, wrap in code block
        result.result.content[0].text = `\`\`\`json\n${result.result.content[0].text}\n\`\`\``;
      }
    }
    
    return result;
  }

  // Safety & Moderation Methods
  private async checkContentSafety(id: string | number, args: any): Promise<MCPResponse> {
    const { content, categories = ['harassment', 'hate', 'sexual', 'dangerous'] } = args;
    
    const fullPrompt = `Analyze the following content for safety issues in these categories: ${categories.join(', ')}. 
    
Content: "${content}"

Provide a safety assessment with:
1. Overall safety rating (safe/caution/unsafe)
2. Specific concerns for each category
3. Recommendations if any issues are found

Format as JSON.`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  private async moderateText(id: string | number, args: any): Promise<MCPResponse> {
    const { text, level = 'moderate' } = args;
    
    const levelInstructions: { [key: string]: string } = {
      'strict': 'Remove or modify any potentially inappropriate content',
      'moderate': 'Clean up obviously inappropriate content while preserving meaning',
      'lenient': 'Only remove explicit inappropriate content'
    };
    
    const fullPrompt = `${levelInstructions[level]} in the following text. Return the cleaned version:\n\n${text}`;
    
    return this.generateText(id, { prompt: fullPrompt });
  }

  // Helper Methods
  private getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }

  private errorResponse(id: string | number, code: number, message: string): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
  }
}

// Start server
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

new GeminiMCPServer(apiKey);
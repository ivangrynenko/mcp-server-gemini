# Claude Development Context

## Project Overview
This is a Model Context Protocol (MCP) server implementation for Google's Gemini AI models. It provides Claude Desktop integration with Gemini's capabilities including text generation, image analysis, code generation, chat conversations, content creation, and safety moderation.

## Core Architecture
- **Transport**: stdio (required by Claude Desktop)
- **Model**: Gemini 1.5 Pro (most capable model with multimodal support)
- **Protocol**: MCP 2024-11-05 with JSON-RPC 2.0
- **Implementation**: TypeScript with ES modules

## Key Files
- `src/stdio.ts` - Main server implementation with all 16 methods
- `src/index.ts` - WebSocket server (legacy, kept for custom integrations)
- `dist/stdio.js` - Compiled output used by Claude Desktop
- `package.json` - Configuration with stdio as main entry

## Available Methods
### Text Generation
- `generate_text` - Generate text with customizable temperature and token limits

### Image Analysis (Vision)
- `analyze_image` - Analyze images and answer questions
- `extract_text_from_image` - OCR functionality
- `compare_images` - Compare multiple images

### Code Generation
- `generate_code` - Generate code in specific languages
- `explain_code` - Analyze and explain code
- `refactor_code` - Suggest improvements
- `convert_code` - Convert between languages

### Chat Conversations
- `chat` - Stateful conversations with session management
- `clear_chat_history` - Clear session history
- `summarize_conversation` - Get conversation summary

### Content Creation
- `translate_text` - Language translation
- `summarize_text` - Multiple summary styles
- `rewrite_text` - Style/tone transformation
- `generate_structured_data` - Generate JSON, YAML, CSV, etc.

### Safety & Moderation
- `check_content_safety` - Analyze content for safety issues
- `moderate_text` - Filter inappropriate content

## Claude Desktop Configuration
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/mcp-server-gemini/dist/stdio.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Development Commands
- `npm run build` - Compile TypeScript
- `npm run dev` - Development mode with stdio
- `npm run test` - Run tests
- `npm start` - Production stdio server

## Error Handling
- Proper JSON-RPC error codes (-32700, -32600, -32601, -32602, -32603)
- Null responses for notifications (notifications/* methods)
- Graceful handling of missing methods (resources/list, prompts/list)

## Session Management
- Chat sessions stored in Map with sessionId keys
- System prompts supported for initial context
- History maintained across messages in same session

## Image Support
- Formats: JPEG, PNG, GIF, WebP
- Input: File path or base64 encoded data
- Automatic MIME type detection
- Multiple images for comparison (2-5 images)

## Important Notes
- Never use 'gemini-pro' model (deprecated) - always use 'gemini-1.5-pro'
- API key must be set as GEMINI_API_KEY environment variable
- Restart Claude Desktop after configuration changes
- All methods return content array with type 'text'
- Gemini 1.5 Pro supports up to 2M tokens context window

## Testing
When testing new features:
1. Build the project: `npm run build`
2. Restart Claude Desktop
3. Check connection in Claude Desktop's MCP tools list
4. Test individual methods through Claude's interface

## Troubleshooting
- Check Claude Desktop logs for connection errors
- Ensure dist/stdio.js exists and is executable
- Verify API key is valid and has proper permissions
- Use absolute paths in Claude Desktop config
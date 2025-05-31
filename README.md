# Gemini MCP Server Enhanced v2.2

A powerful Model Context Protocol (MCP) server that provides comprehensive access to Google's Gemini 2.0 Flash Experimental AI capabilities, including text generation, image analysis, code generation, chat conversations, and more. Powered by the latest Gemini 2.0 model with advanced reasoning capabilities.

## Features

### Core Capabilities
- Full MCP protocol support with stdio transport for Claude Desktop
- WebSocket support for custom integrations
- Real-time response streaming
- Secure API key handling
- TypeScript implementation with ES modules

### 🚀 Text Generation
- **generate_text** - Generate text with customizable temperature and token limits

### 🖼️ Image Analysis
- **analyze_image** - Analyze images and answer questions about them
- **extract_text_from_image** - Extract text (OCR) from images
- **compare_images** - Compare multiple images and describe differences/similarities

### 💻 Code Generation & Analysis
- **generate_code** - Generate code in specific programming languages with framework support
- **explain_code** - Analyze and explain code with detailed breakdowns
- **refactor_code** - Suggest improvements and refactor code based on goals
- **convert_code** - Convert code between programming languages

### 💬 Chat Conversations
- **chat** - Have conversations with context memory and session management
- **clear_chat_history** - Clear conversation history for a session
- **summarize_conversation** - Get a summary of the conversation

### ✍️ Content Creation
- **translate_text** - Translate text between languages
- **summarize_text** - Create summaries in various styles (brief, detailed, bullet-points, executive)
- **rewrite_text** - Rewrite text in different styles or for different audiences
- **generate_structured_data** - Generate structured data (JSON, YAML, CSV, XML, TOML)

### 🛡️ Safety & Moderation
- **check_content_safety** - Analyze content for safety issues across multiple categories
- **moderate_text** - Filter and clean inappropriate content with different moderation levels

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ivangrynenko/mcp-server-gemini.git
   cd mcp-server-gemini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## Quick Start

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Configure Claude Desktop**
   - Locate your config file:
     ```
     Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
     Windows: %APPDATA%\Claude\claude_desktop_config.json
     Linux: ~/.config/Claude/claude_desktop_config.json
     ```
   - Add Gemini configuration:
     ```json
     {
       "mcpServers": {
         "gemini": {
           "command": "node",
           "args": ["/path/to/mcp-server-gemini/dist/stdio.js"],
           "env": {
             "GEMINI_API_KEY": "your_api_key_here"
           }
         }
       }
     }
     ```

3. **Restart Claude Desktop**

## Usage Examples

Once configured, you can use these tools in Claude Desktop:

### Text Generation
```
Use the generate_text tool to write a creative story about space exploration
```

### Image Analysis
```
Use the analyze_image tool to describe what's in /path/to/image.jpg
```

### Code Generation
```
Use the generate_code tool to create a Python REST API with FastAPI
```

### Chat Conversations
```
Use the chat tool with sessionId "project-discussion" to start a conversation about machine learning
```

### Content Creation
```
Use the translate_text tool to translate "Hello, world!" to Spanish
```

## Documentation

- [Claude Desktop Setup Guide](docs/claude-desktop-setup.md) - Detailed setup instructions
- [Examples and Usage](docs/examples.md) - Usage examples and advanced configuration
- [Implementation Notes](docs/implementation-notes.md) - Technical implementation details
- [Development Guide](docs/development-guide.md) - Guide for developers
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

## Local Development

```bash
# Clone repository
git clone https://github.com/aliargun/mcp-server-gemini.git
cd mcp-server-gemini

# Install dependencies
npm install

# Start development server
npm run dev
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## Common Issues

1. **Connection Issues**
   - Check if port 3005 is available
   - Verify internet connection
   - See [Troubleshooting Guide](docs/troubleshooting.md)

2. **API Key Problems**
   - Verify API key is correct
   - Check permissions
   - See [Setup Guide](docs/claude-desktop-setup.md)

## Security

- API keys are handled via environment variables only
- No sensitive data is logged or stored
- Regular security updates

## License

MIT
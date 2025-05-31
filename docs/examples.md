# Examples and Usage Instructions

## Claude Desktop Setup

1. **Locate the Configuration File**
   ```
   Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
   Windows: %APPDATA%\Claude\claude_desktop_config.json
   Linux: ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add Gemini MCP Configuration**
   ```json
   {
     "mcpServers": {
       "gemini": {
         "command": "npx",
         "args": ["-y", "github:aliargun/mcp-server-gemini"],
         "env": {
           "GEMINI_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**
   - Close Claude Desktop completely
   - Relaunch the application
   - The Gemini provider should now be available

## Example Interactions

### Text Generation
```
Human: Use the generate_text tool to write a haiku about coding

Claude: I'll use the Gemini generate_text tool to create a haiku about coding...
[Uses generate_text with prompt: "Write a haiku about coding"]
```

### Image Analysis
```
Human: Use the analyze_image tool to describe what's in this photo: /Users/me/photo.jpg

Claude: I'll analyze the image using Gemini's vision capabilities...
[Uses analyze_image with imagePath: "/Users/me/photo.jpg"]
```

### Code Generation
```
Human: Use the generate_code tool to create a Python function that sorts a list

Claude: I'll generate Python code for a sorting function...
[Uses generate_code with prompt: "Create a function that sorts a list", language: "python"]
```

### Chat Conversations
```
Human: Start a chat session about machine learning basics

Claude: I'll start a chat session with Gemini about ML basics...
[Uses chat with message: "Let's discuss machine learning basics", sessionId: "ml-basics"]
```

### Advanced Features

1. **Image Comparison**
   ```
   Use compare_images to analyze differences between before.jpg and after.jpg
   ```

2. **Code Refactoring**
   ```
   Use refactor_code to improve this Python code with goals: ["add type hints", "improve performance"]
   ```

3. **Content Translation**
   ```
   Use translate_text to translate "Hello, world!" to Spanish, French, and Japanese
   ```

4. **Structured Data Generation**
   ```
   Use generate_structured_data to create a JSON schema for a user profile with name, email, and preferences
   ```

5. **Content Safety Check**
   ```
   Use check_content_safety to analyze this text for potential issues
   ```
       "temperature": 0.7,
       "maxTokens": 1000
     }
   }
   ```

2. **Streaming Responses**
   ```json
   {
     "method": "generate",
     "params": {
       "prompt": "Your prompt here",
       "stream": true
     }
   }
   ```

## Troubleshooting Common Setup Issues

1. **Config File Not Found**
   - Make sure Claude Desktop has been run at least once
   - Check the path for your operating system
   - Create the file if it doesn't exist

2. **API Key Issues**
   - Get your API key from Google AI Studio
   - Ensure the key has proper permissions
   - Check for any whitespace in the key

3. **Connection Issues**
   - Verify Claude Desktop is running
   - Check if port 3005 is available
   - Look for any firewall restrictions

## Best Practices

1. **API Key Security**
   - Never share your API key
   - Use environment variables when possible
   - Rotate keys periodically

2. **Resource Management**
   - Monitor API usage
   - Implement rate limiting
   - Handle long responses appropriately

## Advanced Configuration

### Custom Port Configuration
```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:aliargun/mcp-server-gemini"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "PORT": "3006"
      }
    }
  }
}
```

### Development Setup
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/local/mcp-server-gemini/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "DEBUG": "true"
      }
    }
  }
}
```

## Using with Other MCP Servers

### Multiple Providers Example
```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:aliargun/mcp-server-gemini"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_key"
      }
    },
    "openai": {
      "command": "npx",
      "args": ["-y", "@mzxrai/mcp-openai@latest"],
      "env": {
        "OPENAI_API_KEY": "your_openai_key"
      }
    }
  }
}
```

## Verification Steps

1. Check Server Status
```bash
curl -I http://localhost:3005
```

2. Test WebSocket Connection
```bash
wscat -c ws://localhost:3005
```

3. Verify MCP Integration
```
Ask Claude: "Can you verify if the Gemini MCP connection is working?"
```

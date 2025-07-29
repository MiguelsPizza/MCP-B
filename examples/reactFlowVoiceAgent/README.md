Setup:

Run the below commands
```
bun install
bun dev
```
(you could also use other package managers like npm)


Usage:
There are 4 built-in MCP servers [Weather, Github, Math, and Users] They should appear as nodes on the UI.

They are fairly simple. In order to add a node designated to your own custom github server, follow these steps:
1. Create your MCP server in the src/mcpServers folder. Make sure there is a function called createMCPServer that returns the server [use the built-in MCPs structure for reference]

2. Add your MCP server to mcp_config.js in src/mcpServers. Use the pre-built configs for guidance on structures. You should then be able to see your server node on the frontend (make sure you set the node coordinates so you can actually see your MCP node).
    a. Also, make sure your mcp server tool functions do not have dashes otherwise the llm can't compile it. [Valid: get_current_weather; Invalid: get-current-weather]

3. After you set your API key and connect the Gemini LLM node to your MCP server node on the frontend, you should be set!



Notes:
- Used mcp-b transports to allow mcps to be identifiable on the browser :)
- Used bun cuz it's supposedly faster

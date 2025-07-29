import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';



// Helper functions for math operations
function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

function multiply(a: number, b: number): number {
  return a * b;
}

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}

function power(base: number, exponent: number): number {
  return Math.pow(base, exponent);
}

function sqrt(n: number): number {
  if (n < 0) {
    throw new Error('Square root of negative number is not allowed');
  }
  return Math.sqrt(n);
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Factorial is only defined for non-negative integers');
  }
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}




// MATH MCP SERVER
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "math-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Basic arithmetic operations
  server.tool(
    'add',
    {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    },
    async ({ a, b }) => {
      console.log(`➕ Math: Adding ${a} + ${b}`);
      
      try {
        const result = add(a, b);
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${a} + ${b} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Addition failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Addition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'subtract',
    {
      a: z.number().describe('First number (minuend)'),
      b: z.number().describe('Second number (subtrahend)')
    },
    async ({ a, b }) => {
      console.log(`➖ Math: Subtracting ${a} - ${b}`);
      
      try {
        const result = subtract(a, b);
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${a} - ${b} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Subtraction failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Subtraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'multiply',
    {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    },
    async ({ a, b }) => {
      console.log(`✖️ Math: Multiplying ${a} × ${b}`);
      
      try {
        const result = multiply(a, b);
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${a} × ${b} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Multiplication failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Multiplication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'divide',
    {
      a: z.number().describe('Dividend'),
      b: z.number().describe('Divisor')
    },
    async ({ a, b }) => {
      console.log(`➗ Math: Dividing ${a} ÷ ${b}`);
      
      try {
        const result = divide(a, b);
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${a} ÷ ${b} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Division failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Division failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Advanced operations
  server.tool(
    'power',
    {
      base: z.number().describe('Base number'),
      exponent: z.number().describe('Exponent')
    },
    async ({ base, exponent }) => {
      console.log(`🔢 Math: Calculating ${base}^${exponent}`);
      
      try {
        const result = power(base, exponent);
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${base}^${exponent} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Power calculation failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Power calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'sqrt',
    {
      number: z.number().describe('Number to find square root of')
    },
    async ({ number }) => {
      console.log(`√ Math: Finding square root of ${number}`);
      
      try {
        const result = sqrt(number);
        
        return {
          content: [{
            type: 'text',
            text: `✅ √${number} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Square root calculation failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Square root calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'factorial',
    {
      number: z.number().int().min(0).describe('Non-negative integer to find factorial of')
    },
    async ({ number }) => {
      console.log(`! Math: Calculating factorial of ${number}`);
      
      try {
        const result = factorial(number);
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${number}! = ${result}`
          }]
        };
      } catch (error) {
        console.error('Factorial calculation failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Factorial calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Multi-step calculation
  server.tool(
    'calculate',
    {
      expression: z.string().describe('Math expression to evaluate (e.g., "2 + 3 * 4")')
    },
    async ({ expression }) => {
      console.log(`🧮 Math: Evaluating expression "${expression}"`);
      
      try {
        // Simple expression evaluation (for basic expressions only)
        // This is a simplified implementation - in production, use a proper math parser
        const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
        
        if (sanitizedExpression !== expression) {
          throw new Error('Invalid characters in expression');
        }
        
        const result = Function('"use strict"; return (' + sanitizedExpression + ')')();
        
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('Invalid result');
        }
        
        return {
          content: [{
            type: 'text',
            text: `✅ ${expression} = ${result}`
          }]
        };
      } catch (error) {
        console.error('Expression evaluation failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Expression evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  return server;
}


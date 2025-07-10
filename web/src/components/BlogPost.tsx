import { ArrowRight, Check, Copy, ExternalLink, Store } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import GIF from '../assets/smaller.gif';
import MultiSiteWorkflow from '../assets/multi-site-workflow.svg?react';
import GIF2 from '../assets/Dynamic Tool Caching.gif';
import FullArch from '../assets/FullArch.png';

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 px-3 text-sm bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 shadow-md rounded-md flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-hidden rounded-lg sm:rounded-xl border border-zinc-800 shadow-lg">
        <div className="flex items-center justify-between bg-zinc-900 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm text-zinc-400">
          <span className="font-mono">{language}</span>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: '#1e1e1e',
            fontSize: '0.75rem',
            lineHeight: '1.5',
            overflow: 'auto',
            maxWidth: '100%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          wrapLines={true}
          wrapLongLines={true}
          showLineNumbers={false}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const BlogPost = () => {
  return (
    <article className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16 pb-16 sm:pb-24 lg:pb-32 min-w-0 overflow-hidden">
      {/* Header */}
      <header className="mb-6 sm:mb-12 lg:mb-16">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 leading-tight">
          MCP-B: The Right place to build your MCP server is in your website
        </h1>
      </header>

      {/* Main content */}
      <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none space-y-4 sm:space-y-8 min-w-0 overflow-hidden">
        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          With all the major security issues and data leakages the MCP ecosystem has been facing
          recently, the pre-authorized, user-scoped sandbox of the browser feels like more of the
          promised land than ever.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Every other day I see a new Launch HN or project that gives another attempt at browser
          automation via LLMs. Every solution I see is banking on the same idea: these models will
          eventually be able to navigate and interact with the browser as well as a human.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Maybe I'm just a bit more skeptical than the average AGI enthusiast, but I feel like we
          are building for a future that is not here yet and might not come for a while. Before we
          get into MCP-B, why I wrote it, and why it solves a bunch of problems with both MCP and
          browser automation. Let's quickly go over the current state of the ecosystem.
        </p>

        <h3 className="text-lg sm:text-2xl font-semibold mt-6 sm:mt-10 mb-3 sm:mb-6">
          Browser automation is a mess
        </h3>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          When current AI tries to buy something online with browser automation, here's what
          actually happens:
        </p>

        <ol className="list-decimal pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>Take a screenshot (or parse the DOM)</li>
          <li>Ask the model: "Where's the 'Add to Cart' button?"</li>
          <li>Model responds with coordinates or element selector</li>
          <li>Click the button</li>
          <li>Wait for page to update</li>
          <li>Take another screenshot</li>
          <li>Ask: "Did that work? What happened?"</li>
          <li>Repeat for every single interaction</li>
        </ol>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          We're using a language model as an OCR engine with a mouse. Every click requires multiple
          round trips through the model. The model burns tokens answering questions like "Is this
          button blue or gray?" and "Where is the search box?" It has to reorient itself with every
          page change, parse visual layouts, and hope the UI hasn't shifted by a pixel.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          MCP and its limitations
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          <strong>MCP stands for "Model Context Protocol."</strong> It's an attempt to standardize
          the way we provide both information and ways to interact with the external world to LLMs.
          It consists of three parts:
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <li>
            <strong>A server</strong> – This is where all the information and functions which allow
            the LLM to take action live
          </li>
          <li>
            <strong>A client</strong> – This lives in the same place as the LLM (sort of) and
            provides a standard way to interact with the capabilities the server has
          </li>
          <li>
            <strong>Transports</strong> – both the client and server have one of these. They allow
            the client to call the server even if they live in totally different places. If it's
            capable of transporting data, you can write transports for it
          </li>
        </ul>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Right now there are two officially supported transports:
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>
            <strong>stdio</strong> - allows communication between processes locally on your computer
          </li>
          <li>
            <strong>streamableHttp/SSE</strong> – allows communication between processes over HTTP
          </li>
        </ul>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          What is MCP-B?
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          MCP-B extends MCP with transports for intra-browser communication. The two transports are
          Extension Transports (for communication within and between browser extensions) and Tab
          Transports (for communication between scripts in the same tab).
        </p>

        <img src={GIF} alt="MCP-B Demo" className="w-full h-auto rounded-lg" />

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          This means your website can be an MCP server and/or client and so can your browser
          extension.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          How MCP-B Works
        </h2>
        <img src={FullArch} alt="MCP-B Full Architecture" className="w-full h-auto rounded-lg" />
        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          MCP-B really only needs 1 transport to work (The TabTransports), but the current extension
          makes use of both. You can think of the MCP-B extension server as an MCP server which
          collects all the tools from other Tab MCP servers then routes requests to the proper URL
          and tab when one of it's tools are called. The extension layer also does some things like
          tool caching and opening a tab with the properly URL of the tool if one does not already
          exist.
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <li>
            <strong>Tab Transports</strong> - Use postMessage for in-page communication between your
            website's MCP server and any client in the same tab. This transport deviates from the
            official protocol a bit where I have added in some edge-cases to help the server and
            client find each other if the server loads in after the client
          </li>
          <li>
            <strong>Extension Transports</strong> - Use Chrome's runtime messaging for communication
            between extension components (sidebar, popup, background)
          </li>
        </ul>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          When you visit a website with an MCP server, the extension will inject an MCP client into
          the page which will reach out and look for any servers, register their tools with the
          extension MCP server, and listen for tool call requests from the extension or tool updates
          from the tab server.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          Why would I want my website to be an MCP server?
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Well having your website be an MCP server isn't really that beneficial by itself. You can
          declare a client in the same tab and call tools on your server but that adds a layer of
          abstraction that is not needed when both server and client live in the same script. Not to
          mention, you will have to embed your own chat application in your website to benefit from
          it. If you do want to do this, I recommend just using the inMemoryTransports from the
          official SDK (they are not documented but work great)
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The true power and benefit of this is when the Website is the MCP server and the extension
          is the MCP client. Let me explain why.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          From the website's perspective, they have just wrapped some of their existing
          functionality (client side APIs, forms, or whatever else they want to allow the model to
          read/interact with) in tools (functions with a bit of information of how to use them for
          LLMs). That's it.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The extension injects a client into the tab when it opens up and connects to the tab
          server and passes along its tools to the rest of the extension. When the extension decides
          it wants to call a tool on the tab, it just passes that request back to the client. You
          get a full MCP client-server relationship with zero configuration from a user perspective.
          All they need to do is visit a website with an MCP server and make sure they have the
          extension installed!
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Lucky for us, MCP supports dynamic tool updates so if the website's tools come in
          asynchronously or based on URL, the client automatically updates.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Website owners get to add automation to their websites without worrying about maintaining
          a chat application. And users can use the same interface they want for multiple websites
          and even get their agent to work across multiple websites like putting the output of one
          website's tool call into the input of another.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          Cross-Site Tool Composition
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          MCP-B enables tools from different websites to work together. Each site exposes its
          existing functionality as MCP tools, and the extension handles routing calls between them.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Site A exposes its cart state:
        </p>

        <div className="my-6 sm:my-12 lg:my-16 not-prose">
          <CodeBlock
            language="typescript"
            code={`// shop.example.com - reading from React state
const { cart } = useCartContext();

server.tool('getCurrentCart', 'Get current shopping cart contents', {}, async () => {  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        items: cart.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sku: item.sku
        })),
        total: cart.total,
        itemCount: cart.items.length
      })
    }]
  };
});`}
          />
        </div>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Site B wraps its existing authenticated API:
        </p>

        <div className="my-6 sm:my-12 lg:my-16 not-prose">
          <CodeBlock
            language="typescript"
            code={`// pricewatch.com - using their existing authenticated API
server.tool('comparePrices', 'Search for product prices across retailers', {
  productName: z.string().describe('Product name to search for'),
  sku: z.string().optional().describe('Product SKU for exact matching')
}, async ({ productName, sku }) => {
  // This uses the site's existing API with the user's current session
  // No additional auth needed - cookies/headers are already set
  const response = await fetch('/api/products/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', // Uses existing session cookies
    body: JSON.stringify({ 
      query: productName,
      sku: sku,
      includeShipping: true 
    })
  });
  
  const results = await response.json();
  
  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify({
        bestPrice: results.prices[0],
        averagePrice: results.average,
        retailers: results.retailers.slice(0, 5)
      })
    }] 
  };
});`}
          />
        </div>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Here's what happens when the model wants to compare prices for items in the cart:
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 my-6 sm:my-8 not-prose">
          <ol className="space-y-3 sm:space-y-4">
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                1
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                The extension calls{' '}
                <code className="font-mono bg-zinc-800 text-amber-400 px-1 sm:px-1.5 py-0.5 rounded-md text-xs sm:text-sm break-all whitespace-pre-wrap">
                  shop_example_com_getCurrentCart
                </code>{' '}
                on the active tab.
              </p>
            </li>
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                2
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                The model receives the cart data in its context and decides to check prices.
              </p>
            </li>
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                3
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                When it calls{' '}
                <code className="font-mono bg-zinc-800 text-amber-400 px-1 sm:px-1.5 py-0.5 rounded-md text-xs sm:text-sm break-all whitespace-pre-wrap">
                  pricewatch_com_comparePrices
                </code>
                , the extension sees this tool belongs to a different domain.
              </p>
            </li>
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                4
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                It opens{' '}
                <code className="font-mono bg-zinc-800 text-amber-400 px-1 sm:px-1.5 py-0.5 rounded-md text-xs sm:text-sm break-all whitespace-pre-wrap">
                  pricewatch.com
                </code>{' '}
                in a new tab (or switches to it if already open).
              </p>
            </li>
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                5
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                Waits for the MCP server to initialize on that tab.
              </p>
            </li>
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                6
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                Executes the tool call with the product data from step 1.
              </p>
            </li>
            <li className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-mono text-xs">
                7
              </span>
              <p className="text-zinc-300 pt-0.5 text-sm sm:text-base">
                Returns the results to the model's context.
              </p>
            </li>
          </ol>
        </div>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The key is that{' '}
          <code className="font-mono bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded-md text-sm">
            fetch('/api/products/search')
          </code>{' '}
          uses whatever authentication the user already has with{' '}
          <code className="font-mono bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded-md text-sm">
            pricewatch.com
          </code>{' '}
          - session cookies, auth headers, whatever. The MCP tool is just a thin wrapper around the
          site's existing API endpoints. The extension manages the tab navigation and maintains the
          conversation context across sites, while each site's tools operate with their own
          authentication context.
        </p>
        <MultiSiteWorkflow />

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          Good websites are Context Engineering
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Something that has been getting a lot of attention recently is context engineering (making
          sure that the model only has context relevant to its task). People are beginning to
          realize that if you give a model 100 tools and ask it to do something where only one of
          them would be the right one to use, it's unlikely for things to go well. That's not
          surprising. If I asked you to build a table and gave you a Home Depot you probably would
          have a harder time than if I gave you a saw, a hammer, wood, and some nails.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The cool thing about MCP-B is you can scope tools to different webpages on your app. So
          instead of giving the model all the tools of your website all at once, you can
          intentionally show it tools based on where it is in the website and what it has called so
          far. Think of this like a UI for LLMs. Websites don't put all of the content on one page,
          we limit the amount of info the user sees at any given time and expose more information
          behind tabs and buttons that indicate it lives there.
        </p>

        <CodeBlock
          language="jsx"
          code={`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { useEffect } from "react";
import { z } from "zod";

// Global MCP server instance
const server = new McpServer({
  name: "ecommerce-app",
  version: "1.0.0"
});

// Component that registers shopping cart tools when rendered
function ShoppingCartTools({ cartId, items }) {
  useEffect(() => {
    const addToCartTool = server.registerTool("addToCart", {
      title: "Add to Cart",
      description: "Add an item to the shopping cart",
      inputSchema: {
        productId: z.string().describe("Product ID to add"),
        quantity: z.number().min(1).describe("Quantity to add")
      }
    }, async ({ productId, quantity }) => {
      await cartService.addItem(cartId, productId, quantity);
      return {
        content: [{ type: "text", text: \`Added \${quantity} of \${productId} to cart\` }]
      };
    });

    const removeFromCartTool = server.registerTool("removeFromCart", {
      title: "Remove from Cart", 
      description: "Remove an item from the shopping cart",
      inputSchema: {
        itemId: z.string().describe("Cart item ID to remove")
      }
    }, async ({ itemId }) => {
      await cartService.removeItem(cartId, itemId);
      return {
        content: [{ type: "text", text: \`Removed item \${itemId} from cart\` }]
      };
    });

    // Only show checkout tool if cart has items
    let checkoutTool;
    if (items.length > 0) {
      checkoutTool = server.registerTool("checkout", {
        title: "Checkout Cart",
        description: "Proceed to checkout with current cart items",
        inputSchema: {
          paymentMethod: z.enum(["credit", "debit", "paypal"])
        }
      }, async ({ paymentMethod }) => {
        const order = await checkoutService.processCart(cartId, paymentMethod);
        return {
          content: [{ type: "text", text: \`Order \${order.id} created successfully\` }]
        };
      });
    }

    // Cleanup when component unmounts
    return () => {
      addToCartTool.remove();
      removeFromCartTool.remove();
      checkoutTool?.remove();
    };
  }, [cartId, items.length]); // Re-register when cart changes

  return null;
}

// Product page tools
function ProductPageTools({ product, isAdmin }) {
  useEffect(() => {
    const tools = [];

    // Customer tools
    tools.push(
      server.registerTool("getProductDetails", {
        title: "Get Product Details",
        description: \`Get detailed information about \${product.name}\`,
        inputSchema: {}
      }, async () => ({
        content: [{ type: "text", text: JSON.stringify(product, null, 2) }]
      }))
    );

    // Admin-only tools
    if (isAdmin) {
      tools.push(
        server.registerTool("updateProduct", {
          title: "Update Product",
          description: \`Update \${product.name} details\`,
          inputSchema: {
            name: z.string().optional(),
            price: z.number().optional(),
            description: z.string().optional()
          }
        }, async (updates) => {
          await productService.update(product.id, updates);
          return {
            content: [{ type: "text", text: "Product updated successfully" }]
          };
        }),

        server.registerTool("deleteProduct", {
          title: "Delete Product",
          description: \`Delete \${product.name} permanently\`,
          inputSchema: {}
        }, async () => {
          await productService.delete(product.id);
          return {
            content: [{ type: "text", text: "Product deleted successfully" }]
          };
        })
      );
    }

    return () => tools.forEach(tool => tool.remove());
  }, [product.id, isAdmin]);

  return null;
}

// Usage in your app
function EcommerceApp() {
  const { user, cart } = useAppState();
  
  return (
    <Routes>
      <Route path="/cart" element={
        <>
          <CartPage />
          <ShoppingCartTools cartId={cart.id} items={cart.items} />
        </>
      } />
      <Route path="/product/:id" element={
        <>
          <ProductPage />
          <ProductPageTools 
            product={currentProduct} 
            isAdmin={user.role === 'admin'} 
          />
        </>
      } />
    </Routes>
  );
}`}
        />

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          In the example above, each React component manages its own tool lifecycle. Mount the
          component, register the tools; unmount it, clean them up. The cart page exposes
          `addToCart` and `removeFromCart`. Navigate away? Those tools disappear. Hit a product page
          as an admin? You get `updateProduct` and `deleteProduct` that regular users never see.
          It's basically the same pattern we use for UI state management, but applied to LLM
          capabilities. No more giving your model 100 tools and hoping it picks the right one. We
          treat the model with the same respect we give to the user.
        </p>

        <h3 className="text-lg sm:text-2xl font-bold mt-6 sm:mt-10 lg:mt-12 mb-3 sm:mb-6">
          Tool Caching Control
        </h3>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Most tools for a website are included in the MCP-B context window so long as they are on
          the active tab. This is another way to limit the amount of tools the model can see at any
          given time. However, websites can tell the MCP-B client to cache their tools and it will
          navigate back to the website which owns them on cached tool call. This is so the model can
          know, "Hey x website has tools and it will have more tools when I navigate to it."
        </p>

        <img src={GIF2} alt="Tool Caching Demo" className="w-full h-auto rounded-lg" />

        <CodeBlock
          language="javascript"
          code={`// Mark a tool as cacheable
server.registerTool("globalAction", {
  title: "Global Action",
  description: "Available everywhere",
  annotations: {
    cache: true  // This tool persists across tabs
  }
}, handler);

// Regular tool (removed when tab becomes inactive)  
server.registerTool("pageSpecific", {
  title: "Page Specific Action", 
  description: "Only available on this page"
  // No cache annotation = not cached
}, handler);`}
        />

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          Remote MCP vs Browser MCP
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          At this point you might be asking, isn't this what remote MCP is supposed to solve? Why
          are we doing it in the browser?
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Well that's a fair point. Remote MCPs have the added benefit of being able to be used by
          remote servers that don't need a human in the loop. But actually, they don't. The OAuth2.1
          spec is required in the remote MCP server implementation and it's basically only useable
          by local clients like Claude desktop at the moment. It's my personal belief that we as an
          industry have really put the cart before the ox on agentic workflows. The Mantra repeated
          by silicon valley has been If we just give these agents all the tools they need, they will
          reliably be able to automate entire workflows.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Are you aware of any serious remote MCP's that allow you to write or delete important data
          from a multi-tenant app? Basically all remote MCPs and most MCPs in general that operate
          on user data are read only.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The models just simply are not there yet and for any important work, humans are needed in
          the loop. I'm not saying that autonomous cloud agents are not the future, but they
          definitely aren't the present or near future.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The beauty of treating the browser as both the UI for the human and LLM is the human can
          see exactly what the agent is doing. MCP-B does this important work where the important
          work is already happening.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          The Auth problem
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          At this point, the auth issues with MCP are well known. OAuth2.1 is great, but we are
          basically trying to re-invent auth for agents that act on behalf of the user. This is a
          good long term goal, but we are quickly realizing that LLM sessions with no
          distinguishable credentials of their own are difficult to authorize and will require a
          complete re-imagining of our authorization systems. Data leakage in multi-tenant apps that
          have MCP servers is just not a solved problem yet.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          I think a very strong case for MCP is to limit the amount of damage the model can do and
          the amount of data it will ever have access to. The nice thing about client side APIs in
          multi-tenant apps is they are hopefully already scoped to the user. If we just give the
          model access to that, there's not much damage they can do.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          It's also worth mentioning that OAuth2.1 is basically incompatible with internal Auth at
          Amazon (where I work). I won't go to much into this, but the implications of this reach
          beyond Amazon internal.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          Security & Trust Model
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          MCP-B definitely has security risks, but the ones that are not risks internal to the
          protocol itself are well known:
        </p>

        <h3 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4">
          For Websites:
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>You only expose tools you'd already expose as buttons/forms</li>
          <li>Tools run in your page's context with your existing auth</li>
          <li>You control what tools are available based on user state</li>
          <li>Support for MCP's elicitation protocol for sensitive operations</li>
        </ul>

        <h3 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4">For Users:</h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>Extensions already require trust when installed</li>
          <li>All tool calls are explicit and auditable</li>
          <li>You can see exactly what sites expose what tools</li>
          <li>The human is in the loop (for now)</li>
        </ul>

        <h3 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4">
          For Developers:
        </h3>

        <div className="my-6 sm:my-12 lg:my-16 not-prose">
          <CodeBlock
            language="typescript"
            code={`// Tools can be scoped to components
function AdminPanel({ user }) {
  const { registerTool } = useMcpServer();
  
  useEffect(() => {
    if (!user.isAdmin) return;
    
    const unregister = server.registerTool('deleteUser', {
      description: 'Delete a user account',
      // This tool only exists while admin panel is mounted
    });
    
    return () => unregister();
  }, [user.isAdmin]);
}`}
          />
        </div>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          If a website wants to expose a "delete all user data" tool, that's on them. It's no
          different than putting a big red delete button on the page. MCP-B just makes these
          capabilities accessible to the LLM as well. I plan to add support for elicitation ASAP
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          Try it in 5 Minutes
        </h2>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-4 sm:p-8 my-6 sm:my-8">
          <ol className="space-y-3 sm:space-y-4">
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </span>
              <div>
                <p className="font-semibold mb-1 text-sm sm:text-base">Install the extension:</p>
                <a
                  href="https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline break-words"
                >
                  <Store className="w-4 h-4" />
                  Chrome Web Store
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </li>

            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </span>
              <div>
                <p className="font-semibold mb-1 text-sm sm:text-base">Add to your website:</p>
                <pre className="bg-gray-900 text-gray-100 p-2 sm:p-3 rounded-md overflow-x-auto text-xs sm:text-sm">
                  <code className="whitespace-pre-wrap break-words">
                    npm install @mcp-b/transports @modelcontextprotocol/sdk zod
                  </code>
                </pre>
              </div>
            </li>

            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </span>
              <div>
                <p className="font-semibold mb-3 text-sm sm:text-base">Expose a tool:</p>
                <CodeBlock
                  language="typescript"
                  code={`import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer({
  name: 'my-app',
  version: '1.0.0'
});

server.tool('sayHello', 'Says hello', {
  name: z.string()
}, async ({ name }) => ({
  content: [{ type: 'text', text: \`Hello \${name}!\` }]
}));

await server.connect(new TabServerTransport({ allowedOrigins: ['*'] }));`}
                />
              </div>
            </li>

            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                4
              </span>
              <p className="text-sm sm:text-base">
                Visit your site and click the MCP-B extension, go to the MCP server tab and click on
                your tool
              </p>
            </li>
          </ol>
        </div>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8 break-words">
          Why Not Computer Use or Browser Automation?
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          <a
            href="https://www.dwarkesh.com/p/timelines-june-2025"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
          >
            Dwarkesh Patel recently wrote
          </a>{' '}
          what we're all thinking about computer use:
        </p>
        <blockquote>
          <p>"It works great until it doesn't work at all. Then it's worse than useless."</p>
        </blockquote>
        <p>
          He benchmarked it - 44 seconds and $4-5 to do a simple search. That's not a tool, that's a
          very expensive party trick.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          There are several players trying to solve browser automation for AI:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>
            <a
              href="https://github.com/microsoft/playwright-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
            >
              Playwright MCP
            </a>
          </li>
          <li>
            <a
              href="https://browsermcp.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
            >
              BrowserMCP
            </a>
          </li>
          <li>
            <a
              href="https://www.diabrowser.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
            >
              Dia
            </a>
          </li>
          <li>Anthropic's own computer use</li>
        </ul>
        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Playwright MCP is the smartest of the bunch - they use accessibility trees instead of
          pixels. But here's the thing: they're all betting on the same losing horse. They're
          assuming models will eventually be so good they can just... figure it out. Navigate any
          UI, understand any layout, click the right button every time.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          This is the AGI fantasy all over again. We're building tools for the models we wish we
          had, not the models we actually have.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          Dwarkesh nails it:
        </p>
        <blockquote>
          <p>"Computers have APIs. Computers call APIs. That's what computers do."</p>
        </blockquote>
        <p>So why are we teaching them to cosplay as humans clicking buttons?</p>
        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          Think about what these approaches are really asking:
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6 min-w-0 overflow-hidden">
          <li>Computer use: "Parse these pixels and figure out what to click"</li>
          <li>Playwright MCP: "Here's an accessibility tree, figure out what to click"</li>
          <li>
            MCP-B: "Here's a function called <code>addToCart()</code>, call it"
          </li>
        </ul>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          One of these is not like the others.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          Look at the latency difference Dwarkesh measured:
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6 min-w-0 overflow-hidden">
          <li>Computer use: 10-20 seconds per action (44 seconds for a simple task)</li>
          <li>Playwright MCP: 1-2 seconds per action</li>
          <li>MCP-B: Milliseconds (it's just a function call)</li>
        </ul>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          But speed isn't even the main advantage. The real win is determinism. When you call{' '}
          <code>shop.addToCart({`{id: "abc123", quantity: 2}`})</code>, it either works or throws a
          specific error. When you try to click a button, you're hoping the UI hasn't changed, the
          element loaded, the viewport is right, and a dozen other things outside your control.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6 break-words hyphens-auto">
          MCP-B is an admission that AGI is not happening tomorrow. If we're serious about
          automating parts of white collar work, we need to build out the infrastructure for it.
          LLMs work best with text and function calls, not pretending to be humans with mice. MCP-B
          lays the foundation for LLMs to automate the browser the way computers are meant to -
          through APIs.
        </p>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          What can MCP-B do right now?
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          The MCP-B extension ships with a chat client with access to all of the MCP extension tools
          and a Model inspector type UI that allows you to see the active tool list and call them
          with manually inputed arguments. I only support tools at the moment. but supporting the
          entire spec is probably only one ClaudeCode session away. In terms of extension tools, I
          spiked on bulk generating them from chromes documentation with the bulk request api from
          Anthropic. It worked really well. The tools are open source and MCP-B Ships with the
          following tools
        </p>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 my-4 sm:my-6">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            The full list of open source tools can be found in the{' '}
            <a
              href="https://www.npmjs.com/package/@mcp-b/extension-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
            >
              @mcp-b/extension-tools
            </a>{' '}
            package.
          </p>
        </div>

        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-14 lg:mt-16 mb-4 sm:mb-8">
          The future of MCP-B
        </h2>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          As of today, the extension is open source. I think if I am going to ask website developers
          to interface with an extension for their functionality to work, it needs to be open.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          I want to just build a really solid MCP-host and developer tools. I currently have a
          simple chat application in the extension and a model-inspector like tab as well, but I'd
          prefer to just have it be a thin UI and a thick backend (inside the extension) for tool
          and context management. The extension transport allows other extensions to connect to the
          MCP-B extension as a client and I am also working with the guys from{' '}
          <a
            href="https://github.com/MiguelsPizza/WebMCP"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
          >
            chrome-mcp
          </a>{' '}
          to make it so you can connect MCP-B to local MCP hosts over native ports in a standardized
          way.
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          If you are at all familiar with the dApp extensions in the crypto space, you know that
          multiple clients injecting the same thing into the user's tab is bad news for everyone.
          I'd prefer that other extensions connect to MCP-B directly instead of injecting their own
          tab clients. (This is probably naïve though)
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          Either way, we are going to need an open standard and we can take the crypto space as an
          example of what not to do (looking at you MetaMask)
        </p>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          You can find the the transports and React hooks today:
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>
            <a
              href="https://www.npmjs.com/package/@mcp-b/transports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-words"
            >
              <strong>@mcp-b/transports</strong>
            </a>{' '}
            - The core transport implementations
          </li>
        </ul>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          There a still a couple of things that need to be ironed out on the protocol:
        </p>

        <ul className="list-disc pl-4 sm:pl-6 space-y-2 mb-4 sm:mb-6">
          <li>Figure out how to opt into tool caching and wether to cache by default</li>
          <li>
            Figure out how to delay execution of cached tools that take time to register when the
            url is visited
          </li>
          <li>
            Determine wether tool filtering should happen in the client side or be a list the
            clients can send to the server
          </li>
          <li>A security sign off from someone who actually knows security</li>
        </ul>

        <p className="leading-relaxed sm:leading-loose text-sm sm:text-lg mb-3 sm:mb-6">
          At the moment, MCP-B extension collects 0 user data and the only API endpoint it interacts
          with is my chat endpoint. I plan to keep it that way. It's not a product, it's a bridge.
          If you own a "chatGPT in the sidebar" application, let me know, I'll help hook it up to
          MCP-B.
        </p>

        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-8 my-6 sm:my-8 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Get Involved</h3>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="font-semibold mb-2 text-sm sm:text-base">Website owners:</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                Try adding MCP to your site. Takes 5 minutes. Download the extension, add server to
                your page and register it with a TabServerTransport
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2 text-sm sm:text-base">Extension developers:</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                Build on top of MCP-B. If you already have an MCP client in your extension, your job
                is really easy. If not, you can see how I did it with assistant UI.
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-purple-200 dark:border-purple-800">
            <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm sm:text-base">
              Want to test it out on your website? Reach out:
            </p>
            <a
              href="mailto:alexnahasdev@gmail.com"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline font-semibold break-words"
            >
              alexnahasdev@gmail.com
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;

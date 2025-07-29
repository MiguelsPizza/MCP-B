import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';


// User interface
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Constants
const USERS_STORAGE_KEY = 'users-mcp-data';



// Helper functions
export async function loadUsers(): Promise<User[]> {
  try {
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersData) {
      return [];
    }
    const users = JSON.parse(usersData);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error loading users from localStorage:', error);
    return [];
  }
}


const users = await loadUsers();

export async function getUserById(id: number): Promise<User | null> {
  return users.find(u => u.id === id) || null;
}


export async function saveUsers(users: User[]): Promise<void> {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
    throw new Error('Failed to save users to localStorage');
  }
}

export async function createUser(userData: {
  name: string;
  email: string;
  address: string;
  phone: string;
}): Promise<number> {
  const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  
  users.push({ id, ...userData });
  await saveUsers(users);
  
  return id;
}

export async function deleteUser(id: number): Promise<User | null> {
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return null;
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  await saveUsers(users);
  
  return deletedUser;
}

export async function clearAllUsers(): Promise<number> {
  const count = users.length;
  
  await saveUsers([]);
  
  return count;
}

// Helper function to generate fake user data
function generateFakeUser(): Omit<User, 'id'> {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'];
  const streets = ['Main St', 'Oak Ave', 'Park Rd', 'First St', 'Second St', 'Elm St', 'Cedar Ave', 'Pine St'];
  const cities = ['Springfield', 'Franklin', 'Georgetown', 'Clinton', 'Madison', 'Washington', 'Arlington', 'Salem'];
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];

  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: `${Math.floor(Math.random() * 9999) + 1} ${street}, ${city}, ${state} ${Math.floor(Math.random() * 90000) + 10000}`
  };
}

// Helper function to create a user using the existing tooling
async function createUserWithData(userData: Omit<User, 'id'>): Promise<User> {
  const id = await createUser(userData);
  return { id, ...userData };
}




// USERS MCP SERVER
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "users-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Create a new user
  server.tool(
    'create_user',
    {
      name: z.string().describe('Full name of the user'),
      email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email address").describe('Email address of the user'),
      phone: z.string().describe('Phone number of the user'),
      address: z.string().describe('Physical address of the user')
    },
    async ({ name, email, phone, address }) => {
      console.log(`👤 Users: Creating user ${name}`);
      
      try {
        const users = await loadUsers();
        
        // Check if email already exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          return {
            content: [{
              type: 'text',
              text: `❌ A user with email "${email}" already exists.`
            }]
          };
        }

        const user = await createUserWithData({ name, email, phone, address });
        
        return {
          content: [{
            type: 'text',
            text: `✅ User created successfully!\n\n👤 **${user.name}**\n📧 ${user.email}\n📞 ${user.phone}\n🏠 ${user.address}\n🆔 ID: ${user.id}`
          }]
        };
      } catch (error) {
        console.error('Failed to create user:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Create a random user
  server.tool(
    'create_random_user',
    {
      count: z.number().min(1).max(10).default(1).describe('Number of random users to create (1-10)')
    },
    async ({ count = 1 }) => {
      console.log(`👤 Users: Creating ${count} random user(s)`);
      
      try {
        const users = await loadUsers();
        const createdUsers: User[] = [];
        
        for (let i = 0; i < count; i++) {
          const fakeData = generateFakeUser();
          // Ensure email uniqueness
          let attempts = 0;
          while (users.some(u => u.email === fakeData.email) && attempts < 10) {
            Object.assign(fakeData, generateFakeUser());
            attempts++;
          }
          
          const user = await createUserWithData(fakeData);
          createdUsers.push(user);
        }
        
        const usersList = createdUsers.map(user => 
          `👤 **${user.name}** (${user.email})`
        ).join('\n');
        
        return {
          content: [{
            type: 'text',
            text: `✅ Successfully created ${count} random user(s):\n\n${usersList}`
          }]
        };
      } catch (error) {
        console.error('Failed to create random users:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create random users: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Get all users
  server.tool(
    'get_all_users',
    {},
    async () => {
      console.log(`👤 Users: Getting all users`);
      
      try {
        const users = await loadUsers();
        
        if (users.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `📋 No users found. Create some users first!`
            }]
          };
        }

        const usersList = users.map(user => 
          `👤 **${user.name}** (ID: ${user.id})\n📧 ${user.email}\n📞 ${user.phone}\n🏠 ${user.address}`
        ).join('\n\n---\n\n');

        return {
          content: [{
            type: 'text',
            text: `📋 All Users (${users.length} total):\n\n${usersList}`
          }]
        };
      } catch (error) {
        console.error('Failed to get users:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );


  server.tool(
    'get_user_by_id',
    {
      id: z.number().describe('User ID to get')
    },
    async ({ id }) => {
      console.log(`👤 Users: Getting user by id ${id}`);
      
      try {
        const user = await getUserById(id);
        
        if (!user) {
          return {
            content: [{
              type: 'text',
              text: `📋 No user found with id ${id}`
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: `📋 User with id ${id}:\n\n${user.name}\n📧 ${user.email}\n📞 ${user.phone}\n🏠 ${user.address}`
          }]
        };
      } catch (error) {
        console.error('Failed to get user by id:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to get user by id: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Delete a user
  server.tool(
    'delete_user',
    {
      id: z.number().describe('User ID to delete')
    },
    async ({ id }) => {
      console.log(`👤 Users: Deleting user ${id}`);
      
      try {
        const deletedUser = await deleteUser(id);
        
        if (!deletedUser) {
          return {
            content: [{
              type: 'text',
              text: `❌ User with ID "${id}" not found.`
            }]
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: `✅ User "${deletedUser.name}" (${deletedUser.email}) has been deleted.`
          }]
        };
      } catch (error) {
        console.error('Failed to delete user:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Clear all users
  server.tool(
    'clear_all_users',
    {},
    async () => {
      console.log(`👤 Users: Clearing all users`);
      
      try {
        const count = await clearAllUsers();
        
        return {
          content: [{
            type: 'text',
            text: `✅ All ${count} users have been cleared.`
          }]
        };
      } catch (error) {
        console.error('Failed to clear users:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to clear users: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  return server;
}


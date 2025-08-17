import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, notionApiToken, notionDatabaseId, todos } = await req.json();
    
    console.log('Notion sync request:', { action });

    if (!notionApiToken || !notionDatabaseId) {
      throw new Error('Notion API token and database ID are required');
    }

    switch (action) {
      case 'sync-todos-to-notion':
        return await syncTodosToNotion(notionApiToken, notionDatabaseId, todos);
      case 'get-todos-from-notion':
        return await getTodosFromNotion(notionApiToken, notionDatabaseId);
      case 'test-connection':
        return await testNotionConnection(notionApiToken, notionDatabaseId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in notion-sync function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testNotionConnection(notionApiToken: string, notionDatabaseId: string) {
  console.log('Testing Notion connection...');
  
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const database = await response.json();
    console.log('Notion connection successful:', database.title);

    return new Response(JSON.stringify({ 
      success: true, 
      database: {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled',
        url: database.url
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Notion connection test failed:', error);
    throw error;
  }
}

async function syncTodosToNotion(notionApiToken: string, notionDatabaseId: string, todos: any[]) {
  console.log('Syncing todos to Notion:', todos.length);
  
  // First, get the database schema to check available properties
  const schemaResponse = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${notionApiToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  });

  if (!schemaResponse.ok) {
    const errorText = await schemaResponse.text();
    console.error('Failed to get database schema:', errorText);
    throw new Error(`Notion API error: ${schemaResponse.status} - ${errorText}`);
  }

  const schema = await schemaResponse.json();
  const properties = schema.properties;
  console.log('Available properties for sync:', Object.keys(properties));
  
  const results = [];
  
  for (const todo of todos) {
    try {
      const notionPage: any = {
        parent: { database_id: notionDatabaseId },
        properties: {}
      };

      // Find title/name property - try exact match first, then case-insensitive
      let titlePropertyName = null;
      let titleProperty = null;
      
      // Try exact property name matches
      const titleKeys = ['專案名稱', 'Name', 'name', 'Title', 'title', '名稱', '標題'];
      for (const key of titleKeys) {
        if (properties[key]) {
          titlePropertyName = key;
          titleProperty = properties[key];
          break;
        }
      }
      
      // If no exact match, find by type
      if (!titlePropertyName) {
        titlePropertyName = Object.keys(properties).find(key => {
          const prop = properties[key];
          return prop.type === 'title';
        });
        if (titlePropertyName) {
          titleProperty = properties[titlePropertyName];
        }
      }
      
      if (titlePropertyName && titleProperty) {
        if (titleProperty.type === 'title') {
          notionPage.properties[titlePropertyName] = {
            title: [
              {
                text: {
                  content: todo.content || 'Untitled'
                }
              }
            ]
          };
        } else if (titleProperty.type === 'rich_text') {
          notionPage.properties[titlePropertyName] = {
            rich_text: [
              {
                text: {
                  content: todo.content || 'Untitled'
                }
              }
            ]
          };
        }
      }

      // Add Status property if it exists
      if (properties['Status'] || properties['status']) {
        const statusProperty = properties['Status'] || properties['status'];
        const propertyName = Object.keys(properties).find(key => 
          key.toLowerCase() === 'status'
        ) || 'Status';
        
        if (statusProperty.type === 'select') {
          notionPage.properties[propertyName] = {
            select: {
              name: todo.done ? 'Done' : 'Not started'
            }
          };
        } else if (statusProperty.type === 'checkbox') {
          notionPage.properties[propertyName] = {
            checkbox: todo.done
          };
        }
      }

      // Add scheduled date if available - try to find date property
      if (todo.scheduledDate) {
        for (const [propName, propConfig] of Object.entries(properties)) {
          if (propConfig.type === 'date') {
            notionPage.properties[propName] = {
              date: {
                start: todo.scheduledDate
              }
            };
            break; // Use first date property found
          }
        }
      }

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(notionPage),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create Notion page for todo:', todo.id, errorText);
        results.push({ id: todo.id, success: false, error: errorText });
      } else {
        const createdPage = await response.json();
        console.log('Created Notion page for todo:', todo.id, createdPage.id);
        results.push({ id: todo.id, success: true, notionPageId: createdPage.id });
      }
    } catch (error) {
      console.error('Error syncing todo to Notion:', todo.id, error);
      results.push({ id: todo.id, success: false, error: error.message });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getTodosFromNotion(notionApiToken: string, notionDatabaseId: string) {
  console.log('Getting todos from Notion...');
  
  try {
    // First, get the database schema to check available properties
    const schemaResponse = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    });

    if (!schemaResponse.ok) {
      const errorText = await schemaResponse.text();
      console.error('Failed to get database schema:', errorText);
      throw new Error(`Notion API error: ${schemaResponse.status} - ${errorText}`);
    }

    const schema = await schemaResponse.json();
    const properties = schema.properties;
    console.log('Available properties:', Object.keys(properties));

    // Build query body - only add sorts if we have a suitable property
    const queryBody: any = {};
    
    // Try to find a suitable sort property (created_time, Created time, or last_edited_time)
    const sortableProps = ['Created time', 'created_time', 'Last edited time', 'last_edited_time'];
    const availableSortProp = sortableProps.find(prop => properties[prop]);
    
    if (availableSortProp) {
      queryBody.sorts = [
        {
          property: availableSortProp,
          direction: 'descending'
        }
      ];
      console.log('Using sort property:', availableSortProp);
    } else {
      console.log('No suitable sort property found, querying without sorting');
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(queryBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to query Notion database:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Retrieved Notion pages:', data.results.length);

    const todos = data.results.map((page: any) => {
      const pageProperties = page.properties;
      
      // Find the title/name property dynamically
      const titleProperty = Object.keys(pageProperties).find(key => {
        const prop = pageProperties[key];
        return prop.type === 'title' || key.toLowerCase() === 'name' || key.toLowerCase() === 'title';
      });
      
      // Find the status property dynamically
      const statusProperty = Object.keys(pageProperties).find(key => {
        return key.toLowerCase() === 'status';
      });
      
      // Find the date property dynamically
      const dateProperty = Object.keys(pageProperties).find(key => {
        const prop = pageProperties[key];
        return prop.type === 'date' || key.toLowerCase() === 'date';
      });
      
      // Find the created time property dynamically
      const createdTimeProperty = Object.keys(pageProperties).find(key => {
        const prop = pageProperties[key];
        return prop.type === 'created_time' || key.toLowerCase().includes('created');
      });
      
      // Extract content
      let content = 'Untitled';
      if (titleProperty && pageProperties[titleProperty]) {
        const titleProp = pageProperties[titleProperty];
        if (titleProp.title && titleProp.title[0]) {
          content = titleProp.title[0].plain_text;
        } else if (titleProp.rich_text && titleProp.rich_text[0]) {
          content = titleProp.rich_text[0].plain_text;
        }
      }
      
      // Extract status
      let done = false;
      if (statusProperty && pageProperties[statusProperty]) {
        const statusProp = pageProperties[statusProperty];
        if (statusProp.select) {
          done = statusProp.select.name === 'Done' || statusProp.select.name === '完成';
        } else if (statusProp.checkbox !== undefined) {
          done = statusProp.checkbox;
        }
      }
      
      // Extract scheduled date
      let scheduledDate = null;
      if (dateProperty && pageProperties[dateProperty] && pageProperties[dateProperty].date) {
        scheduledDate = pageProperties[dateProperty].date.start;
      }
      
      // Extract created time
      let createdAt = page.created_time;
      if (createdTimeProperty && pageProperties[createdTimeProperty]) {
        createdAt = pageProperties[createdTimeProperty].created_time || createdAt;
      }
      
      return {
        id: `notion-${page.id}`,
        content,
        done,
        createdAt,
        scheduledDate,
        notionPageId: page.id,
        notionUrl: page.url
      };
    });

    return new Response(JSON.stringify({ todos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting todos from Notion:', error);
    throw error;
  }
}
#!/usr/bin/env node

import { GraphQLClient } from 'graphql-request';

const apiKey = process.env.TWENTY_API_KEY;
const baseUrl = process.env.TWENTY_BASE_URL || 'https://twenty.app.jezweb.com';

const client = new GraphQLClient(`${baseUrl}/graphql`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});

// Try different metadata queries to find the right one
const queries = [
  { name: 'objects', query: '{ objects { edges { node { id nameSingular namePlural } } } }' },
  { name: 'objectMetadatas', query: '{ objectMetadatas { edges { node { id nameSingular namePlural } } } }' },
  { name: '__schema', query: '{ __schema { types { name fields { name type { name } } } } }' }
];

async function testQueries() {
  for (const { name, query } of queries) {
    try {
      console.log(`\n🔍 Testing query: ${name}`);
      const result = await client.request(query);
      console.log(`✅ SUCCESS for ${name}:`, JSON.stringify(result, null, 2));
      break; // Stop at first successful query
    } catch (error) {
      console.log(`❌ FAILED for ${name}:`, error.message);
    }
  }
}

testQueries().catch(console.error);
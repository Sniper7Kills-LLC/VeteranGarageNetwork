import { defineFunction } from '@aws-amplify/backend';

export const getStats = defineFunction({
  name: 'getStats',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    USER_POOL_ID: process.env.AMPLIFY_AUTH_USERPOOL_ID || '',
  },
});

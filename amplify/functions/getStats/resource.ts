import { defineFunction } from '@aws-amplify/backend';

export const getStats = defineFunction({
  name: 'getStats',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    // This will be populated by backend.ts
  },
});

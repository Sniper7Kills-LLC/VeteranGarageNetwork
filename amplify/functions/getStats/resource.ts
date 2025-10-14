import { defineFunction } from '@aws-amplify/backend';

export const getStats = defineFunction({
  name: 'getStats',
  entry: './handler.ts',
  environment: {
    // This will be populated by backend.ts
  },
});

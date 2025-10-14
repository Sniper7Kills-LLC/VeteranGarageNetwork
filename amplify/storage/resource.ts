import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'vgnEventImages',
  access: (allow) => ({
    'event-images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['admin']).to(['read', 'write', 'delete'])
    ]
  })
});

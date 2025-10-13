import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      facebook: {
        clientId: secret('FACEBOOK_CLIENT_ID'),
        clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
      },
      callbackUrls: [
        'http://localhost:5173/profile',
        'https://veterangaragenetwork.com/profile',
        'https://www.veterangaragenetwork.com/profile'
      ],
      logoutUrls: ['http://localhost:5173/', 'https://veterangaragenetwork.com', 'https://www.veterangaragenetwork.com'],
    }
  },
});

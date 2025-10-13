import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { CLUB_TYPE_VALUES } from '../config/enums';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Club: a
    .model({
      // Basic Fields
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      type: a.enum(CLUB_TYPE_VALUES),
      
      // Admin & System Fields
      approved: a.boolean().default(false).authorization((allow) => [
        allow.authenticated().to(['create']),
        allow.groups(['admin']).to(['read', 'update']),
      ]),
      // NOTE: 'owners' is an array of Cognito User Pool 'sub' identifiers
      // Supports multiple owners for a single club
      // Must be manually populated on creation and managed by the application
      owners: a.string().array().authorization((allow) => [
        allow.guest().to(['read']),
        allow.authenticated().to(['read', 'create']),
        allow.ownersDefinedIn('owners').to(['read','update']),
        allow.groups(['admin']).to(['read', 'update'])
      ]),
      
      // Special Notes for Approval
      notes: a.string().authorization((allow)=>[
        allow.groups(['admin']).to(['read', 'update']), 
        allow.authenticated().to(['create'])
      ]),
      
      // Relationships
      chapters: a.hasMany('ClubChapter', 'clubId'),
      shopAssociations: a.hasMany('ClubAssociation', 'clubId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read','create']),
    ]),

  ClubChapter: a
    .model({
      // Basic Fields
      id: a.id().required(),      
      name: a.string().required(),
      description: a.string(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      // Required for Map Placement
      latitude: a.float().required(),
      longitude: a.float().required(),

      // Admin & System Fields
      approved: a.boolean().default(false).authorization((allow) => [
        allow.authenticated().to(['create']),
        allow.groups(['admin']).to(['read', 'update']),
      ]),
      // NOTE: 'owners' is an array of Cognito User Pool 'sub' identifiers
      // Supports multiple owners for a single chapter
      // Must be manually populated on creation and managed by the application
      owners: a.string().array().authorization((allow) => [
        allow.guest().to(['read']),
        allow.authenticated().to(['read', 'create']),
        allow.ownersDefinedIn('owners').to(['read','update']),
        allow.groups(['admin']).to(['read', 'update'])
      ]),

      // Special Notes for Approval
      notes: a.string().authorization((allow)=>[
        allow.groups(['admin']).to(['read', 'update']), 
        allow.authenticated().to(['create'])
      ]),

      // Relationships
      clubId: a.id().required(),
      club: a.belongsTo('Club', 'clubId'),
      roles: a.hasMany('ChapterRole', 'chapterId'),
      chapterAssociations: a.hasMany('ChapterAssociation', 'chapterId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read','create']),
    ]),

  ChapterRole: a
    .model({
      // Basic Fields
      id: a.id().required(),    
      roleTitle: a.string().required(),
      personName: a.string().required(),
      email: a.email().authorization((allow)=> [
        allow.authenticated().to(['read', 'create'])
      ]),
      phone: a.phone().authorization((allow)=> [
        allow.authenticated().to(['read', 'create'])
      ]),

      // Admin & System Fields
      owner: a.string().authorization((allow) => [
        allow.guest().to(['read']),
        allow.authenticated().to(['read']),
        allow.groups(['admin']).to(['read', 'update'])
      ]),

      // Relationships
      chapterId: a.id().required(),
      chapter: a.belongsTo('ClubChapter', 'chapterId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read','create']),
    ]),

  // ============================================================================
  // SHOPS & ASSOCIATIONS
  // ============================================================================

  Shop: a
    .model({
      // Basic Fields
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      
      // Location
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      latitude: a.float().required(),
      longitude: a.float().required(),
      
      // Contact Information
      phone: a.phone(),
      email: a.email(),
      website: a.url(),
      
      // Services - string array (AWS doesn't support enum arrays)
      services: a.string().array(),
      
      // Admin & System Fields
      approved: a.boolean().default(false).authorization((allow) => [
        allow.authenticated().to(['create']),
        allow.groups(['admin']).to(['read', 'update']),
      ]),
      // NOTE: 'owners' is an array of Cognito User Pool 'sub' identifiers
      // Supports multiple owners for a single shop
      // Must be manually populated on creation and managed by the application
      owners: a.string().array().authorization((allow) => [
        allow.guest().to(['read']),
        allow.authenticated().to(['read', 'create']),
        allow.ownersDefinedIn('owners').to(['read','update']),
        allow.groups(['admin']).to(['read', 'update'])
      ]),
      
      // Special Notes for Approval
      notes: a.string().authorization((allow)=>[
        allow.groups(['admin']).to(['read', 'update']), 
        allow.authenticated().to(['create'])
      ]),
      
      // Relationships
      clubAssociations: a.hasMany('ClubAssociation', 'shopId'),
      chapterAssociations: a.hasMany('ChapterAssociation', 'shopId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read','create']),
    ]),

  ClubAssociation: a
    .model({
      // Basic Fields
      id: a.id().required(),
      relationship: a.string().required(),
      details: a.string(),
      
      // Admin & System Fields
      approved: a.boolean().default(false).authorization((allow) => [
        allow.authenticated().to(['create']),
        allow.groups(['admin']).to(['read', 'update']),
      ]),
      // NOTE: 'owner' field is automatically managed by Amplify via allow.owner() authorization
      // It is populated with the user's Cognito User Pool 'sub' on record creation
      // Owners automatically get full CRUD access to their own records
      
      // Special Notes for Approval
      notes: a.string().authorization((allow)=>[
        allow.groups(['admin']).to(['read', 'update']), 
        allow.authenticated().to(['create'])
      ]),
      
      // Relationships
      shopId: a.id().required(),
      shop: a.belongsTo('Shop', 'shopId'),
      clubId: a.id().required(),
      club: a.belongsTo('Club', 'clubId'),
    })
    .authorization((allow) => [
      allow.owner(), // Automatically creates and manages 'owner' field with user's sub
      allow.guest().to(['read']),
      allow.authenticated().to(['read','create']),
    ]),

  ChapterAssociation: a
    .model({
      // Basic Fields
      id: a.id().required(),
      relationship: a.string().required(),
      details: a.string(),
      
      // Admin & System Fields
      approved: a.boolean().default(false).authorization((allow) => [
        allow.authenticated().to(['create']),
        allow.groups(['admin']).to(['read', 'update']),
      ]),
      // NOTE: 'owner' field is automatically managed by Amplify via allow.owner() authorization
      // It is populated with the user's Cognito User Pool 'sub' on record creation
      // Owners automatically get full CRUD access to their own records
      
      // Special Notes for Approval
      notes: a.string().authorization((allow)=>[
        allow.groups(['admin']).to(['read', 'update']), 
        allow.authenticated().to(['create'])
      ]),
      
      // Relationships
      shopId: a.id().required(),
      shop: a.belongsTo('Shop', 'shopId'),
      chapterId: a.id().required(),
      chapter: a.belongsTo('ClubChapter', 'chapterId'),
    })
    .authorization((allow) => [
      allow.owner(), // Automatically creates and manages 'owner' field with user's sub
      allow.guest().to(['read']),
      allow.authenticated().to(['read','create']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

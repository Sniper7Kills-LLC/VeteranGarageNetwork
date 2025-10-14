import { DynamoDBClient, ScanCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

const dynamoClient = new DynamoDBClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

// Cache for table names
let cachedTableNames: { chapterTable?: string; eventTable?: string } = {};

async function findTableNames() {
  if (cachedTableNames.chapterTable && cachedTableNames.eventTable) {
    return cachedTableNames;
  }

  const listTablesCommand = new ListTablesCommand({});
  const tablesResult = await dynamoClient.send(listTablesCommand);
  const tables = tablesResult.TableNames || [];

  // Find tables that match our model names
  const chapterTable = tables.find(name => name.includes('ClubChapter'));
  const eventTable = tables.find(name => name.includes('Event') && !name.includes('EventChapter'));

  if (!chapterTable || !eventTable) {
    throw new Error(`Could not find required tables. Found: ${tables.join(', ')}`);
  }

  cachedTableNames = { chapterTable, eventTable };
  return cachedTableNames;
}

export const handler = async () => {
  const userPoolId = process.env.USER_POOL_ID;

  if (!userPoolId) {
    throw new Error("Missing USER_POOL_ID environment variable");
  }

  // Find the table names dynamically
  const { chapterTable, eventTable } = await findTableNames();

  // Count ClubChapters
  const chapterScanCommand = new ScanCommand({
    TableName: chapterTable,
    Select: "COUNT",
  });
  const chapterResult = await dynamoClient.send(chapterScanCommand);
  const chapterCount = chapterResult.Count || 0;

  // Count Events
  const eventScanCommand = new ScanCommand({
    TableName: eventTable,
    Select: "COUNT",
  });
  const eventResult = await dynamoClient.send(eventScanCommand);
  const eventCount = eventResult.Count || 0;

  // Count Cognito Users
  let memberCount = 0;
  let paginationToken: string | undefined = undefined;
  
  do {
    const listUsersCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 60, // Max allowed per request
      PaginationToken: paginationToken,
    });
    
    const userResult = await cognitoClient.send(listUsersCommand);
    memberCount += userResult.Users?.length || 0;
    paginationToken = userResult.PaginationToken;
  } while (paginationToken);

  // Return the stats directly (no HTTP wrapper needed for Amplify Data queries)
  return {
    chapters: chapterCount,
    events: eventCount,
    members: memberCount,
    projects: 1337, // Placeholder until projects feature is implemented
  };
};

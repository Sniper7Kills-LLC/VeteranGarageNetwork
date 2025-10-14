import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { getStats } from './functions/getStats/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  getStats,
});

const getStatsLambda = backend.getStats.resources.lambda;
const userPoolId = backend.auth.resources.userPool.userPoolId;

// Add environment variables using CDK
if ('addEnvironment' in getStatsLambda) {
  (getStatsLambda as any).addEnvironment('USER_POOL_ID', userPoolId);
}

// Grant the Lambda function permission to list and scan DynamoDB tables
getStatsLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:ListTables', 'dynamodb:Scan', 'dynamodb:Query'],
    resources: ['*'],
  })
);

// Grant the Lambda function permission to list Cognito users
getStatsLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:ListUsers'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Allow unauthenticated and authenticated access to the getStats function
getStatsLambda.grantInvoke(
  backend.auth.resources.unauthenticatedUserIamRole
);
getStatsLambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

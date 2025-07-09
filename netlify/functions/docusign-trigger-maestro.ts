import type { Handler, HandlerEvent } from "@netlify/functions";
import docusign from 'docusign-esign';

// Note: This function requires the 'docusign-esign' package.
// If you haven't already, install it by running: npm install docusign-esign

interface RequestData {
  workflowId: string;
  claimantName: string;
  claimantEmail: string;
  // You can add any other input variables your Maestro workflow needs
  // For example:
  // propertyId: string;
  // claimAmount: number;
}

const responseHeaders = {
  "Content-Type": "application/json"
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { ...responseHeaders, 'Allow': 'POST' }
    };
  }

  try {
    if (!event.body) {
      throw new Error("Request body is missing.");
    }
    
    const requestData: RequestData = JSON.parse(event.body);
    const { workflowId, claimantName, claimantEmail } = requestData;

    if (!workflowId || !claimantName || !claimantEmail) {
      throw new Error("Missing workflowId, claimantName, or claimantEmail in the request body.");
    }

    console.log(`[Maestro Start] Triggering workflow: ${workflowId} for ${claimantEmail}`);

    // --- DocuSign API Client Initialization (same as other functions) ---
    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath('account-d.docusign.com');

    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const userId = process.env.DOCUSIGN_USER_ID;
    const privateKey = Buffer.from(process.env.DOCUSIGN_PRIVATE_KEY_BASE64!, 'base64').toString('ascii');
    
    if (!integrationKey || !userId || !privateKey) {
        console.error("Missing DocuSign environment variables.");
        throw new Error("DocuSign environment variables are not set up on Netlify.");
    }

    const consentScopes = ["signature", "impersonation"];
    
    const tokenResponse = await apiClient.requestJWTUserToken(
        integrationKey,
        userId,
        consentScopes,
        Buffer.from(privateKey),
        3600
    );
    
    const accessToken = tokenResponse.body.access_token;
    const accountInfo = await apiClient.getUserInfo(accessToken);
    const accountId = accountInfo.accounts[0].accountId;
    
    apiClient.setBasePath(`${accountInfo.accounts[0].baseUri}/restapi`);
    apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    
    // --- Trigger Maestro Workflow ---
    const workflowsApi = new docusign.WorkflowsApi(apiClient);
    
    const workflowInstance = {
      // The workflowId for the Maestro workflow you created in DocuSign
      workflowId: workflowId,
      instanceName: `Unclaimed Property Claim for ${claimantName}`,
      // These key-value pairs are the inputs for your workflow
      inputParameters: {
        // IMPORTANT: The keys here ('ClaimantName', 'ClaimantEmail') MUST
        // exactly match the names of the input variables in your Maestro workflow.
        ClaimantName: claimantName,
        ClaimantEmail: claimantEmail,
        // Pass any other data from the request body to the workflow
        ...requestData
      }
    };

    console.log("[DocuSign] Creating Maestro workflow instance...");
    const result = await workflowsApi.createWorkflowInstance(accountId, {
      triggerWorkflowInstanceRequest: workflowInstance
    });
    console.log(`[DocuSign] Workflow instance created successfully. Instance ID: ${result.instanceId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, instanceId: result.instanceId }),
      headers: responseHeaders,
    };

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error.response?.data?.message || error.message;
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
      headers: responseHeaders,
    };
  }
};

export { handler }; 
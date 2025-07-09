import type { Handler, HandlerEvent } from "@netlify/functions";
import docusign from 'docusign-esign';

// Note: This function requires the 'docusign-esign' package.
// If you haven't already, install it by running: npm install docusign-esign

interface TemplateRole {
  email: string;
  name: string;
  roleName: string;
}

interface RequestData {
  templateId: string;
  roles: TemplateRole[];
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
    
    const { templateId, roles }: RequestData = JSON.parse(event.body);

    if (!templateId || !roles || !roles.length) {
      throw new Error("Missing templateId or roles in the request body.");
    }

    console.log(`[Workflow Start] Received request for template: ${templateId}`);

    // --- DocuSign API Client Initialization ---
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
    
    // --- Envelope Creation from Template ---
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.templateId = templateId;
    
    // Assign recipients to the template roles
    const templateRoles = roles.map(role => {
      return docusign.TemplateRole.constructFromObject({
        email: role.email,
        name: role.name,
        roleName: role.roleName
      });
    });

    envelopeDefinition.templateRoles = templateRoles;
    envelopeDefinition.status = "sent"; // requests that the envelope be sent immediately

    // --- Send Envelope ---
    console.log("[DocuSign] Sending envelope from template...");
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const results = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    console.log(`[DocuSign] Envelope sent successfully. Envelope ID: ${results.envelopeId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, envelopeId: results.envelopeId }),
      headers: responseHeaders,
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: responseHeaders,
    };
  }
};

export { handler }; 
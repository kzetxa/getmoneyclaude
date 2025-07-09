import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import { docusign } from 'docusign-esign';

// --- Interfaces for Request Body ---
interface ClaimantData {
  firstName: string;
  lastName: string;
  email: string;
}
interface RequestData {
  pdfBase64: string;
  claimantData: ClaimantData;
}


// --- Main Function Logic ---
serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pdfBase64, claimantData }: RequestData = await req.json();

    if (!pdfBase64 || !claimantData) {
      throw new Error("Missing pdfBase64 or claimantData in the request body.");
    }
    
    console.log(`[Function Start] Received request for: ${claimantData.email}`);

    // --- DocuSign API Client Initialization ---
    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath('account-d.docusign.com'); // AUTH SERVER
    
    // You need to set these as environment variables in your Supabase project
    const integrationKey = Deno.env.get("DOCUSIGN_INTEGRATION_KEY");
    const userId = Deno.env.get("DOCUSIGN_USER_ID");
    const privateKey = Deno.env.get("DOCUSIGN_PRIVATE_KEY");
    
    if (!integrationKey || !userId || !privateKey) {
        console.error("Missing DocuSign environment variables.");
        throw new Error("DocuSign environment variables are not set.");
    }

    const consentScopes = ["signature", "impersonation"];
    
    console.log("[DocuSign Auth] Requesting access token...");
    const tokenResponse = await apiClient.requestJWTUserToken(
        integrationKey,
        userId,
        consentScopes,
        Buffer.from(privateKey), // The private key
        3600 // expires in 1 hour
    );
    
    const accessToken = tokenResponse.body.access_token;
    console.log("[DocuSign Auth] Access token obtained.");

    const accountInfo = await apiClient.getUserInfo(accessToken);
    const accountId = accountInfo.accounts[0].accountId;
    
    apiClient.setBasePath(`${accountInfo.accounts[0].baseUri}/restapi`);
    apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    
    console.log(`[DocuSign] API Base Path: ${apiClient.basePath}`);
    console.log(`[DocuSign] Account ID: ${accountId}`);

    // --- Envelope Creation ---
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = 'Please Sign Your Unclaimed Property Agreement';
    envelopeDefinition.status = 'sent'; // requests that the envelope be sent immediately.

    // Add the document
    const document = new docusign.Document();
    document.documentBase64 = pdfBase64;
    document.name = 'Standard_Investigator_Agreement.pdf';
    document.fileExtension = 'pdf';
    document.documentId = '1';
    envelopeDefinition.documents = [document];

    // Add the recipient
    const signer = docusign.Signer.constructFromObject({
        email: claimantData.email,
        name: `${claimantData.firstName} ${claimantData.lastName}`,
        recipientId: '1',
        clientUserId: `${claimantData.firstName}${claimantData.lastName}`.toLowerCase(), // Required for embedded signing
        tabs: docusign.Tabs.constructFromObject({
          // We can pre-place signature tabs if we know the location in the PDF
          // This requires knowing the x/y coordinates and page number.
          // For now, we will let DocuSign auto-place or rely on a template.
          signHereTabs: [
              docusign.SignHere.constructFromObject({
                  anchorString: '/s/', // This will search for the string '/s/' in the document to place a signature tab.
                  anchorXOffset: '1',
                  anchorYOffset: '0.5',
                  anchorUnits: 'inches',
              })
          ]
      })
    });
    envelopeDefinition.recipients = docusign.Recipients.constructFromObject({
        signers: [signer]
    });

    // --- Send Envelope ---
    console.log("[DocuSign] Sending envelope...");
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const results = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    console.log(`[DocuSign] Envelope sent successfully. Envelope ID: ${results.envelopeId}`);

    return new Response(JSON.stringify({ success: true, envelopeId: results.envelopeId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 
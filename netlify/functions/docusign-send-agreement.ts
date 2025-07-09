import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import docusign from 'docusign-esign';

// Note: This function requires the 'docusign-esign' package.
// Please install it by running: npm install docusign-esign

interface ClaimantData {
  firstName: string;
  lastName: string;
  email: string;
}

interface RequestData {
  pdfBase64: string;
  claimantData: ClaimantData;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' }
    };
  }

  try {
    if (!event.body) {
      throw new Error("Request body is missing.");
    }
    
    const { pdfBase64, claimantData }: RequestData = JSON.parse(event.body);

    if (!pdfBase64 || !claimantData) {
      throw new Error("Missing pdfBase64 or claimantData in the request body.");
    }

    console.log(`[Function Start] Received request for: ${claimantData.email}`);

    // --- DocuSign API Client Initialization ---
    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath('account-d.docusign.com');

	  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || "d7b01701-1cb3-42bc-b3f3-c08204bb5775";
	  const userId = process.env.DOCUSIGN_USER_ID || "7815dd60-f817-4c97-88f2-f55e7db94901";
    // Netlify's UI can't handle multi-line secrets well. It's recommended to Base64 encode
    // your private key and store that. Then, decode it in the function.
	  const base64String = process.env.DOCUSIGN_PRIVATE_KEY_BASE64 || "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBaHFUNWxPQ04zaXJlaFRUSWdHSmJyWE95RTI1VGE5RkJubTUyaU5QYkRoOXVxTkt0ClRJMFgyTTFOaU44T0QxQW0rYlMxLzBRU25rTk1LTDNzcDlKcU1RSzV3MEZSc0VXSzNEcUlla3FrMGVZMEwvbTEKVHdVYTFNZGhhNnhSdXNuSStSNCtYMVVxNUpOWElvVkZJWTBtaWJJTzdEdEF2MnZPWVlGWStkZ3JRRGRTMjM5cAovVmdYU2RuY0pmS0dETCsvTzNPd0ZTWEF6NnVIZ3ZTdFgweTJqM0xEU2NFVFFCV0dwY0JGaDZqK056QUp4L2plCnRPcUp2dTZKVGoxZUJiUTRmS2JDUWpYV3FSM3ZubDlmVFFqeHArUGlkaVdMdGhJcks5eVgvK1pPSlBZU2Rub2EKQ3FVLzBpbTJ0TXQwWHAvem9kL09kOEU1dk5mbDYvWklIYnNvUVFJREFRQUJBb0lCQUQrWi8zRlZiMzVTTnNHcQprTW1nYkpqdkRWL0RYakdRYTlRNGJ0S3NiSTNyeUJ5RVJDdGtmSzdETUF4bS9SKzdwMldOK09pSFVkb2poUDY3CjFHWGo3WmlRSm9xMnVLMHc5R3FhVmF5YXhPZUh2QUFyanZzd09KL3BQTG9kY0kvdzBIZm8wdUs2ZXVQMU81UkoKYXNIeUNKSERvK3Z3QTJKSXZQanZIa1lLMkVkaENSUzc2b0QwZ1ZFK1ZtTXZTa095K2J6Mm4wcmFsN2swcHFJcApHOTNEM1JvaWlRU0JmZDAvcUlZL3lCRFdkQnNBTWVUcUlSVDZ0R29ORDE2OFdsTUlvWWx4T3hPOXB4NFhvMkd6CmxjbGppNmRPUHYrUDZPeEs5bDBlajQxaEdON1A1YlU1YW53R1M5aXZ2aVFleE9KVXZXeUpwbE93a20yT1hETTUKL0g2enArOENnWUVBMmt0UUtILzNrSkp5ZVBoZXVGSjdXUzBXdHBuVXdzbkpWM3Q4bWI5NE1GMThnYjB2U2dhcAppdTF6aDNjVjBNeUhDTlVOL2R5M3FGL3A5Q3VFVHlCZ01kaHQ1R2xybmFHTlA5SWQ2MTEvY2dId3VrbHVMYyt2CkJ0YXRsRC9yZTNpK3RhK0JSKzNDU09YZjRTQjlGbm9PT0NxaHY0bHhjdDB5UFRlc1prM0U0SE1DZ1lFQW5lYkgKRkg4N3hEamdhTFhIL1BSSmxwWHBpQlZtclpyTzZLbGkxUlJySndiYU42WjVLanNNK2w1Zkk2WXppTExsSWFNTwpPTVNlV3NGdXFMSElITFRuS2E2MnV4bGJBMDBjNVFaenJWdlBUT0FXdEY4ZWVWVCszOGRiRTZUcXU1WFdTSnBmCndheDdmN1VTcUh1M3daRTNnTE45RUdNODE5UTNacVMzUFN2UUszc0NnWUIrWWZJanNJcnRPY3hxdXlsanYrVkkKS1BHb2dJR00wUFR2NEQrd2FBazJ2emxSaCsxMEIwMXJjTFJkYnBYRDBGWXh4K0FVNVErenZPd2ZnSDVXcldEawpHdkRzdUJnbEtCNDJIL2xRaGs0OS9GK2FDdDl1U0hxR0ZBNWs4V2p0a0dlaG10M1hmaERvMGFYL21pYXh0N0s1CjAvelhmc1NmQXUrT1A4aGhabzhnZndLQmdEZXBLRGhEZVkvNzlLODBsU0RJQkVDKzY2bDYwYzBVcXljOHZvZ2EKUUlOcldQVVJDOWtsSTdnR0dFZDZ5T1BCSENBMVdFZ09senVxd0JWYlJnMUlmOHdqdUdwUHo5TmtGWEZ1U3N5cgpkbkhFOUh2MG84dGxlTXJ0ZlY5NVhQMXZIakJOcXIrY3k1UURBbWE5NWRLb0hBYVVQdHZOLzU2ZFFrSStnaEZnCkptdU5Bb0dBVkxsc2doTkRIZTJLVWtOMFdVOGp0R1JYMW45SWpMU1Q3U1lHT0hEOGVuTmRqaW1kczNveDl5RkYKUnR3Nk5oSHZHb25IWmF3UTBzdmRVQ3p6NVdXMDJKejNmaVpMQmtHdllZK3Q0MHZ6WVVhTnloY1RWRTFKMlBFbwpUVkZGVXc5Sk5hbmh5cWthR2F5UUtpdWs3QWdqTm40K05nMGFadER2Mmxza3FrcW5TRVk9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==";
	  const privateKey = Buffer.from(base64String, 'base64').toString('ascii');
    
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
        Buffer.from(privateKey),
        3600
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
    envelopeDefinition.status = 'sent';

    const document = new docusign.Document();
    document.documentBase64 = pdfBase64;
    document.name = 'Standard_Investigator_Agreement.pdf';
    document.fileExtension = 'pdf';
    document.documentId = '1';
    envelopeDefinition.documents = [document];

    const signer = docusign.Signer.constructFromObject({
        email: claimantData.email,
        name: `${claimantData.firstName} ${claimantData.lastName}`,
        recipientId: '1',
        tabs: docusign.Tabs.constructFromObject({
          signHereTabs: [
              docusign.SignHere.constructFromObject({
                  anchorString: '/s/',
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

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, envelopeId: results.envelopeId }),
      headers: { "Content-Type": "application/json" },
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

export { handler }; 
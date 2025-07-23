import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import docusign from 'docusign-esign';

// Note: This function requires the 'docusign-esign' package.

interface TemplateData {
	account_type_1: string;
	account_type_2: string;
	account_type_3: string;
	account_type_4: string;
	account_type_primary: string;
	amount_1: string;
	amount_2: string;
	amount_3: string;
	amount_4: string;
	amount_primary: string;
	attachment_checkbox: boolean;
	claimant_email: string;
	claimant_mailing_address: string;
	claimant_name: string;
	claimant_phone: string;
	claimant_ssn: string;
	investigator_email: string;
	investigator_name: string;
	investigator_phone: string;
	investigator_ssn: string;
	owner_address_1: string;
	owner_address_2: string;
	owner_address_3: string;
	owner_address_4: string;
	owner_address_primary: string;
	owner_name_1: string;
	owner_name_2: string;
	owner_name_3: string;
	owner_name_4: string;
	owner_name_primary: string;
	property_id_1: string;
	property_id_2: string;
	property_id_3: string;
	property_id_4: string;
	property_id_primary: string;
	reported_by_1: string;
	reported_by_2: string;
	reported_by_3: string;
	reported_by_4: string;
	reported_by_primary: string;
	securities_1: string;
	securities_2: string;
	securities_3: string;
	securities_4: string;
	securities_primary: string;
}

interface RequestData {
	templateData: TemplateData;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
	if (event.httpMethod !== 'POST') {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: 'Method Not Allowed' }),
			headers: { 
				'Allow': 'POST',
				'Content-Type': 'application/json'
			}
		};
	}

	const headers = {
		"Content-Type": "application/json",
	};

	try {
		if (!event.body) {
			throw new Error("Request body is missing.");
		}

		const { templateData }: RequestData = JSON.parse(event.body);

		if (!templateData) {
			throw new Error("Missing templateData in the request body.");
		}

		console.log(`[Function Start] Received request for: ${templateData.claimant_email}`);

		// --- DocuSign API Client Initialization ---
		const apiClient = new docusign.ApiClient();
		apiClient.setOAuthBasePath('account-d.docusign.com');

		const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
		const userId = process.env.DOCUSIGN_USER_ID;
		// Netlify's UI can't handle multi-line secrets well. It's recommended to Base64 encode
		// your private key and store that. Then, decode it in the function.
		const base64String = process.env.DOCUSIGN_PRIVATE_KEY_BASE64 || "";
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
		// const templateId = "ba7cfb97-1492-4320-a363-1314ec8a08ef";
		const templateId = process.env.DOCUSIGN_TEMPLATE_ID || "ca0fcdc7-bbc9-41b7-badf-4267773fb56d";

		if (!templateId) {
			throw new Error("DocuSign template ID is not set in environment variables.");
		}

		envelopeDefinition.templateId = templateId;
		// For embedded signing, the envelope is created in a 'created' status, not 'sent'
		envelopeDefinition.status = 'sent';

		// Separate tabs for each role
		const allTabs = Object.entries(templateData);

		const claimantTabs = allTabs
			.filter(([key]) => !key.startsWith('investigator_'))
			.map(([key, value]) => docusign.Text.constructFromObject({ tabLabel: key, value: String(value) }));

		const investigatorTabs = allTabs
			.filter(([key]) => key.startsWith('investigator_'))
			.map(([key, value]) => docusign.Text.constructFromObject({ tabLabel: key, value: String(value) }));

		const checkboxTab = docusign.Checkbox.constructFromObject({
			tabLabel: 'attachment_checkbox',
			selected: templateData.attachment_checkbox ? 'true' : 'false'
		});

		const claimantRole = docusign.TemplateRole.constructFromObject({
			email: templateData.claimant_email,
			name: templateData.claimant_name,
			roleName: 'Claimant', // This must match the role name in the template
			clientUserId: templateData.claimant_email, // This makes the user an embedded signer
			tabs: docusign.Tabs.constructFromObject({
				textTabs: claimantTabs,
				checkboxTabs: [checkboxTab]
			}),
		});

		// const investigatorRole = docusign.TemplateRole.constructFromObject({
		//     email: templateData.investigator_email,
		//     name: templateData.investigator_name,
		//     roleName: 'Investigator', // This must match the role name in the template
		//     // No clientUserId, so they are a remote (email) recipient
		// 	tabs: docusign.Tabs.constructFromObject({ textTabs: investigatorTabs })
		// });

		envelopeDefinition.templateRoles = [claimantRole];
		// envelopeDefinition.templateRoles = [claimantRole, investigatorRole];

		// --- Send Envelope ---
		console.log("[DocuSign] Sending envelope from template...");
		const envelopesApi = new docusign.EnvelopesApi(apiClient);
		const envelopeResults = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
		const envelopeId = envelopeResults.envelopeId;
		console.log(`[DocuSign] Envelope created successfully. Envelope ID: ${envelopeId}`);

		// --- Create Recipient View for the Claimant ---
		console.log('[DocuSign] Creating recipient view for embedded signing...');
		const recipientViewRequest = new docusign.RecipientViewRequest();
		recipientViewRequest.returnUrl = process.env.DOCUSIGN_IFRAME_RETURN_URL || 'http://localhost:5173/docusign-return'; 
		recipientViewRequest.authenticationMethod = 'none';
		recipientViewRequest.email = templateData.claimant_email;
		recipientViewRequest.userName = templateData.claimant_name;
		recipientViewRequest.clientUserId = templateData.claimant_email;

		const signingViewResults = await envelopesApi.createRecipientView(accountId, envelopeId, {
			recipientViewRequest: recipientViewRequest,
		});
		console.log('[DocuSign] Recipient view created successfully.');

		return {
			statusCode: 200,
			body: JSON.stringify({
				success: true,
				envelopeId: envelopeId,
				redirectUrl: signingViewResults.url
			}),
			headers,
		};

	} catch (error) {
		console.error('Error processing request:', error);
		const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
		return {
			statusCode: 500,
			body: JSON.stringify({ error: errorMessage }),
			headers,
		};
	}
};

export { handler }; 
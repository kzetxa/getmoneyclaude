import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import docusign from 'docusign-esign';

interface TriggerRequestBody {
	instanceName?: string;
	inputs?: Record<string, unknown>;
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
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
			throw new Error('Request body is missing.');
		}

		const { instanceName, inputs }: TriggerRequestBody = JSON.parse(event.body);

		// Get workflow ID from environment variables
		const workflowId = process.env.DOCUSIGN_MAESTRO_WORKFLOW_ID;
		if (!workflowId) {
			throw new Error('DOCUSIGN_MAESTRO_WORKFLOW_ID environment variable is not set.');
		}

		// DocuSign JWT auth (reuse pattern from existing function)
		const apiClient = new docusign.ApiClient();
		apiClient.setOAuthBasePath('account.docusign.com');

		const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || "";
		const userId = process.env.DOCUSIGN_USER_ID || "";
		const base64String = process.env.DOCUSIGN_PRIVATE_KEY_BASE64 as string;
		const privateKey = Buffer.from(base64String || '', 'base64').toString('ascii');

		if (!integrationKey || !userId || !privateKey) {
			throw new Error('DocuSign environment variables are not set.');
		}

		const consentScopes = ["signature", "impersonation", "aow_manage"];
		const tokenResponse = await apiClient.requestJWTUserToken(
			integrationKey,
			userId,
			consentScopes,
			privateKey,
			3600
		);

		const accessToken = tokenResponse.body.access_token;
		const userInfo = await apiClient.getUserInfo(accessToken);

		// const targetAccount = userInfo.accounts.find(a => !a.isDefault) || userInfo.accounts[0];
		const targetAccount = userInfo.accounts[1];
		const accountId = targetAccount.accountId;

		// Step B: Trigger the workflow using the direct trigger endpoint
		const triggerPayload = {
			instance_name: instanceName || "KYC basic",
			trigger_inputs: inputs
		};

		console.log('[Maestro] Triggering workflow with payload:', triggerPayload);

		// Use the direct trigger endpoint as per the API documentation
		const triggerWorkflowUrl = `https://api.docusign.com/v1/accounts/${accountId}/workflows/${workflowId}/actions/trigger`;

		const triggerWorkflowRes = await fetch(triggerWorkflowUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(triggerPayload)
		});

		if (!triggerWorkflowRes.ok) {
			const errorText = await triggerWorkflowRes.text();
			console.error('[Maestro] Failed to trigger workflow:', triggerWorkflowRes.status, errorText);
			return {
				statusCode: triggerWorkflowRes.status,
				headers,
				body: JSON.stringify({ 
					error: 'Failed to trigger Maestro workflow', 
					status: triggerWorkflowRes.status, 
					details: errorText 
				})
			};
		}

		const workflowInstance = await triggerWorkflowRes.json();
		console.log('[Maestro] Workflow triggered successfully:', workflowInstance);

		// Step C: Return workflow_instance_url to frontend for embedding
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({ 
				success: true, 
				instanceUrl: workflowInstance.instance_url,
				instanceId: workflowInstance.id,
				details: workflowInstance
			})
		};
	} catch (e: any) {
		const ds = e?.response?.body || e;
		console.error('DocuSign Maestro error:', JSON.stringify(ds, null, 2));
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ error: ds?.message || ds?.error || 'Unknown error', details: ds })
		};
	}
};

export { handler };



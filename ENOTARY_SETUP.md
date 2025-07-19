# eNotary Setup Guide for DocuSign Maestro Workflows

This guide explains how to set up eNotary functionality using DocuSign Maestro workflows for your unclaimed property application.

## Overview

eNotary functionality allows for remote notarization of documents, which is essential for compliance and legal validity of unclaimed property claims. DocuSign Maestro workflows provide a visual, no-code way to create complex eNotary processes.

## Prerequisites

1. **DocuSign Account with eNotary Features**
   - Ensure your DocuSign account has eNotary capabilities enabled
   - Contact DocuSign support if eNotary features are not available

2. **Notary Network**
   - Access to DocuSign's network of certified eNotaries, or
   - Your own certified eNotaries with DocuSign accounts

## Step 1: Create the Maestro Workflow

### 1.1 Access Maestro
1. Log into your DocuSign account
2. Navigate to **Admin** → **Workflows** → **Maestro**
3. Click **Create Workflow**

### 1.2 Define Workflow Input Variables
Create these input variables in your Maestro workflow:

```
ClaimantName (Text)
ClaimantEmail (Text)
ClaimantPhone (Text)
ClaimantAddress (Text)
ClaimantSSN (Text)
PropertyIds (Text)
ClaimAmounts (Text)
NotaryEmail (Text) - Optional
NotaryName (Text) - Optional
RequestTimestamp (Text)
```

### 1.3 Build the Workflow Steps

#### Step 1: Document Preparation
- **Action**: Create Document from Template
- **Template**: Your existing unclaimed property template
- **Map Variables**: Connect input variables to template fields

#### Step 2: Notary Assignment
- **Action**: Assign Notary
- **Options**:
  - Auto-assign from DocuSign network
  - Assign specific notary (if NotaryEmail provided)
  - Manual assignment

#### Step 3: Identity Verification
- **Action**: Identity Verification
- **Methods**:
  - Knowledge-Based Authentication (KBA)
  - Government ID verification
  - Video verification

#### Step 4: Video Session Scheduling
- **Action**: Schedule Video Session
- **Options**:
  - Send scheduling link to claimant
  - Auto-schedule based on notary availability
  - Manual scheduling

#### Step 5: Document Signing
- **Action**: Document Signing
- **Process**:
  - Notary presents document
  - Claimant signs in presence of notary
  - Notary applies notarial certificate

#### Step 6: Certificate Generation
- **Action**: Generate Notarial Certificate
- **Includes**:
  - Notary information
  - Verification methods used
  - Timestamp and location
  - Compliance records

#### Step 7: Completion
- **Action**: Send Completion Notification
- **Recipients**:
  - Claimant
  - Your system (webhook)
  - State authorities (if required)

### 1.4 Configure Workflow Settings
- **Name**: "Unclaimed Property eNotary Workflow"
- **Description**: "Handles eNotary process for unclaimed property claims"
- **Timeout**: Set appropriate timeout (e.g., 7 days)
- **Retry Logic**: Configure retry attempts for failed steps

## Step 2: Environment Configuration

### 2.1 Netlify Environment Variables
Add these to your Netlify environment:

```bash
DOCUSIGN_ENOTARY_WORKFLOW_ID=your-workflow-id-here
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_PRIVATE_KEY_BASE64=your-base64-encoded-private-key
```

### 2.2 Frontend Environment Variables
Add to your React app's environment:

```bash
REACT_APP_DOCUSIGN_ENOTARY_WORKFLOW_ID=your-workflow-id-here
```

## Step 3: Integration with Your Application

### 3.1 Update Checkout Process
Modify your checkout dialog to include eNotary option:

```typescript
// In CheckoutDialog.tsx
const [showENotaryDialog, setShowENotaryDialog] = useState(false);

// Add button for eNotary option
<Button 
  onClick={() => setShowENotaryDialog(true)}
  variant="outlined"
  color="primary"
>
  Require eNotary
</Button>

// Add the ENotaryDialog component
<ENotaryDialog
  open={showENotaryDialog}
  onClose={() => setShowENotaryDialog(false)}
  formData={checkoutData}
/>
```

### 3.2 Handle Workflow Status Updates
Create a webhook endpoint to receive workflow status updates:

```typescript
// netlify/functions/docusign-webhook.ts
const handler: Handler = async (event: HandlerEvent) => {
  // Handle workflow status updates
  // Update your database with workflow progress
  // Send notifications to users
};
```

## Step 4: Compliance and Legal Considerations

### 4.1 State-Specific Requirements
- Research eNotary requirements for each state where you operate
- Ensure your workflow meets state-specific compliance needs
- Consider different workflows for different states

### 4.2 Record Keeping
- Maintain audit trails of all notarization sessions
- Store notarial certificates securely
- Implement retention policies for compliance records

### 4.3 Identity Verification
- Implement multiple verification methods
- Document verification processes
- Maintain records of verification attempts

## Step 5: Testing

### 5.1 Test Workflow
1. Create a test workflow instance
2. Verify each step executes correctly
3. Test error handling and retry logic
4. Validate compliance requirements

### 5.2 User Experience Testing
1. Test the complete user journey
2. Verify notifications and communications
3. Test mobile responsiveness
4. Validate accessibility requirements

## Step 6: Deployment

### 6.1 Production Setup
1. Deploy updated Netlify functions
2. Update environment variables
3. Test with production DocuSign account
4. Monitor workflow execution

### 6.2 Monitoring and Maintenance
1. Set up logging and monitoring
2. Create alerts for workflow failures
3. Regular compliance audits
4. Update workflows as requirements change

## Troubleshooting

### Common Issues

1. **Workflow Not Triggering**
   - Verify workflow ID is correct
   - Check API permissions
   - Validate input parameters

2. **Notary Assignment Failures**
   - Check notary availability
   - Verify notary credentials
   - Review assignment rules

3. **Identity Verification Issues**
   - Test verification methods
   - Check KBA questions
   - Validate ID verification process

### Support Resources
- DocuSign Developer Documentation
- DocuSign Support Portal
- State Notary Commissions
- Legal Counsel for Compliance

## Cost Considerations

### DocuSign eNotary Costs
- Per-notarization fees
- Monthly subscription costs
- Additional verification fees

### Implementation Costs
- Development time
- Legal review
- Compliance audits
- Ongoing maintenance

## Next Steps

1. **Immediate**: Set up the Maestro workflow in DocuSign
2. **Short-term**: Integrate with your application
3. **Medium-term**: Add state-specific compliance
4. **Long-term**: Optimize and scale the process

## Additional Resources

- [DocuSign Maestro Documentation](https://developers.docusign.com/docs/maestro/)
- [eNotary Compliance Guide](https://www.docusign.com/notary)
- [State Notary Requirements](https://www.nationalnotary.org/)
- [Remote Notarization Laws](https://www.nass.org/remote-notarization) 
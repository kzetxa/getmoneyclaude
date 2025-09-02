import type { UnclaimedProperty } from '../types/Property';
import type { CheckoutData as BaseCheckoutData } from '../stores/CartStore';

// We're adding 'ssn' which is required for the DocuSign template.
// This assumes CartStore's CheckoutData will be updated to include it.
export interface CheckoutData extends BaseCheckoutData {
  ssn: string;
}

export interface FormData {
  properties: UnclaimedProperty[];
  claimantData: CheckoutData;
}

export class PDFService {
  static async sendForSignature(formData: FormData): Promise<any> {
    try {
      console.log('Preparing data for DocuSign Maestro workflow...');
      const { properties, claimantData } = formData;

      const claimantAddress = [
        claimantData.address.street1,
        claimantData.address.street2,
        `${claimantData.address.city}, ${claimantData.address.state} ${claimantData.address.zipCode}`
      ].filter(Boolean);

      // Structure data for Maestro workflow inputs as flat variables
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputs: { [key: string]: any } = {
        // Claimant Info
        claimant_name: `${claimantData.firstName} ${claimantData.lastName}`,
        claimant_email: claimantData.email,
        claimant_phone: claimantData.phone || '',
        claimant_mailing_address: claimantAddress.join(', '),
        claimant_ssn: claimantData.ssn,

        // Investigator Info (using placeholder values as before)
        investigator_name: 'MoneyMatched, Inc.',
        investigator_email: 'info@moneymatched.com',
        investigator_phone: '316-992-1795',
        investigator_ssn: '39-2527674',
        investigator_mailing_address: '817 Pier Ave Unit B, Santa Monica, CA 90405',

        // Initialize all property-related fields to empty strings
        attachment_checkbox: false,
      };

      // Initialize all property-related fields to empty strings
      const propFields = [
        'account_type', 'amount', 'owner_address', 'owner_name',
        'property_id', 'reported_by', 'securities'
      ];
      const suffixes = ['_primary', '_1', '_2', '_3', '_4'];
      suffixes.forEach(suffix => {
        propFields.forEach(field => {
          inputs[`${field}${suffix}`] = '';
        });
      });

      // Populate data for up to 5 properties
      properties.slice(0, 5).forEach((property, index) => {
        const suffix = suffixes[index];
        const ownerAddress = [
          property.ownerStreet1,
          property.ownerStreet2,
          property.ownerCity,
          property.ownerState,
          property.ownerZip
        ].filter(Boolean).join(', ');
        
        inputs[`owner_name${suffix}`] = property.ownerName;
        inputs[`owner_address${suffix}`] = ownerAddress;
        inputs[`property_id${suffix}`] = property.id?.split('_')?.[0] || '';
        inputs[`amount${suffix}`] = `$${property.currentCashBalance.toLocaleString()}`;
        inputs[`account_type${suffix}`] = property.propertyType;
        inputs[`reported_by${suffix}`] = property.holderName;
        inputs[`securities${suffix}`] = (property as any).shares || '';
      });

      const payload = {
        instanceName: `Claim - ${claimantData.lastName}, ${claimantData.firstName}`,
        inputs
      };

      console.log('Invoking Netlify function to trigger Maestro workflow...', payload);

      const response = await fetch('/.netlify/functions/docusign-trigger-maestro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to trigger Maestro workflow: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Successfully triggered Maestro workflow via Netlify function.', data);

      // Return the response data - Maestro may or may not provide a redirectUrl
      return data;

    } catch (error) {
      console.error('Error in sendForSignature:', error);
      throw new Error(`Failed to send for signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 
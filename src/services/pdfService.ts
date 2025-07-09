import { PDFDocument, PDFForm, PDFTextField } from 'pdf-lib';
import type { UnclaimedProperty } from '../types/Property';
import type { CheckoutData } from '../stores/CartStore';

export interface FormData {
  properties: UnclaimedProperty[];
  claimantData: CheckoutData;
}

export class PDFService {
  private static async loadFormTemplate(formPath: string): Promise<Uint8Array> {
    const response = await fetch(formPath);
    if (!response.ok) {
      throw new Error(`Failed to load form: ${response.statusText}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  private static formatAddress(property: UnclaimedProperty): string {
    const addressParts = [
      property.ownerStreet1,
      property.ownerStreet2,
      property.ownerCity,
      property.ownerState,
      property.ownerZip
    ].filter(Boolean);
    
    return addressParts.join(', ');
  }

  private static async getFormFields(form: PDFForm): Promise<string[]> {
    // Get all field names for debugging
    const fields = form.getFields();
    return fields.map(field => field.getName());
  }

  private static async populateStandardInvestigatorAgreement(
    pdfDoc: PDFDocument, 
    formData: FormData
  ): Promise<PDFDocument> {
    const form = pdfDoc.getForm();
    
    // Get all field names for debugging
    const fieldNames = await this.getFormFields(form);
    console.log('Available PDF fields:', fieldNames);

    // Helper function to safely fill a field
    const fillField = (fieldName: string, value: string): boolean => {
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
        console.log(`✓ Filled field "${fieldName}": ${value}`);
        return true;
      } catch (e) {
        return false;
      }
    };

    // Fill general claimant information
    const claimantName = `${formData.claimantData.firstName} ${formData.claimantData.lastName}`.trim();
    fillField('Claimant Name', claimantName);

    // Process up to 4 properties (matching the form structure)
    const propertiesToProcess = formData.properties.slice(0, 5);

    propertiesToProcess.forEach((property, index) => {
      const propertyNumber = index;
      const formattedAddress = this.formatAddress(property);

      // For the first property, also fill the general fields (without numbers)
      if (index === 0) {
        fillField(`Owner's Name`, property.ownerName);
        fillField(`Owner's Address as Reported to the State Controller's Office`, formattedAddress);
        fillField(`Amount`, `$${property.currentCashBalance.toLocaleString()}`);
        fillField(`Property ID`, property.id);
        fillField(`Type of Account`, property.propertyType);
        fillField(`Reported By`, property.holderName);
      } else {
		  // Fill numbered property fields (1), (2), (3), (4)
		  fillField(`Owner's Name (${propertyNumber})`, property.ownerName);
		  fillField(`Owner's Address as Reported to the State Controller's Office (${propertyNumber})`, formattedAddress);
		  fillField(`Amount (${propertyNumber})`, `$${property.currentCashBalance.toLocaleString()}`);
		  fillField(`Property ID (${propertyNumber})`, property.id);
		  fillField(`Type of Account (${propertyNumber})`, property.propertyType);
		  fillField(`Reported by (${propertyNumber})`, property.holderName);
		  fillField(`Reported By (${propertyNumber})`, property.holderName); // Handle capitalization variation
	  }
    });

    // Additional fields we could populate if we had the data
    // fillField('Investigator Name', ''); // Would need to be provided by user
    // fillField('Investigator', ''); // Would need to be provided by user
    // fillField('Investigator\'s SSN or Tax ID', ''); // Would need to be provided by user
    // fillField('Agreed Percentage', ''); // Would need to be provided by user
    // fillField('Date 2', new Date().toLocaleDateString()); // Could use current date

    console.log(`✓ Successfully processed ${propertiesToProcess.length} properties in PDF form`);
    return pdfDoc;
  }

  static async generateStandardInvestigatorAgreement(formData: FormData): Promise<Uint8Array> {
    try {
      // Load the PDF form template
      const formBytes = await this.loadFormTemplate('/forms/FORM_standard_investigator_agreement.pdf');
      
      // Load PDF document
      const pdfDoc = await PDFDocument.load(formBytes);
      
      // Populate the form
      const populatedDoc = await this.populateStandardInvestigatorAgreement(pdfDoc, formData);
      
      // Save the filled PDF
      return await populatedDoc.save();
      
    } catch (error) {
      console.error('Error generating Standard Investigator Agreement:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async downloadPDF(pdfBytes: Uint8Array, filename: string): Promise<void> {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  static async previewPDF(pdfBytes: Uint8Array): Promise<string> {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }

  // Method to inspect PDF form fields (for development/debugging)
  static async inspectFormFields(formPath: string): Promise<string[]> {
    try {
      const formBytes = await this.loadFormTemplate(formPath);
      const pdfDoc = await PDFDocument.load(formBytes);
      const form = pdfDoc.getForm();
      return await this.getFormFields(form);
    } catch (error) {
      console.error('Error inspecting form fields:', error);
      return [];
    }
  }
} 
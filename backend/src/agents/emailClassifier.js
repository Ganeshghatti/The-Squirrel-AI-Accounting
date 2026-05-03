import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const EmailClassificationSchema = z.object({
  sender: z.string().describe("Email address of the sender for this batch"),
  results: z.array(
    z.object({
      email_id: z.string().describe("Unique email identifier"),
      subject: z.string().describe("Email subject line"),
      received_date: z.string().describe("Email received date in YYYY-MM-DD format"),
      classification: z
        .enum(["invoice", "debit_note", "not_invoice", "duplicate", "needs_review"])
        .describe("Classification result for this email"),
      confidence: z.enum(["high", "medium", "low"]).describe("Confidence in this classification"),
      reason: z.string().describe("One-line explanation for the classification"),
      preview: z
        .object({
          probable_invoice_number: z.string().optional(),
          probable_amount: z.number().optional(),
          probable_date: z.string().optional(),
          attachment_filename: z.string().optional(),
        })
        .describe("Best-effort preview data extracted from email body only"),
    })
  ),
  batch_summary: z.object({
    total_emails: z.number(),
    invoices_found: z.number(),
    debit_notes_found: z.number(),
    duplicates_found: z.number(),
    needs_review: z.number(),
    not_invoices: z.number(),
  }),
});

const SYSTEM_PROMPT = `You are an email classification agent for an automated accounting system. Your job is to examine batches of emails from a single sender and determine which ones contain purchase invoices, debit notes, or credit notes that need to be entered into Tally accounting software.

## What you receive
1. A batch of emails from ONE sender (subject, body text, attachment filenames)
2. A list of existing vouchers already posted in Tally for the selected date range (to detect duplicates)

## Classification rules

### Classify as "invoice" when the email:
- Contains or attaches a purchase invoice, tax invoice, bill, or proforma invoice
- Has a PDF/image attachment with a filename suggesting an invoice (e.g., "INV-001.pdf", "TaxInvoice.pdf")
- Body text references invoice number, bill number, GSTIN, taxable amount, CGST, SGST, IGST, HSN/SAC codes
- Is a vendor sending a bill for goods or services supplied

### Classify as "debit_note" when the email:
- Contains or references a debit note, credit note, or purchase return
- References an original invoice being adjusted
- Mentions defective goods returned, price revision downward, or discount after sale

### Classify as "not_invoice" when the email:
- Is marketing, newsletters, promotions, spam, internal communication
- Is a payment confirmation or receipt (not an invoice)
- Is a quotation, estimate, or enquiry (not a finalized bill)
- Is a shipping notification or delivery update without invoice

### Classify as "duplicate" when:
- The email references an invoice number that already exists in the provided voucher list
- Match by: supplier invoice number + sender/vendor name

### Classify as "needs_review" when:
- Email might contain an invoice but you're not confident
- Invoice data is partially visible but key fields are missing

## Important rules
- Never guess. If unsure, use "needs_review".
- One email can only have ONE classification.
- For "invoice" and "debit_note", extract whatever metadata you can see from the email body.
- The attachment content (PDF internals) is NOT available to you. Judge from subject, body, and filename only.`;

/**
 * @param {{ sender: string, emails: Array<{ email_id: string, subject: string, received_date: string, body_preview: string, attachments: string[] }>, existing_vouchers: Array }} batch
 */
export async function classifyEmailBatch(batch) {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const structured = model.withStructuredOutput(EmailClassificationSchema);

  const userMessage = JSON.stringify(batch, null, 2);

  const result = await structured.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  return result;
}
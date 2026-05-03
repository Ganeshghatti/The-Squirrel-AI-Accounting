import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

const CreateLedgerSchema = z.object({
  name: z.string(),
  parent: z.enum([
    "Sundry Creditors", "Sundry Debtors", "Purchase Accounts", "Sales Accounts",
    "Direct Expenses", "Indirect Expenses", "Duties & Taxes", "Bank Accounts",
    "Cash-in-Hand", "Fixed Assets", "Current Assets", "Current Liabilities",
    "Loans (Liability)", "Capital Account", "Investments", "Reserves & Surplus",
  ]),
  gstin: z.string().max(15).optional(),
  registration_type: z.enum(["Regular", "Composition", "Unregistered/Consumer", "Unknown"]),
  state: z.string().optional(),
  address_lines: z.array(z.string()).max(4).optional(),
  pincode: z.string().optional(),
  email: z.string().optional(),
  mobile: z.string().optional(),
  phone: z.string().optional(),
  is_bill_wise: z.boolean().default(true),
  country: z.string().default("India"),
});

const CreateStockCategorySchema = z.object({
  name: z.string(),
  parent: z.string().default("Primary"),
});

const CreateStockItemSchema = z.object({
  name: z.string(),
  parent: z.string().default("Primary"),
  base_units: z.string(),
  hsn_code: z.string().optional(),
  gst_rate: z.number().optional(),
});

const ItemInvoiceLineItemSchema = z.object({
  stock_item_name: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  rate: z.number().nonnegative(),
  amount: z.number(),
  discount_percent: z.number().optional(),
  hsn_code: z.string().optional(),
  godown: z.string().default("Main Location"),
  purchase_ledger: z.string().default("Purchase"),
});

const AccountingInvoiceLineItemSchema = z.object({
  ledger_name: z.string(),
  amount: z.number(),
  description: z.string().optional(),
});

const TaxEntrySchema = z.object({
  ledger_name: z.enum(["CGST", "SGST", "IGST"]),
  rate: z.number(),
  amount: z.number(),
});

const AdditionalChargeSchema = z.object({
  ledger_name: z.string(),
  amount: z.number(),
  parent_group: z.string().optional(),
});

const CreatePurchaseVoucherSchema = z.object({
  voucher_mode: z.enum(["item_invoice", "accounting_invoice"]),
  posting_date: z.string().regex(/^\d{8}$/),
  supplier_invoice_number: z.string(),
  supplier_invoice_date: z.string().regex(/^\d{8}$/),
  party_ledger: z.string(),
  place_of_supply: z.string().optional(),
  gst_type: z.enum(["intrastate", "interstate"]),
  item_entries: z.array(ItemInvoiceLineItemSchema).optional(),
  accounting_entries: z.array(AccountingInvoiceLineItemSchema).optional(),
  tax_entries: z.array(TaxEntrySchema),
  additional_charges: z.array(AdditionalChargeSchema).optional(),
  subtotal: z.number(),
  tax_total: z.number(),
  additional_charges_total: z.number().default(0),
  grand_total: z.number(),
  bill_type: z.enum(["New Ref", "Agst Ref", "Advance", "On Account"]).default("New Ref"),
  narration: z.string().optional(),
});

const ActionSchema = z.object({
  action: z.enum(["create_ledger", "create_stock_category", "create_stock_item", "create_purchase_voucher"]),
  order: z.number().int().positive(),
  params: z.union([CreateLedgerSchema, CreateStockCategorySchema, CreateStockItemSchema, CreatePurchaseVoucherSchema]),
  reason: z.string(),
});

const InvoiceProcessorOutputSchema = z.object({
  email_id: z.string(),
  confidence: z.enum(["high", "medium", "low", "error"]),
  confidence_reason: z.string(),
  actions: z.array(ActionSchema),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
  balance_check: z.object({
    total_debit: z.number(),
    total_credit: z.number(),
    is_balanced: z.boolean(),
  }),
});

// ─── State code lookup ─────────────────────────────────────────────────────────

const GSTIN_STATE_CODES = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh",
  "23": "Madhya Pradesh", "24": "Gujarat", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "36": "Telangana", "37": "Andhra Pradesh",
};

const SYSTEM_PROMPT = `You are an invoice processing agent for an automated Tally accounting system. You receive invoice details extracted from a PDF attachment along with the complete context of what already exists in the user's Tally company. Your job is to produce an ordered list of actions that will enter this invoice into Tally.

## What you receive
1. Parsed invoice data (extracted from email body + PDF attachment text provided below)
2. Tally context: existing ledgers, stock items, stock categories, units, company state code

## Action types you can output (ONLY these four):
- create_ledger
- create_stock_category
- create_stock_item
- create_purchase_voucher

## Decision process
1. Check if vendor ledger exists (by name or GSTIN match). If not → create_ledger.
2. Check each stock item. If not found → check if category/group exists. If not → create_stock_category first, then create_stock_item.
3. Determine invoice mode: line items with qty/rate → item_invoice; services only → accounting_invoice.
4. Determine GST type: compare vendor GSTIN state code (first 2 chars) with company state code. Same → intrastate (CGST+SGST). Different → interstate (IGST).
5. Validate totals. If mismatch ≤ ₹1 add round_off in additional_charges.
6. Output actions in dependency order: stock_category → ledger → stock_item → purchase_voucher.

## Rules
- Use EXISTING names exactly as they appear in Tally (preserve casing/spelling).
- All dates in YYYYMMDD format. All amounts as numbers (2 decimal places).
- The purchase voucher debit + credit totals MUST balance to zero.
- Never fabricate data. If a critical field is missing, set confidence to "error".

## GSTIN State Codes: ${JSON.stringify(GSTIN_STATE_CODES)}`;

/**
 * @param {{ email_id: string, emailBody: string, attachmentText: string, pdfBase64: string | null, tallyContext: object }} input
 */
export async function processInvoice(input) {
  const { email_id, emailBody, attachmentText, pdfBase64, tallyContext } = input;

  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const structured = model.withStructuredOutput(InvoiceProcessorOutputSchema);

  const contentParts = [
    {
      type: "text",
      text: `Email ID: ${email_id}\n\n## Email Body\n${emailBody}\n\n## Invoice Text Extracted from Attachment\n${attachmentText || "(no text extracted)"}\n\n## Tally Context\n${JSON.stringify(tallyContext, null, 2)}`,
    },
  ];

  // Include PDF image if available (as vision input)
  if (pdfBase64) {
    contentParts.unshift({
      type: "image_url",
      image_url: { url: `data:application/pdf;base64,${pdfBase64}`, detail: "high" },
    });
  }

  const result = await structured.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: contentParts },
  ]);

  return result;
}
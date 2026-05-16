import mongoose from "mongoose";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { XMLParser } from "fast-xml-parser";
import { Company } from "../models/Company.js";
import { EmailAnalysis } from "../models/EmailAnalysis.js";
import { classifyEmailBatch } from "../agents/emailClassifier.js";
import { processInvoice } from "../agents/invoiceProcessor.js";

export async function listCompanies(req, res, next) {
  try {
    const companies = await Company.find({
      owner: req.user._id,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(companies);
  } catch (e) {
    next(e);
  }
}

export async function getCompany(req, res, next) {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    }).lean();
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (e) {
    next(e);
  }
}

export async function createCompany(req, res, next) {
  try {
    const { name, desc } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    const body = req.body;
    const pick = (k) =>
      !body || typeof body !== "object"
        ? ""
        : typeof body[k] === "string"
          ? body[k].trim()
          : body[k] != null
            ? String(body[k]).trim()
            : "";
    const tallyGuid = pick("tallyGuid");
    const tallyCompanyNumber = pick("tallyCompanyNumber");
    const tallyReservedName = pick("tallyReservedName");
    const tallyBooksFrom = pick("tallyBooksFrom");
    const tallyStartingFrom = pick("tallyStartingFrom");
    const tallyEndingAt = pick("tallyEndingAt");

    if (tallyGuid) {
      const dup = await Company.findOne({
        owner: req.user._id,
        tallyGuid,
        deletedAt: null,
      }).lean();
      if (dup) {
        return res
          .status(409)
          .json({ error: "A company with this Tally GUID already exists" });
      }
    }
    const company = await Company.create({
      name: name.trim(),
      desc: typeof desc === "string" ? desc.trim() : "",
      owner: req.user._id,
      tallyGuid,
      tallyCompanyNumber,
      tallyReservedName,
      tallyBooksFrom,
      tallyStartingFrom,
      tallyEndingAt,
    });
    res.status(201).json(company.toJSON());
  } catch (e) {
    next(e);
  }
}

export async function updateCompany(req, res, next) {
  try {
    const { name, desc } = req.body;
    const company = await Company.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    if (name !== undefined) company.name = name;
    if (desc !== undefined) company.desc = desc;
    const body = req.body;
    const pick = (k) =>
      !body || typeof body !== "object"
        ? ""
        : typeof body[k] === "string"
          ? body[k].trim()
          : body[k] != null
            ? String(body[k]).trim()
            : "";
    for (const k of [
      "tallyGuid",
      "tallyCompanyNumber",
      "tallyReservedName",
      "tallyBooksFrom",
      "tallyStartingFrom",
      "tallyEndingAt",
    ]) {
      if (body[k] !== undefined) company[k] = pick(k);
    }
    await company.save();
    res.json(company.toJSON());
  } catch (e) {
    next(e);
  }
}

export async function connectMailbox(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid company id" });
    }
    const raw = req.body;
    if (!raw || typeof raw !== "object") {
      return res
        .status(400)
        .json({ error: "Request body must be a mailbox object" });
    }
    const emailAddress = raw.emailAddress?.trim();
    const imapHost = raw.imapHost?.trim();
    const username = raw.username?.trim();
    const password = raw.password;
    if (
      !emailAddress ||
      !imapHost ||
      !username ||
      password === undefined ||
      password === ""
    ) {
      return res
        .status(400)
        .json({
          error: "emailAddress, imapHost, username, and password are required",
        });
    }
    const mailbox = {
      label: typeof raw.label === "string" ? raw.label.trim() : "",
      emailAddress: emailAddress.toLowerCase(),
      imapHost,
      imapPort: Number.isFinite(Number(raw.imapPort))
        ? Number(raw.imapPort)
        : 993,
      tls: raw.tls !== false,
      username,
      password: String(password),
    };
    const company = await Company.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    const exists = company.connectedMailboxes.some(
      (m) => m.emailAddress === mailbox.emailAddress,
    );
    if (exists) {
      return res
        .status(409)
        .json({ error: "This email is already connected to the company" });
    }
    company.connectedMailboxes.push(mailbox);
    await company.save();
    const json = company.toJSON();
    const added = json.connectedMailboxes[json.connectedMailboxes.length - 1];
    res.status(201).json(added);
  } catch (e) {
    next(e);
  }
}

export async function disconnectMailbox(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid company id" });
    }
    if (!mongoose.isValidObjectId(req.params.mailboxId)) {
      return res.status(400).json({ error: "Invalid mailbox id" });
    }
    const company = await Company.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    const sub = company.connectedMailboxes.id(req.params.mailboxId);
    if (!sub) {
      return res.status(404).json({ error: "Mailbox not found" });
    }
    sub.deleteOne();
    await company.save();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

/** Parse Tally DayBook XML → array of voucher objects for duplicate detection. */
function parseVoucherXml(xml) {
  if (!xml) return [];
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const body = parsed?.ENVELOPE?.BODY ?? parsed?.BODY ?? parsed;
    // Traverse to find VOUCHER nodes wherever they appear
    const findVouchers = (obj) => {
      if (!obj || typeof obj !== "object") return [];
      if (Array.isArray(obj)) return obj.flatMap(findVouchers);
      if ("VOUCHER" in obj) {
        const v = obj.VOUCHER;
        return (Array.isArray(v) ? v : [v]).map((vch) => ({
          voucher_number: vch.VOUCHERNUMBER ?? "",
          reference: vch.REFERENCE ?? "",
          party_ledger: vch.PARTYLEDGERNAME ?? "",
          date: vch.DATE ?? "",
          amount: Number(vch.AMOUNT ?? 0),
        }));
      }
      return Object.values(obj).flatMap(findVouchers);
    };
    return findVouchers(body);
  } catch {
    return [];
  }
}

/** Parse Tally ledger/stockItem/unit XML → flat array of objects. */
function parseTallyCollection(xml, tagName) {
  if (!xml) return [];
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const find = (obj) => {
      if (!obj || typeof obj !== "object") return [];
      if (Array.isArray(obj)) return obj.flatMap(find);
      if (tagName in obj) {
        const v = obj[tagName];
        return Array.isArray(v) ? v : [v];
      }
      return Object.values(obj).flatMap(find);
    };
    return find(parsed);
  } catch {
    return [];
  }
}

function tallyScalarText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "#text" in value) return String(value["#text"]).trim();
  return "";
}

export async function analyzeCompany(req, res, next) {
  try {
    const { mailboxId, fromDate, toDate, tallySnapshot, ledgerXml, stockItemXml, unitXml, voucherXml } =
      req.body;
    if (!mailboxId || !fromDate || !toDate) {
      return res.status(400).json({ error: "mailboxId, fromDate, toDate are required" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid company id" });
    }

    const company = await Company.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    }).select("+connectedMailboxes.password");
    if (!company) return res.status(404).json({ error: "Company not found" });

    const mailbox = company.connectedMailboxes.id(mailboxId);
    if (!mailbox) return res.status(404).json({ error: "Mailbox not found" });

    // ── 1. Fetch emails via IMAP with full source ──────────────────────────
    const since = new Date(fromDate + "T00:00:00");
    const before = new Date(toDate + "T23:59:59");

    const imapClient = new ImapFlow({
      host: mailbox.imapHost,
      port: mailbox.imapPort,
      secure: mailbox.tls,
      auth: { user: mailbox.username, pass: mailbox.password },
      logger: false,
    });

    const rawEmails = [];
    await imapClient.connect();
    const lock = await imapClient.getMailboxLock("INBOX");
    try {
      const uids = await imapClient.search({ since, before });
      for await (const msg of imapClient.fetch(uids, { envelope: true, source: true })) {
        rawEmails.push({ uid: msg.uid, envelope: msg.envelope, source: msg.source });
      }
    } finally {
      lock.release();
      await imapClient.logout();
    }

    if (rawEmails.length === 0) {
      const analysis = await EmailAnalysis.create({
        company: company._id,
        mailboxId,
        fromDate,
        toDate,
        summary: { total_emails: 0, invoices_found: 0, debit_notes_found: 0, duplicates_found: 0, needs_review: 0, not_invoices: 0 },
        emailResults: [],
      });
      return res.json({ emailCount: 0, invoiceCount: 0, analysisId: analysis._id, invoiceEmails: [] });
    }

    // ── 2. Parse emails ────────────────────────────────────────────────────
    const parsedEmails = await Promise.all(
      rawEmails.map(async (raw) => {
        const parsed = await simpleParser(raw.source);
        const sender = raw.envelope.from?.[0]?.address ?? "";
        const attachmentFilenames = (parsed.attachments ?? []).map((a) => a.filename ?? "").filter(Boolean);
        return {
          uid: raw.uid,
          email_id: raw.envelope.messageId ?? `uid_${raw.uid}`,
          subject: raw.envelope.subject ?? "(no subject)",
          sender,
          received_date: raw.envelope.date
            ? new Date(raw.envelope.date).toISOString().slice(0, 10)
            : fromDate,
          body_preview: (parsed.text ?? parsed.html ?? "").slice(0, 800),
          attachments: attachmentFilenames,
          // keep full parsed for Agent 2
          _parsed: parsed,
        };
      })
    );

    // ── 3. Tally context (prefer compact JSON snapshot from desktop app) ───
    let existingVouchers;
    let existingLedgers;
    let existingStockItems;
    let existingUnits;

    if (tallySnapshot && typeof tallySnapshot === "object") {
      existingVouchers = Array.isArray(tallySnapshot.existing_vouchers)
        ? tallySnapshot.existing_vouchers
        : [];
      existingLedgers = Array.isArray(tallySnapshot.existing_ledgers) ? tallySnapshot.existing_ledgers : [];
      existingStockItems = Array.isArray(tallySnapshot.existing_stock_items)
        ? tallySnapshot.existing_stock_items
        : [];
      existingUnits = Array.isArray(tallySnapshot.existing_units) ? tallySnapshot.existing_units : [];
    } else {
      existingVouchers = parseVoucherXml(voucherXml);
      existingLedgers = parseTallyCollection(ledgerXml, "LEDGER").map((l) => ({
        name: l["@_NAME"] ?? tallyScalarText(l.NAME),
        parent: tallyScalarText(l.PARENT),
        gstin: tallyScalarText(l.PARTYGSTIN) || null,
      }));
      existingStockItems = parseTallyCollection(stockItemXml, "STOCKITEM").map((s) => ({
        name: s["@_NAME"] ?? tallyScalarText(s.NAME),
        parent: tallyScalarText(s.PARENT),
        base_units: tallyScalarText(s.BASEUNITS),
        hsn: tallyScalarText(s.HSNCODE) || undefined,
      }));
      existingUnits = parseTallyCollection(unitXml, "UNIT").map((u) => ({
        name: u["@_NAME"] ?? tallyScalarText(u.NAME),
      }));
    }

    // ── 4. Agent 1: classify emails grouped by sender ─────────────────────
    const bySender = {};
    for (const e of parsedEmails) {
      (bySender[e.sender] ??= []).push(e);
    }

    const classificationMap = {};
    await Promise.all(
      Object.entries(bySender).map(async ([sender, batch]) => {
        try {
          const result = await classifyEmailBatch({
            sender,
            emails: batch.map(({ email_id, subject, received_date, body_preview, attachments }) => ({
              email_id, subject, received_date, body_preview, attachments,
            })),
            existing_vouchers: existingVouchers,
          });
          for (const r of result.results) {
            classificationMap[r.email_id] = r;
          }
        } catch (err) {
          // fallback: mark as needs_review
          for (const e of batch) {
            classificationMap[e.email_id] = {
              email_id: e.email_id,
              subject: e.subject,
              received_date: e.received_date,
              classification: "needs_review",
              confidence: "low",
              reason: `Agent 1 error: ${err.message}`,
              preview: {},
            };
          }
        }
      })
    );

    // ── 5. Agent 2: process invoice/debit_note emails ─────────────────────
    const tallyContext = {
      company_state_code: company.tallyGuid?.slice(0, 2) ?? "",
      existing_ledgers: existingLedgers,
      existing_stock_items: existingStockItems,
      existing_stock_categories: Array.isArray(tallySnapshot?.existing_stock_categories)
        ? tallySnapshot.existing_stock_categories
        : [],
      existing_units: existingUnits,
    };

    const invoiceEmails = parsedEmails.filter((e) => {
      const cls = classificationMap[e.email_id]?.classification;
      return cls === "invoice" || cls === "debit_note";
    });

    const agentResults = await Promise.all(
      invoiceEmails.map(async (e) => {
        const classification = classificationMap[e.email_id];
        // Find the PDF attachment (if any)
        const pdfAttachment = e._parsed.attachments?.find(
          (a) => a.contentType === "application/pdf" || (a.filename ?? "").toLowerCase().endsWith(".pdf")
        );
        const attachmentText = pdfAttachment
          ? `[Attachment: ${pdfAttachment.filename}]`
          : "";

        try {
          const agent2Result = await processInvoice({
            email_id: e.email_id,
            emailBody: e.body_preview,
            attachmentText,
            pdfBase64: null, // gpt-4o vision expects image formats; skip raw PDF
            tallyContext,
          });
          return { email_id: e.email_id, agent2: agent2Result };
        } catch (err) {
          return {
            email_id: e.email_id,
            agent2: {
              email_id: e.email_id,
              confidence: "error",
              confidence_reason: `Agent 2 error: ${err.message}`,
              actions: [],
              warnings: [],
              errors: [err.message],
              balance_check: { total_debit: 0, total_credit: 0, is_balanced: false },
            },
          };
        }
      })
    );

    const agent2Map = Object.fromEntries(agentResults.map((r) => [r.email_id, r.agent2]));

    // ── 6. Build final results + save to DB ────────────────────────────────
    const emailResults = parsedEmails.map((e) => {
      const cls = classificationMap[e.email_id] ?? {};
      const a2 = agent2Map[e.email_id];
      return {
        email_id: e.email_id,
        subject: e.subject,
        sender: e.sender,
        received_date: e.received_date,
        classification: cls.classification ?? "needs_review",
        confidence: cls.confidence ?? "low",
        reason: cls.reason ?? "",
        preview: cls.preview ?? {},
        actions: a2?.actions ?? [],
        actionConfidence: a2?.confidence ?? null,
        actionWarnings: a2?.warnings ?? [],
        actionErrors: a2?.errors ?? [],
        balance_check: a2?.balance_check ?? null,
      };
    });

    // Aggregate summary from all sender batches
    const summary = emailResults.reduce(
      (acc, r) => {
        acc.total_emails++;
        if (r.classification === "invoice") acc.invoices_found++;
        else if (r.classification === "debit_note") acc.debit_notes_found++;
        else if (r.classification === "duplicate") acc.duplicates_found++;
        else if (r.classification === "needs_review") acc.needs_review++;
        else acc.not_invoices++;
        return acc;
      },
      { total_emails: 0, invoices_found: 0, debit_notes_found: 0, duplicates_found: 0, needs_review: 0, not_invoices: 0 }
    );

    const analysis = await EmailAnalysis.create({
      company: company._id,
      mailboxId,
      fromDate,
      toDate,
      summary,
      emailResults,
    });

    const invoiceResults = emailResults.filter(
      (r) => r.classification === "invoice" || r.classification === "debit_note"
    );

    res.json({
      emailCount: emailResults.length,
      invoiceCount: invoiceResults.length,
      analysisId: analysis._id,
      summary,
      invoiceEmails: invoiceResults,
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteCompany(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const company = await Company.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    company.deletedAt = new Date();
    await company.save();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

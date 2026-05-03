import mongoose from "mongoose";
import { ImapFlow } from "imapflow";
import { Company } from "../models/Company.js";

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

export async function analyzeCompany(req, res, next) {
  try {
    const {
      mailboxId,
      fromDate,
      toDate,
      ledgerXml,
      stockItemXml,
      unitXml,
      voucherXml,
    } = req.body;
    if (!mailboxId || !fromDate || !toDate) {
      return res
        .status(400)
        .json({ error: "mailboxId, fromDate, toDate are required" });
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

    const since = new Date(fromDate + "T00:00:00");
    const before = new Date(toDate + "T23:59:59");

    const client = new ImapFlow({
      host: mailbox.imapHost,
      port: mailbox.imapPort,
      secure: mailbox.tls,
      auth: { user: mailbox.username, pass: mailbox.password },
      logger: false,
    });

    const emails = [];
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ since, before });
      for await (const msg of client.fetch(uids, { envelope: true })) {
        emails.push({
          date: msg.envelope.date,
          from: msg.envelope.from,
          to: msg.envelope.to,
          subject: msg.envelope.subject,
          messageId: msg.envelope.messageId,
        });
      }
    } finally {
      lock.release();
      await client.logout();
    }
    res.json({
      emailCount: emails.length,
      emails,
      tallyData: { ledgerXml, stockItemXml, unitXml, voucherXml },
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

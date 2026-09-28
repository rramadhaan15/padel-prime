import "server-only";

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "padel_session";
const SESSION_AGE_SECONDS = 7 * 24 * 60 * 60;

type Account = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
};
type Session = { accountId: string; expiresAt: number };
type AuthStore = {
  accounts: Record<string, Account>;
  sessions: Record<string, Session>;
};

function storePath() {
  return path.resolve(process.cwd(), ".data", "auth_store.json");
}

function readStore(): AuthStore {
  try {
    const parsed = JSON.parse(fs.readFileSync(storePath(), "utf8")) as AuthStore;
    return {
      accounts: parsed.accounts ?? {},
      sessions: parsed.sessions ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { accounts: {}, sessions: {} };
    }
    throw error;
  }
}

function writeStore(store: AuthStore) {
  const target = storePath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(store), { mode: 0o600 });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const sessionKey = (token: string) => createHash("sha256").update(token).digest("hex");

export function registerAccount(name: string, email: string, password: string, phone: string) {
  const store = readStore();
  const normalized = normalizeEmail(email);
  if (store.accounts[normalized]) return null;
  const account: Account = {
    id: randomBytes(16).toString("hex"),
    name: name.trim(),
    email: normalized,
    phone,
    passwordHash: hashPassword(password),
  };
  store.accounts[normalized] = account;
  writeStore(store);
  return { id: account.id, name: account.name, email: account.email, phone: account.phone };
}

export function updateAccountPhone(accountId: string, phone: string) {
  const store = readStore();
  const account = Object.values(store.accounts).find((item) => item.id === accountId);
  if (!account) return null;
  account.phone = phone;
  writeStore(store);
  return { id: account.id, name: account.name, email: account.email, phone: account.phone };
}

export function verifyAccount(email: string, password: string) {
  const account = readStore().accounts[normalizeEmail(email)];
  if (!account || !verifyPassword(password, account.passwordHash)) return null;
  return { id: account.id, name: account.name, email: account.email, phone: account.phone };
}

export function createSession(accountId: string) {
  const store = readStore();
  const token = randomBytes(32).toString("hex");
  store.sessions[sessionKey(token)] = {
    accountId,
    expiresAt: Date.now() + SESSION_AGE_SECONDS * 1000,
  };
  writeStore(store);
  return token;
}

export function deleteSession(token: string | undefined) {
  if (!token) return;
  const store = readStore();
  delete store.sessions[sessionKey(token)];
  writeStore(store);
}

export function accountFromSession(token: string | undefined) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const store = readStore();
  const session = store.sessions[sessionKey(token)];
  if (!session || session.expiresAt <= Date.now()) return null;
  const account = Object.values(store.accounts).find((item) => item.id === session.accountId);
  return account ? { id: account.id, name: account.name, email: account.email, phone: account.phone } : null;
}

export async function currentAccount() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return accountFromSession(token);
}

export function accountForRequest(request: NextRequest) {
  return accountFromSession(request.cookies.get(SESSION_COOKIE)?.value);
}

export function ownsHold(request: NextRequest, holdId: string) {
  const account = accountForRequest(request);
  const hold = db.getSlotHold(holdId);
  return Boolean(account && hold && hold.customerId === account.id);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_AGE_SECONDS,
};

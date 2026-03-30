import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID, randomBytes } from "crypto";
import type { User, SafeUser, Role } from "./types";
import { hashPassword } from "./password";

const DATA_DIR = join(process.cwd(), ".data");
const USERS_FILE = join(DATA_DIR, "users.json");
const INIT_CREDS_FILE = join(DATA_DIR, "initial-credentials.txt");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromDisk(): User[] {
  try {
    if (existsSync(USERS_FILE)) {
      const raw = readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read users file:", err);
  }
  return [];
}

function saveToDisk(users: User[]) {
  try {
    ensureDataDir();
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write users file:", err);
  }
}

// Singleton via globalThis (same pattern as settings-store)
const g = globalThis as any;
if (!g.__sfUsers) {
  g.__sfUsers = loadFromDisk();
}

function getUsers(): User[] {
  return g.__sfUsers as User[];
}

function setUsers(users: User[]) {
  g.__sfUsers = users;
  saveToDisk(users);
}

export function toSafeUser(user: User): SafeUser {
  const { passwordHash, inviteToken, inviteTokenExpiry, ...safe } = user;
  return safe;
}

export function getAllUsers(): SafeUser[] {
  return getUsers().map(toSafeUser);
}

export function getUserById(id: string): User | null {
  return getUsers().find((u) => u.id === id) ?? null;
}

export function getUserByUsername(username: string): User | null {
  return (
    getUsers().find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    ) ?? null
  );
}

export function hasAnyUsers(): boolean {
  return getUsers().length > 0;
}

export async function createUser(data: {
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: Role;
}): Promise<SafeUser> {
  const existing = getUserByUsername(data.username);
  if (existing) {
    throw new Error("This username is not available");
  }

  const now = new Date().toISOString();
  const user: User = {
    id: randomUUID(),
    username: data.username,
    displayName: data.displayName,
    email: data.email,
    passwordHash: await hashPassword(data.password),
    role: data.role,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const users = getUsers();
  users.push(user);
  setUsers(users);
  return toSafeUser(user);
}

export async function updateUser(
  id: string,
  data: {
    displayName?: string;
    email?: string;
    role?: Role;
    password?: string;
  }
): Promise<SafeUser | null> {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  const user = users[idx];
  if (data.displayName !== undefined) user.displayName = data.displayName;
  if (data.email !== undefined) user.email = data.email;
  if (data.role !== undefined) user.role = data.role;
  if (data.password) user.passwordHash = await hashPassword(data.password);
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  setUsers(users);
  return toSafeUser(user);
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  setUsers(filtered);
  return true;
}

// ─── INVITE FLOW ──────────────────────────────────────────────────────────
// Admin creates an invite (no password). User receives a link with a token
// and sets their own password to activate the account.

const INVITE_TOKEN_EXPIRY_HOURS = 72; // 3 days

export function getUserByEmail(email: string): User | null {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getUserByInviteToken(token: string): User | null {
  return getUsers().find((u) => u.inviteToken === token) ?? null;
}

export async function createInvite(data: {
  email: string;
  displayName: string;
  role: Role;
}): Promise<{ user: SafeUser; inviteToken: string }> {
  const existing = getUserByEmail(data.email);
  if (existing) {
    throw new Error("An invite has already been sent to this email address");
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  const token = randomBytes(32).toString("hex");

  // Use email prefix as temporary username (user can't login until they accept)
  const tempUsername = data.email.split("@")[0] + "-" + randomBytes(3).toString("hex");

  const user: User = {
    id: randomUUID(),
    username: tempUsername,
    displayName: data.displayName || data.email.split("@")[0],
    email: data.email,
    passwordHash: "", // No password yet — set on accept
    role: data.role,
    status: "pending",
    inviteToken: token,
    inviteTokenExpiry: expiry.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const users = getUsers();
  users.push(user);
  setUsers(users);
  return { user: toSafeUser(user), inviteToken: token };
}

export async function acceptInvite(data: {
  token: string;
  username: string;
  password: string;
  displayName?: string;
}): Promise<SafeUser> {
  const users = getUsers();
  const idx = users.findIndex((u) => u.inviteToken === data.token);
  if (idx === -1) {
    throw new Error("Invalid or expired invite link");
  }

  const user = users[idx];

  if (user.status !== "pending") {
    throw new Error("This invite has already been used");
  }

  if (user.inviteTokenExpiry && new Date(user.inviteTokenExpiry) < new Date()) {
    throw new Error("This invite link has expired. Ask your admin for a new one.");
  }

  // Check username isn't taken by another user
  const existingUsername = getUsers().find(
    (u) => u.username.toLowerCase() === data.username.toLowerCase() && u.id !== user.id
  );
  if (existingUsername) {
    throw new Error(`Username "${data.username}" is already taken`);
  }

  user.username = data.username;
  user.passwordHash = await hashPassword(data.password);
  if (data.displayName) user.displayName = data.displayName;
  user.status = "active";
  user.inviteToken = undefined;
  user.inviteTokenExpiry = undefined;
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  setUsers(users);
  return toSafeUser(user);
}

/**
 * Seed a default admin account if no users exist.
 * Generates a random password and writes it to .data/initial-credentials.txt
 * so the admin can read it from the server. Never hardcoded in source.
 */
export async function seedDefaultAdmin(): Promise<void> {
  if (hasAnyUsers()) return;

  const password = randomBytes(16).toString("base64url"); // ~22 char random password

  console.log("[auth] No users found — creating default admin account.");
  console.log(`[auth] Default credentials written to: ${INIT_CREDS_FILE}`);

  await createUser({
    username: "admin",
    password,
    displayName: "Administrator",
    email: "",
    role: "admin",
  });

  // Write credentials to a file (server-side only, gitignored via .data/)
  try {
    ensureDataDir();
    writeFileSync(
      INIT_CREDS_FILE,
      [
        "SignalFoundry — Initial Admin Credentials",
        "==========================================",
        "",
        `Username: admin`,
        `Password: ${password}`,
        "",
        "Login at: http://localhost:3000/login",
        "",
        "IMPORTANT: Change this password immediately after first login.",
        "Delete this file after you have logged in.",
        "",
        `Generated: ${new Date().toISOString()}`,
      ].join("\n"),
      "utf-8"
    );
  } catch (err) {
    // If file write fails, log to console as fallback
    console.log(`[auth] Username: admin`);
    console.log(`[auth] Password: ${password}`);
    console.log("[auth] Change this password immediately after login.");
  }
}

import { z } from "zod";

/** Loose enough for international numbers, strict enough to catch typos. */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .regex(/^[+]?[\d\s()-]+$/, "Enter a valid phone number");

export const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name")
  .max(80, "That name is too long");

/** Honeypot: bots fill hidden fields, humans never see them. */
export const honeypotSchema = z.string().max(0, "Submission rejected").optional();

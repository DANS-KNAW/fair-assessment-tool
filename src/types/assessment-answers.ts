import { z } from "zod";

// Assessment Answer Schema
export const assessmentAnswerSchema = z.object({
  // Code and basic info
  cq1: z.string().max(255),
  yq1: z.string().min(1, "Domain is required"),
  yq2: z.string().min(1, "Role is required"),
  yq3: z.string().min(1, "Organization is required"),

  // Findable questions + intentions
  fq1: z.string().max(3),
  fq1i: z.string().max(1),
  fq2: z.string().max(3),
  fq2i: z.string().max(1),
  fq3: z.string().max(3),
  fq3i: z.string().max(1),

  // Accessible questions + intentions
  aq1: z.string().max(3),
  aq1i: z.string().max(1),
  aq2: z.string().max(3),
  aq2i: z.string().max(1),

  // Interoperable questions + intentions
  iq1: z.string().max(3),
  iq1i: z.string().max(1),

  // Reusable questions + intentions
  rq1: z.string().max(3),
  rq1i: z.string().max(1),
  rq2: z.string().max(3),
  rq2i: z.string().max(1),
  rq3: z.string().max(3),
  rq3i: z.string().max(1),
  rq4: z.string().max(3),
  rq4i: z.string().max(1),

  // Feedback questions
  qq1: z.string(),
  qq2: z.string(),
  qq3: z.string(),
  qq4: z.string().max(50),
});

export const downloadRequestSchema = z.object({
  email: z.email("Valid email is required").max(255),
  password: z.string().min(1, "Password is required").max(255),
  code: z.string().min(1, "Code is required").max(255),
});

export const completeAnswerSchema = assessmentAnswerSchema.extend({
  host: z.string().min(1, "Host is required").max(255),
  date: z.date(),
});

export type AssessmentAnswerDto = z.infer<typeof assessmentAnswerSchema>;
export type DownloadRequest = z.infer<typeof downloadRequestSchema>;
export type CompleteAnswerDto = z.infer<typeof completeAnswerSchema>;

import { z } from "zod";

// Define MongoDB schema
export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
});

export const teamMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  whatsappNumber: z.string(),
  projectId: z.string(),
  sectionNumber: z.number().nullable().optional(),
});

// Define insert schemas
export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

export const insertTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: z.string()
    .transform((val) => {
      // Remove all spaces and non-digit characters except +
      const cleaned = val.replace(/[^\d+]/g, '');

      // If it already has country code (starts with +20)
      if (cleaned.startsWith('+20') && cleaned.length === 13) {
        return cleaned;
      }

      // If it starts with 20 (without +)
      if (cleaned.startsWith('20') && cleaned.length === 12) {
        return `+${cleaned}`;
      }

      // If it's a 10-digit number, add country code
      if (cleaned.length === 10) {
        return `+20${cleaned}`;
      }

      return cleaned; // Return cleaned value for validation to fail
    })
    .refine(
      (val) => /^\+20\d{10}$/.test(val),
      "Must be in format +20XXXXXXXXXX (Egyptian number, spaces allowed)"
    ),
  projectId: z.string(),
  sectionNumber: z.number().min(1).max(4).optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
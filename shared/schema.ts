import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  projectId: integer("project_id").notNull(),
  sectionNumber: integer("section_number"),
  photoUrl: text("photo_url"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers)
  .pick({
    name: true,
    whatsappNumber: true,
    projectId: true,
    sectionNumber: true,
    photoUrl: true,
  })
  .extend({
    whatsappNumber: z.string()
      .transform((val) => {
        // Remove any non-digit characters
        const digits = val.replace(/\D/g, '');

        // If it's already a complete number with country code, return as is
        if (digits.startsWith('20') && digits.length >= 11) {
          return `+${digits}`;
        }

        // Add Egyptian country code if missing
        if (digits.length === 10) {
          return `+20${digits}`;
        }

        throw new Error('Invalid phone number format');
      })
      .refine((val) => /^\+20\d{10}$/.test(val), "Must be a valid Egyptian phone number"),
    sectionNumber: z.number().min(1).max(4).optional(),
    photoUrl: z.string().optional(),
  });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
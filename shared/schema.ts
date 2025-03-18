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
  })
  .extend({
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
    sectionNumber: z.number().min(1).max(4).optional(),
  });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
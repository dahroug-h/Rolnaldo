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
      .refine(
        (val) => /^\+20\d{10}$/.test(val),
        "Must be in format +201234567890 (Egyptian number)"
      ),
    sectionNumber: z.number().min(1).max(4).optional(),
  });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
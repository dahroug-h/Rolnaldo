import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTeamMemberSchema } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express) {
  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const project = await storage.getProjectById(id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(project);
  });

  app.get("/api/projects/:id/members", async (req, res) => {
    const projectId = parseInt(req.params.id);
    const members = await storage.getTeamMembers(projectId);
    res.json(members);
  });

  app.post("/api/projects", async (req, res) => {
    const result = insertProjectSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid project data" });
      return;
    }
    const project = await storage.createProject(result.data);
    res.json(project);
  });

  app.post("/api/members", async (req, res) => {
    const result = insertTeamMemberSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid member data" });
      return;
    }
    const member = await storage.addTeamMember(result.data);
    // Store the member's ID in the session for self-deletion
    req.session.userId = member.id;
    res.json(member);
  });

  app.delete("/api/members/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const member = await storage.getTeamMemberById(id);
    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    if (!req.session.userId || req.session.userId !== member.id) {
      res.status(403).json({ error: "You can only remove yourself from teams" });
      return;
    }

    await storage.removeTeamMember(id);
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });
    res.status(204).send();
  });

  return createServer(app);
}
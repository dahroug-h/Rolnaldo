import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTeamMemberSchema } from "@shared/schema";
import { ObjectId } from "mongodb";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
  }
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export async function registerRoutes(app: Express) {
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.get("/api/admin/status", (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
  });
  
  app.get("/api/me", (req, res) => {
    res.json({ userId: req.session?.userId || null });
  });

  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const project = await storage.getProjectById(id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project ID format" });
    }
  });

  app.get("/api/projects/:id/members", async (req, res) => {
    const projectId = req.params.id;
    try {
      const members = await storage.getTeamMembers(projectId);
      res.json(members);
    } catch (error) {
      res.status(400).json({ error: "Invalid project ID format" });
    }
  });

  app.post("/api/projects", requireAdmin, async (req, res) => {
    const result = insertProjectSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid project data" });
      return;
    }
    const project = await storage.createProject(result.data);
    res.json(project);
  });

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    const id = req.params.id;
    try {
      await storage.removeProject(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Invalid project ID format" });
    }
  });

  app.post("/api/members", async (req, res) => {
    const result = insertTeamMemberSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid member data" });
      return;
    }

    // Check for existing membership
    const existingMembers = await storage.getTeamMembers(result.data.projectId);
    const hasExisting = existingMembers.some(
      member => member.whatsappNumber === result.data.whatsappNumber
    );

    if (hasExisting) {
      res.status(400).json({ error: "You are already a member of this project" });
      return;
    }

    const member = await storage.addTeamMember(result.data);
    req.session.userId = member.id;
    res.json(member);
  });

  app.delete("/api/members/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const member = await storage.getTeamMemberById(id);
      if (!member) {
        res.status(404).json({ error: "Member not found" });
        return;
      }

      // Allow deletion only if user is admin or the member themselves
      if (!req.session.isAdmin && (!req.session.userId || req.session.userId !== member.id)) {
        res.status(403).json({ error: "You can only remove yourself from teams or be an admin" });
        return;
      }

      await storage.removeTeamMember(id);

      // Only destroy session if the user removed themselves (not admin)
      if (!req.session.isAdmin && req.session.userId === member.id) {
        req.session.destroy(err => {
          if (err) {
            console.error('Error destroying session:', err);
          }
        });
      }

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Invalid member ID format" });
    }
  });

  return createServer(app);
}
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
  
  app.get("/api/me", async (req, res) => {
    const userId = req.session?.userId;
    
    // Step 3: When a user returns, we recognize them by their userId in the session
    // This completes the workflow: 1) Register → 2) Login → 3) Return & Recognize 
    if (userId) {
      // If we wanted to add more info, we could look up the user's data here
      console.log(`User recognized with ID: ${userId}`);
    }
    
    res.json({ userId: userId || null });
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

    // Check for existing membership by WhatsApp number or name for this project
    const existingMembers = await storage.getTeamMembers(result.data.projectId);
    const hasExistingNumber = existingMembers.some(
      member => member.whatsappNumber === result.data.whatsappNumber
    );
    const hasExistingName = existingMembers.some(
      member => member.name.toLowerCase() === result.data.name.toLowerCase()
    );

    if (hasExistingNumber) {
      res.status(400).json({ error: "This WhatsApp number is already registered for this project" });
      return;
    }

    if (hasExistingName) {
      res.status(400).json({ error: "This name is already taken for this project" });
      return;
    }

    // Step 2: Prepare the member data to be stored
    const memberData = { ...result.data };
    
    // Step 3: Add the member to the database (without userId at first)
    const member = await storage.addTeamMember(memberData);
    
    // Make sure member has an ID
    if (!member || typeof member.id !== 'string') {
      res.status(500).json({ error: "Failed to create team member" });
      return;
    }
    
    // Step 4: Update the member with a permanent userId (using MongoDB _id)
    // This is the key step for implementing the persistent user ID pattern
    await storage.updateTeamMemberUserId(member.id, member.id);
    console.log(`User registered with ID: ${member.id}`);
    
    // Step 5: Store the userId in the session (login step)
    req.session.userId = member.id;
    
    // Step 6: Return the complete member data
    const updatedMember = await storage.getTeamMemberById(member.id);
    
    if (!updatedMember) {
      res.status(500).json({ error: "Failed to retrieve updated team member" });
      return;
    }
    
    res.json(updatedMember);
  });

  app.delete("/api/members/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const member = await storage.getTeamMemberById(id);
      if (!member) {
        res.status(404).json({ error: "Member not found" });
        return;
      }

      // Check if user has permission to remove this member
      // 1. Admin can remove any member
      // 2. Regular user can only remove themselves
      const isCurrentUser = 
        req.session.userId === member.id || 
        (member.userId && req.session.userId === member.userId);
      
      if (!req.session.isAdmin && (!req.session.userId || !isCurrentUser)) {
        res.status(403).json({ 
          error: "You can only remove yourself from teams. Admins can remove anyone." 
        });
        return;
      }

      // Remove the member from the database
      await storage.removeTeamMember(id);

      // Only clear the session if the user removed themselves and is not an admin
      if (!req.session.isAdmin && isCurrentUser) {
        // Set userId to undefined instead of null to satisfy TypeScript
        req.session.userId = undefined;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(400).json({ error: "Invalid member ID format" });
    }
  });

  return createServer(app);
}
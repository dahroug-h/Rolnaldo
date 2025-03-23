import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTeamMemberSchema } from "@shared/schema";
import { ObjectId } from "mongodb";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
    currentChallenge?: string;
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
    if (userId) {
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

    const memberData = { ...result.data };
    const member = await storage.addTeamMember(memberData);

    if (!member || typeof member.id !== 'string') {
      res.status(500).json({ error: "Failed to create team member" });
      return;
    }

    await storage.updateTeamMemberUserId(member.id, member.id);
    console.log(`User registered with ID: ${member.id}`);
    req.session.userId = member.id;
    const updatedMember = await storage.getTeamMemberById(member.id);

    if (!updatedMember) {
      res.status(500).json({ error: "Failed to retrieve updated team member" });
      return;
    }

    res.json(updatedMember);
  });

  // Placeholder for rpName, rpID, and origin.  These need to be defined appropriately.
  const rpName = "YourAppName";
  const rpID = "your.app.id";
  const origin = "http://localhost:3000"; // Replace with your actual origin

  app.post("/api/members/:id/webauthn/register", async (req, res) => {
    const member = await storage.getTeamMemberById(req.params.id);
    if (!member || member.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const options = await generateRegistrationOptions({ //generateRegistrationOptions is not defined
      rpName,
      rpID,
      userID: member.id,
      userName: member.name,
      attestationType: 'none'
    });

    req.session.currentChallenge = options.challenge;
    res.json(options);
  });

  app.post("/api/members/:id/webauthn/verify", async (req, res) => {
    const member = await storage.getTeamMemberById(req.params.id);
    if (!member || member.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const verification = await verifyRegistrationResponse({ //verifyRegistrationResponse is not defined
      credential: req.body,
      expectedChallenge: req.session.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    await storage.updateTeamMemberUserId(member.id, member.id, {
      credentialID: verification.registrationInfo?.credentialID.toString('base64'),
      credentialPublicKey: verification.registrationInfo?.credentialPublicKey.toString('base64')
    });

    res.json({ verified: true });
  });

  app.delete("/api/members/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const member = await storage.getTeamMemberById(id);
      if (!member) {
        res.status(404).json({ error: "Member not found" });
        return;
      }

      const isCurrentUser = 
        req.session.userId === member.id || 
        (member.userId && req.session.userId === member.userId);

      if (!req.session.isAdmin && (!req.session.userId || !isCurrentUser)) {
        res.status(403).json({ 
          error: "You can only remove yourself from teams. Admins can remove anyone." 
        });
        return;
      }

      if (!req.session.isAdmin && member.credentialID) {
        const options = await generateAuthenticationOptions({ //generateAuthenticationOptions is not defined
          rpID,
          allowCredentials: [{
            id: Buffer.from(member.credentialID, 'base64'),
            type: 'public-key'
          }]
        });

        req.session.currentChallenge = options.challenge;
        return res.status(403).json({ 
          error: "WebAuthn verification required",
          options 
        });
      }

      await storage.removeTeamMember(id);
      if (!req.session.isAdmin && isCurrentUser) {
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
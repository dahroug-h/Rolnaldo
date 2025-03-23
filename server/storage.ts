import {
  type Project,
  type InsertProject,
  type TeamMember,
  type InsertTeamMember,
} from "@shared/schema";
import { MongoClient, ObjectId } from "mongodb";

// Convert MongoDB _id to id for frontend
function mapMongoProject(doc: any): Project {
  if (!doc) return doc;
  return {
    id: doc._id.toString(),
    name: doc.name,
  };
}

function mapMongoTeamMember(doc: any): TeamMember {
  if (!doc) return doc;
  return {
    id: doc._id.toString(),
    name: doc.name,
    whatsappNumber: doc.whatsappNumber,
    projectId: doc.projectId,
    sectionNumber: doc.sectionNumber || null,
    userId: doc.userId || doc._id.toString(), // Use userId if available, otherwise use document ID
    deviceId: doc.deviceId, // Include device ID for client-side verification
  };
}

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  removeProject(id: string): Promise<void>;
  getTeamMembers(projectId?: string): Promise<TeamMember[]>;
  getTeamMemberById(id: string): Promise<TeamMember | undefined>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(id: string): Promise<void>;
  updateTeamMemberUserId(id: string, userId: string): Promise<void>;
  connect(): Promise<void>;
  close(): Promise<void>;
}

export class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private connected: boolean = false;
  private db: any;

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db("team_not_found");
      this.connected = true;
      console.log("Connected to MongoDB Atlas");
      
      // Create initial projects if database is empty
      const projectsCount = await this.db.collection("projects").countDocuments();
      if (projectsCount === 0) {
        await this.db.collection("projects").insertMany([
          { name: "Web Development" },
          { name: "Mobile App" },
          { name: "AI/ML Project" }
        ]);
        console.log("Created initial projects");
      }
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
      console.log("Disconnected from MongoDB");
    }
  }

  async getProjects(): Promise<Project[]> {
    const projects = await this.db.collection("projects").find().toArray();
    return projects.map(mapMongoProject);
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    try {
      const project = await this.db.collection("projects").findOne({ _id: new ObjectId(id) });
      return project ? mapMongoProject(project) : undefined;
    } catch (error) {
      console.error(`Error getting project by ID: ${id}`, error);
      return undefined;
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await this.db.collection("projects").insertOne(project);
    return {
      id: result.insertedId.toString(),
      ...project
    };
  }

  async removeProject(id: string): Promise<void> {
    try {
      // Remove all team members of this project first
      await this.db.collection("team_members").deleteMany({ projectId: id });
      // Then remove the project
      await this.db.collection("projects").deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error(`Error removing project: ${id}`, error);
      throw error;
    }
  }

  async getTeamMembers(projectId?: string): Promise<TeamMember[]> {
    let query = {};
    if (projectId) {
      query = { projectId };
    }
    const members = await this.db.collection("team_members").find(query).toArray();
    return members.map(mapMongoTeamMember);
  }

  async getTeamMemberById(id: string): Promise<TeamMember | undefined> {
    try {
      const member = await this.db.collection("team_members").findOne({ _id: new ObjectId(id) });
      return member ? mapMongoTeamMember(member) : undefined;
    } catch (error) {
      console.error(`Error getting team member by ID: ${id}`, error);
      return undefined;
    }
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await this.db.collection("team_members").insertOne({
      ...member,
      sectionNumber: member.sectionNumber || null,
      deviceId: member.deviceId // Store the device ID for user identification
    });
    return {
      id: result.insertedId.toString(),
      ...member,
      sectionNumber: member.sectionNumber || null,
      deviceId: member.deviceId
    };
  }

  async removeTeamMember(id: string): Promise<void> {
    try {
      await this.db.collection("team_members").deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error(`Error removing team member: ${id}`, error);
      throw error;
    }
  }
  
  async updateTeamMemberUserId(id: string, userId: string): Promise<void> {
    try {
      await this.db.collection("team_members").updateOne(
        { _id: new ObjectId(id) },
        { $set: { userId: userId } }
      );
      console.log(`Updated team member ${id} with userId: ${userId}`);
    } catch (error) {
      console.error(`Error updating team member userId: ${id}`, error);
      throw error;
    }
  }
}

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hsnh08130:Akj6qe2RbgJ2mrQF@cluster0.ludgd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create and export the MongoDB storage instance
export const storage = new MongoDBStorage(MONGODB_URI);
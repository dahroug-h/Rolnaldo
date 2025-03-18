import {
  type Project,
  type InsertProject,
  type TeamMember,
  type InsertTeamMember,
} from "@shared/schema";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  getTeamMembers(projectId?: number): Promise<TeamMember[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private teamMembers: Map<number, TeamMember>;
  private projectId: number;
  private memberId: number;

  constructor() {
    this.projects = new Map();
    this.teamMembers = new Map();
    this.projectId = 1;
    this.memberId = 1;

    // Add some initial projects
    this.createProject({ name: "Web Development" });
    this.createProject({ name: "Mobile App" });
    this.createProject({ name: "AI/ML Project" });
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const newProject = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }

  async getTeamMembers(projectId?: number): Promise<TeamMember[]> {
    const members = Array.from(this.teamMembers.values());
    if (projectId) {
      return members.filter((member) => member.projectId === projectId);
    }
    return members;
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = this.memberId++;
    const newMember = { ...member, id };
    this.teamMembers.set(id, newMember);
    return newMember;
  }

  async removeTeamMember(id: number): Promise<void> {
    this.teamMembers.delete(id);
  }
}

export const storage = new MemStorage();

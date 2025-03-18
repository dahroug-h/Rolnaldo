import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import JoinForm from "./join-form";
import { type Project, type TeamMember } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserMinus } from "lucide-react";

type ProjectListProps = {
  projects: Project[];
};

export default function ProjectList({ projects }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const { data: teamMembers = {}, isLoading } = useQuery<Record<number, TeamMember[]>>({
    queryKey: ["/api/projects", "members"],
    queryFn: async () => {
      const membersPromises = projects.map(async (project) => {
        const response = await fetch(`/api/projects/${project.id}/members`, {
          credentials: "include",
        });
        const members = await response.json();
        return [project.id, members];
      });
      const results = await Promise.all(membersPromises);
      return Object.fromEntries(results);
    },
    enabled: projects.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "members"] });
      toast({
        title: "Success",
        description: "Member removed from the team",
      });
    },
  });

  return (
    <div className="space-y-6 mt-8">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-2xl font-semibold">{project.name}</h2>
            <Button
              onClick={() => setSelectedProject(project)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="mr-2 h-4 w-4" />
              Join Team
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Team Members
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : teamMembers[project.id]?.length ? (
                teamMembers[project.id].map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        WhatsApp: {member.whatsappNumber}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMutation.mutate(member.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No team members yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent>
          {selectedProject && (
            <JoinForm project={selectedProject} onClose={() => setSelectedProject(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
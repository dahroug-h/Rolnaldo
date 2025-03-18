import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import JoinForm from "./join-form";
import { type Project, type TeamMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserMinus } from "lucide-react";

type ProjectListProps = {
  projects: Project[];
};

export default function ProjectList({ projects }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/projects", selectedProject?.id, "members"],
    enabled: !!selectedProject,
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "You have been removed from the team",
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
              Need a Team
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        {selectedProject && (
          <JoinForm project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </Dialog>
    </div>
  );
}

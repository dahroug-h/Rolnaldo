import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Project } from "@shared/schema";
import { Users2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

type ProjectListProps = {
  projects: Project[];
};

export default function ProjectList({ projects }: ProjectListProps) {
  const { data: memberCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/projects/member-counts"],
    queryFn: async () => {
      const countPromises = projects.map(async (project) => {
        const response = await fetch(`/api/projects/${project.id}/members`);
        const members = await response.json();
        return [project.id, members.length];
      });
      const results = await Promise.all(countPromises);
      return Object.fromEntries(results);
    },
    enabled: projects.length > 0,
  });

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <Link href={`/project/${project.id}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {memberCounts[project.id] || 0} members
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  );
}
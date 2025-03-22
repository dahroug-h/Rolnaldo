import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProjectList from "@/components/project-list";
import SearchFilter from "@/components/search-filter";
import { type Project } from "@shared/schema";
import AdminPanel from "@/components/admin-panel";


export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            404 Team Not Found
          </h1>
          <p className="text-xl text-muted-foreground">By EECE 27</p>
        </div>

        <div className="grid gap-8 mb-8">
          <AdminPanel />

          <div>
            <SearchFilter 
              value={searchQuery}
              onChange={setSearchQuery}
            />

            {isLoading ? (
              <div className="space-y-4 mt-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="mt-8">
                <ProjectList projects={filteredProjects} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
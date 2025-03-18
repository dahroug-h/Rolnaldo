import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProjectList from "@/components/project-list";
import SearchFilter from "@/components/search-filter";
import { type Project } from "@shared/schema";

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
          <img 
            src="/attached_assets/Logo%20Transparent.png" 
            alt="404 Team Not Found" 
            className="h-24 mb-4"
          />
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            404 Team Not Found
          </h1>
        </div>

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
          <ProjectList projects={filteredProjects} />
        )}
      </main>
    </div>
  );
}
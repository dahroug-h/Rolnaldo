import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const { data: adminStatus, refetch: refetchAdminStatus } = useQuery({
    queryKey: ["adminStatus"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      setIsLoggedIn(data.isAdmin);
      return data;
    },
    staleTime: Infinity,
    cacheTime: Infinity
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/login", { password });
    },
    onSuccess: async () => {
      await refetchAdminStatus();
      setPassword("");
      toast({
        description: "Admin access granted",
        duration: 2000,
      });
    },
  });

  const projectForm = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsOpen(false);
      projectForm.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  if (!isLoggedIn) {
    return (
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Admin Login</h2>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
        />
        <Button 
          onClick={() => loginMutation.mutate()}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Project Management</h2>
        <Button onClick={() => setIsOpen(true)}>Create Project</Button>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center justify-between p-2 bg-muted rounded">
            <span>{project.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteProjectMutation.mutate(project.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))} className="space-y-4">
              <FormField
                control={projectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter project name" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

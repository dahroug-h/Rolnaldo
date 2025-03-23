import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type Project, insertTeamMemberSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getDeviceId } from "@/lib/deviceId";
import { Loader2 } from "lucide-react";

type JoinFormProps = {
  project: Project;
  onClose: () => void;
};

type FormData = {
  name: string;
  whatsappNumber: string;
  projectId: string;
  sectionNumber?: number;
};

export default function JoinForm({ project, onClose }: JoinFormProps) {
  const { toast } = useToast();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(insertTeamMemberSchema),
    defaultValues: {
      name: "",
      whatsappNumber: "",
      projectId: project.id,
      sectionNumber: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      // Reset progress when starting
      setLoadingProgress(0);
      
      // Start progress animation
      startProgressAnimation();
      
      // Get or create a persistent device ID
      const deviceId = await getDeviceId();
      
      await apiRequest("POST", "/api/members", {
        ...values,
        deviceId // Send the device ID to identify this user
      });
    },
    onSuccess: () => {
      // Stop animation and set to 100%
      stopProgressAnimation();
      setLoadingProgress(100);
      
      // Invalidate both the members list and the specific project's members
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "members"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/members`] });

      toast({
        description: "Successfully joined project",
        duration: 2000,
      });
      
      // Small delay before closing to show completed progress
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error) => {
      // Stop animation
      stopProgressAnimation();
      
      toast({
        title: "Error joining project",
        description: error instanceof Error ? error.message : "There was an error joining the project",
        variant: "destructive",
      });
    }
  });
  
  // Helper functions for progress animation
  const startProgressAnimation = () => {
    // Clear any existing interval
    stopProgressAnimation();
    
    // Start a new interval
    progressIntervalRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        const newValue = prev + 5;
        return newValue < 90 ? newValue : 90;
      });
    }, 100);
  };
  
  const stopProgressAnimation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => stopProgressAnimation();
  }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Join {project.name} Team</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsappNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+201234567890" />
                </FormControl>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your number in format: +201234567890
                </p>
                <p className="text-xs text-primary mt-1">
                  Your session will be remembered so you can return later
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sectionNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Number (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your section" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Section {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {mutation.isPending && (
            <div className="space-y-2 my-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Processing your request...
                  </p>
                </div>
                <p className="text-sm font-medium">{loadingProgress}%</p>
              </div>
              <Progress value={loadingProgress} className="h-2" />
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Joining..." : "Join Team"}
          </Button>
        </form>
      </Form>
    </>
  );
}
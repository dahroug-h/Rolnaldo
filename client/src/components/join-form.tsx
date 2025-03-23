import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import FingerprintJS from "@fingerprintjs/fingerprintjs";

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
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;
      
      await apiRequest("POST", "/api/members", {
        ...values,
        fingerprint
      });
    },
    onSuccess: () => {
      // Invalidate both the members list and the specific project's members
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "members"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/members`] });

      toast({
        description: "Joined project",
        duration: 2000,
      });
      onClose();
    },
  });

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

// Removed placeholder function; FingerprintJS is now used directly in the mutation.
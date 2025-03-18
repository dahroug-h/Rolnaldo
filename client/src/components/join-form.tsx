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

type JoinFormProps = {
  project: Project;
  onClose: () => void;
};

type FormData = {
  name: string;
  whatsappNumber: string;
  projectId: number;
  sectionNumber?: number;
  photo?: File;
  photoUrl?: string;
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
      photoUrl: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const formData = { ...values };
      if (formData.photo) {
        const reader = new FileReader();
        const photoUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result);
          reader.readAsDataURL(formData.photo);
        });
        formData.photoUrl = photoUrl as string;
        delete formData.photo;
      }
      await apiRequest("POST", "/api/members", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "members"] });
      toast({
        title: "Success",
        description: "You have joined the team!",
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
                  <Input {...field} placeholder="e.g., 1234567890" />
                </FormControl>
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

          <FormField
            control={form.control}
            name="photo"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Photo (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onChange(file);
                    }}
                    {...field}
                  />
                </FormControl>
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
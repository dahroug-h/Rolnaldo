import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JoinForm from "@/components/join-form";
import { useState } from "react";
import { type Project, type TeamMember } from "@shared/schema";
import { Users2, MessageCircle, ArrowLeft, MoreVertical, Search, Loader2 } from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import { getDeviceId } from "@/lib/deviceId";

// Type for our member query data
type MemberData = TeamMember[];

export default function ProjectPage() {
  const [_, params] = useRoute("/project/:id");
  const projectId = params?.id || "";
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  const { 
    data: members = [], 
    refetch: refetchMembers, 
    isLoading: membersLoading,
    isRefetching: membersRefetching
  } = useQuery<TeamMember[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });
  
  const { data: adminStatus } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/status"],
    staleTime: Infinity,
    gcTime: Infinity, // replaced cacheTime with gcTime which is the new name in React Query v5
  });

  const { data: meData } = useQuery<{ userId: string | null }>({
    queryKey: ["/api/me"],
  });

  const isAdmin = adminStatus?.isAdmin || false;
  const currentUserId = meData?.userId || null;

  // Check if user is logged in (has a userId) and if they're a member of this project
  const isUserLoggedIn = !!currentUserId;
  const isUserMember = isUserLoggedIn && members.some(
    member => member.id === currentUserId || member.userId === currentUserId
  );

  if (!project) return <div>Project not found</div>;

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isLoading = membersLoading || membersRefetching;


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button 
              variant="outline" 
              size="lg"
              className="hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <span className="text-xl font-semibold">By EECE 27</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8 flex-grow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8 mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {project.name}
          </h1>
          <Button onClick={() => setShowJoinForm(true)} className="w-full sm:w-auto">
            <Users2 className="mr-2 h-5 w-5" />
            Join Team
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name..."
            className="pl-10"
          />
        </div>
        
        {/* Simple loading indicator */}
        {isLoading && (
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading team members...
              </p>
            </div>
          </div>
        )}
        
        {/* Members Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredMembers.length} members
            {searchQuery && ` (filtered from ${members.length})`}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Skeleton loaders when loading */}
          {isLoading && filteredMembers.length === 0 && 
            Array(3).fill(0).map((_, index) => (
              <Card key={`skeleton-${index}`} className="w-full bg-muted/30">
                <CardContent className="flex items-center justify-between p-4 sm:p-6 h-24 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <div className="h-8 w-8 bg-muted rounded-full" />
                    </div>
                    <div>
                      <div className="h-5 w-32 bg-muted rounded mb-2" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
          
          {/* No results found */}
          {!isLoading && filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No team members found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowJoinForm(true)}
              >
                <Users2 className="mr-2 h-5 w-5" />
                Join this team
              </Button>
            </div>
          )}
          
          {/* Actual members list */}
          {filteredMembers.map((member) => (
            <Card key={member.id} className="w-full">
              <CardContent className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Users2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{member.name}</h2>
                    {member.sectionNumber && (
                      <p className="text-sm text-muted-foreground">
                        Section {member.sectionNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href={`https://wa.me/${member.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                  >
                    <Button variant="outline" size="lg" className="rounded-full p-3">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                    </Button>
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Show Remove Me option if the member is the current user, using persistent userId */}
                      {currentUserId && (currentUserId === member.id || currentUserId === member.userId) && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              // Get the device ID for authentication
                              const deviceId = await getDeviceId();
                              await fetch(`/api/members/${member.id}`, {
                                method: 'DELETE',
                                credentials: 'include',
                                headers: {
                                  'X-Device-ID': deviceId
                                }
                              });
                              // Refresh data after successful removal
                              refetchMembers();
                            } catch (error) {
                              console.error("Failed to remove self:", error);
                            }
                          }}
                        >
                          Remove Me
                        </DropdownMenuItem>
                      )}

                      {/* Admin can remove anyone except themselves (they should use Remove Me) */}
                      {isAdmin && currentUserId && currentUserId !== member.id && currentUserId !== member.userId && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              // Admins don't need to provide device ID
                              await fetch(`/api/members/${member.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                              });
                              // Refresh data after successful removal
                              refetchMembers();
                            } catch (error) {
                              console.error("Failed to remove member:", error);
                            }
                          }}
                        >
                          Remove Member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showJoinForm} onOpenChange={setShowJoinForm}>
          <DialogContent>
            <JoinForm project={project} onClose={() => setShowJoinForm(false)} />
          </DialogContent>
        </Dialog>
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex items-center justify-center space-x-4">
          <p>© Hassan Dahroug 2025</p>
          <a
            href="https://www.linkedin.com/in/hassan-dahroug-736ab7285/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            <SiLinkedin className="h-5 w-5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
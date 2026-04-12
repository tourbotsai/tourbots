"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Eye, EyeOff, KeyRound, Loader2, MailPlus, Shield, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTeamMembers } from "@/hooks/app/useTeamMembers";
import { useUser } from "@/hooks/useUser";

type AssignableRole = "admin" | "manager" | "viewer";
type AssignableAccountRole = "user" | "admin" | "platform_admin";

export function TeamMembersSettings() {
  const { toast } = useToast();
  const { user } = useUser();
  const isPlatformAdmin = user?.role === "platform_admin";
  const { members, isLoading, isMutating, error, inviteMember, updateMemberRole, removeMember, setMemberPassword } =
    useTeamMembers();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<AssignableRole>("viewer");
  const [inviteAccountRole, setInviteAccountRole] = useState<AssignableAccountRole>("user");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState("");
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [showInviteConfirmPassword, setShowInviteConfirmPassword] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ userId: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; name: string } | null>(null);
  const [newMemberExpanded, setNewMemberExpanded] = useState(false);
  const hasInvitePasswordMismatch = invitePassword !== inviteConfirmPassword;
  const hasResetPasswordMismatch = resetPassword !== resetConfirmPassword;
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.is_owner && !b.is_owner) return -1;
      if (!a.is_owner && b.is_owner) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [members]);

  const onInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (hasInvitePasswordMismatch) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmittingInvite(true);
      await inviteMember({
        email: inviteEmail,
        role: inviteRole,
        first_name: inviteFirstName || undefined,
        last_name: inviteLastName || undefined,
        password: invitePassword,
        account_role: inviteAccountRole,
      });

      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole("viewer");
      setInviteAccountRole("user");
      setInvitePassword("");
      setInviteConfirmPassword("");
      setShowInvitePassword(false);
      setShowInviteConfirmPassword(false);

      toast({
        title: "Team member added",
        description: "User access is now active for this account.",
      });
    } catch (inviteError: any) {
      toast({
        title: "Failed to add team member",
        description: inviteError.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingInvite(false);
    }
  };

  const onRoleChange = async (userId: string, nextRole: AssignableRole) => {
    try {
      await updateMemberRole(userId, nextRole);
      toast({
        title: "Role updated",
        description: "Team member role has been updated.",
      });
    } catch (updateError: any) {
      toast({
        title: "Failed to update role",
        description: updateError.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onRemoveMember = async (userId: string, name: string) => {
    try {
      await removeMember(userId);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({
        title: "Team member removed",
        description: `${name} no longer has access to this account.`,
      });
    } catch (removeError: any) {
      toast({
        title: "Failed to remove team member",
        description: removeError.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSetPassword = async () => {
    if (!resetTarget) return;
    if (hasResetPasswordMismatch) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }
    if (resetPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    try {
      await setMemberPassword(resetTarget.userId, resetPassword);
      toast({
        title: "Password updated",
        description: `Password has been reset for ${resetTarget.name}.`,
      });
      setResetModalOpen(false);
      setResetTarget(null);
      setResetPassword("");
      setResetConfirmPassword("");
      setShowResetPassword(false);
      setShowResetConfirmPassword(false);
    } catch (passwordError: any) {
      toast({
        title: "Failed to update password",
        description: passwordError.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Team Members</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Add and manage users who can access this account and venue workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
            <Shield className="h-4 w-4" />
            Current Team
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-lg border border-border/80 p-6 text-sm text-muted-foreground dark:border-input">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading team members...
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-6 text-sm text-muted-foreground dark:border-input">
              No team members yet.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex flex-col gap-3 rounded-lg border border-border/80 p-3 dark:border-input sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      {member.full_name}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {member.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.is_owner && <Badge variant="secondary">Primary Owner</Badge>}
                      {member.account_role === "platform_admin" && <Badge variant="outline">Platform Admin</Badge>}
                      {!member.is_active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.is_owner ? (
                      <Badge>Owner</Badge>
                    ) : (
                      <Select
                        value={member.access_role}
                        onValueChange={(value) => onRoleChange(member.user_id, value as AssignableRole)}
                        disabled={isMutating}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {!member.is_owner && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetTarget({ userId: member.user_id, name: member.full_name });
                            setResetPassword("");
                            setResetConfirmPassword("");
                            setShowResetPassword(false);
                            setShowResetConfirmPassword(false);
                            setResetModalOpen(true);
                          }}
                          disabled={isMutating}
                          className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                        >
                          <KeyRound className="mr-1 h-4 w-4" />
                          Reset Password
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setDeleteTarget({ userId: member.user_id, name: member.full_name });
                            setDeleteDialogOpen(true);
                          }}
                          disabled={isMutating}
                          className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Collapsible open={newMemberExpanded} onOpenChange={setNewMemberExpanded}>
          <div className="rounded-xl border border-border/80 dark:border-input">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex h-auto w-full items-center justify-between rounded-xl px-4 py-3 hover:bg-muted/40 dark:hover:bg-white/5"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                  <UserPlus className="h-4 w-4" />
                  New Team Member
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${newMemberExpanded ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="border-t border-border/80 p-4 dark:border-input">
              <form onSubmit={onInvite} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="team-invite-email">Email Address</Label>
                    <Input
                      id="team-invite-email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-invite-first-name">First Name</Label>
                    <Input
                      id="team-invite-first-name"
                      placeholder="First name"
                      value={inviteFirstName}
                      onChange={(event) => setInviteFirstName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-invite-last-name">Last Name</Label>
                    <Input
                      id="team-invite-last-name"
                      placeholder="Last name"
                      value={inviteLastName}
                      onChange={(event) => setInviteLastName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Role</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as AssignableRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isPlatformAdmin && (
                    <div className="space-y-2">
                      <Label>Account Role</Label>
                      <Select
                        value={inviteAccountRole}
                        onValueChange={(value) => setInviteAccountRole(value as AssignableAccountRole)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Account User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="platform_admin">Platform Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="team-invite-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="team-invite-password"
                        type={showInvitePassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="Set initial password"
                        value={invitePassword}
                        onChange={(event) => setInvitePassword(event.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowInvitePassword((value) => !value)}
                        aria-label={showInvitePassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {showInvitePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-invite-password-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="team-invite-password-confirm"
                        type={showInviteConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="Confirm password"
                        value={inviteConfirmPassword}
                        onChange={(event) => setInviteConfirmPassword(event.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowInviteConfirmPassword((value) => !value)}
                        aria-label={showInviteConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {showInviteConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={submittingInvite || isMutating || hasInvitePasswordMismatch || invitePassword.length < 8}
                      className="w-full dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      {submittingInvite ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <MailPlus className="mr-2 h-4 w-4" />
                          Add Team Member
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {hasInvitePasswordMismatch && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  Password and confirm password must match before adding the team member.
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-md dark:border-input dark:bg-[#121923]/96">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetTarget?.name || "this team member"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reset-member-password">New Password</Label>
              <div className="relative">
                <Input
                  id="reset-member-password"
                  type={showResetPassword ? "text" : "password"}
                  value={resetPassword}
                  minLength={8}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword((value) => !value)}
                  aria-label={showResetPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-member-password-confirm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="reset-member-password-confirm"
                  type={showResetConfirmPassword ? "text" : "password"}
                  value={resetConfirmPassword}
                  minLength={8}
                  onChange={(event) => setResetConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword((value) => !value)}
                  aria-label={showResetConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {hasResetPasswordMismatch && (
              <p className="text-sm text-red-600 dark:text-red-400">Password and confirm password must match.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetModalOpen(false)}
              className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              onClick={onSetPassword}
              disabled={isMutating || hasResetPasswordMismatch || resetPassword.length < 8}
              className="dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:border-input dark:bg-[#121923]/96">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deleteTarget?.name || "this user"} from this account team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                onRemoveMember(deleteTarget.userId, deleteTarget.name);
              }}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

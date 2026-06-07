"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  Save,
  Shield,
  User,
} from "lucide-react";
import {
  changeCurrentUserPassword,
  updateActiveSchoolYearDates,
  updateCurrentUserLegacyProfile,
  type LegacyCurrentProfileData,
} from "@/lib/actions/profile";
import { toast } from "sonner";

interface ProfileUser {
  name: string;
  email: string;
  role: string;
}

interface ActiveSchoolYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

interface ProfileNotice {
  type: "success" | "error";
  message: string;
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "Administrator",
    MANAGER: "Manager",
    TEACHER: "Teacher",
    NURSE: "Nurse",
    DOCTOR: "Doctor",
  };
  return map[role] ?? role;
}

function sectionValue(section: string) {
  return (
    section
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "profile"
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function fieldInputId(fieldLegacyId: number) {
  return `legacy-profile-field-${fieldLegacyId}`;
}

function buildInitialProfileValues(profile: LegacyCurrentProfileData | null) {
  return Object.fromEntries(
    (profile?.profileFields ?? []).map((field) => [
      String(field.fieldLegacyId),
      field.fieldType === "checkbox" ? field.value === "1" : field.value,
    ]),
  ) as Record<string, string | boolean>;
}

export function ProfileClient({
  user,
  legacyProfile = null,
  profileNotice = null,
  legacySettings = false,
  activeSchoolYear = null,
  canEditSchoolYear = false,
}: {
  user: ProfileUser;
  legacyProfile?: LegacyCurrentProfileData | null;
  profileNotice?: ProfileNotice | null;
  legacySettings?: boolean;
  activeSchoolYear?: ActiveSchoolYear | null;
  canEditSchoolYear?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legacyName, setLegacyName] = useState(
    legacyProfile?.name || user.name || "",
  );
  const [legacyEmail, setLegacyEmail] = useState(
    legacyProfile?.email || user.email || "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [legacyPassword, setLegacyPassword] = useState("");
  const [legacyConfirm, setLegacyConfirm] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showLegacyPassword, setShowLegacyPassword] = useState(false);
  const [showLegacyConfirm, setShowLegacyConfirm] = useState(false);
  const [profileValues, setProfileValues] = useState(() =>
    buildInitialProfileValues(legacyProfile),
  );
  const [pendingConfirmUrl, setPendingConfirmUrl] = useState<string | null>(null);
  const [schoolYearStartDate, setSchoolYearStartDate] = useState(
    activeSchoolYear?.startDate ?? "",
  );
  const [schoolYearEndDate, setSchoolYearEndDate] = useState(
    activeSchoolYear?.endDate ?? "",
  );
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isLegacyPending, startLegacyTransition] = useTransition();
  const [isSchoolYearPending, startSchoolYearTransition] = useTransition();
  const initials = (legacyName || user.name)
    ? (legacyName || user.name)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  const profileSections = useMemo(() => {
    const sections = new Map<
      string,
      NonNullable<LegacyCurrentProfileData["profileFields"]>
    >();

    for (const field of legacyProfile?.profileFields ?? []) {
      const fields = sections.get(field.section) ?? [];
      fields.push(field);
      sections.set(field.section, fields);
    }

    return Array.from(sections.entries()).map(([section, fields]) => ({
      section,
      fields,
      value: sectionValue(section),
    }));
  }, [legacyProfile]);

  useEffect(() => {
    if (!profileNotice) return;
    if (profileNotice.type === "success") {
      toast.success(profileNotice.message);
    } else {
      toast.error(profileNotice.message);
    }
  }, [profileNotice]);

  function handlePasswordSave() {
    if (!password) {
      toast.error("No Change !");
      return;
    }
    if (password.length < 5) {
      toast.error("Password must be at least 5 characters");
      return;
    }

    startPasswordTransition(async () => {
      const result = await changeCurrentUserPassword(password);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update password");
        return;
      }

      setPassword("");
      setShowPassword(false);
      toast.success("Password updated successfully");
    });
  }

  function handleLegacySave() {
    if (!legacyProfile) return;
    if (!currentPassword) {
      toast.error("You must enter the current password to make changes.");
      return;
    }
    if (!legacyName.trim()) {
      toast.error("You must enter a name.");
      return;
    }
    if (legacyPassword && legacyPassword.length < 5) {
      toast.error("Your password must be at least 5 characters.");
      return;
    }
    if (legacyPassword && legacyPassword !== legacyConfirm) {
      toast.error("Your passwords did not match.");
      return;
    }

    startLegacyTransition(async () => {
      const result = await updateCurrentUserLegacyProfile({
        currentPassword,
        name: legacyName,
        email: legacyEmail,
        password: legacyPassword,
        confirm: legacyConfirm,
        profileValues: legacyProfile.profileFields.map((field) => ({
          fieldLegacyId: field.fieldLegacyId,
          value: profileValues[String(field.fieldLegacyId)] ?? "",
        })),
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to update profile");
        return;
      }

      setCurrentPassword("");
      setLegacyPassword("");
      setLegacyConfirm("");
      setShowCurrentPassword(false);
      setShowLegacyPassword(false);
      setShowLegacyConfirm(false);
      setPendingConfirmUrl(result.data?.confirmUrl ?? null);

      if (result.data?.requiresConfirmation) {
        toast.warning("Check your email to confirm this change.");
      } else {
        toast.success("Profile updated successfully");
      }
    });
  }

  function handleSchoolYearSave() {
    if (!schoolYearStartDate || !schoolYearEndDate) {
      toast.error("Please Fill both start & end dates");
      return;
    }

    startSchoolYearTransition(async () => {
      const result = await updateActiveSchoolYearDates(
        schoolYearStartDate,
        schoolYearEndDate,
      );
      if (!result.success) {
        toast.error(result.error ?? "Failed to update scholastic year");
        return;
      }

      toast.success("Dates updated successufly");
    });
  }

  function renderPasswordToggle(
    visible: boolean,
    setVisible: (value: boolean) => void,
    label: string,
  ) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1 top-1"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    );
  }

  const displayName = legacyName || user.name || "Unnamed";
  const displayEmail = legacyEmail || user.email || "No email";

  return (
    <>
      <PageHeader
        title={legacySettings ? "Settings" : "Profile"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: legacySettings ? "Settings" : "Profile" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {displayName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {user.role ? (
                <Badge variant="secondary">{formatRole(user.role)}</Badge>
              ) : null}
              {legacyProfile ? (
                <Badge variant="outline">
                  {legacyProfile.username || legacyProfile.legacyUserId}
                </Badge>
              ) : null}
              <span className="max-w-full truncate text-sm text-muted-foreground">
                {displayEmail}
              </span>
            </div>
          </div>
        </div>

        {profileNotice ? (
          <div
            className={
              profileNotice.type === "success"
                ? "rounded-sm border border-[#b7e2d7] bg-[#f0fbf8] px-4 py-3 text-sm text-[#126b5c]"
                : "rounded-sm border border-[#f0c1ba] bg-[#fff5f3] px-4 py-3 text-sm text-[#9f2f22]"
            }
          >
            {profileNotice.message}
          </div>
        ) : null}

        {pendingConfirmUrl ? (
          <div className="rounded-sm border border-[#f3d28a] bg-[#fff9e7] px-4 py-3 text-sm text-[#7b5a08]">
            <div className="font-medium">Check your email to confirm this change.</div>
            <a
              href={pendingConfirmUrl}
              className="mt-1 block break-all text-primary underline-offset-4 hover:underline"
            >
              {pendingConfirmUrl}
            </a>
          </div>
        ) : null}

        {legacyProfile ? (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="general">
                <User className="size-4" />
                General
              </TabsTrigger>
              {profileSections.map((section) => (
                <TabsTrigger key={section.value} value={section.value}>
                  <Shield className="size-4" />
                  {section.section}
                </TabsTrigger>
              ))}
              {legacyProfile.showAccessLogs ? (
                <TabsTrigger value="access-logs">
                  <Clock3 className="size-4" />
                  Access logs
                </TabsTrigger>
              ) : null}
              {legacyProfile.integrations.length ? (
                <TabsTrigger value="integration">
                  <Link2 className="size-4" />
                  Integration
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="general">
              <Card className="rounded-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="legacy-current-password">
                        Current password
                      </Label>
                      <div className="relative">
                        <Input
                          id="legacy-current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        {renderPasswordToggle(
                          showCurrentPassword,
                          setShowCurrentPassword,
                          "current password",
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legacy-name">Name</Label>
                      <Input
                        id="legacy-name"
                        value={legacyName}
                        onChange={(event) => setLegacyName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legacy-email">Email</Label>
                      <Input
                        id="legacy-email"
                        type="email"
                        value={legacyEmail}
                        onChange={(event) => setLegacyEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legacy-new-password">New password</Label>
                      <div className="relative">
                        <Input
                          id="legacy-new-password"
                          type={showLegacyPassword ? "text" : "password"}
                          value={legacyPassword}
                          onChange={(event) =>
                            setLegacyPassword(event.target.value)
                          }
                          placeholder="Leave blank for no change"
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        {renderPasswordToggle(
                          showLegacyPassword,
                          setShowLegacyPassword,
                          "new password",
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legacy-confirm-password">
                        New password again
                      </Label>
                      <div className="relative">
                        <Input
                          id="legacy-confirm-password"
                          type={showLegacyConfirm ? "text" : "password"}
                          value={legacyConfirm}
                          onChange={(event) =>
                            setLegacyConfirm(event.target.value)
                          }
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        {renderPasswordToggle(
                          showLegacyConfirm,
                          setShowLegacyConfirm,
                          "new password confirmation",
                        )}
                      </div>
                    </div>
                    {legacyProfile.publicProfileUrl ? (
                      <div className="space-y-2">
                        <Label>Your public link</Label>
                        <a
                          href={legacyProfile.publicProfileUrl}
                          className="block break-all rounded-sm border bg-muted/30 px-3 py-2 text-sm text-primary underline-offset-4 hover:underline"
                        >
                          {legacyProfile.publicProfileUrl}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {profileSections.map((section) => (
              <TabsContent key={section.value} value={section.value}>
                <Card className="rounded-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {section.section}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {section.fields.map((field) => {
                        const key = String(field.fieldLegacyId);
                        if (field.fieldType === "checkbox") {
                          return (
                            <div
                              key={field.fieldLegacyId}
                              className="flex min-h-10 items-center gap-3 rounded-sm border px-3 py-2"
                            >
                              <Checkbox
                                id={fieldInputId(field.fieldLegacyId)}
                                checked={profileValues[key] === true}
                                onCheckedChange={(checked) =>
                                  setProfileValues((values) => ({
                                    ...values,
                                    [key]: checked === true,
                                  }))
                                }
                              />
                              <Label
                                htmlFor={fieldInputId(field.fieldLegacyId)}
                                className="text-sm font-medium"
                              >
                                {field.label}
                              </Label>
                            </div>
                          );
                        }

                        if (field.fieldType === "textarea") {
                          return (
                            <div
                              key={field.fieldLegacyId}
                              className="space-y-2 lg:col-span-2"
                            >
                              <Label htmlFor={fieldInputId(field.fieldLegacyId)}>
                                {field.label}
                              </Label>
                              <Textarea
                                id={fieldInputId(field.fieldLegacyId)}
                                value={String(profileValues[key] ?? "")}
                                onChange={(event) =>
                                  setProfileValues((values) => ({
                                    ...values,
                                    [key]: event.target.value,
                                  }))
                                }
                                rows={5}
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={field.fieldLegacyId} className="space-y-2">
                            <Label htmlFor={fieldInputId(field.fieldLegacyId)}>
                              {field.label}
                            </Label>
                            <Input
                              id={fieldInputId(field.fieldLegacyId)}
                              value={String(profileValues[key] ?? "")}
                              onChange={(event) =>
                                setProfileValues((values) => ({
                                  ...values,
                                  [key]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            {legacyProfile.showAccessLogs ? (
              <TabsContent value="access-logs">
                <Card className="rounded-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Access Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {legacyProfile.accessLogs.length ? (
                          legacyProfile.accessLogs.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>
                                {formatDateTime(entry.occurredAt)}
                              </TableCell>
                              <TableCell>{entry.ipAddress ?? "No IP"}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2}>
                              Has not logged in yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {legacyProfile.integrations.length ? (
              <TabsContent value="integration">
                <Card className="rounded-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {legacyProfile.integrations.map((method) => (
                        <div
                          key={method.provider}
                          className="rounded-sm border p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{method.provider}</div>
                            <Badge
                              variant={method.linked ? "success" : "secondary"}
                            >
                              {method.linked ? "Linked" : "Available"}
                            </Badge>
                          </div>
                          <div className="mt-2 min-h-5 truncate text-sm text-muted-foreground">
                            {method.identifier ?? "No linked identifier"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleLegacySave}
                disabled={isLegacyPending}
                className="min-w-36"
              >
                {isLegacyPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save changes
              </Button>
            </div>
          </Tabs>
        ) : (
          <>
            <Card className="rounded-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Name
                      </dt>
                      <dd className="text-foreground">{user.name || "Not set"}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Email
                      </dt>
                      <dd className="text-foreground">
                        {user.email || "Not set"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="size-4 text-muted-foreground" />
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Role
                      </dt>
                      <dd className="text-foreground">
                        {user.role ? formatRole(user.role) : "Not set"}
                      </dd>
                    </div>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="rounded-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="size-4 text-primary" />
                  Change your password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex max-w-xl flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="New Password"
                      autoComplete="new-password"
                      className="pr-10"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handlePasswordSave();
                        }
                      }}
                    />
                    {renderPasswordToggle(
                      showPassword,
                      setShowPassword,
                      "password",
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handlePasswordSave}
                    disabled={isPasswordPending}
                    className="sm:w-32"
                  >
                    {isPasswordPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {legacySettings && canEditSchoolYear ? (
          <Card className="rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-primary" />
                Change Scholastic Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid max-w-3xl gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="legacy-start-date">Start Date</Label>
                  <Input
                    id="legacy-start-date"
                    type="date"
                    value={schoolYearStartDate}
                    onChange={(event) =>
                      setSchoolYearStartDate(event.target.value)
                    }
                    aria-invalid={!schoolYearStartDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legacy-end-date">End Date</Label>
                  <Input
                    id="legacy-end-date"
                    type="date"
                    value={schoolYearEndDate}
                    onChange={(event) =>
                      setSchoolYearEndDate(event.target.value)
                    }
                    aria-invalid={!schoolYearEndDate}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSchoolYearSave}
                  disabled={isSchoolYearPending}
                  className="sm:w-32"
                >
                  {isSchoolYearPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}

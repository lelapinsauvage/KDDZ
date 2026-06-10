"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Send, UserCheck, Users, XSquare } from "lucide-react";
import { sendClassMessage } from "@/lib/actions/messages";
import type { MessageNatureOption } from "@/lib/message-compose-options";
import {
  DEFAULT_LEGACY_DELIVERY_OPTIONS,
  LegacyDeliveryOptionsField,
  type LegacyDeliveryOptions,
} from "../_components/legacy-delivery-options";

interface ClassOption {
  id: string;
  name: string;
  branchName: string;
  childCount: number;
}

interface ClassChild {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  classId: string | null;
}

interface ClassMessageClientProps {
  classes: ClassOption[];
  classChildrenList: ClassChild[];
  natures: MessageNatureOption[];
  defaultClassId?: string;
}

function activeChildIdsForClass(children: ClassChild[], classId: string) {
  return new Set(
    children
      .filter((child) => child.classId === classId && child.isActive)
      .map((child) => child.id),
  );
}

export function ClassMessageClient({
  classes,
  classChildrenList,
  natures,
  defaultClassId,
}: ClassMessageClientProps) {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState(defaultClassId ?? "");
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(
    () => activeChildIdsForClass(classChildrenList, defaultClassId ?? ""),
  );
  const [nature, setNature] = useState(natures[0]?.value ?? "General");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delivery, setDelivery] = useState<LegacyDeliveryOptions>(
    { ...DEFAULT_LEGACY_DELIVERY_OPTIONS, mobile: false },
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);

  const selectedClassDetail = useMemo(() => {
    if (!selectedClass) return null;
    return classes.find((c) => c.id === selectedClass) ?? null;
  }, [selectedClass, classes]);

  const classChildren = useMemo(
    () => classChildrenList.filter((child) => child.classId === selectedClass),
    [classChildrenList, selectedClass],
  );

  function handleClassChange(classId: string) {
    setSelectedClass(classId);
    setSelectedChildIds(activeChildIdsForClass(classChildrenList, classId));
    setSuccess(false);
    setError(null);
  }

  function toggleChild(id: string) {
    setSelectedChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllChildren() {
    setSelectedChildIds(new Set(classChildren.map((child) => child.id)));
  }

  function selectAllActive() {
    setSelectedChildIds(
      new Set(
        classChildren
          .filter((child) => child.isActive)
          .map((child) => child.id),
      ),
    );
  }

  function unselectAll() {
    setSelectedChildIds(new Set());
  }

  function toggleAllVisibleChildren(checked: boolean) {
    if (checked) {
      selectAllChildren();
    } else {
      unselectAll();
    }
  }

  function handleSend() {
    if (!selectedClass) return;

    setError(null);
    startTransition(async () => {
      const result = await sendClassMessage({
        classId: selectedClass,
        childIds: Array.from(selectedChildIds),
        subject: subject || null,
        body,
        nature,
        delivery,
      });

      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data as any;
        setSentCount(data?.recipientCount ?? 0);
        setAdminCount(data?.adminRecipientCount ?? 0);
        setSuccess(true);
        setTimeout(() => router.push("/messages/sent"), 2000);
      } else {
        setError(result.error ?? "Failed to send class message");
      }
    });
  }

  const canSend =
    Boolean(selectedClass) &&
    Boolean(subject) &&
    Boolean(body) &&
    (delivery.adminOnly || selectedChildIds.size > 0) &&
    !isPending &&
    !success;
  const allVisibleChildrenSelected =
    classChildren.length > 0 &&
    classChildren.every((child) => selectedChildIds.has(child.id));

  return (
    <>
      <PageHeader
        title="Class Message"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages", href: "/messages/inbox" },
          { label: "Compose", href: "/messages/compose" },
          { label: "Class Message" },
        ]}
      />

      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Message to Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} — {cls.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClassDetail && (
                <div className="flex items-center gap-2 pt-1">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Send to all parents in{" "}
                    <span className="font-medium text-foreground">
                      {selectedClassDetail.name}
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary font-normal"
                  >
                    {selectedClassDetail.childCount}{" "}
                    {selectedClassDetail.childCount === 1
                      ? "child"
                      : "children"}
                  </Badge>
                </div>
              )}
            </div>

            {selectedClassDetail && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={selectAllChildren}
                  >
                    <CheckSquare className="mr-1 size-3" />
                    Select All Children
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={selectAllActive}
                  >
                    <UserCheck className="mr-1 size-3" />
                    Select All Active
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={unselectAll}
                  >
                    <XSquare className="mr-1 size-3" />
                    Unselect All
                  </Button>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-md border">
                  {classChildren.length === 0 ? (
                    <div className="p-5 text-center text-sm text-muted-foreground">
                      No children found in this class.
                    </div>
                  ) : (
                    <table className="w-full text-sm" data-legacy-class-recipient-table>
                      <thead className="sticky top-0 z-10 bg-muted/80 text-xs text-muted-foreground backdrop-blur">
                        <tr className="border-b">
                          <th className="w-10 px-3 py-2 text-left font-medium">
                            <Checkbox
                              aria-label="Select all children in page"
                              checked={allVisibleChildrenSelected}
                              onCheckedChange={(next) =>
                                toggleAllVisibleChildren(next === true)
                              }
                            />
                          </th>
                          <th className="w-14 px-3 py-2 text-left font-medium">
                            #
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Name
                          </th>
                          <th className="w-28 px-3 py-2 text-left font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {classChildren.map((child, index) => {
                          const checked = selectedChildIds.has(child.id);
                          return (
                            <tr
                              key={child.id}
                              className={checked ? "bg-primary/5" : ""}
                            >
                              <td className="px-3 py-2">
                                <Checkbox
                                  aria-label={`Select ${child.firstName} ${child.lastName}`}
                                  checked={checked}
                                  onCheckedChange={() => toggleChild(child.id)}
                                />
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {child.firstName} {child.lastName}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={child.isActive ? "secondary" : "outline"}
                                >
                                  {child.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nature</Label>
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {natures.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sending Via</Label>
              <LegacyDeliveryOptionsField
                value={delivery}
                onChange={setDelivery}
                showAdminOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Message subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message to all parents in the selected class..."
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Message sent to {sentCount} parent
                {sentCount !== 1 ? "s" : ""}
                {adminCount > 0
                  ? ` and ${adminCount} admin${adminCount !== 1 ? "s" : ""}`
                  : ""}{" "}
                successfully! Redirecting...
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/messages/compose")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!canSend}
              >
                <Send className="mr-1 size-3.5" />
                {isPending ? "Sending..." : "Send to Class"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

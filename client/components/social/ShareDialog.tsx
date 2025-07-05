import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Users,
  Calendar as CalendarIcon,
  Settings,
  Link,
  QrCode,
  Mail,
  MessageSquare,
  Download,
  BarChart3,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  ShareSettings,
  SharedItem,
  ShareLink,
  ShareVisibility,
} from "@/types/social";
import { FlashcardSet } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import {
  shareItem,
  createShareSettings,
  copyShareUrl,
  getSharedItem,
  updateSharedItem,
} from "@/lib/sharingService";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: FlashcardSet | Folder | null;
  existingShare?: SharedItem;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  item,
  existingShare,
}) => {
  const [shareSettings, setShareSettings] = useState<ShareSettings>(
    existingShare?.settings ||
      createShareSettings({
        visibility: "public",
        allowComments: true,
        allowCloning: true,
        allowDownload: true,
      }),
  );
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(
    existingShare,
  );
  const [shareLink, setShareLink] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    shareSettings.expiresAt ? new Date(shareSettings.expiresAt) : undefined,
  );

  useEffect(() => {
    if (existingShare) {
      setSharedItem(existingShare);
      // Generate share link based on existing share
      setShareLink(`${window.location.origin}/shared/${existingShare.shareId}`);
    }
  }, [existingShare]);

  if (!item) return null;

  const isSet = "cards" in item;
  const itemTitle = isSet ? item.title : item.name;

  const handleVisibilityChange = (visibility: ShareVisibility) => {
    setShareSettings((prev) => ({ ...prev, visibility }));
  };

  const handleSettingChange = (key: keyof ShareSettings, value: any): void => {
    setShareSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateShare = async () => {
    setIsCreating(true);

    try {
      const owner = {
        id: "current_user", // Would come from auth context
        name: "Current User",
        avatar: undefined,
      };

      // Set expiry date if selected
      const settingsWithExpiry = {
        ...shareSettings,
        expiresAt: expiryDate?.toISOString(),
      };

      const newSharedItem = shareItem(item, settingsWithExpiry, owner);
      setSharedItem(newSharedItem);

      // Generate share link
      const link = `${window.location.origin}/shared/${newSharedItem.shareId}`;
      setShareLink(link);

      toast.success("Share link created successfully!");
    } catch (error) {
      toast.error("Failed to create share link");
      console.error("Error creating share:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateShare = async () => {
    if (!sharedItem) return;

    try {
      updateSharedItem(sharedItem.shareId, {
        settings: {
          ...shareSettings,
          expiresAt: expiryDate?.toISOString(),
        },
      });

      toast.success("Share settings updated!");
    } catch (error) {
      toast.error("Failed to update share settings");
      console.error("Error updating share:", error);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    const success = await copyShareUrl(shareLink.split("/").pop() || "");
    if (success) {
      toast.success("Link copied to clipboard!");
    } else {
      toast.error("Failed to copy link");
    }
  };

  const getVisibilityIcon = (visibility: ShareVisibility) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-4 h-4" />;
      case "unlisted":
        return <Link className="w-4 h-4" />;
      case "restricted":
        return <Lock className="w-4 h-4" />;
      case "private":
        return <EyeOff className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getVisibilityDescription = (visibility: ShareVisibility) => {
    switch (visibility) {
      case "public":
        return "Anyone can view and find this content";
      case "unlisted":
        return "Anyone with the link can view";
      case "restricted":
        return "Password required to view";
      case "private":
        return "Only you can view this content";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share {isSet ? "Set" : "Folder"}</span>
          </DialogTitle>
          <DialogDescription>
            Share "{itemTitle}" with others and control access permissions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="link" disabled={!sharedItem}>
              Share Link
            </TabsTrigger>
            <TabsTrigger value="analytics" disabled={!sharedItem}>
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {/* Visibility Settings */}
            <div>
              <Label className="text-base font-medium">Visibility</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {(["public", "unlisted", "restricted", "private"] as const).map(
                  (visibility) => (
                    <Card
                      key={visibility}
                      className={`cursor-pointer transition-colors ${
                        shareSettings.visibility === visibility
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => handleVisibilityChange(visibility)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {getVisibilityIcon(visibility)}
                          <div>
                            <div className="font-medium capitalize">
                              {visibility}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getVisibilityDescription(visibility)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </div>

            {/* Password Protection */}
            {shareSettings.visibility === "restricted" && (
              <div>
                <Label htmlFor="password">Password Protection</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={shareSettings.password || ""}
                  onChange={(e) =>
                    handleSettingChange("password", e.target.value)
                  }
                  className="mt-2"
                />
              </div>
            )}

            {/* Permissions */}
            <div>
              <Label className="text-base font-medium">Permissions</Label>
              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Allow Comments</div>
                      <div className="text-sm text-gray-500">
                        Let viewers leave comments
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={shareSettings.allowComments}
                    onCheckedChange={(checked) =>
                      handleSettingChange("allowComments", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Copy className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Allow Cloning</div>
                      <div className="text-sm text-gray-500">
                        Let viewers make their own copy
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={shareSettings.allowCloning}
                    onCheckedChange={(checked) =>
                      handleSettingChange("allowCloning", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Allow Download</div>
                      <div className="text-sm text-gray-500">
                        Let viewers download content
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={shareSettings.allowDownload}
                    onCheckedChange={(checked) =>
                      handleSettingChange("allowDownload", checked)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="p-0 h-auto font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
              </Button>

              {showAdvancedSettings && (
                <div className="space-y-4 mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  {/* Expiry Date */}
                  <div>
                    <Label>Expiry Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start mt-2"
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {expiryDate
                            ? expiryDate.toLocaleDateString()
                            : "Set expiry date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expiryDate}
                          onSelect={setExpiryDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Max Views */}
                  <div>
                    <Label htmlFor="maxViews">Maximum Views (Optional)</Label>
                    <Input
                      id="maxViews"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={shareSettings.maxViews || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "maxViews",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-6">
            {sharedItem && (
              <>
                {/* Share Link */}
                <div>
                  <Label className="text-base font-medium">Share Link</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input value={shareLink} readOnly className="flex-1" />
                    <Button onClick={handleCopyLink} size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Share Options */}
                <div>
                  <Label className="text-base font-medium">Share Options</Label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex items-center justify-center space-x-2"
                    >
                      <Link className="w-4 h-4" />
                      <span>Copy Link</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // QR Code generation would be implemented here
                        toast.info("QR Code feature coming soon!");
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const subject = `Check out this ${isSet ? "flashcard set" : "folder"}: ${itemTitle}`;
                        const body = `I wanted to share this ${isSet ? "flashcard set" : "folder"} with you: ${shareLink}`;
                        window.open(
                          `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                        );
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const text = `Check out this ${isSet ? "flashcard set" : "folder"}: ${itemTitle} ${shareLink}`;
                        if (navigator.share) {
                          navigator.share({
                            title: itemTitle,
                            text,
                            url: shareLink,
                          });
                        } else {
                          toast.info("Share via browser not supported");
                        }
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>

                {/* Share Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Share Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Visibility</span>
                      <div className="flex items-center space-x-2">
                        {getVisibilityIcon(shareSettings.visibility)}
                        <Badge variant="outline" className="capitalize">
                          {shareSettings.visibility}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Views</span>
                      <span className="text-sm font-medium">
                        {sharedItem.stats.views}
                        {shareSettings.maxViews &&
                          ` / ${shareSettings.maxViews}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm">
                        {new Date(sharedItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {shareSettings.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Expires</span>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(
                              shareSettings.expiresAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {sharedItem && (
              <>
                {/* Analytics Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Views</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {sharedItem.stats.views}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Copy className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Clones</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {sharedItem.stats.clones}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">Comments</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {sharedItem.stats.comments}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Likes</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {sharedItem.stats.likes}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 text-center py-8">
                      Detailed analytics coming soon
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!sharedItem ? (
            <Button onClick={handleCreateShare} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Share Link"}
            </Button>
          ) : (
            <Button onClick={handleUpdateShare}>Update Settings</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

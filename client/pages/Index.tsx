import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Clock,
  TrendingUp,
  Play,
  Target,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  Users,
  Star,
  Archive,
  Grid,
  List,
  SortAsc,
  Calendar,
  X,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlashcardSet, Workplace } from "@/types/flashcard";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { DashboardLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export default function Index() {
  const location = useLocation();
  useEffect(() => {
    const after = (location.state as any)?.afterCreateWorkspace;
    if (after) {
      setSelectedWorkplace(after);
      // xóa state để không bị chạy lại
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkplace, setSelectedWorkplace] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateWorkplaceOpen, setIsCreateWorkplaceOpen] = useState(false);
  const [newWorkplace, setNewWorkplace] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });
  const navigate = useNavigate();

  const [isAddSetOpen, setIsAddSetOpen] = useState(false);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [setsRes, workplacesRes] = await Promise.all([
        fetch("/api/me/flashcard-sets"),
        fetch("/api/me/workplaces"),
      ]);
      setSets(await setsRes.json());
      setWorkplaces(await workplacesRes.json());
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (window.confirm("Xoá study set?")) {
      try {
        console.log("id",id);
        
        await fetch(`/api/me/flashcard-sets/${id}`, { method: "DELETE" });
        setSets(sets.filter((s) => s.id !== id));
      } catch (err) {
        console.error("Delete error", err);
      }
    }
  };

  const handleCreateWorkplace = async () => {
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const res = await fetch("/api/me/workplaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkplace),
      });
      const created = await res.json();
      setWorkplaces([...workplaces, created]);
      setIsCreateWorkplaceOpen(false);
      setNewWorkplace({ name: "", description: "", color: "#3b82f6" });
    } catch (err) {
      console.error("Create error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xoá workspace này?")) return;
    try {
      await fetch(`/api/me/workplaces/${id}`, { method: "DELETE" });
      setWorkplaces((prev) => prev.filter((w) => w.id !== id));
      // Optional: nếu workspace đang được chọn thì reset lại về 'all'
      if (selectedWorkplace === id) setSelectedWorkplace("all");
      // Các study set liên quan đã được gỡ ở backend
    } catch (err) {
      console.error("Failed to delete workspace", err);
    }
  };

  const filteredSets = sets.filter((set) => {
    const matchesWorkplace =
      selectedWorkplace === "all" || set.workplaceId === selectedWorkplace;
    return matchesWorkplace;
  });

  const sortedSets = filteredSets.sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "name":
        return a.title.localeCompare(b.title);
      case "cards":
        return (b.cards?.length || 0) - (a.cards?.length || 0);
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return 0;
    }
  });

  const getWorkplaceColor = (id: string) =>
    workplaces.find((w) => w.id === id)?.color || "#3b82f6";

  const getWorkplaceName = (id: string) =>
    workplaces.find((w) => w.id === id)?.name || "Chưa phân loại";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <DashboardLoadingSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative text-center py-12 px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Master Any Subject
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Tổ chức học tập thông minh với workspace
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/create">
                <Button size="lg" className="bg-white text-blue-600">
                  <Plus className="h-5 w-5 mr-2" /> Tạo Study Set Mới
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white dark:text-white text-cyan-900"
                onClick={() => setIsCreateWorkplaceOpen(true)}
              >
                <Folder className="h-5 w-5 mr-2" /> Tạo Workspace
              </Button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isCreateWorkplaceOpen && (
          <div className="fixed inset-0 z-50 top-[-8rem] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md mx-4">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Tạo Workspace Mới
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setIsCreateWorkplaceOpen(false)}
                >
                  <X className="h-4 w-4 text-foreground" />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Tên Workspace"
                  value={newWorkplace.name}
                  onChange={(e) =>
                    setNewWorkplace({ ...newWorkplace, name: e.target.value })
                  }
                />
                <textarea
                  placeholder="Mô tả"
                  rows={3}
                  value={newWorkplace.description}
                  onChange={(e) =>
                    setNewWorkplace({
                      ...newWorkplace,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded-md px-3 py-2 bg-background text-foreground dark:border-gray-700"
                />
                <div className="flex gap-2">
                  {["#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full border-2",
                        newWorkplace.color === color
                          ? "border-gray-800 scale-110"
                          : "border-gray-300",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setNewWorkplace({ ...newWorkplace, color })
                      }
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateWorkplace}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateWorkplaceOpen(false)}
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Workspace Cards */}
        {workplaces.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Workspaces của bạn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workplaces.map((wp) => (
                <Card
                  key={wp.id}
                  className="cursor-pointer border-l-4"
                  style={{ borderLeftColor: wp.color }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: wp.color }}
                        />
                        <CardTitle className="text-lg">{wp.name}</CardTitle>
                      </div>
                      <div className="flex justify-between items-center">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteWorkspace(wp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {wp.description}
                    </p>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {sets.filter((s) => s.workplaceId === wp.id).length} study
                      sets
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWorkplace(wp.id)}
                    >
                      Xem tất cả
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 flex-wrap">
            <Select
              value={selectedWorkplace}
              onValueChange={setSelectedWorkplace}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn workspace" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                <SelectItem value="all">Tất cả workspace</SelectItem>
                {workplaces.map((wp) => (
                  <SelectItem key={wp.id} value={wp.id}>
                    {wp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Gần đây</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="cards">Số lượng thẻ</SelectItem>
                <SelectItem value="created">Ngày tạo</SelectItem>
              </SelectContent>
            </Select>
            {selectedWorkplace !== "all" && (
              <Button
                onClick={() => setIsAddSetOpen(true)}
                className="bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm Study Set
              </Button>
            )}
          </div>
          {isAddSetOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">
                    Thêm Study Set vào Workspace
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddSetOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 dark:text-gray-200">
                      Chọn từ Study Set chưa gán
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {sets.filter((s) => !s.workplaceId).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Không còn study set nào chưa gán.
                        </p>
                      )}
                      {sets
                        .filter((s) => !s.workplaceId)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex justify-between items-center p-2 border rounded-md dark:border-gray-700 dark:text-white"
                          >
                            <span>{s.title}</span>
                            <Button
                              size="sm"
                              onClick={async () => {
                                await fetch(
                                  `/api/me/flashcard-sets/${s.id}/workplace`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      workplaceId: selectedWorkplace,
                                    }),
                                  },
                                );
                                loadData();
                                setIsAddSetOpen(false);
                              }}
                            >
                              Gán vào workspace
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 dark:border-gray-600">
                    <h3 className="font-medium mb-2 dark:text-gray-200 flex justify-center">
                      Hoặc
                    </h3>
                    <Button
                      onClick={() => {
                        navigate("/create", {
                          state: { prefillWorkspaceId: selectedWorkplace },
                        });
                        setIsAddSetOpen(false);
                      }}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo mới Study Set cho Workspace này
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Study Sets */}
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4",
          )}
        >
          {sortedSets.map((set) => (
            <Card
              key={set.id}
              className={cn(
                "group hover:shadow-lg transition",
                viewMode === "list" && "flex flex-row items-center p-4",
              )}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{set.title}</CardTitle>
                    {set.workplaceId && (
                      <Badge
                        style={{
                          backgroundColor: `${getWorkplaceColor(set.workplaceId)}20`,
                          color: getWorkplaceColor(set.workplaceId),
                        }}
                        className="mt-2"
                      >
                        {getWorkplaceName(set.workplaceId)}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteSet(set.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p
                  className={cn(
                    "text-sm",
                    "min-h-[3rem]",
                    "text-gray-800 dark:text-muted-foreground",
                  )}
                >
                  {set.description || "Không có mô tả"}
                </p>
                <div className="flex justify-between text-sm text-gray-700 dark:text-muted-foreground">
                  <span>
                    <BookOpen className="inline h-4 w-4 mr-1" />
                    {set.cards?.length || 0} thẻ
                  </span>
                  <span>
                    <Calendar className="inline h-4 w-4 mr-1" />
                    {new Date(set.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link to={`/study/${set.id}`}>
                    <Button size="sm" className="bg-green-600 text-white">
                      <Play className="h-4 w-4 mr-2" />
                      Học
                    </Button>
                  </Link>
                  <Link to={`/test/${set.id}`}>
                    <Button size="sm" variant="outline">
                      <Target className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                  </Link>
                  <Link to={`/edit/${set.id}`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Select
                    value={set.workplaceId || "null"}
                    onValueChange={async (newWpId) => {
                      const res = await fetch(
                        `/api/me/flashcard-sets/${set.id}/workplace`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            workplaceId: newWpId === "null" ? null : newWpId,
                          }),
                        },
                      );

                      const updated = await res.json();
                      setSets((prev) =>
                        prev.map((s) => (s.id === updated.id ? updated : s)),
                      );
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Chọn workspace" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectItem value="null">Không có workplace</SelectItem>
                      {workplaces.map((wp) => (
                        <SelectItem key={wp.id} value={wp.id}>
                          {wp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}


"use client";

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Material, Feedback, BugReport, SocialLink } from '@/types';
import { FilePenLine, Trash2, Facebook, Twitter, Linkedin, Loader2, PlusCircle, BarChart2, Bug, Users, Search, Eye, EyeOff, GitCompareArrows, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMaterials, deleteMaterial, addMaterial, updateMaterial, getFeedback, deleteFeedback, getSocialLinks, updateSocialLinks, getBugReports, deleteBugReport, getSiteStats, getDailyVisits, batchUpdateMaterialsAccessibility, batchDeleteMaterials } from '@/services/firestore';
import { storage } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { getFileNameFromUrl } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const materialSchema = z.object({
    title: z.string().optional(),
    course: z.string().min(1, "Course is required"),
    faculty: z.string().min(1, "Faculty is required"),
    program: z.string().min(1, "Program is required"),
    lecturer: z.string().min(1, "Lecturer name is required"),
    year: z.coerce.number().min(1, "Year is required"),
    semester: z.coerce.number().min(1, "Semester is required"),
    type: z.enum(['Lecture Slides', 'Past Papers', 'Memos', 'Tutorials', 'Lab Manuals']),
    file: z.any().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

const faculties: Material['faculty'][] = ['Engineering', 'Humanities', 'Management Sciences', 'ICT', 'Economics & Finance'];
const materialTypes: Material['type'][] = ['Lecture Slides', 'Past Papers', 'Memos', 'Tutorials', 'Lab Manuals'];

const chartConfig = {
  downloads: {
    label: "Downloads",
    color: "hsl(var(--primary))",
  },
  visits: {
    label: "Visits",
    color: "hsl(var(--chart-2))",
  }
} satisfies ChartConfig;

const LoadingSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
)

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [bugReports, setBugReports] = React.useState<BugReport[]>([]);
  const [socialLinks, setSocialLinks] = React.useState<SocialLink[]>([]);
  const [siteVisits, setSiteVisits] = React.useState(0);
  const [dailyVisits, setDailyVisits] = React.useState<{ date: string; visits: number; }[]>([]);
  const [loading, setLoading] = React.useState({ materials: true, feedback: true, bugs: true, social: true, stats: true, dailyVisits: true });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = React.useState('');
  const [isBatchUpdating, setIsBatchUpdating] = React.useState(false);
  const [selectedMaterials, setSelectedMaterials] = React.useState<Set<string>>(new Set());

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { title: '', course: '', faculty: 'Engineering', program: '', lecturer: '', year: 1, semester: 1, type: 'Lecture Slides', file: undefined },
  });

  const fetchAllData = React.useCallback(async () => {
    setLoading({ materials: true, feedback: true, bugs: true, social: true, stats: true, dailyVisits: true });
    const [materialsData, feedbackData, bugReportsData, socialLinksData, statsData, dailyVisitsData] = await Promise.all([
        getMaterials(),
        getFeedback(),
        getBugReports(),
        getSocialLinks(),
        getSiteStats(),
        getDailyVisits(),
    ]);
    
    setMaterials(materialsData);
    setFeedback(feedbackData);
    setBugReports(bugReportsData);
    setSiteVisits(statsData.visits);
    setDailyVisits(dailyVisitsData);

    const defaultLinks: SocialLink[] = [ { id: 'facebook', name: 'Facebook', url: '' }, { id: 'twitter', name: 'Twitter', url: '' }, { id: 'linkedin', name: 'LinkedIn', url: '' } ];
    const mergedLinks = defaultLinks.map(defaultLink => socialLinksData.find(dbLink => dbLink.id === defaultLink.id) || defaultLink);
    setSocialLinks(mergedLinks);
    
    setLoading({ materials: false, feedback: false, bugs: false, social: false, stats: false, dailyVisits: false });
    setSelectedMaterials(new Set());
  }, []);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  React.useEffect(() => {
    if (isFormOpen) {
      if (editingMaterial) {
        form.reset({...editingMaterial, file: undefined });
      } else {
        form.reset({ title: '', course: '', faculty: 'Engineering', program: '', lecturer: '', year: 1, semester: 1, type: 'Lecture Slides', file: undefined });
      }
    }
  }, [editingMaterial, isFormOpen, form]);


  const handleMaterialSubmit = async (values: MaterialFormValues) => {
    setIsSaving(true);
    try {
        if (editingMaterial) {
            // Handle editing a single material
            if (!values.title) {
                toast({ variant: 'destructive', title: 'Error', description: "Title is required when editing a material." });
                setIsSaving(false);
                return;
            }

            const file = values.file?.[0];
            let downloadURL = editingMaterial.url;

            if (file) {
                const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                downloadURL = await getDownloadURL(snapshot.ref);
            }

            const { file: _file, ...finalData } = values;
            
            await updateMaterial(editingMaterial.id, { ...finalData, url: downloadURL });
            toast({ title: "Success", description: "Material updated successfully." });
        } else {
            // Handle adding one or more new materials
            const files = values.file;
            if (!files || files.length === 0) {
                toast({ variant: 'destructive', title: 'Error', description: "At least one file is required to add new material." });
                setIsSaving(false);
                return;
            }

            const { file: _file, title: formTitle, ...commonData } = values;

            const uploadPromises = Array.from(files as FileList).map(async (file) => {
                const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                const title = (files.length === 1 && formTitle)
                    ? formTitle
                    : file.name.lastIndexOf('.') > -1 ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;

                await addMaterial({ ...commonData, title, url: downloadURL });
            });

            await Promise.all(uploadPromises);

            toast({ title: "Success", description: `${files.length} material(s) added successfully.` });
        }

        setIsFormOpen(false);
        setEditingMaterial(null);
        fetchAllData();
    } catch (error) {
        console.error("Error saving material:", error);
        toast({ variant: 'destructive', title: 'Error', description: "Failed to save material. Please try again." });
    } finally {
        setIsSaving(false);
    }
  }

  const handleEditClick = (material: Material) => { setEditingMaterial(material); setIsFormOpen(true); }
  const handleAddNewClick = () => { setEditingMaterial(null); setIsFormOpen(true); }

  const handleDelete = async (id: string, type: 'material' | 'feedback' | 'bug') => {
      try {
          if (type === 'material') {
              await deleteMaterial(id);
              setMaterials(prev => prev.filter(m => m.id !== id));
              toast({ title: 'Material Deleted' });
          } else if (type === 'feedback') {
              await deleteFeedback(id);
              setFeedback(prev => prev.filter(fb => fb.id !== id));
              toast({ title: 'Feedback Deleted' });
          } else if (type === 'bug') {
              await deleteBugReport(id);
              setBugReports(prev => prev.filter(br => br.id !== id));
              toast({ title: 'Bug Report Deleted' });
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${type}.` });
      }
  }

  const saveSocialLinks = async () => {
      setIsSaving(true);
      try {
        await updateSocialLinks(socialLinks);
        toast({ title: 'Success', description: 'Social links updated successfully.' });
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to update social links.' }); } 
      finally { setIsSaving(false); }
  }

  const handleSocialLinkChange = (id: SocialLink['id'], url: string) => {
      setSocialLinks(prev => prev.map(link => link.id === id ? { ...link, url } : link));
  };
  
  const handleAccessibilityToggle = async (id: string, isAccessible: boolean) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, isAccessible } : m));
    try {
        await updateMaterial(id, { isAccessible });
        toast({ title: 'Status Updated', description: `Material is now ${isAccessible ? 'accessible' : 'inaccessible'}.` });
    } catch (error) {
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, isAccessible: !isAccessible } : m));
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const getCurrentSemester = () => {
    const month = new Date().getMonth(); // 0 = January
    if (month >= 1 && month <= 5) return 1; // Feb - June
    if (month >= 6 && month <= 11) return 2; // July - Dec
    return 0; // Vacation (Jan)
  }

  const handleBatchAccessibilityUpdate = async (mode: 'sync' | 'all-visible' | 'all-hidden') => {
      setIsBatchUpdating(true);
      
      let updates: { id: string; isAccessible: boolean }[] = [];
      const currentSemester = getCurrentSemester();

      if (mode === 'sync') {
          updates = materials.map(m => ({
              id: m.id,
              isAccessible: m.semester === currentSemester
          }));
      } else {
          const isAccessible = mode === 'all-visible';
          updates = materials.map(m => ({
              id: m.id,
              isAccessible,
          }));
      }

      try {
          await batchUpdateMaterialsAccessibility(updates);
          setMaterials(prev => prev.map(material => {
              const update = updates.find(u => u.id === material.id);
              return update ? { ...material, isAccessible: update.isAccessible } : material;
          }));
          toast({ title: "Success", description: "All materials have been updated." });
      } catch (error) {
          console.error("Batch update failed:", error);
          toast({ variant: 'destructive', title: "Error", description: "Failed to update materials." });
      } finally {
          setIsBatchUpdating(false);
      }
  };
  
  const handleUpdateSelectionAccessibility = async (isAccessible: boolean) => {
      setIsBatchUpdating(true);
      const ids = Array.from(selectedMaterials);
      const updates = ids.map(id => ({ id, isAccessible }));
      try {
          await batchUpdateMaterialsAccessibility(updates);
          setMaterials(prev => prev.map(m => ids.includes(m.id) ? { ...m, isAccessible } : m));
          toast({ title: 'Success', description: `${ids.length} material(s) updated.` });
          setSelectedMaterials(new Set());
      } catch (error) {
          console.error("Batch update error:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update selected materials.' });
      } finally {
          setIsBatchUpdating(false);
      }
  };

  const handleDeleteSelected = async () => {
      setIsBatchUpdating(true);
      const ids = Array.from(selectedMaterials);
      try {
          await batchDeleteMaterials(ids);
          setMaterials(prev => prev.filter(m => !ids.includes(m.id)));
          toast({ title: 'Success', description: `${ids.length} material(s) deleted.` });
          setSelectedMaterials(new Set());
      } catch (error) {
          console.error("Batch delete error:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete selected materials.' });
      } finally {
          setIsBatchUpdating(false);
      }
  };


  const analyticsData = React.useMemo(() => {
    if (loading.materials) return [];
    const dataByFaculty = materials.reduce((acc, material) => {
      const faculty = material.faculty;
      if (!acc[faculty]) {
        acc[faculty] = 0;
      }
      acc[faculty] += material.downloads || 0;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(dataByFaculty).map(([name, downloads]) => ({ name, downloads }));
  }, [materials, loading.materials]);

  const filteredAdminMaterials = React.useMemo(() => {
    const lowercasedTerm = adminSearchTerm.toLowerCase();
    const filtered = materials.filter(material => 
        (
            !adminSearchTerm ||
            material.title.toLowerCase().includes(lowercasedTerm) ||
            material.course.toLowerCase().includes(lowercasedTerm) ||
            material.faculty.toLowerCase().includes(lowercasedTerm) ||
            material.program.toLowerCase().includes(lowercasedTerm) ||
            material.lecturer.toLowerCase().includes(lowercasedTerm)
        )
    );

    return filtered.sort((a, b) => {
        const programCompare = a.program.localeCompare(b.program);
        if (programCompare !== 0) return programCompare;
        const courseCompare = a.course.localeCompare(b.course);
        if (courseCompare !== 0) return courseCompare;
        return a.title.localeCompare(b.title);
    });
  }, [materials, adminSearchTerm]);
  
  const handleToggleSelect = (id: string) => {
    setSelectedMaterials(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        return newSelection;
    });
  };

  const handleToggleSelectAll = (checked: boolean | 'indeterminate') => {
      if (checked) {
          setSelectedMaterials(new Set(filteredAdminMaterials.map(m => m.id)));
      } else {
          setSelectedMaterials(new Set());
      }
  };

  const isAllSelected = filteredAdminMaterials.length > 0 && selectedMaterials.size === filteredAdminMaterials.length && filteredAdminMaterials.every(m => selectedMaterials.has(m.id));


  return (
    <div className="container mx-auto py-4">
      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics"><BarChart2 className="mr-2 h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="bugs"><Bug className="mr-2 h-4 w-4"/>Bug Reports</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Analytics</CardTitle>
                    <CardDescription>Insights into platform usage and user engagement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                       <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Total Website Visits</CardTitle>
                              <Users className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            {loading.stats ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{siteVisits.toLocaleString()}</div>}
                            <p className="text-xs text-muted-foreground">Total number of times the site has been visited.</p>
                          </CardContent>
                       </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Website Visits (Last 30 Days)</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[20rem]">
                        {loading.dailyVisits ? <Skeleton className="h-full w-full" /> : (
                          <ChartContainer config={chartConfig} className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart accessibilityLayer data={dailyVisits} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Legend />
                                    <Line dataKey="visits" type="monotone" stroke="var(--color-visits)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        )}
                      </CardContent>
                    </Card>

                    {loading.materials ? <LoadingSkeleton /> : (
                         <Card>
                            <CardHeader>
                                <CardTitle>Material Downloads by Faculty</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[20rem]">
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart accessibilityLayer data={analyticsData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                angle={-45} 
                                                textAnchor="end" 
                                                height={80} 
                                                interval={0}
                                            />
                                            <YAxis />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent indicator="dot" />}
                                            />
                                            <Legend />
                                            <Bar dataKey="downloads" fill="var(--color-downloads)" radius={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center"><CardTitle>Course Materials</CardTitle><Button onClick={handleAddNewClick}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button></div>
                <CardDescription>Manage the course materials available in the app.</CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search materials..."
                        className="pl-9"
                        value={adminSearchTerm}
                        onChange={(e) => setAdminSearchTerm(e.target.value)}
                    />
                </div>
                {selectedMaterials.size > 0 && (
                  <div className="flex items-center gap-2 p-2 mt-4 bg-muted/50 rounded-lg border">
                      <div className="flex-1 text-sm font-medium">
                          {selectedMaterials.size} item(s) selected
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateSelectionAccessibility(true)} disabled={isBatchUpdating}>
                          <Eye className="mr-2 h-4 w-4"/> Make Visible
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateSelectionAccessibility(false)} disabled={isBatchUpdating}>
                          <EyeOff className="mr-2 h-4 w-4"/> Make Hidden
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isBatchUpdating}>
                                  <Trash2 className="mr-2 h-4 w-4"/> Delete
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action will permanently delete {selectedMaterials.size} selected material(s). This cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteSelected} disabled={isBatchUpdating}>
                                      {isBatchUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      Yes, delete
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMaterials(new Set())} disabled={isBatchUpdating}>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Clear selection</span>
                      </Button>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-muted-foreground">Global Actions</div>
                    <div className="flex gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isBatchUpdating || materials.length === 0}>
                                    <GitCompareArrows className="mr-2 h-4 w-4" /> Sync with Semester
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sync with Current Semester?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will make materials for the current semester accessible and hide others. This overrides any manual settings. Are you sure?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleBatchAccessibilityUpdate('sync')} disabled={isBatchUpdating}>
                                        {isBatchUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Yes, Sync
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button size="sm" onClick={() => handleBatchAccessibilityUpdate('all-visible')} disabled={isBatchUpdating || materials.length === 0}>
                            {isBatchUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                            Make All Visible
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleBatchAccessibilityUpdate('all-hidden')} disabled={isBatchUpdating || materials.length === 0}>
                            {isBatchUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            Make All Hidden
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading.materials ? <LoadingSkeleton /> : (
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead className="w-12">
                                   <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleToggleSelectAll}
                                        aria-label="Select all rows"
                                   />
                               </TableHead>
                               <TableHead>Title</TableHead><TableHead>File</TableHead>
                               <TableHead>Program</TableHead>
                               <TableHead>Course</TableHead>
                               <TableHead>Faculty</TableHead>
                               <TableHead>Type</TableHead>
                               <TableHead>Downloads</TableHead>
                               <TableHead>Accessible</TableHead>
                               <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                    <TableBody>
                      {filteredAdminMaterials.map((material) => (
                        <TableRow 
                            key={material.id}
                            data-state={selectedMaterials.has(material.id) ? "selected" : undefined}
                        >
                          <TableCell>
                            <Checkbox
                                checked={selectedMaterials.has(material.id)}
                                onCheckedChange={() => handleToggleSelect(material.id)}
                                aria-label={`Select material ${material.title}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{material.title}</TableCell>
                          <TableCell><a href={material.url} target="_blank" rel="noopener noreferrer" className="underline text-sm hover:text-primary truncate block max-w-48" title={getFileNameFromUrl(material.url)}>{getFileNameFromUrl(material.url)}</a></TableCell>
                          <TableCell>{material.program}</TableCell>
                          <TableCell>{material.course}</TableCell>
                          <TableCell>{material.faculty}</TableCell>
                          <TableCell><Badge variant="secondary">{material.type}</Badge></TableCell>
                          <TableCell>{material.downloads}</TableCell>
                          <TableCell><Switch checked={material.isAccessible} onCheckedChange={(checked) => handleAccessibilityToggle(material.id, checked)} aria-label="Toggle material accessibility" /></TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(material)}><FilePenLine className="h-4 w-4" /></Button>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the material.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(material.id, 'material')}>Delete</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody></Table>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card><CardHeader><CardTitle>User Feedback</CardTitle><CardDescription>Here's what users are saying about the platform.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {loading.feedback ? <LoadingSkeleton /> : feedback.length > 0 ? feedback.map(fb => (<Card key={fb.id}><CardContent className="p-4 flex justify-between items-start"><div><p className="text-sm">{fb.text}</p><p className="text-xs text-muted-foreground mt-2">{fb.createdAt?.toLocaleString()}</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the feedback.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(fb.id, 'feedback')}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>)) : (<p className="text-center text-muted-foreground p-8">No feedback submitted yet.</p>)}
            </CardContent></Card>
        </TabsContent>

         <TabsContent value="bugs">
          <Card><CardHeader><CardTitle>Bug Reports</CardTitle><CardDescription>User-submitted issues and bug reports.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {loading.bugs ? <LoadingSkeleton /> : bugReports.length > 0 ? bugReports.map(br => (<Card key={br.id}><CardContent className="p-4 flex justify-between items-start"><div><p className="text-sm">{br.text}</p><p className="text-xs text-muted-foreground mt-2">{br.createdAt?.toLocaleString()}</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the report.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(br.id, 'bug')}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>)) : (<p className="text-center text-muted-foreground p-8">No bug reports submitted yet.</p>)}
            </CardContent></Card>
        </TabsContent>
        
        <TabsContent value="social">
          <Card><CardHeader><CardTitle>Social Media Links</CardTitle><CardDescription>Manage the social media links displayed in the app footer.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {loading.social ? <LoadingSkeleton /> : socialLinks.map(link => (<div key={link.id} className="flex items-center gap-4"><Label htmlFor={link.id} className="w-24 flex items-center gap-2 capitalize">{link.id === 'facebook' && <Facebook />}{link.id === 'twitter' && <Twitter />}{link.id === 'linkedin' && <Linkedin />}{link.name}</Label><Input id={link.id} value={link.url} onChange={(e) => handleSocialLinkChange(link.id, e.target.value)} /></div>))}
            </CardContent>
            <CardFooter className="flex justify-end"><Button onClick={saveSocialLinks} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></CardFooter></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(handleMaterialSubmit)} className="space-y-4"><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title / Subject</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course Code</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></div><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="faculty" render={({ field }) => (<FormItem><FormLabel>Faculty</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a faculty" /></SelectTrigger></FormControl><SelectContent>{faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} /><FormField control={form.control} name="program" render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></div><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="lecturer" render={({ field }) => (<FormItem><FormLabel>Lecturer</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent>{materialTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} /></div><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 1} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 1} /></FormControl><FormMessage /></FormItem>)} /></div>
          <FormField
            control={form.control}
            name="file"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>Material File</FormLabel>
                {editingMaterial?.url && (
                    <div className="text-sm text-muted-foreground">
                        Current: <a href={editingMaterial.url} target="_blank" rel="noopener noreferrer" className="underline">{getFileNameFromUrl(editingMaterial.url)}</a>
                    </div>
                )}
                <FormControl>
                    <Input 
                        type="file" 
                        multiple={!editingMaterial}
                        onChange={(e) => {
                           onChange(e.target.files);
                        }}
                         {...rest}
                    />
                </FormControl>
                {!editingMaterial && <FormDescription>You can select multiple files. The filename will be used as the title if the title field is empty.</FormDescription>}
                {editingMaterial && <FormDescription>Leave blank to keep the current file.</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingMaterial ? 'Save Changes' : 'Add Material'}</Button></DialogFooter></form></Form>
      </DialogContent></Dialog>
    </div>
  );
}

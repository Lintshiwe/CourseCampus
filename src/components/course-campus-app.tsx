
"use client";

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { MaterialCard } from './material-card';
import type { Material, SocialLink } from '@/types';
import { BookOpenCheck, Bug, Facebook, Linkedin, MessageSquareQuote, Search, Twitter, Shield, Loader2, Mail } from 'lucide-react';
import { getMaterials, addFeedback, addBugReport, getSocialLinks, logVisit } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const FilterSelect = ({ label, placeholder, options, value, onChange }: { label: string, placeholder: string, options: string[], value: string, onChange: (value: string) => void }) => (
    <div className="grid gap-2">
        <Label className="text-xs font-medium text-sidebar-foreground/70">{label}</Label>
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground h-9">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
        </Select>
    </div>
);

export function CourseCampusApp() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [socialLinks, setSocialLinks] = React.useState<Record<SocialLink['id'], string>>({ facebook: '#', twitter: '#', linkedin: '#' });
  const [feedbackText, setFeedbackText] = React.useState('');
  const [bugText, setBugText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    faculty: 'all',
    program: 'all',
    year: 'all',
    semester: 'all',
    type: 'all',
  });

  React.useEffect(() => {
    logVisit();
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [materialsData, socialLinksData] = await Promise.all([getMaterials(), getSocialLinks()]);
        
        const accessibleMaterials = materialsData.filter(m => m.isAccessible);
        setMaterials(accessibleMaterials);
        
        if (socialLinksData.length > 0) {
            const links: Record<string, string> = { facebook: '#', twitter: '#', linkedin: '#' };
            socialLinksData.forEach((l: SocialLink) => {
                if (l.id in links) {
                    links[l.id] = l.url;
                }
            });
            setSocialLinks(links as Record<SocialLink['id'], string>);
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const filteredMaterials = React.useMemo(() => {
    return materials.filter(material => {
      return (
        (material.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         material.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
         material.lecturer.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filters.faculty === 'all' || material.faculty === filters.faculty) &&
        (filters.program === 'all' || material.program === filters.program) &&
        (filters.year === 'all' || material.year.toString() === filters.year) &&
        (filters.semester === 'all' || material.semester.toString() === filters.semester) &&
        (filters.type === 'all' || material.type === filters.type)
      );
    });
  }, [materials, searchTerm, filters]);

  const groupedMaterials = React.useMemo(() => {
    // 1. Group by program, then by semester
    const grouped = filteredMaterials.reduce((acc, material) => {
      const program = material.program || 'General';
      const semester = `Semester ${material.semester}`;

      if (!acc[program]) {
        acc[program] = {};
      }
      if (!acc[program][semester]) {
        acc[program][semester] = [];
      }
      acc[program][semester].push(material);

      return acc;
    }, {} as Record<string, Record<string, Material[]>>);

    // 2. Sort the final structure
    // Sort programs alphabetically
    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .reduce((obj, programKey) => {
        const semesters = grouped[programKey];
        // Sort semesters numerically
        const sortedSemesters = Object.keys(semesters)
          .sort((a, b) => {
            const numA = parseInt(a.replace('Semester ', ''), 10);
            const numB = parseInt(b.replace('Semester ', ''), 10);
            return numA - numB;
          })
          .reduce((semObj, semesterKey) => {
            // Sort materials by title within each semester
            semObj[semesterKey] = semesters[semesterKey].sort((a, b) =>
              a.title.localeCompare(b.title)
            );
            return semObj;
          }, {} as Record<string, Material[]>);
        obj[programKey] = sortedSemesters;
        return obj;
      }, {} as Record<string, Record<string, Material[]>>);
  }, [filteredMaterials]);


  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) { toast({ variant: "destructive", title: "Empty Feedback", description: "Please enter your feedback before submitting." }); return; }
    setIsSubmitting(true);
    try {
        await addFeedback(feedbackText);
        setFeedbackText('');
        toast({ title: "Feedback Submitted!", description: "Thank you for your valuable feedback." });
    } catch (error) {
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your feedback. Please try again." });
    } finally { setIsSubmitting(false); }
  };

  const handleBugReportSubmit = async () => {
    if (!bugText.trim()) { toast({ variant: "destructive", title: "Empty Report", description: "Please describe the bug you encountered." }); return; }
    setIsSubmitting(true);
    try {
        await addBugReport(bugText);
        setBugText('');
        toast({ title: "Bug Reported!", description: "Thanks for helping us improve CourseCampus." });
    } catch (error) {
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit the bug report. Please try again." });
    } finally { setIsSubmitting(false); }
  }

  const faculties = [...new Set(materials.map(m => m.faculty))].filter(Boolean);
  const programs = [...new Set(materials.map(m => m.program))].filter(Boolean);
  const years = [...new Set(materials.map(m => m.year.toString()))].sort();
  const semesters = [...new Set(materials.map(m => m.semester.toString()))].sort();
  const types: Material['type'][] = ['Lecture Slides', 'Past Papers', 'Memos', 'Tutorials', 'Lab Manuals'];

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r-0">
        <SidebarHeader><div className="flex items-center gap-2 p-2"><BookOpenCheck className="w-8 h-8 text-sidebar-primary" /><h1 className="font-headline text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">CourseCampus</h1></div></SidebarHeader>
        <SidebarContent>
            <SidebarGroup className="p-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" /><Input placeholder="Search materials..." className="pl-9 bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            </SidebarGroup>
            <SidebarGroup className="p-2 pt-0"><div className="grid gap-4">
                    {loading ? (<><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></>) : (<>
                        <FilterSelect label="Faculty" placeholder="All Faculties" options={faculties} value={filters.faculty} onChange={handleFilterChange('faculty')} />
                        <FilterSelect label="Program" placeholder="All Programs" options={programs} value={filters.program} onChange={handleFilterChange('program')} />
                        <FilterSelect label="Academic Year" placeholder="All Years" options={years} value={filters.year} onChange={handleFilterChange('year')} />
                        <FilterSelect label="Semester" placeholder="All Semesters" options={semesters} value={filters.semester} onChange={handleFilterChange('semester')} />
                        <FilterSelect label="Material Type" placeholder="All Types" options={types} value={filters.type} onChange={handleFilterChange('type')} />
                      </>)}
            </div></SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="my-2 bg-sidebar-border" />
          <SidebarMenu>
            <Dialog><DialogTrigger asChild><SidebarMenuItem><SidebarMenuButton tooltip="Submit Feedback"><MessageSquareQuote /><span>Feedback</span></SidebarMenuButton></SidebarMenuItem></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Submit Feedback</DialogTitle><DialogDescription>We'd love to hear your thoughts! Please share any suggestions or reviews.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4"><Textarea placeholder="Type your feedback here." rows={6} value={feedbackText} onChange={e => setFeedbackText(e.target.value)} /></div>
                    <DialogFooter><Button onClick={handleFeedbackSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit</Button></DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog><DialogTrigger asChild><SidebarMenuItem><SidebarMenuButton tooltip="Report a Bug"><Bug /><span>Report a Bug</span></SidebarMenuButton></SidebarMenuItem></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Report a Bug</DialogTitle><DialogDescription>Spotted an issue? Help us improve by reporting it.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea placeholder="Describe the bug you encountered..." rows={4} value={bugText} onChange={(e) => setBugText(e.target.value)} />
                    </div>
                    <DialogFooter><Button onClick={handleBugReportSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Report Bug</Button></DialogFooter>
                </DialogContent>
            </Dialog>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Contact Us">
                    <a href="mailto:contact@coursecampus.com" aria-label="Contact Us">
                        <Mail />
                        <span>Contact Us</span>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/login" tooltip="Admin Login"><Shield /><span>Admin</span></SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
          <Separator className="my-2 bg-sidebar-border" />
          <div className="flex flex-col items-center justify-center gap-2 p-4 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-4">
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Facebook className="h-5 w-5" /></a>
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Twitter className="h-5 w-5" /></a>
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Linkedin className="h-5 w-5" /></a>
                </div>
                 <p className="text-xs text-sidebar-foreground/50 mt-2">
                    &copy; {new Date().getFullYear()} CourseCampus by sladethedeciever
                 </p>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h2 className="font-headline text-2xl font-bold">Course Materials</h2></div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
            ) : Object.keys(groupedMaterials).length > 0 ? (
                <Accordion type="multiple" defaultValue={Object.keys(groupedMaterials)} className="w-full space-y-4">
                    {Object.entries(groupedMaterials).map(([program, semesters]) => (
                        <AccordionItem value={program} key={program} className="border-b-0">
                           <h3 className="font-headline text-xl font-bold mb-2">{program}</h3>
                            {Object.entries(semesters).map(([semester, materials]) => (
                                <AccordionItem value={`${program}-${semester}`} key={`${program}-${semester}`} className="border rounded-lg mb-4">
                                     <AccordionTrigger className="px-4 py-2 text-lg font-semibold bg-muted/50 rounded-t-lg">
                                        {semester}
                                     </AccordionTrigger>
                                     <AccordionContent className="p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {materials.map(material => (<MaterialCard key={material.id} material={material} />))}
                                        </div>
                                     </AccordionContent>
                                </AccordionItem>
                            ))}
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                    <Search className="w-16 h-16 mb-4" /><h3 className="text-xl font-headline font-semibold">No Materials Found</h3><p className="max-w-md mt-2">Your search and filter criteria did not match any materials. Please try again.</p>
                </div>
            )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

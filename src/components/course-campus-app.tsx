
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { MaterialCard } from './material-card';
import type { Material, SocialLink } from '@/types';
import { BookOpenCheck, Bug, Facebook, Linkedin, MessageSquareQuote, Search, Twitter } from 'lucide-react';


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

const defaultSocials: Record<SocialLink['id'], string> = {
    facebook: '#',
    twitter: '#',
    linkedin: '#',
};

const defaultMaterials: Material[] = [
  { id: '1', title: 'Intro to Programming', course: 'ICP1521', faculty: 'ICT', program: 'Software Dev', year: 1, semester: 1, type: 'Document', url: '#' },
  { id: '2', title: 'Calculus I Notes', course: 'MTH1521', faculty: 'Engineering', program: 'Elec Eng', year: 1, semester: 1, type: 'Document', url: '#' },
  { id: '3', title: 'Networking Basics', course: 'CNF2521', faculty: 'ICT', program: 'Software Dev', year: 2, semester: 1, type: 'Slides', url: '#' },
  { id: '4', title: 'Web Development Intro', course: 'WDP2521', faculty: 'ICT', program: 'Software Dev', year: 2, semester: 2, type: 'Video', url: '#' },
];

export function CourseCampusApp() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [socialLinks, setSocialLinks] = React.useState(defaultSocials);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState({
    faculty: 'all',
    program: 'all',
    year: 'all',
    semester: 'all',
    type: 'all',
  });

  React.useEffect(() => {
    const storedMaterials = JSON.parse(localStorage.getItem('materials') || 'null');
    setMaterials(storedMaterials || defaultMaterials);

    const storedSocials = JSON.parse(localStorage.getItem('social-links') || 'null');
     if (storedSocials) {
        const links: Record<string, string> = {...defaultSocials};
        storedSocials.forEach((l: SocialLink) => links[l.id] = l.url);
        setSocialLinks(links as Record<SocialLink['id'], string>);
    }
  }, []);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const filteredMaterials = materials.filter(material => {
    return (
      (material.title.toLowerCase().includes(searchTerm.toLowerCase()) || material.course.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filters.faculty === 'all' || material.faculty === filters.faculty) &&
      (filters.program === 'all' || material.program === filters.program) &&
      (filters.year === 'all' || material.year.toString() === filters.year) &&
      (filters.semester === 'all' || material.semester.toString() === filters.semester) &&
      (filters.type === 'all' || material.type === filters.type)
    );
  });
  
  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
        toast({ variant: "destructive", title: "Empty Feedback", description: "Please enter your feedback before submitting." });
        return;
    }
    const existingFeedback = JSON.parse(localStorage.getItem('user-feedback') || '[]');
    const newFeedback = {
        id: new Date().toISOString(),
        text: feedbackText,
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem('user-feedback', JSON.stringify([newFeedback, ...existingFeedback]));
    setFeedbackText('');
    toast({ title: "Feedback Submitted!", description: "Thank you for your valuable feedback." });
  };


  const faculties = [...new Set(materials.map(m => m.faculty))];
  const programs = [...new Set(materials.map(m => m.program))];
  const years = [...new Set(materials.map(m => m.year.toString()))];
  const semesters = [...new Set(materials.map(m => m.semester.toString()))];
  const types = [...new Set(materials.map(m => m.type))];

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r-0">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <BookOpenCheck className="w-8 h-8 text-sidebar-primary" />
            <h1 className="font-headline text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">CourseCampus</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup className="p-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
                    <Input 
                        placeholder="Search materials..." 
                        className="pl-9 bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </SidebarGroup>
            <SidebarGroup className="p-2 pt-0">
                <div className="grid gap-4">
                    <FilterSelect label="Faculty" placeholder="All Faculties" options={faculties} value={filters.faculty} onChange={handleFilterChange('faculty')} />
                    <FilterSelect label="Program" placeholder="All Programs" options={programs} value={filters.program} onChange={handleFilterChange('program')} />
                    <FilterSelect label="Academic Year" placeholder="All Years" options={years} value={filters.year} onChange={handleFilterChange('year')} />
                    <FilterSelect label="Semester" placeholder="All Semesters" options={semesters} value={filters.semester} onChange={handleFilterChange('semester')} />
                    <FilterSelect label="Material Type" placeholder="All Types" options={types} value={filters.type} onChange={handleFilterChange('type')} />
                </div>
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="my-2 bg-sidebar-border" />
          <SidebarMenu>
            <Dialog>
                <DialogTrigger asChild>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Submit Feedback">
                            <MessageSquareQuote />
                            <span>Feedback</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Feedback</DialogTitle>
                        <DialogDescription>
                            We'd love to hear your thoughts! Please share any suggestions or reviews.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea placeholder="Type your feedback here." rows={6} value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleFeedbackSubmit}>Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog>
                <DialogTrigger asChild>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Report a Bug">
                            <Bug />
                            <span>Report a Bug</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report a Bug</DialogTitle>
                        <DialogDescription>
                            Spotted an issue? Help us improve by reporting it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea placeholder="Describe the bug you encountered..." rows={4} />
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="screenshot">Screenshot (Optional)</Label>
                            <Input id="screenshot" type="file" className="text-foreground"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => toast({ title: "Bug Reported!", description: "Thanks for helping us improve CourseCampus." })}>Report Bug</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </SidebarMenu>
          <Separator className="my-2 bg-sidebar-border" />
          <div className="flex items-center justify-center gap-4 p-4 group-data-[collapsible=icon]:hidden">
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Facebook className="h-5 w-5" /></a>
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Twitter className="h-5 w-5" /></a>
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground"><Linkedin className="h-5 w-5" /></a>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h2 className="font-headline text-2xl font-bold">Course Materials</h2>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {filteredMaterials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMaterials.map(material => (
                        <MaterialCard key={material.id} material={material} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                    <Search className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-headline font-semibold">No Materials Found</h3>
                    <p className="max-w-md mt-2">Try adjusting your search or filter criteria to find what you're looking for.</p>
                </div>
            )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

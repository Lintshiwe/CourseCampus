
export type Material = {
  id: string;
  title: string;
  course: string;
  faculty: string;
  program: string;
  year: number;
  semester: number;
  type: 'Document' | 'Slides' | 'Video';
  url: string;
};

export type Feedback = {
  id: string;
  text: string;
  createdAt: string; // Using ISO string for easier serialization
};

export type SocialLink = {
  id: 'facebook' | 'twitter' | 'linkedin';
  name: string;
  url: string;
};

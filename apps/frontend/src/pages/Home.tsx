import { GithubSection } from '@/components/github';
import { Hero } from '@/components/Hero';
import { About, EducationSection, ExperienceSection, SkillsSection, Stats } from '@/components/sections';
import { ContactSection, LabSection, ProjectsSection } from '@/components/showcase';

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <ExperienceSection />
      <SkillsSection />
      <GithubSection />
      <ProjectsSection />
      <LabSection />
      <EducationSection />
      <ContactSection />
    </>
  );
}

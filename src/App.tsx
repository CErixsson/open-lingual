import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/i18n";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardRouter from "./pages/DashboardRouter";
import ExercisePage from "./pages/Exercise";
import LeaderboardPage from "./pages/Leaderboard";
import CoursesPage from "./pages/Courses";
import LessonEditor from "./pages/LessonEditor";
import ScenariosPage from "./pages/Scenarios";
import DialoguePlayer from "./pages/DialoguePlayer";
import LessonPlayer from "./pages/LessonPlayer";
import CurriculumPlayer from "./pages/CurriculumPlayer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/dashboard/skills" element={<Dashboard />} />
              <Route path="/exercise/:id" element={<ExercisePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/lessons/new" element={<LessonEditor />} />
              <Route path="/lessons/:id/edit" element={<LessonEditor />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="/scenarios/:id" element={<DialoguePlayer />} />
              <Route path="/lessons/:id" element={<LessonPlayer />} />
              <Route path="/learn/:lang/:level/:lessonId" element={<CurriculumPlayer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

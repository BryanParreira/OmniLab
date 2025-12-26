import React from 'react';
import { CommandBar } from "./components/CommandBar"; 
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import { Cerebro } from "./components/Cerebro";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { Chronos } from "./components/Chronos";
import { Canvas } from "./components/Canvas";
import { Zenith } from "./components/Zenith";
import { Settings } from "./components/Settings";
import { CommandPalette } from "./components/CommandPalette";
import { DailyDashboard } from "./components/DailyDashboard";
import { OnboardingTour } from "./components/OnboardingTour";
import { LuminaProvider, useLumina } from "./context/LuminaContext";

const MainContent = () => {
  const { currentView } = useLumina();
  
  let content;
  switch (currentView) {
    case 'home':
      content = <DailyDashboard />;
      break;
    case 'cerebro': 
      content = <Cerebro />; 
      break;
    case 'dashboard':
    case 'project-dashboard': 
      content = <ProjectDashboard />; 
      break;
    case 'chronos': 
      content = <Chronos />; 
      break;
    case 'canvas': 
      content = <Canvas />; 
      break;
    case 'zenith': 
      content = <Zenith />; 
      break;
    case 'chat':
    default: 
      content = <Workspace />; 
      break;
  }

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 relative z-10 gap-2">
      <CommandBar />
      <div className="flex-1 rounded-2xl glass-panel overflow-hidden relative shadow-2xl bg-[#030304]">
        {content}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { 
    isSettingsOpen, 
    closeGlobalSettings, 
    commandPaletteOpen, 
    setCommandPaletteOpen
  } = useLumina();
  
  return (
    <>
      <div className="flex h-screen w-screen bg-void text-white overflow-hidden p-3 gap-3 relative selection:bg-indigo-500/30">
        <div className="bg-noise"></div>
        
        <div className="w-[260px] flex flex-col z-20 h-full shrink-0">
          <Sidebar />
        </div>
        
        <MainContent />
      </div>
      
      <Settings isOpen={isSettingsOpen} onClose={closeGlobalSettings} />
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Onboarding Tour - Auto-shows on first launch */}
      <OnboardingTour />
    </>
  );
};

export default function App() {
  return (
    <LuminaProvider>
      <AppContent />
    </LuminaProvider>
  );
}
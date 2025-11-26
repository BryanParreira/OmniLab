import { CommandBar } from "./components/CommandBar";
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import { Cerebro } from "./components/Cerebro";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { Chronos } from "./components/Chronos";
import { Settings } from "./components/Settings";
import { LuminaProvider, useLumina } from "./context/LuminaContext";

const MainContent = () => {
  const { currentView } = useLumina();
  let content;
  switch (currentView) {
    case 'cerebro': content = <Cerebro />; break;
    case 'project-dashboard': content = <ProjectDashboard />; break;
    case 'chronos': content = <Chronos />; break;
    default: content = <Workspace />; break;
  }
  return (
    <div className="flex flex-col flex-1 h-full min-w-0 relative z-10 gap-2">
      <CommandBar />
      <div className="flex-1 rounded-2xl glass-panel overflow-hidden relative shadow-2xl bg-[#030304]">{content}</div>
    </div>
  );
};

const AppContent = () => {
  const { isSettingsOpen, closeGlobalSettings } = useLumina();
  return (
    <>
      <div className="flex h-screen w-screen bg-void text-white overflow-hidden p-3 gap-3 relative selection:bg-indigo-500/30">
        <div className="bg-noise"></div>
        <div className="w-[260px] flex flex-col z-20 h-full shrink-0"><Sidebar /></div>
        <MainContent />
      </div>
      <Settings isOpen={isSettingsOpen} onClose={closeGlobalSettings} />
    </>
  );
};

export default function App() {
  return <LuminaProvider><AppContent /></LuminaProvider>;
}
import { CommandBar } from "./components/CommandBar";
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import { LuminaProvider } from "./context/LuminaContext";

export default function App() {
  return (
    <LuminaProvider>
      {/* The w-screen h-screen ensures full size */}
      <div className="flex h-screen w-screen bg-[#030304] text-white overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 h-full min-w-0 relative">
          <CommandBar />
          <Workspace />
        </div>
      </div>
    </LuminaProvider>
  );
}
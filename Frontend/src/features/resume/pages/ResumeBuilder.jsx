import { useParams } from "react-router";
import AIOptimizer from "../components/AIOptimizer";
import ResumeEditor from "../components/ResumeEditor";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ResumePreviewLive from "../components/ResumePreviewLive";
import { useResume } from "../hooks/useResume";
import { downloadPDF } from "../services/resume.api";
import "../style/resume.scss";

export default function ResumeBuilder() {
  const {
    resume,
    analytics,
    builderSidebar,
    handleAIImprove,
    setResume
  } = useResume(id);

  const handleDownload = async () => {
    const blob = await downloadPDF(resume);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "resume.pdf";
    a.click();
  };


  return (
    <div className="resume-ui resume-page resume-page--builder">
      <Topbar activeTab="analysis" />

      <div className="resume-layout">
        <Sidebar
          title="Resume Editor"
          subtitle="AI Workspace"
          avatar="https://i.pravatar.cc/96?img=12"
          items={builderSidebar}
          assist={{ label: "AI Assist", variant: "outline" }}
        />

        <main className="resume-main builder-split">

          {/* LEFT */}
          <div className="builder-editor">
            <ResumeEditor resume={resume} setResume={setResume} />
          </div>

          {/* CENTER (MAIN FOCUS) */}
          <div className="builder-preview">
            <ResumePreviewLive
              resume={resume}
              analytics={analytics}
            />
          </div>

          <button onClick={handleDownload}>
            Download PDF
          </button>
          
          {/* RIGHT */}
          <AIOptimizer
            analytics={analytics}
            onAutoFix={handleAIImprove}
          />
        </main>
      </div>
    </div>
  );
}
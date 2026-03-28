import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenTool } from "lucide-react";
import { StepIndicator } from "@/components/step-indicator";
import { HandwritingTemplate } from "@/components/handwriting-template";
import { NoteCreation } from "@/components/note-creation";
import { ExportPanel } from "@/components/export-panel";
import { HandwritingEngine } from "@/lib/handwriting-engine";
import type { CharacterStroke, HandwritingTemplate as HandwritingTemplateRecord } from "@shared/schema";

const DEFAULT_USER_ID = "user-1";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"template" | "notes" | "export">("template");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [fontSize, setFontSize] = useState("medium");
  const [includeLines, setIncludeLines] = useState(false);

  const {
    data: template,
    isLoading: templateLoading,
    isError: templateError,
  } = useQuery<HandwritingTemplateRecord | null>({
    queryKey: [`/api/templates/${DEFAULT_USER_ID}`, templateId],
    enabled: templateId != null,
  });

  useEffect(() => {
    setNoteText("");
    setFontSize("medium");
    setIncludeLines(false);
  }, [templateId]);

  const characterData = template?.characterData as Record<string, CharacterStroke> | undefined;

  const handwritingData = useMemo(() => {
    if (!characterData || !noteText.trim()) return null;
    const engine = new HandwritingEngine();
    engine.setCharacterTemplates(characterData);
    engine.analyzeHandwritingStyle(characterData);
    return engine.generateHandwriting(noteText, { fontSize, includeLines });
  }, [characterData, noteText, fontSize, includeLines]);

  const handleTemplateComplete = (id: number) => {
    setTemplateId(id);
    setCurrentStep("notes");
  };

  const handleNotesComplete = () => {
    setCurrentStep("export");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <PenTool className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">HandScript</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Examples</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Transform Digital Notes into{" "}
              <span className="text-primary">Personal Handwriting</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              HandScript captures your unique handwriting style and converts any digital text into authentic, 
              personalized handwritten notes. Perfect for letters, journals, and creative projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setCurrentStep("template")}
                className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
              >
                <PenTool className="w-5 h-5 mr-2 inline" />
                Start Creating
              </button>
              <button className="bg-white text-slate-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-50 transition-colors border border-slate-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workflow Interface */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepIndicator currentStep={currentStep} />
          
          {currentStep === "template" && (
            <HandwritingTemplate onComplete={handleTemplateComplete} />
          )}
          
          {currentStep === "notes" && templateId && (
            <NoteCreation
              templateLoading={templateLoading}
              templateError={templateError}
              template={template ?? null}
              noteText={noteText}
              onNoteTextChange={setNoteText}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              includeLines={includeLines}
              onIncludeLinesChange={setIncludeLines}
              handwritingData={handwritingData}
              onComplete={handleNotesComplete}
            />
          )}
          
          {currentStep === "export" && (
            <ExportPanel
              handwritingData={handwritingData}
              includeLines={includeLines}
              noteText={noteText}
              templateLoading={templateLoading}
              templateError={templateError}
              hasTemplate={!!template}
            />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose HandScript?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience the perfect blend of digital convenience and personal touch
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Authentic Handwriting</h3>
              <p className="text-slate-600">
                Our advanced AI captures every nuance of your handwriting style for truly authentic results.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Lightning Fast</h3>
              <p className="text-slate-600">
                Convert any text to handwriting in seconds. Perfect for quick notes and last-minute assignments.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Works Everywhere</h3>
              <p className="text-slate-600">
                Use HandScript on any device - desktop, tablet, or mobile. Your handwriting follows you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <PenTool className="text-white w-4 h-4" />
              </div>
              <h3 className="text-xl font-semibold">HandScript</h3>
            </div>
            <p className="text-slate-400 text-sm mb-8">
              Transform your digital notes into beautiful, personalized handwriting.
            </p>
            <p className="text-slate-400 text-sm">
              &copy; 2024 HandScript. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

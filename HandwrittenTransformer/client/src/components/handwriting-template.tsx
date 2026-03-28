import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CanvasDrawing } from "@/components/canvas-drawing";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CharacterStroke } from "@shared/schema";

interface HandwritingTemplateProps {
  onComplete: (templateId: number) => void;
}

export function HandwritingTemplate({ onComplete }: HandwritingTemplateProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("uppercase");
  const [characterData, setCharacterData] = useState<Record<string, CharacterStroke>>({
    // Auto-complete space character since it doesn't need to be drawn
    " ": {
      character: " ",
      strokes: []
    }
  });
  
  const userId = "user-1"; // In a real app, this would come from auth

  const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    lowercase: "abcdefghijklmnopqrstuvwxyz".split(""),
    numbers: "0123456789".split(""),
    special: [".", ",", "!", "?", "'", '"', "-", "(", ")", " "].filter(Boolean),
  };

  const totalCharacters = Object.values(characterSets).flat().length;
  const completedCharacters = Object.keys(characterData).length;
  const progress = (completedCharacters / totalCharacters) * 100;

  const { data: existingTemplate } = useQuery({
    queryKey: [`/api/templates/${userId}`],
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { userId: string; characterData: Record<string, CharacterStroke>; isComplete: boolean }) => {
      const response = await apiRequest("POST", "/api/templates", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${userId}`] });
      toast({
        title: "Template saved",
        description: "Your handwriting template has been saved successfully.",
      });
      if (data.isComplete) {
        onComplete(data.id);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStrokeComplete = (character: string, strokes: Array<Array<{ x: number; y: number; timestamp: number }>>) => {
    if (strokes.length === 0) {
      // Character was cleared
      const newData = { ...characterData };
      delete newData[character];
      setCharacterData(newData);
    } else {
      // Character was drawn
      const strokeData: CharacterStroke = {
        character,
        strokes,
      };
      setCharacterData(prev => ({ ...prev, [character]: strokeData }));
    }
  };

  const handleSaveProgress = () => {
    saveTemplateMutation.mutate({
      userId,
      characterData,
      isComplete: false,
    });
  };

  const handleContinue = () => {
    const isComplete = completedCharacters >= Math.ceil(totalCharacters * 0.8); // Allow 80% completion
    
    if (!isComplete) {
      toast({
        title: "Template incomplete",
        description: "Please complete at least 80% of characters before continuing.",
        variant: "destructive",
      });
      return;
    }

    saveTemplateMutation.mutate({
      userId,
      characterData,
      isComplete: true,
    });
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Your Handwriting Template</h2>
        <p className="text-blue-100">
          Write each character in your natural handwriting style. We'll analyze and capture your unique writing patterns.
        </p>
      </div>

      <CardContent className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="uppercase">Uppercase (A-Z)</TabsTrigger>
            <TabsTrigger value="lowercase">Lowercase (a-z)</TabsTrigger>
            <TabsTrigger value="numbers">Numbers (0-9)</TabsTrigger>
            <TabsTrigger value="special">Special Characters</TabsTrigger>
          </TabsList>

          {Object.entries(characterSets).map(([setName, characters]) => (
            <TabsContent key={setName} value={setName}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {characters.map((character) => {
                  if (character === " ") {
                    // Special handling for space character - show as completed
                    return (
                      <div key={character} className="character-card bg-emerald-50 rounded-xl p-4 border-2 border-emerald-300">
                        <div className="text-center mb-3">
                          <span className="text-2xl font-bold text-emerald-700">Space</span>
                        </div>
                        <div className="w-full h-24 bg-white rounded-lg border border-emerald-200 flex items-center justify-center">
                          <div className="text-emerald-600 text-sm font-medium">
                            ✓ Auto-completed
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-xs text-emerald-600">No drawing required</span>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <CanvasDrawing
                      key={character}
                      character={character}
                      onStrokeComplete={handleStrokeComplete}
                    />
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600">
              Progress: <span className="font-semibold">{completedCharacters}</span> of{" "}
              <span>{totalCharacters}</span> characters
            </div>
            <Progress value={progress} className="w-48" />
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleSaveProgress}
              disabled={saveTemplateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button
              onClick={handleContinue}
              disabled={saveTemplateMutation.isPending || completedCharacters < Math.ceil(totalCharacters * 0.8)}
              className="bg-accent hover:bg-emerald-600"
            >
              Continue to Notes <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

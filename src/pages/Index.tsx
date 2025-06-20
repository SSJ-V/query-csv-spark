import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { DataPreview } from "@/components/DataPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Upload, MessageCircle, Database, Brain } from "lucide-react";
import Papa from "papaparse";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const Index = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upload" | "chat" | "preview">("upload");
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadCsvToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload CSV.");
      }

      const data = await response.json();
      console.log("Backend response:", data);
      return true;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  };

  // Ask backend query
  const askBackend = async (question: string) => {
    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error("Failed to query backend.");
      }

      const data = await response.json();
      console.log("Backend answer:", data);
      return data.response || "No response.";
    } catch (error: any) {
      console.error(error);
      return "Error: " + error.message;
    }
  };

  // Existing frontend callback — you can call uploadCsvToBackend(file) inside your file upload flow

  const handleFileUpload = async (data: any[], filename: string, file: File) => {
    setIsProcessing(true);
    setCsvData(data);
    setFileName(filename);
    setKnowledgeBase(data);
    setActiveTab("chat");

    // Send file to backend
    const success = await uploadCsvToBackend(file);
    if (!success) {
      setActiveTab("upload");
    }
    setIsProcessing(false);
  };

  const handleHeaderUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleHeaderFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          handleFileUpload(results.data, file.name, file);
          setIsProcessing(false);
        },
        error: () => {
          setIsProcessing(false);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
      {/* Hidden file input for header upload */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleHeaderFileInput}
      />
      {/* Header */}
      <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-slate-700/20 sticky top-0 z-10 transition-colors duration-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CSV Intelligence
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">RAG-Powered Data Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "upload" ? "default" : "ghost"}
                  onClick={handleHeaderUploadClick}
                  className="gap-2 hover:scale-105 transition-transform duration-200"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
                <Button
                  variant={activeTab === "preview" ? "default" : "ghost"}
                  onClick={() => setActiveTab("preview")}
                  className="gap-2 hover:scale-105 transition-transform duration-200"
                  disabled={csvData.length === 0}
                >
                  <Database className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant={activeTab === "chat" ? "default" : "ghost"}
                  onClick={() => setActiveTab("chat")}
                  className="gap-2 hover:scale-105 transition-transform duration-200"
                  disabled={csvData.length === 0}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          {activeTab === "upload" && csvData.length === 0 && (
            <div className="text-center mb-12 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-500">
                Intelligent CSV Analysis
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 transition-colors duration-500">
                Upload your CSV files and ask sophisticated questions about your data. 
                Our RAG system with chain of thought reasoning provides deep insights.
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:scale-105 transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
                  <Upload className="w-8 h-8 text-blue-500 mb-4" />
                  <h3 className="font-semibold mb-2 dark:text-gray-100">Smart Upload</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Automatically parse and validate your CSV files</p>
                </Card>
                <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:scale-105 transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
                  <Brain className="w-8 h-8 text-purple-500 mb-4" />
                  <h3 className="font-semibold mb-2 dark:text-gray-100">RAG Analysis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Retrieval-augmented generation for accurate insights</p>
                </Card>
                <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:scale-105 transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
                  <MessageCircle className="w-8 h-8 text-green-500 mb-4" />
                  <h3 className="font-semibold mb-2 dark:text-gray-100">Natural Chat</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ask questions in plain English and get detailed answers</p>
                </Card>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="animate-fade-in">
            {activeTab === "upload" && (
              <FileUpload onFileUpload={handleFileUpload} />
            )}
            
            {activeTab === "preview" && csvData.length > 0 && (
              <DataPreview data={csvData} fileName={fileName} />
            )}
            
            {activeTab === "chat" && csvData.length > 0 && (
              <ChatInterface 
                knowledgeBase={knowledgeBase} 
                csvData={csvData}
                fileName={fileName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

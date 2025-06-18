
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { DataPreview } from "@/components/DataPreview";
import { Upload, MessageCircle, Database, Brain } from "lucide-react";

const Index = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upload" | "chat" | "preview">("upload");
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);

  const handleFileUpload = (data: any[], filename: string) => {
    setCsvData(data);
    setFileName(filename);
    setKnowledgeBase(data);
    setActiveTab("preview");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="backdrop-blur-sm bg-white/70 border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CSV Intelligence
                </h1>
                <p className="text-sm text-gray-600">RAG-Powered Data Analysis</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "upload" ? "default" : "ghost"}
                onClick={() => setActiveTab("upload")}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button
                variant={activeTab === "preview" ? "default" : "ghost"}
                onClick={() => setActiveTab("preview")}
                className="gap-2"
                disabled={csvData.length === 0}
              >
                <Database className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant={activeTab === "chat" ? "default" : "ghost"}
                onClick={() => setActiveTab("chat")}
                className="gap-2"
                disabled={csvData.length === 0}
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
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
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Intelligent CSV Analysis
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Upload your CSV files and ask sophisticated questions about your data. 
                Our RAG system with chain of thought reasoning provides deep insights.
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 hover:scale-105 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-blue-500 mb-4" />
                  <h3 className="font-semibold mb-2">Smart Upload</h3>
                  <p className="text-sm text-gray-600">Automatically parse and validate your CSV files</p>
                </Card>
                <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 hover:scale-105 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-purple-500 mb-4" />
                  <h3 className="font-semibold mb-2">RAG Analysis</h3>
                  <p className="text-sm text-gray-600">Retrieval-augmented generation for accurate insights</p>
                </Card>
                <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 hover:scale-105 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-green-500 mb-4" />
                  <h3 className="font-semibold mb-2">Natural Chat</h3>
                  <p className="text-sm text-gray-600">Ask questions in plain English and get detailed answers</p>
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

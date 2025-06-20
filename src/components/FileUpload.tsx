import { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { Upload, FileText, CheckCircle } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (data: any[], filename: string, file: File) => void;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file only.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast({
            title: "Parse Error",
            description: "There was an error parsing your CSV file.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        console.log("CSV data parsed:", results.data);
        
        toast({
          title: "File uploaded successfully!",
          description: `Processed ${results.data.length} rows of data.`,
        });

        onFileUpload(results.data, file.name, file);
        setIsProcessing(false);
      },
      error: () => {
        toast({
          title: "Upload Error",
          description: "Failed to upload the file. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card 
        className={`
          relative overflow-hidden transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-blue-400 bg-blue-50/80 scale-102' 
            : 'border-gray-200 bg-white/60 hover:bg-white/80'
          }
          ${isProcessing ? 'pointer-events-none' : ''}
          backdrop-blur-sm border-2 border-dashed
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleCardClick}
        style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
          ref={fileInputRef}
        />
        <div className="p-12">
          <div className="text-center">
            <div className={`
              w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300
              ${isDragging 
                ? 'bg-blue-500 scale-110' 
                : uploadedFile 
                  ? 'bg-green-500' 
                  : 'bg-gray-100'
              }
            `}>
              {isProcessing ? (
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              ) : uploadedFile ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
              )}
            </div>
            
            {uploadedFile ? (
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  File uploaded successfully!
                </h3>
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{uploadedFile.name}</span>
                </div>
                <p className="text-sm text-gray-500">
                  Your CSV file has been processed and added to the knowledge base.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {isDragging ? "Drop your CSV file here" : "Upload your CSV file"}
                </h3>
                <p className="text-gray-500 mb-6">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <div className="flex flex-col items-center">
                  <Upload className="w-4 h-4 mb-2 text-blue-500" />
                  <span className="font-semibold text-gray-700">
                    {isProcessing ? "Processing..." : "Click or drag to upload CSV"}
                  </span>
                  <span className="text-xs text-gray-400 mt-2">Supported format: CSV files only</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Animated border effect */}
        <div className={`
          absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 transition-opacity duration-300
          ${isDragging ? 'opacity-20' : ''}
        `} />
      </Card>
    </div>
  );
};

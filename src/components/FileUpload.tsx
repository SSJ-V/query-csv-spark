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

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card 
        className="w-full max-w-2xl p-12 bg-white border-dashed border-2 border-gray-300 text-center cursor-pointer hover:border-blue-500 transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" ref={fileInputRef} />
        {!uploadedFile ? (
          <>
            <div className="mb-6">
              <Upload className="w-16 h-16 mx-auto text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Upload your CSV file</h2>
            <p className="text-gray-500 mb-4">Drag and drop or click to upload. Only CSV files supported.</p>
            {isProcessing && (
              <p className="text-sm text-gray-400">Processing...</p>
            )}
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-lg font-semibold text-green-600 mb-2">File uploaded successfully!</h2>
            <p className="text-gray-500">{uploadedFile.name}</p>
          </>
        )}
      </Card>
    </div>
  );
};

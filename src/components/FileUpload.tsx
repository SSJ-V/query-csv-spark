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

    // ✅ Upload CSV directly to backend
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("https://spark-rag.onrender.com/upload-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          toast({
            title: "File uploaded successfully!",
            description: `Processed ${results.data.length} rows of data.`,
          });
          onFileUpload(results.data, file.name, file);
          setIsProcessing(false);
        }
      });
    } catch {
      toast({
        title: "Backend error",
        description: "Failed to upload to backend.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-dashed border-2 p-12 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
        <input type="file" accept=".csv" ref={fileInputRef} hidden onChange={handleFileInput} />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-6 flex justify-center items-center bg-gray-100 rounded-full">
            {isProcessing ? (
              <div className="animate-spin border-2 border-t-transparent w-8 h-8 rounded-full border-blue-500" />
            ) : uploadedFile ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <Upload className="w-10 h-10 text-blue-500" />
            )}
          </div>
          {uploadedFile ? (
            <>
              <h3 className="font-semibold text-green-600">File uploaded!</h3>
              <p className="text-sm text-gray-500 mt-2">{uploadedFile.name}</p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-gray-700">Upload your CSV</h3>
              <p className="text-sm text-gray-500">Click or drag to upload</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

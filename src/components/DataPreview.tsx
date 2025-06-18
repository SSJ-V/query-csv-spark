
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

interface DataPreviewProps {
  data: any[];
  fileName: string;
}

export const DataPreview = ({ data, fileName }: DataPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  const currentData = data.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const getColumnStats = (columnName: string) => {
    const values = data.map(row => row[columnName]).filter(val => val != null && val !== "");
    const uniqueValues = new Set(values);
    const isNumeric = values.every(val => !isNaN(Number(val)) && val !== "");
    
    return {
      totalValues: values.length,
      uniqueValues: uniqueValues.size,
      isNumeric,
      type: isNumeric ? "Number" : "Text"
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:scale-102 transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{fileName}</h2>
            <p className="text-gray-600 dark:text-gray-300">Data Preview & Analysis</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-300">Total Rows</span>
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.length.toLocaleString()}</span>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-purple-700 dark:text-purple-300">Columns</span>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{columns.length}</span>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-300">Data Quality</span>
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round((data.filter(row => Object.values(row).some(val => val != null && val !== "")).length / data.length) * 100)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Column Information */}
      <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/20">
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Column Analysis</h3>
        <div className="grid gap-3">
          {columns.map((column, index) => {
            const stats = getColumnStats(column);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors hover:scale-102 duration-300">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{column}</span>
                  <Badge variant={stats.isNumeric ? "default" : "secondary"}>
                    {stats.type}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stats.totalValues} values • {stats.uniqueValues} unique
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-gray-100">Data Sample</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="hover:scale-105 transition-transform duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="hover:scale-105 transition-transform duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-600">
                {columns.map((column, index) => (
                  <th key={index} className="text-left p-3 font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700/50">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="p-3 text-gray-800 dark:text-gray-200">
                      {row[column] || <span className="text-gray-400 dark:text-gray-500">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

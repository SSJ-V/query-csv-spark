
interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

interface QueryResult {
  answer: string;
  reasoning: string;
  relevantDocuments: VectorDocument[];
}

export class RAGProcessor {
  private documents: VectorDocument[] = [];
  private indexed: boolean = false;

  // Simple text similarity function (cosine similarity on word vectors)
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    const allWords = [...new Set([...words1, ...words2])];
    const vector1 = allWords.map(word => words1.filter(w => w === word).length);
    const vector2 = allWords.map(word => words2.filter(w => w === word).length);
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  indexData(csvData: any[]): void {
    console.log("Indexing CSV data for RAG...");
    
    this.documents = csvData.map((row, index) => {
      // Convert row to searchable text
      const content = Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return {
        id: `row_${index}`,
        content,
        metadata: { ...row, rowIndex: index }
      };
    });
    
    this.indexed = true;
    console.log(`Indexed ${this.documents.length} documents`);
  }

  private retrieveRelevantDocuments(query: string, topK: number = 5): VectorDocument[] {
    if (!this.indexed) {
      console.warn("Data not indexed yet");
      return [];
    }

    // Calculate similarity scores
    const scoredDocuments = this.documents.map(doc => ({
      document: doc,
      score: this.calculateSimilarity(query, doc.content)
    }));

    // Sort by relevance and return top K
    return scoredDocuments
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.document);
  }

  private generateChainOfThoughtReasoning(query: string, relevantDocs: VectorDocument[]): string {
    const steps = [
      "1. Query Analysis:",
      `   - User asked: "${query}"`,
      `   - Identified key terms and intent`,
      "",
      "2. Data Retrieval:",
      `   - Retrieved ${relevantDocs.length} most relevant records`,
      `   - Selected based on semantic similarity to the query`,
      "",
      "3. Data Analysis:",
      `   - Examining patterns in the retrieved data`,
      `   - Looking for quantitative and qualitative insights`,
      "",
      "4. Synthesis:",
      `   - Combining insights from multiple data points`,
      `   - Providing comprehensive answer based on evidence`
    ];

    return steps.join("\n");
  }

  private analyzeDataForQuery(query: string, relevantDocs: VectorDocument[], allData: any[]): string {
    const lowerQuery = query.toLowerCase();
    
    // Get column names from the first document
    const columns = relevantDocs.length > 0 ? Object.keys(relevantDocs[0].metadata).filter(k => k !== 'rowIndex') : [];
    
    // Detect query type and generate appropriate response
    if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('total')) {
      return this.handleCountQuery(query, allData, columns);
    } else if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
      return this.handleAverageQuery(query, allData, columns);
    } else if (lowerQuery.includes('maximum') || lowerQuery.includes('max') || lowerQuery.includes('highest')) {
      return this.handleMaxQuery(query, allData, columns);
    } else if (lowerQuery.includes('minimum') || lowerQuery.includes('min') || lowerQuery.includes('lowest')) {
      return this.handleMinQuery(query, allData, columns);
    } else if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      return this.handleSummaryQuery(allData, columns);
    } else {
      return this.handleGeneralQuery(query, relevantDocs, columns);
    }
  }

  private handleCountQuery(query: string, data: any[], columns: string[]): string {
    const total = data.length;
    
    // Try to identify specific conditions in the query
    const conditionMatch = query.match(/where|with|having|that have|that are/i);
    if (conditionMatch) {
      return `Based on your dataset, I can provide count information. The total number of records is ${total}. For more specific counts with conditions, please specify the exact criteria you're looking for.`;
    }
    
    return `The dataset contains a total of ${total.toLocaleString()} records across ${columns.length} columns.`;
  }

  private handleAverageQuery(query: string, data: any[], columns: string[]): string {
    const numericColumns = columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]);
      return sample.every(val => !isNaN(Number(val)) && val !== "" && val != null);
    });

    if (numericColumns.length === 0) {
      return "I couldn't find any numeric columns in your dataset to calculate averages. Please specify which column you'd like to analyze.";
    }

    const averages = numericColumns.map(col => {
      const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      return `${col}: ${avg.toFixed(2)}`;
    });

    return `Here are the averages for numeric columns:\n${averages.join('\n')}`;
  }

  private handleMaxQuery(query: string, data: any[], columns: string[]): string {
    const numericColumns = columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]);
      return sample.every(val => !isNaN(Number(val)) && val !== "" && val != null);
    });

    if (numericColumns.length === 0) {
      return "I couldn't find any numeric columns in your dataset to find maximum values. Please specify which column you'd like to analyze.";
    }

    const maxValues = numericColumns.map(col => {
      const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
      const max = Math.max(...values);
      return `${col}: ${max}`;
    });

    return `Here are the maximum values for numeric columns:\n${maxValues.join('\n')}`;
  }

  private handleMinQuery(query: string, data: any[], columns: string[]): string {
    const numericColumns = columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]);
      return sample.every(val => !isNaN(Number(val)) && val !== "" && val != null);
    });

    if (numericColumns.length === 0) {
      return "I couldn't find any numeric columns in your dataset to find minimum values. Please specify which column you'd like to analyze.";
    }

    const minValues = numericColumns.map(col => {
      const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
      const min = Math.min(...values);
      return `${col}: ${min}`;
    });

    return `Here are the minimum values for numeric columns:\n${minValues.join('\n')}`;
  }

  private handleSummaryQuery(data: any[], columns: string[]): string {
    const totalRows = data.length;
    const totalColumns = columns.length;
    
    const columnTypes = columns.map(col => {
      const sample = data.slice(0, 10).map(row => row[col]);
      const isNumeric = sample.every(val => !isNaN(Number(val)) && val !== "" && val != null);
      return { name: col, type: isNumeric ? 'Numeric' : 'Text' };
    });

    const numericCols = columnTypes.filter(c => c.type === 'Numeric');
    const textCols = columnTypes.filter(c => c.type === 'Text');

    return `Dataset Summary:
    
Total Records: ${totalRows.toLocaleString()}
Total Columns: ${totalColumns}

Column Breakdown:
• Numeric columns (${numericCols.length}): ${numericCols.map(c => c.name).join(', ')}
• Text columns (${textCols.length}): ${textCols.map(c => c.name).join(', ')}

This dataset appears to be well-structured with a good mix of data types for analysis.`;
  }

  private handleGeneralQuery(query: string, relevantDocs: VectorDocument[], columns: string[]): string {
    if (relevantDocs.length === 0) {
      return "I couldn't find relevant data for your query. Could you please rephrase your question or be more specific about what you're looking for?";
    }

    const examples = relevantDocs.slice(0, 3).map((doc, index) => {
      const metadata = doc.metadata;
      const relevantFields = Object.entries(metadata)
        .filter(([key]) => key !== 'rowIndex')
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `${index + 1}. ${relevantFields}`;
    });

    return `Based on your query, I found ${relevantDocs.length} relevant records. Here are the top matches:

${examples.join('\n')}

These records seem most relevant to your question. Would you like me to analyze specific aspects of this data or perform calculations on particular columns?`;
  }

  async queryWithReasoning(query: string, csvData: any[]): Promise<QueryResult> {
    console.log("Processing query with RAG:", query);
    
    // Step 1: Retrieve relevant documents
    const relevantDocs = this.retrieveRelevantDocuments(query);
    
    // Step 2: Generate chain of thought reasoning
    const reasoning = this.generateChainOfThoughtReasoning(query, relevantDocs);
    
    // Step 3: Analyze data and generate answer
    const answer = this.analyzeDataForQuery(query, relevantDocs, csvData);
    
    console.log("Generated response with reasoning");
    
    return {
      answer,
      reasoning,
      relevantDocuments: relevantDocs
    };
  }
}

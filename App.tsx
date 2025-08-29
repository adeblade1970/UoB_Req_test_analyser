import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ExcelUploader } from './components/ExcelUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RequirementsAnalysisDisplay } from './components/RequirementsAnalysisDisplay';
import { TestCaseAnalysisDisplay } from './components/TestCaseAnalysisDisplay';
import { Spinner } from './components/Spinner';
import { generateFormAnalysis, analyzeRequirements, analyzeTestCases } from './services/geminiService';
import { parseRequirementsFromExcel, parseTestCasesFromExcel } from './utils/parseExcel';
import type { FormAnalysis, RequirementsAnalysis, TestCase, TestCaseAnalysis } from './types';
import { exportFormAnalysisToExcel, exportRequirementsAnalysisToExcel, exportTestCaseAnalysisToExcel } from './utils/exportToExcel';
import { DownloadIcon } from './components/icons/DownloadIcon';

type Mode = 'screenshot' | 'url' | 'excel' | 'test_cases';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // The result includes the data URL prefix (e.g., "data:image/png;base64,"), 
            // so we need to strip it out for the Gemini API.
            const pureBase64 = base64String.split(',')[1];
            resolve(pureBase64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const getScreenshotFromUrl = async (targetUrl: string): Promise<{ base64: string; objectUrl: string }> => {
    if (!targetUrl || !targetUrl.startsWith('http')) {
        throw new Error("Please enter a valid URL (e.g., https://example.com).");
    }
    
    // Use a public screenshot service. Thum.io is a good option for this.
    const screenshotServiceUrl = `https://image.thum.io/get/width/1280/crop/720/noanimate/${targetUrl}`;

    try {
        const response = await fetch(screenshotServiceUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch screenshot. Status: ${response.status} ${response.statusText}`);
        }
        const imageBlob = await response.blob();
        if (imageBlob.type.startsWith('text/')) {
             throw new Error(`The screenshot service returned an error. This can happen with invalid or inaccessible URLs.`);
        }
        const base64 = await blobToBase64(imageBlob);
        const objectUrl = URL.createObjectURL(imageBlob);
        return { base64, objectUrl };

    } catch (error) {
        console.error("Error fetching or processing screenshot:", error);
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
             throw new Error("A network error occurred. This could be due to a CORS policy on the screenshot service or a network connectivity issue.");
        }
        throw new Error("Could not retrieve a screenshot from the provided URL. Please check if the URL is correct and publicly accessible.");
    }
};


const App: React.FC = () => {
  // Common state
  const [mode, setMode] = useState<Mode>('screenshot');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Screenshot mode state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [formAnalysisResult, setFormAnalysisResult] = useState<FormAnalysis | null>(null);

  // URL mode state
  const [url, setUrl] = useState<string>('');
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  
  // Excel (Requirements) mode state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [requirementsAnalysisResult, setRequirementsAnalysisResult] = useState<RequirementsAnalysis | null>(null);

  // Excel (Test Cases) mode state
  const [testCaseFile, setTestCaseFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCaseAnalysisResult, setTestCaseAnalysisResult] = useState<TestCaseAnalysis | null>(null);

  useEffect(() => {
    // Cleanup function to revoke the object URL to prevent memory leaks
    const currentUrl = screenshotPreviewUrl;
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [screenshotPreviewUrl]);
  
  const resetState = (clearResultsOnly = false) => {
    setIsLoading(false);
    setError(null);
    setFormAnalysisResult(null);
    setRequirementsAnalysisResult(null);
    setTestCaseAnalysisResult(null);
    setImageBase64(null);

    if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
        setScreenshotPreviewUrl(null);
    }

    if (!clearResultsOnly) {
        // Screenshot
        setImageFile(null);
        // URL
        setUrl('');
        // Requirements
        setExcelFile(null);
        setRequirements([]);
        // Test Cases
        setTestCaseFile(null);
        setTestCases([]);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    if (mode !== newMode) {
      setMode(newMode);
      resetState();
    }
  };

  const handleImageUpload = useCallback((file: File) => {
    resetState();
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const pureBase64 = base64String.split(',')[1];
      setImageBase64(pureBase64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleExcelUpload = useCallback(async (file: File) => {
    resetState();
    setExcelFile(file);
    setIsLoading(true);
    try {
      const parsedRequirements = await parseRequirementsFromExcel(file);
      setRequirements(parsedRequirements);
      if (parsedRequirements.length === 0) {
        setError("No requirements found. Please check the file's content and column header (e.g., 'Requirement Description').");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during parsing.";
      setError(`Failed to process Excel file: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTestCaseUpload = useCallback(async (file: File) => {
    resetState();
    setTestCaseFile(file);
    setIsLoading(true);
    try {
      const parsedTestCases = await parseTestCasesFromExcel(file);
      setTestCases(parsedTestCases);
      if (parsedTestCases.length === 0) {
        setError("No test cases found. Please ensure the file has columns for an ID and Description, and that they contain content.");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during parsing.";
      setError(`Failed to process Excel file: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleGenerate = async () => {
    if (mode === 'screenshot' && !imageBase64) {
      setError("Please upload an image first.");
      return;
    }
    if (mode === 'url' && !url) {
      setError("Please enter a URL first.");
      return;
    }
    if (mode === 'excel' && requirements.length === 0) {
      setError("Please upload an Excel file with requirements first.");
      return;
    }
    if (mode === 'test_cases' && testCases.length === 0) {
      setError("Please upload an Excel file with test cases first.");
      return;
    }

    resetState(true);
    setIsLoading(true);

    try {
      if (mode === 'screenshot' && imageBase64) {
        const result = await generateFormAnalysis(imageBase64);
        setFormAnalysisResult(result);
      } else if (mode === 'url') {
          const { base64, objectUrl } = await getScreenshotFromUrl(url);
          setScreenshotPreviewUrl(objectUrl);
          setImageBase64(base64);
          const result = await generateFormAnalysis(base64);
          setFormAnalysisResult(result);
      } else if (mode === 'excel' && requirements.length > 0) {
        const result = await analyzeRequirements(requirements);
        setRequirementsAnalysisResult(result);
      } else if (mode === 'test_cases' && testCases.length > 0) {
        const result = await analyzeTestCases(testCases);
        setTestCaseAnalysisResult(result);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during AI analysis.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = () => {
    if ((mode === 'screenshot' || mode === 'url') && formAnalysisResult) {
      exportFormAnalysisToExcel(formAnalysisResult);
    } else if (mode === 'excel' && requirementsAnalysisResult) {
      exportRequirementsAnalysisToExcel(requirementsAnalysisResult);
    } else if (mode === 'test_cases' && testCaseAnalysisResult) {
      exportTestCaseAnalysisToExcel(testCaseAnalysisResult);
    }
  };

  const activeTabClass = "inline-block p-4 text-teal-400 bg-slate-800 border-r border-l border-t border-slate-700 rounded-t-lg active";
  const inactiveTabClass = "inline-block p-4 border-b border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300";

  const renderContent = () => {
    switch (mode) {
      case 'screenshot':
        return (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Analyze a Form Screenshot</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Upload a screenshot of any web or mobile form. Our AI will generate comprehensive requirements and test scenarios instantly.</p>
            </div>
            <div className="bg-slate-800 rounded-b-2xl rounded-tr-2xl shadow-2xl p-6 md:p-8 border-x border-b border-slate-700">
              <ImageUploader onImageUpload={handleImageUpload} />
              {imageFile && (
                <div className="mt-8 text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">Image Preview</h3>
                  <img src={URL.createObjectURL(imageFile)} alt="Form screenshot preview" className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg border-2 border-slate-600"/>
                  <button onClick={handleGenerate} disabled={isLoading} className="mt-6 inline-flex items-center justify-center px-8 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/50">
                    {isLoading ? <Spinner /> : "Generate Analysis"}
                  </button>
                </div>
              )}
            </div>
          </>
        );
      
      case 'url':
        return (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Analyze a Live URL</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">Enter a public URL. The app will capture a screenshot and generate requirements and test scenarios for any forms and hyperlinks it finds.</p>
            </div>
            <div className="bg-slate-800 rounded-b-2xl rounded-tr-2xl shadow-2xl p-6 md:p-8 border-x border-b border-slate-700">
               <div className="flex flex-col sm:flex-row gap-2">
                 <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        if(formAnalysisResult) resetState(true);
                    }}
                    placeholder="https://www.example.com"
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Website URL"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                  <button 
                      onClick={handleGenerate} 
                      disabled={isLoading || !url} 
                      className="inline-flex items-center justify-center px-8 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/50"
                  >
                    {isLoading ? <Spinner /> : "Generate"}
                  </button>
              </div>
              {isLoading && !screenshotPreviewUrl && (
                <p className="text-center text-slate-400 mt-4 animate-pulse">Capturing screenshot from URL...</p>
              )}
              {screenshotPreviewUrl && (
                <div className="mt-8 text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">Screenshot Preview</h3>
                  <img src={screenshotPreviewUrl} alt="Website screenshot preview" className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg border-2 border-slate-600"/>
                   {isLoading && (
                     <div className="mt-6 flex justify-center items-center gap-2">
                        <Spinner />
                        <span className="text-white font-semibold">Analyzing Image...</span>
                     </div>
                   )}
                </div>
              )}
            </div>
          </>
        );
        
      case 'excel':
        return (
          <>
             <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Analyze Requirements from Excel</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Upload an .xlsx file with a column for your requirements (e.g., <span className="font-medium text-teal-400">"Requirement"</span>, <span className="font-medium text-teal-400">"Description"</span>, or <span className="font-medium text-teal-400">"User Story"</span>). The AI will assess clarity and generate test cases.</p>
            </div>
            <div className="bg-slate-800 rounded-b-2xl rounded-tl-2xl shadow-2xl p-6 md:p-8 border-x border-b border-slate-700">
              <ExcelUploader onFileUpload={handleExcelUpload} fileName={excelFile?.name} />
              {requirements.length > 0 && (
                <div className="mt-8 text-center">
                   <h3 className="text-lg font-semibold text-white mb-2">Requirements Found: {requirements.length}</h3>
                   <p className="text-slate-400 text-sm mb-4">Ready to analyze the requirements from <span className="font-medium text-slate-300">{excelFile?.name}</span>.</p>
                  <button onClick={handleGenerate} disabled={isLoading} className="mt-4 inline-flex items-center justify-center px-8 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/50">
                    {isLoading ? <Spinner /> : "Analyze Requirements"}
                  </button>
                </div>
              )}
            </div>
          </>
        );
      
      case 'test_cases':
        return (
          <>
             <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Review Test Cases from Excel</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                Upload an .xlsx file with columns for an <span className="font-medium text-teal-400">ID</span> (e.g., "Test Case ID"), a <span className="font-medium text-teal-400">Description</span> (e.g., "Scenario"), and optionally an <span className="font-medium text-teal-400">Expected Result</span>. The AI will provide feedback and suggest missing cases.
              </p>
            </div>
            <div className="bg-slate-800 rounded-b-2xl rounded-tl-2xl shadow-2xl p-6 md:p-8 border-x border-b border-slate-700">
              <ExcelUploader onFileUpload={handleTestCaseUpload} fileName={testCaseFile?.name} />
              {testCases.length > 0 && (
                <div className="mt-8 text-center">
                   <h3 className="text-lg font-semibold text-white mb-2">Test Cases Found: {testCases.length}</h3>
                   <p className="text-slate-400 text-sm mb-4">Ready to review the test cases from <span className="font-medium text-slate-300">{testCaseFile?.name}</span>.</p>
                  <button onClick={handleGenerate} disabled={isLoading} className="mt-4 inline-flex items-center justify-center px-8 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/50">
                    {isLoading ? <Spinner /> : "Review Test Cases"}
                  </button>
                </div>
              )}
            </div>
          </>
        );
    }
  };
  
  const hasResults = formAnalysisResult || requirementsAnalysisResult || testCaseAnalysisResult;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button onClick={() => handleModeChange('screenshot')} className={mode === 'screenshot' ? activeTabClass : inactiveTabClass}>Analyze Screenshot</button>
            </li>
            <li className="mr-2">
              <button onClick={() => handleModeChange('url')} className={mode === 'url' ? activeTabClass : inactiveTabClass}>Analyze URL</button>
            </li>
            <li className="mr-2">
              <button onClick={() => handleModeChange('excel')} className={mode === 'excel' ? activeTabClass : inactiveTabClass}>Analyze Requirements</button>
            </li>
            <li>
              <button onClick={() => handleModeChange('test_cases')} className={mode === 'test_cases' ? activeTabClass : inactiveTabClass}>Review Test Cases</button>
            </li>
          </ul>
        </div>
        
        {renderContent()}
        
        {error && (
          <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {hasResults && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">Analysis Results</h2>
              <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors shadow">
                <DownloadIcon className="w-5 h-5" />
                Export to Excel
              </button>
            </div>
            {formAnalysisResult && <ResultsDisplay results={formAnalysisResult} />}
            {requirementsAnalysisResult && <RequirementsAnalysisDisplay results={requirementsAnalysisResult} />}
            {testCaseAnalysisResult && <TestCaseAnalysisDisplay results={testCaseAnalysisResult} />}
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import type { TestCaseAnalysis, TestCaseFeedback } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InfoIcon } from './icons/InfoIcon';
import { WarningIcon } from './icons/WarningIcon';
import { TestIcon } from './icons/TestIcon';

interface TestCaseAnalysisDisplayProps {
  results: TestCaseAnalysis;
}

const AccordionItem: React.FC<{ item: TestCaseFeedback }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg mb-4 overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.isClear 
                        ? <InfoIcon className="w-6 h-6 text-green-400 flex-shrink-0" /> 
                        : <WarningIcon className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    }
                    <p className="text-md text-slate-300 truncate">
                        <span className="font-semibold text-slate-400 mr-2">{item.originalId}:</span>
                        {item.originalDescription}
                    </p>
                </div>
                 <div className="flex items-center gap-3 ml-4">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ${item.isClear ? 'bg-green-900/70 text-green-300' : 'bg-amber-900/70 text-amber-300'}`}>
                        {item.isClear ? 'Clear' : 'Needs Improvement'}
                    </span>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-6 border-t border-slate-700 space-y-6">
                    {item.originalExpectedResult && (
                         <div>
                            <h4 className="text-lg font-bold text-slate-200 mb-3">Expected Result</h4>
                            <div className="bg-slate-900/50 p-4 rounded-md">
                                <p className="text-slate-300 whitespace-pre-wrap">{item.originalExpectedResult}</p>
                            </div>
                        </div>
                    )}
                    {!item.isClear && item.feedback && (
                         <div>
                            <h4 className="text-lg font-bold text-slate-200 mb-3">AI Feedback</h4>
                            <div className="bg-amber-900/30 border border-amber-800 text-amber-200 p-4 rounded-md">
                                <p>{item.feedback}</p>
                            </div>
                        </div>
                    )}
                     {item.isClear && (
                         <div>
                            <p className="text-slate-400 italic">This test case is clear and actionable. No feedback needed.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TestCaseAnalysisDisplay: React.FC<TestCaseAnalysisDisplayProps> = ({ results }) => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-4">Reviewed Test Cases</h3>
      {results.reviewedTestCases.map((item, index) => (
        <AccordionItem key={`${index}-${item.originalId}`} item={item} />
      ))}

      {results.suggestedMissingTestCases && results.suggestedMissingTestCases.length > 0 && (
        <div className="mt-12">
            <h3 className="flex items-center text-2xl font-bold text-white mb-4">
                <TestIcon className="w-7 h-7 mr-3 text-teal-400"/>
                Suggested Missing Test Cases
            </h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                    {results.suggestedMissingTestCases.map((scenario, index) => <li key={index}>{scenario}</li>)}
                </ul>
            </div>
        </div>
      )}
    </div>
  );
};

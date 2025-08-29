import React, { useState } from 'react';
import type { FormAnalysis, FormElement } from '../types';
import { RequirementIcon } from './icons/RequirementIcon';
import { TestIcon } from './icons/TestIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckCircleIcon, XCircleIcon } from './icons/StatusIcons';
import { UserIcon } from './icons/UserIcon';

interface ResultsDisplayProps {
  results: FormAnalysis;
}

const AccordionItem: React.FC<{ element: FormElement }> = ({ element }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg mb-4 overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
                <div className="flex items-center">
                    <span className="bg-teal-900 text-teal-300 text-xs font-semibold mr-3 px-2.5 py-0.5 rounded-full">{element.elementType}</span>
                    <h3 className="text-lg font-semibold text-white">{element.elementName}</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-6 border-t border-slate-700 space-y-6">
                    {element.userStory && (
                        <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><UserIcon className="w-6 h-6 mr-2 text-teal-400"/> User Story</h4>
                            <blockquote className="border-l-4 border-teal-500 pl-4 py-2 bg-slate-900/50 text-slate-300 italic">
                                {element.userStory}
                            </blockquote>
                        </div>
                    )}
                    <div>
                        <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><RequirementIcon className="w-6 h-6 mr-2 text-teal-400"/> Requirements</h4>
                        <ul className="list-disc list-inside space-y-2 text-slate-300">
                            {element.requirements.map((req, index) => <li key={index}>{req}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><TestIcon className="w-6 h-6 mr-2 text-teal-400"/> Test Scenarios</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 p-4 rounded-md">
                                <h5 className="flex items-center font-semibold text-green-400 mb-2"><CheckCircleIcon className="w-5 h-5 mr-2"/> Positive Tests</h5>
                                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                    {element.testScenarios.positive.map((scenario, index) => <li key={index}>{scenario}</li>)}
                                </ul>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-md">
                                <h5 className="flex items-center font-semibold text-red-400 mb-2"><XCircleIcon className="w-5 h-5 mr-2"/> Negative Tests</h5>
                                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                    {element.testScenarios.negative.map((scenario, index) => <li key={index}>{scenario}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    {element.gherkinTestScenarios && (
                        <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><TestIcon className="w-6 h-6 mr-2 text-teal-400"/> Gherkin Scenarios</h4>
                            <div className="bg-slate-900/50 p-4 rounded-md font-mono text-sm text-slate-300">
                                <pre className="whitespace-pre-wrap">{element.gherkinTestScenarios}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  return (
    <div>
      {results.map((element, index) => (
        <AccordionItem key={`${element.elementName}-${index}`} element={element} />
      ))}
    </div>
  );
};
import React, { useState } from 'react';
import type { RequirementsAnalysis, RequirementAnalysisResult, SuggestedRequirement } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckCircleIcon, XCircleIcon } from './icons/StatusIcons';
import { InfoIcon } from './icons/InfoIcon';
import { WarningIcon } from './icons/WarningIcon';
import { RequirementIcon } from './icons/RequirementIcon';
import { TestIcon } from './icons/TestIcon';
import { UserIcon } from './icons/UserIcon';

interface RequirementsAnalysisDisplayProps {
  results: RequirementsAnalysis;
}

const AccordionItem: React.FC<{ item: RequirementAnalysisResult }> = ({ item }) => {
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
                    <p className="text-md text-slate-300 truncate">{item.originalRequirement}</p>
                </div>
                 <div className="flex items-center gap-4 ml-4">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${item.isClear ? 'bg-green-900/70 text-green-300' : 'bg-amber-900/70 text-amber-300'}`}>
                        {item.isClear ? 'Clear' : 'Unclear'}
                    </span>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-6 border-t border-slate-700 space-y-6">
                    {!item.isClear && item.clarityFeedback && (
                         <div>
                            <h4 className="text-lg font-bold text-slate-200 mb-3">AI Feedback</h4>
                            <div className="bg-amber-900/30 border border-amber-800 text-amber-200 p-4 rounded-md">
                                <p>{item.clarityFeedback}</p>
                            </div>
                        </div>
                    )}
                     {item.isClear && item.userStory && (
                        <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><UserIcon className="w-6 h-6 mr-2 text-teal-400"/> User Story</h4>
                            <blockquote className="border-l-4 border-teal-500 pl-4 py-2 bg-slate-900/50 text-slate-300 italic">
                                {item.userStory}
                            </blockquote>
                        </div>
                    )}
                    {item.isClear && item.testScenarios && (
                         <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><TestIcon className="w-6 h-6 mr-2 text-teal-400"/> Test Scenarios</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/50 p-4 rounded-md">
                                    <h5 className="flex items-center font-semibold text-green-400 mb-2"><CheckCircleIcon className="w-5 h-5 mr-2"/> Positive Tests</h5>
                                    <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                        {item.testScenarios.positive.map((scenario, index) => <li key={index}>{scenario}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-md">
                                    <h5 className="flex items-center font-semibold text-red-400 mb-2"><XCircleIcon className="w-5 h-5 mr-2"/> Negative Tests</h5>
                                    <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                        {item.testScenarios.negative.map((scenario, index) => <li key={index}>{scenario}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    {item.isClear && item.gherkinTestScenarios && (
                        <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><TestIcon className="w-6 h-6 mr-2 text-teal-400"/> Gherkin Scenarios</h4>
                            <div className="bg-slate-900/50 p-4 rounded-md font-mono text-sm text-slate-300">
                                <pre className="whitespace-pre-wrap">{item.gherkinTestScenarios}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SuggestedRequirementAccordionItem: React.FC<{ item: SuggestedRequirement }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg mb-4 overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <RequirementIcon className="w-6 h-6 text-teal-400 flex-shrink-0" />
                    <p className="text-md text-slate-300 truncate">{item.requirementDescription}</p>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-6 border-t border-slate-700 space-y-6">
                    {item.userStory && (
                        <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><UserIcon className="w-6 h-6 mr-2 text-teal-400"/> User Story</h4>
                            <blockquote className="border-l-4 border-teal-500 pl-4 py-2 bg-slate-900/50 text-slate-300 italic">
                                {item.userStory}
                            </blockquote>
                        </div>
                    )}
                    <div>
                        <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><TestIcon className="w-6 h-6 mr-2 text-teal-400"/> Test Scenarios</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 p-4 rounded-md">
                                <h5 className="flex items-center font-semibold text-green-400 mb-2"><CheckCircleIcon className="w-5 h-5 mr-2"/> Positive Tests</h5>
                                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                    {item.testScenarios.positive.map((scenario, index) => <li key={index}>{scenario}</li>)}
                                </ul>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-md">
                                <h5 className="flex items-center font-semibold text-red-400 mb-2"><XCircleIcon className="w-5 h-5 mr-2"/> Negative Tests</h5>
                                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                    {item.testScenarios.negative.map((scenario, index) => <li key={index}>{scenario}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    {item.gherkinTestScenarios && (
                        <div>
                            <h4 className="flex items-center text-xl font-bold text-slate-200 mb-3"><TestIcon className="w-6 h-6 mr-2 text-teal-400"/> Gherkin Scenarios</h4>
                            <div className="bg-slate-900/50 p-4 rounded-md font-mono text-sm text-slate-300">
                                <pre className="whitespace-pre-wrap">{item.gherkinTestScenarios}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export const RequirementsAnalysisDisplay: React.FC<RequirementsAnalysisDisplayProps> = ({ results }) => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-4">Analyzed Requirements</h3>
      {results.analyzedRequirements.map((item, index) => (
        <AccordionItem key={`${index}-${item.originalRequirement.slice(0, 10)}`} item={item} />
      ))}
      {results.suggestedMissingRequirements && results.suggestedMissingRequirements.length > 0 && (
        <div className="mt-12">
            <h3 className="flex items-center text-2xl font-bold text-white mb-4">
                <RequirementIcon className="w-7 h-7 mr-3 text-teal-400"/>
                Suggested Missing Requirements
            </h3>
            {results.suggestedMissingRequirements.map((item, index) => (
                 <SuggestedRequirementAccordionItem key={`${index}-${item.requirementDescription.slice(0, 10)}`} item={item} />
            ))}
        </div>
      )}
    </div>
  );
};
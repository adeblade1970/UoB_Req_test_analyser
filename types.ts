export interface FormElement {
  elementName: string;
  elementType: 'InputField' | 'Button' | 'Checkbox' | 'Dropdown' | 'Radio' | 'TextArea' | 'Link' | 'Other';
  userStory: string;
  requirements: string[];
  testScenarios: {
    positive: string[];
    negative: string[];
  };
  gherkinTestScenarios: string;
}

export type FormAnalysis = FormElement[];

export interface RequirementAnalysisResult {
  originalRequirement: string;
  isClear: boolean;
  clarityFeedback: string | null;
  userStory: string | null;
  testScenarios: {
    positive: string[];
    negative: string[];
  } | null;
  gherkinTestScenarios: string | null;
}

export interface SuggestedRequirement {
  requirementDescription: string;
  userStory: string;
  testScenarios: {
    positive: string[];
    negative: string[];
  };
  gherkinTestScenarios: string;
}

export interface RequirementsAnalysis {
  analyzedRequirements: RequirementAnalysisResult[];
  suggestedMissingRequirements: SuggestedRequirement[];
}

export interface TestCase {
  id: string;
  description: string;
  expectedResult?: string;
}

export interface TestCaseFeedback {
  originalId: string;
  originalDescription: string;
  originalExpectedResult?: string;
  isClear: boolean;
  feedback: string | null;
}

export interface TestCaseAnalysis {
  reviewedTestCases: TestCaseFeedback[];
  suggestedMissingTestCases: string[];
}
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { FormAnalysis, RequirementsAnalysis, TestCase, TestCaseAnalysis } from '../types';

// --- START: API Configuration ---
// To use a different AI API, update the values below and modify the API calling functions.

// Your AI API provider's base URL.
// For Google Gemini, this is handled by the SDK. For other providers, this would be their main API endpoint.
const API_BASE_URL = 'https://generativelanguage.googleapis.com'; // Example: For OpenAI, this might be 'https://api.openai.com/v1'

// Your API key. It is strongly recommended to use environment variables for security.
const API_KEY = process.env.API_KEY;

// --- END: API Configuration ---


if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. Please configure it in your environment.");
}


// --- START: Gemini SDK Initialization ---
// If you switch to another provider, you would replace this section 
// with your new provider's SDK initialization or a generic fetch client setup.
const ai = new GoogleGenAI({ apiKey: API_KEY });
// --- END: Gemini SDK Initialization ---


// Schema for Form Analysis from Screenshot
const formAnalysisSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      elementName: {
        type: Type.STRING,
        description: 'The visible label or name of the form element (e.g., "First Name", "Submit Button"). Infer a name if not present.'
      },
      elementType: {
        type: Type.STRING,
        enum: ['InputField', 'Button', 'Checkbox', 'Dropdown', 'Radio', 'TextArea', 'Link', 'Other'],
        description: 'The type of the form element.'
      },
      userStory: {
        type: Type.STRING,
        description: 'A concise user story for this element in the format: "As a [user type], I want to [action] so that [benefit]."'
      },
      requirements: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of 2-4 key functional requirements for this element. For example, for an email field: "Must be a valid email format", "This field is required". For a link: "Must navigate to the contact page".'
      },
      testScenarios: {
        type: Type.OBJECT,
        properties: {
          positive: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of 2-3 positive test cases for valid inputs and expected successful outcomes.'
          },
          negative: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of 2-3 negative test cases for invalid inputs and expected error-handling.'
          }
        }
      },
      gherkinTestScenarios: {
          type: Type.STRING,
          description: 'A set of BDD test scenarios written in Gherkin syntax (Feature, Scenario, Given, When, Then). Combine them into a single string with appropriate line breaks.'
      }
    }
  }
};

const formAnalysisPrompt = `
You are an expert Senior Business Analyst and QA Engineer. Your task is to analyze the provided screenshot of a web page. 
Identify every interactive element. This includes all form elements (input fields, text areas, dropdowns, checkboxes, radio buttons, action buttons) AND all hyperlinks (<a> tags).

For each element you identify, perform the following:
1.  **Identify Name and Type**: Determine the element's visible text or label (e.g., "Email Address", "Contact Us") and classify its type (e.g., "InputField", "Button", "Link").
2.  **Generate a User Story**: Write a concise user story for the element's primary function. Follow the format: "As a [user type], I want to [action] so that [benefit]."
3.  **Generate Requirements**: Write clear, concise functional requirements.
    *   For form elements, this includes validation, state changes, etc.
    *   For links, this includes the expected destination URL or page section, and if it should open in a new tab.
4.  **Generate Test Scenarios**: Create both positive (happy path) and negative (error path) test scenarios.
    *   For form elements, this covers valid/invalid inputs.
    *   For links, a positive test is verifying it navigates correctly, and a negative test could be checking for broken links (404s).
5.  **Generate Gherkin Scenarios**: Based on the requirements, write detailed BDD test scenarios using Gherkin syntax. Include at least one positive and one negative scenario. Combine these into a single string using newline characters for formatting.

Provide the final output *only* in a structured JSON format that strictly adheres to the provided schema. Do not include any explanatory text or markdown formatting outside of the JSON structure.
`;

export const generateFormAnalysis = async (imageBase64: string): Promise<FormAnalysis> => {
  const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } };
  const textPart = { text: formAnalysisPrompt };
  
  try {
    // --- START: API Call Logic for Form Analysis ---
    // This section uses the Google Gemini SDK. To switch providers, you would replace this block
    // with a `fetch` call to your new API endpoint (using API_BASE_URL and API_KEY).
    // You would need to:
    // 1. Construct the correct headers (e.g., 'Authorization': `Bearer ${API_KEY}`).
    // 2. Adapt the request body (prompt, image data, schema) to match the new API's requirements.
    // 3. Await the response and parse its body to fit the `FormAnalysis` type.

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: formAnalysisSchema,
        temperature: 0.2,
      },
    });

    const parsedJson = JSON.parse(response.text.trim());
    if (!Array.isArray(parsedJson)) {
        throw new Error("API response is not in the expected array format.");
    }
    return parsedJson as FormAnalysis;
    // --- END: API Call Logic for Form Analysis ---

  } catch (error) {
    console.error("Error calling AI API for form analysis:", error);
    throw new Error("Failed to get a valid response from the AI API.");
  }
};


// Schema for Requirements Analysis from Text
const requirementsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    analyzedRequirements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalRequirement: {
            type: Type.STRING,
            description: 'The exact requirement text that was analyzed.'
          },
          isClear: {
            type: Type.BOOLEAN,
            description: 'True if the requirement is clear, specific, unambiguous, and testable. False otherwise.'
          },
          clarityFeedback: {
            type: Type.STRING,
            description: 'If unclear, provide a brief, constructive reason. Should be null if the requirement is clear.'
          },
          userStory: {
            type: Type.STRING,
            nullable: true,
            description: 'A concise user story generated from the requirement, in the format: "As a [user type], I want to [action] so that [benefit]." Should be null if the requirement is unclear.'
          },
          testScenarios: {
            type: Type.OBJECT,
            nullable: true,
            description: 'Generated test scenarios. Should be null if the requirement is unclear.',
            properties: {
              positive: { type: Type.ARRAY, items: { type: Type.STRING } },
              negative: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          gherkinTestScenarios: {
            type: Type.STRING,
            nullable: true,
            description: 'A set of BDD test scenarios written in Gherkin syntax. Combine them into a single string with appropriate line breaks. Should be null if the requirement is unclear.'
          }
        },
        required: ["originalRequirement", "isClear", "clarityFeedback", "userStory", "testScenarios", "gherkinTestScenarios"]
      }
    },
    suggestedMissingRequirements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          requirementDescription: {
            type: Type.STRING,
            description: "A clear, concise description of a new, suggested requirement."
          },
          userStory: {
            type: Type.STRING,
            description: 'A concise user story for the suggested requirement, in the format: "As a [user type], I want to [action] so that [benefit]."'
          },
          testScenarios: {
            type: Type.OBJECT,
            properties: {
              positive: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Positive test scenarios for the suggested requirement.' },
              negative: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Negative test scenarios for the suggested requirement.' }
            }
          },
          gherkinTestScenarios: {
            type: Type.STRING,
            description: 'A set of BDD test scenarios for the suggested requirement written in Gherkin syntax. Combine them into a single string with appropriate line breaks.'
          }
        },
        required: ["requirementDescription", "userStory", "testScenarios", "gherkinTestScenarios"]
      }
    }
  },
  required: ["analyzedRequirements", "suggestedMissingRequirements"]
};


const requirementsAnalysisPrompt = `
You are an expert QA Engineer and Senior Business Analyst specializing in software requirements. Your task is to analyze a list of functional requirements.

Your analysis must have two parts:
1.  **Analyze Existing Requirements**: For each requirement in the provided list:
    *   **Evaluate Clarity**: Determine if the requirement is clear, specific, unambiguous, and testable. It should not be vague or open to interpretation.
    *   **Provide Feedback**: If the requirement is UNCLEAR, provide a brief, constructive reason. If it is CLEAR, this field must be null.
    *   **Generate a User Story**: If and only if the requirement is CLEAR, generate a concise user story in the format: 'As a [user type], I want to [action] so that [benefit].'. If the requirement is UNCLEAR, this field must be null.
    *   **Generate Test Scenarios**: If and only if the requirement is CLEAR, generate 2-3 positive (happy path) and 2-3 negative (error/edge case) test scenarios. If the requirement is UNCLEAR, this field must be null.
    *   **Generate Gherkin Scenarios**: If the requirement is CLEAR, write detailed BDD test scenarios using Gherkin syntax. Combine these into a single string. If the requirement is UNCLEAR, this field must be null.
    *   The 'originalRequirement' in your response MUST EXACTLY MATCH the requirement text provided in the input.

2.  **Suggest Missing Requirements**: After reviewing all the individual requirements, analyze the suite as a whole. Identify potential gaps in functionality. This includes missing:
    *   Negative scenarios or error handling requirements.
    *   Edge case requirements (e.g., handling zero items, maximum limits).
    *   Related user actions or features that are commonly expected but not mentioned.
    *   Based on your analysis, create a list of new, suggested requirement descriptions.
    *   For each new suggested requirement, also generate a user story, a set of positive and negative test scenarios, and a corresponding set of Gherkin scenarios.
    *   If no gaps are found, 'suggestedMissingRequirements' can be an empty array.

Return a single JSON object that strictly adheres to the provided JSON schema. Do not include any explanatory text or markdown.
`;

export const analyzeRequirements = async (requirements: string[]): Promise<RequirementsAnalysis> => {
  const fullPrompt = `${requirementsAnalysisPrompt}\n\nAnalyze the following requirements:\n${JSON.stringify(requirements)}`;
  
  try {
    // --- START: API Call Logic for Requirements Analysis ---
    // To switch providers, replace this block with a `fetch` call to your new API endpoint.
    // Adapt the headers, body, and response parsing as needed.

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: requirementsAnalysisSchema,
        temperature: 0.3,
      },
    });
    
    const parsedJson = JSON.parse(response.text.trim());
    if (typeof parsedJson !== 'object' || parsedJson === null || !('analyzedRequirements' in parsedJson) || !('suggestedMissingRequirements' in parsedJson)) {
        throw new Error("API response is not in the expected object format with 'analyzedRequirements' and 'suggestedMissingRequirements' keys.");
    }
    return parsedJson as RequirementsAnalysis;
    // --- END: API Call Logic for Requirements Analysis ---

  } catch (error) {
    console.error("Error calling AI API for requirements analysis:", error);
    throw new Error("Failed to get a valid response from the AI API.");
  }
};

// Schema for Test Case Analysis
const testCaseAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    reviewedTestCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalId: { type: Type.STRING, description: "The original ID of the test case being reviewed." },
          originalDescription: { type: Type.STRING, description: "The original description of the test case." },
          originalExpectedResult: { type: Type.STRING, nullable: true, description: "The original expected results description for the test case, if provided." },
          isClear: { type: Type.BOOLEAN, description: "True if the test case is clear, atomic, and actionable. False otherwise." },
          feedback: { type: Type.STRING, nullable: true, description: "Constructive feedback if the test case is unclear or can be improved. Null if it's clear." }
        },
        required: ["originalId", "originalDescription", "isClear", "feedback"]
      }
    },
    suggestedMissingTestCases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of new test case descriptions for scenarios that seem to be missing from the provided set."
    }
  },
  required: ["reviewedTestCases", "suggestedMissingTestCases"]
};

const testCaseAnalysisPrompt = `
You are a world-class Senior QA Lead with a specialization in test case design and analysis. Your task is to review a provided suite of test cases.

Your analysis must have two parts:
1.  **Review Existing Test Cases**: For each individual test case provided, evaluate it based on the following criteria:
    *   **Clarity**: Is the description unambiguous?
    *   **Atomicity**: Does it test a single, specific piece of functionality?
    *   **Actionability**: Does it contain clear steps and an expected result?
    *   **Context**: If an optional 'expectedResult' field is provided, consider it. Does the description logically lead to this expected result? Is the expected result itself clear and verifiable?
    *   Based on your evaluation, set 'isClear' to true or false.
    *   If 'isClear' is false, provide brief, constructive 'feedback' on how to improve it. If it's clear, 'feedback' must be null.
    *   The 'originalId', 'originalDescription', and 'originalExpectedResult' in your response must exactly match the input.

2.  **Identify Gaps**: After reviewing all the individual cases, analyze the suite as a whole. Identify any potential gaps in test coverage. This includes missing:
    *   Negative scenarios (e.g., invalid inputs, error conditions).
    *   Edge cases (e.g., boundary values, empty fields).
    *   Accessibility, performance, or security checks if relevant from context.
    *   Create a list of new test case descriptions for these identified gaps and put them in 'suggestedMissingTestCases'. If no gaps are found, this can be an empty array.

Provide the final output *only* in a structured JSON format that strictly adheres to the provided schema. Do not include any explanatory text or markdown.
`;

export const analyzeTestCases = async (testCases: TestCase[]): Promise<TestCaseAnalysis> => {
  const fullPrompt = `${testCaseAnalysisPrompt}\n\nReview the following test cases:\n${JSON.stringify(testCases)}`;
  
  try {
    // --- START: API Call Logic for Test Case Analysis ---
    // To switch providers, replace this block with a `fetch` call to your new API endpoint.
    // Adapt the headers, body, and response parsing as needed.

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: testCaseAnalysisSchema,
        temperature: 0.4,
      },
    });
    
    const parsedJson = JSON.parse(response.text.trim());
    return parsedJson as TestCaseAnalysis;
    // --- END: API Call Logic for Test Case Analysis ---

  } catch (error) {
    console.error("Error calling AI API for test case analysis:", error);
    throw new Error("Failed to get a valid response from the AI API.");
  }
};
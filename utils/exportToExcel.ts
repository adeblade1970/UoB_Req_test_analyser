import * as XLSX from 'xlsx';
import type { FormAnalysis, RequirementsAnalysis, TestCaseAnalysis } from '../types';

const fitCols = (ws: XLSX.WorkSheet) => {
    if (!ws['!ref']) return;
    const objectMaxLength: { wch: number }[] = [];
    const range = XLSX.utils.decode_range(ws['!ref']);
    // Get header widths
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: range.s.r };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (ws[cell_ref]) {
            const header_w = (ws[cell_ref].v?.toString() ?? '').length;
            objectMaxLength.push({ wch: header_w + 2 });
        }
    }
    // Get content widths
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (ws[cell_ref]) {
                const lines = (ws[cell_ref].v?.toString() ?? '').split('\n');
                const max_w = lines.reduce((acc, line) => Math.max(acc, line.length), 0);
                if (objectMaxLength[C].wch < max_w + 2) {
                    objectMaxLength[C].wch = max_w + 2;
                }
            }
        }
    }
    ws['!cols'] = objectMaxLength;
};


export const exportFormAnalysisToExcel = (analysis: FormAnalysis, fileName: string = 'UoB_QA_Form_Analysis.xlsx') => {
  const requirementsData: object[] = [];
  const testsData: object[] = [];
  const gherkinData: object[] = [];

  analysis.forEach((element, elementIndex) => {
    const elementId = String(elementIndex + 1).padStart(2, '0');

    if (element.gherkinTestScenarios) {
      gherkinData.push({
        'Element ID': `E-${elementId}`,
        'Element Name': element.elementName,
        'Gherkin Scenarios': element.gherkinTestScenarios,
      });
    }

    if (element.requirements && element.requirements.length > 0) {
      element.requirements.forEach((req, reqIndex) => {
        const reqId = `REQ-${elementId}-${String(reqIndex + 1).padStart(2, '0')}`;
        
        requirementsData.push({
          'Requirement ID': reqId,
          'Element Name': element.elementName,
          'Element Type': element.elementType,
          'User Story': element.userStory || '',
          'Requirement Description': req,
        });

        if (element.testScenarios) {
          let positiveTestIndex = 1;
          element.testScenarios.positive.forEach(test => {
            const testId = `TC-${reqId}-P${String(positiveTestIndex++).padStart(2, '0')}`;
            testsData.push({ 'Test Case ID': testId, 'Requirement ID': reqId, 'Element Name': element.elementName, 'Test Type': 'Positive', 'Test Scenario Description': test });
          });

          let negativeTestIndex = 1;
          element.testScenarios.negative.forEach(test => {
            const testId = `TC-${reqId}-N${String(negativeTestIndex++).padStart(2, '0')}`;
            testsData.push({ 'Test Case ID': testId, 'Requirement ID': reqId, 'Element Name': element.elementName, 'Test Type': 'Negative', 'Test Scenario Description': test });
          });
        }
      });
    }
  });

  const wsReqs = XLSX.utils.json_to_sheet(requirementsData);
  const wsTests = XLSX.utils.json_to_sheet(testsData);
  
  fitCols(wsReqs);
  fitCols(wsTests);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsReqs, 'Requirements');
  XLSX.utils.book_append_sheet(wb, wsTests, 'Test Scenarios');

  if (gherkinData.length > 0) {
    const wsGherkin = XLSX.utils.json_to_sheet(gherkinData);
    fitCols(wsGherkin);
    XLSX.utils.book_append_sheet(wb, wsGherkin, 'Gherkin Scenarios');
  }

  XLSX.writeFile(wb, fileName);
};

export const exportRequirementsAnalysisToExcel = (analysis: RequirementsAnalysis, fileName: string = 'UoB_QA_Requirements_Analysis.xlsx') => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Analyzed Requirements
  const analyzedData = analysis.analyzedRequirements.map(item => ({
    'Original Requirement': item.originalRequirement,
    'User Story': item.userStory || '',
    'Clarity Status': item.isClear ? 'Clear' : 'Unclear',
    'AI Feedback': item.clarityFeedback || '',
    'Positive Test Scenarios': item.testScenarios?.positive.join('\n') || '',
    'Negative Test Scenarios': item.testScenarios?.negative.join('\n') || '',
  }));
  const wsAnalyzed = XLSX.utils.json_to_sheet(analyzedData);
  fitCols(wsAnalyzed);
  XLSX.utils.book_append_sheet(wb, wsAnalyzed, 'Analyzed Requirements');

  // Gherkin Data from both analyzed and suggested
  const gherkinData: object[] = [];

  analysis.analyzedRequirements.forEach((item, index) => {
    if (item.isClear && item.gherkinTestScenarios) {
      gherkinData.push({
        'Requirement ID': `AR-${String(index + 1).padStart(2, '0')}`,
        'Requirement Type': 'Analyzed',
        'Requirement Description': item.originalRequirement,
        'Gherkin Scenarios': item.gherkinTestScenarios,
      });
    }
  });
  
  // Sheet 2: Suggested Missing Requirements (if any)
  if (analysis.suggestedMissingRequirements && analysis.suggestedMissingRequirements.length > 0) {
    const suggestedData = analysis.suggestedMissingRequirements.map(item => ({
      'Suggested Requirement': item.requirementDescription,
      'User Story': item.userStory,
      'Positive Test Scenarios': item.testScenarios.positive.join('\n'),
      'Negative Test Scenarios': item.testScenarios.negative.join('\n'),
    }));
    const wsSuggested = XLSX.utils.json_to_sheet(suggestedData);
    fitCols(wsSuggested);
    XLSX.utils.book_append_sheet(wb, wsSuggested, 'Suggested Requirements');
    
    analysis.suggestedMissingRequirements.forEach((item, index) => {
      if (item.gherkinTestScenarios) {
        gherkinData.push({
          'Requirement ID': `SR-${String(index + 1).padStart(2, '0')}`,
          'Requirement Type': 'Suggested',
          'Requirement Description': item.requirementDescription,
          'Gherkin Scenarios': item.gherkinTestScenarios,
        });
      }
    });
  }
  
  // Sheet 3: Gherkin Scenarios (if any)
  if (gherkinData.length > 0) {
    const wsGherkin = XLSX.utils.json_to_sheet(gherkinData);
    fitCols(wsGherkin);
    XLSX.utils.book_append_sheet(wb, wsGherkin, 'Gherkin Scenarios');
  }

  XLSX.writeFile(wb, fileName);
};


export const exportTestCaseAnalysisToExcel = (analysis: TestCaseAnalysis, fileName: string = 'UoB_QA_TestCase_Analysis.xlsx') => {
  // Sheet 1: Reviewed Test Cases
  const reviewedData = analysis.reviewedTestCases.map(item => ({
    'Original Test Case ID': item.originalId,
    'Original Test Case Description': item.originalDescription,
    'Clarity Status': item.isClear ? 'Clear' : 'Needs Improvement',
    'AI Feedback': item.feedback || '',
  }));
  const wsReviewed = XLSX.utils.json_to_sheet(reviewedData);
  fitCols(wsReviewed);

  // Sheet 2: Suggested Missing Test Cases
  const suggestedData = analysis.suggestedMissingTestCases.map(description => ({
    'Suggested Test Scenario': description,
  }));
  const wsSuggested = XLSX.utils.json_to_sheet(suggestedData);
  fitCols(wsSuggested);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsReviewed, 'Reviewed Test Cases');
  XLSX.utils.book_append_sheet(wb, wsSuggested, 'Suggested Missing Cases');
  XLSX.writeFile(wb, fileName);
};
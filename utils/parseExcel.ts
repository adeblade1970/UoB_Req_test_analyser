import * as XLSX from 'xlsx';
import type { TestCase } from '../types';

export const parseRequirementsFromExcel = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          resolve([]);
          return;
        }

        const headers = Object.keys(json[0]);
        const requirementAliases = [
            'requirement description', 
            'requirement', 
            'requirements', 
            'description', 
            'user story', 
            'feature', 
            'specification'
        ];
        const requirementHeader = headers.find(h => requirementAliases.includes(h.trim().toLowerCase()));

        if (!requirementHeader) {
          const foundHeaders = headers.join("', '");
          return reject(new Error(`Could not find a requirements column (e.g., 'Requirement', 'Description'). Headers found: ['${foundHeaders}'].`));
        }

        const requirements = json
          .map(row => row[requirementHeader])
          .filter((req): req is string => typeof req === 'string' && req.trim() !== '');
        
        resolve(requirements);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseTestCasesFromExcel = (file: File): Promise<TestCase[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          resolve([]);
          return;
        }

        const headers = Object.keys(json[0]);
        const idAliases = ['test case id', 'id', 'test id', 'case id'];
        const descriptionAliases = ['test case description', 'description', 'test description', 'scenario', 'test scenario', 'test case'];
        const expectedResultAliases = ['expected result', 'expected results', 'expected', 'expected outcome', 'expected results description'];

        const idHeader = headers.find(h => idAliases.includes(h.trim().toLowerCase()));
        const descriptionHeader = headers.find(h => descriptionAliases.includes(h.trim().toLowerCase()));
        const expectedResultHeader = headers.find(h => expectedResultAliases.includes(h.trim().toLowerCase())); // Optional

        if (!idHeader || !descriptionHeader) {
          const foundHeaders = headers.join("', '");
          const missing = [];
          if (!idHeader) missing.push("an ID column (e.g., 'Test Case ID')");
          if (!descriptionHeader) missing.push("a Description column (e.g., 'Scenario')");

          return reject(new Error(`Could not find ${missing.join(' and ')}. Headers found: ['${foundHeaders}'].`));
        }

        const testCases = json
          .map(row => ({
            id: String(row[idHeader] ?? ''),
            description: String(row[descriptionHeader] ?? ''),
            expectedResult: expectedResultHeader ? String(row[expectedResultHeader] ?? '') : undefined,
          }))
          .filter(tc => tc.id.trim() !== '' && tc.description.trim() !== '');
        
        resolve(testCases);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
import { google } from 'googleapis';

export interface SheetData {
  sheetName: string;
  data: any[][];
}

export async function getGoogleSheetsData(sheetId: string, excludeTabs: string[] = []): Promise<SheetData[]> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  
  const sheetData: SheetData[] = [];

  if (spreadsheet.data.sheets) {
    for (const sheet of spreadsheet.data.sheets) {
      const sheetTitle = sheet.properties?.title || '';
      
      if (excludeTabs.includes(sheetTitle)) {
        continue;
      }

      const range = `${sheetTitle}!A:Z`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      sheetData.push({
        sheetName: sheetTitle,
        data: response.data.values || [],
      });
    }
  }

  return sheetData;
}

export async function getAllSheetsData(): Promise<Record<string, SheetData[]>> {
  const sheetIds = process.env.GOOGLE_SHEETS_IDS?.split(',') || [];
  const excludeTabs = process.env.GOOGLE_SHEETS_EXCLUDE_TABS?.split(',') || [];
  
  const allData: Record<string, SheetData[]> = {};

  for (const sheetId of sheetIds) {
    const trimmedId = sheetId.trim();
    if (trimmedId) {
      allData[trimmedId] = await getGoogleSheetsData(trimmedId, excludeTabs);
    }
  }

  return allData;
}










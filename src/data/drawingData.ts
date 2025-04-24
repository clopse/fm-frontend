// src/data/drawingData.ts

export interface DrawingFile {
    name: string;
  }
  
  export interface HotelDrawingData {
    folders: Record<string, DrawingFile[]>;
  }
  
  export const drawingData: Record<string, HotelDrawingData> = {
    hiex: {
      folders: {
        fire: [
          { name: 'FireEvac_Level01.pdf' },
          { name: 'FireExit_RoofPlan.pdf' },
        ],
        electrical: [{ name: 'Panel_Lv01.pdf' }],
        plumbing: [],
      },
    },
    moxy: {
      folders: {
        fire: [{ name: 'Fire_Escape_01.pdf' }],
        hvac: [{ name: 'DuctPlan_Level02.pdf' }],
      },
    },
  };
  
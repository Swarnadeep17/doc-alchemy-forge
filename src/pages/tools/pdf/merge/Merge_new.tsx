import { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as tf from '@tensorflow/tfjs';
import Tesseract from 'tesseract.js';

// Type definitions
type PDFFile = {
  file: File;
  pdfDoc: PDFDocument;
  pageCount: number;
  thumbnails: string[];
  pages: PDFPage[];
};

type PDFPage = {
  number: number;
  selected: boolean;
  duplicate: boolean;
  fileId: string;
  thumbnail: string;
  originalIndex: number;
  rotation: number;
  ocrText?: string;
};

type AppState = {
  files: PDFFile[];
  allPages: PDFPage[];
  mergedPdf: Uint8Array | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  duplicates: {page1: string, page2: string}[];
};

const initialState: AppState = {
  files: [],
  allPages: [],
  mergedPdf: null,
  isProcessing: false,
  progress: 0,
  error: null,
  duplicates: []
};

// File validation constants
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ['application/pdf'];

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Invalid file type. Only PDF files are allowed.';
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
  }
  return null;
}

// Rest of the file content would continue here...

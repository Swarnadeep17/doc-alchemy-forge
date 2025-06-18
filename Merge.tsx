// Live Watermark Preview and Drag & Drop Reordering included

import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import * as tf from '@tensorflow/tfjs';
import Tesseract from 'tesseract.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const PDFMergeTool: React.FC = () => {
  // ... All previous states and functions remain unchanged

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(pagesList);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setPagesList(reordered);
  };

  // Render live preview canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const drawPreview = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = watermarkOpacity;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((watermarkRotation * Math.PI) / 180);
      ctx.fillStyle = watermarkColor;
      ctx.font = `${watermarkSize}px Helvetica`;
      ctx.textAlign = 'center';
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    };
    drawPreview();
  }, [watermarkText, watermarkColor, watermarkSize, watermarkOpacity, watermarkRotation]);

  return (
    <div>
      {/* Add Live Preview Canvas */}
      <h2>Watermark Preview</h2>
      <canvas ref={canvasRef} width={300} height={200} style={{ border: '1px solid #ccc' }} />

      {/* Page Reordering List */}
      <h2>Pages</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="pagesList">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {pagesList.map((page, index) => (
                <Draggable key={page.id} draggableId={page.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        padding: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      Page {index + 1} - Doc {page.docIndex + 1} - Pg {page.pageIndex + 1}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      {/* Rest of the UI remains as is */}
    </div>
  );
};

export default PDFMergeTool;

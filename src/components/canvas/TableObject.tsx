'use client';

import { useRef, useState, useCallback } from 'react';
import { CanvasObject, ObjectMetadata } from '@/types/canvas';

interface TableObjectProps {
  object: CanvasObject;
  isSelected: boolean;
  onUpdate: (partial: Partial<CanvasObject>) => void;
}

export default function TableObject({ object, isSelected, onUpdate }: TableObjectProps) {
  const tableData = object.metadata?.tableData;
  const rows = tableData?.rows ?? 3;
  const cols = tableData?.cols ?? 3;
  const cells = tableData?.cells ?? Array.from({ length: rows }, () => Array(cols).fill(''));
  const headers = tableData?.headers ?? Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
  const cellStyles = tableData?.cellStyles ?? {};

  const defaultColWidth = object.width / cols;
  const colWidths = tableData?.colWidths ?? Array(cols).fill(defaultColWidth);

  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // Ref for column resize drag state (direct DOM mutation, commit on pointerup)
  const resizeDragRef = useRef<{
    colIndex: number;
    startX: number;
    startWidth: number;
    allWidths: number[];
  } | null>(null);

  function updateTableData(patch: Partial<NonNullable<ObjectMetadata['tableData']>>) {
    const merged = { ...object.metadata?.tableData, ...patch };
    onUpdate({
      metadata: {
        ...object.metadata,
        tableData: merged as NonNullable<ObjectMetadata['tableData']>,
      },
    });
  }

  // --- Header update ---
  const handleHeaderBlur = useCallback(
    (colIndex: number, value: string) => {
      const newHeaders = [...headers];
      newHeaders[colIndex] = value;
      updateTableData({ headers: newHeaders });
    },
    [headers, updateTableData]
  );

  // --- Cell update ---
  const handleCellBlur = useCallback(
    (row: number, col: number, value: string) => {
      const newCells = cells.map((r) => [...r]);
      newCells[row][col] = value;
      updateTableData({ cells: newCells });
    },
    [cells, updateTableData]
  );

  // --- Cell style: bold toggle ---
  const toggleBold = useCallback(
    (row: number, col: number) => {
      const key = `${row}-${col}`;
      const current = cellStyles[key] ?? {};
      const newStyles = { ...cellStyles, [key]: { ...current, bold: !current.bold } };
      updateTableData({ cellStyles: newStyles });
    },
    [cellStyles, updateTableData]
  );

  // --- Row add/remove ---
  const addRow = useCallback(() => {
    const newCells = [...cells, Array(cols).fill('')];
    updateTableData({ cells: newCells, rows: rows + 1 });
  }, [cells, cols, rows, updateTableData]);

  const removeRow = useCallback(() => {
    if (rows <= 1) return;
    const newCells = cells.slice(0, -1);
    updateTableData({ cells: newCells, rows: rows - 1 });
  }, [cells, rows, updateTableData]);

  // --- Col add/remove ---
  const addCol = useCallback(() => {
    const newCells = cells.map((row) => [...row, '']);
    const newHeaders = [...headers, `Column ${cols + 1}`];
    const newColWidths = [...colWidths, defaultColWidth];
    updateTableData({ cells: newCells, headers: newHeaders, cols: cols + 1, colWidths: newColWidths });
  }, [cells, headers, cols, colWidths, defaultColWidth, updateTableData]);

  const removeCol = useCallback(() => {
    if (cols <= 1) return;
    const newCells = cells.map((row) => row.slice(0, -1));
    const newHeaders = headers.slice(0, -1);
    const newColWidths = colWidths.slice(0, -1);
    updateTableData({ cells: newCells, headers: newHeaders, cols: cols - 1, colWidths: newColWidths });
  }, [cells, headers, cols, colWidths, updateTableData]);

  // --- Column resize ---
  const handleColResizeMouseDown = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      e.stopPropagation();
      e.preventDefault();
      resizeDragRef.current = {
        colIndex,
        startX: e.clientX,
        startWidth: colWidths[colIndex],
        allWidths: [...colWidths],
      };

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeDragRef.current) return;
        const dx = moveEvent.clientX - resizeDragRef.current.startX;
        const newWidth = Math.max(40, resizeDragRef.current.startWidth + dx);
        resizeDragRef.current.allWidths[colIndex] = newWidth;
        // Update col width visually via direct DOM — commit on mouseup
        const thCells = document.querySelectorAll<HTMLElement>(
          `[data-table-id="${object.id}"] th[data-col="${colIndex}"]`
        );
        thCells.forEach((th) => {
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;
        });
        const tdCells = document.querySelectorAll<HTMLElement>(
          `[data-table-id="${object.id}"] td[data-col="${colIndex}"]`
        );
        tdCells.forEach((td) => {
          td.style.width = `${newWidth}px`;
          td.style.minWidth = `${newWidth}px`;
        });
      };

      const onMouseUp = () => {
        if (resizeDragRef.current) {
          updateTableData({ colWidths: [...resizeDragRef.current.allWidths] });
          resizeDragRef.current = null;
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [colWidths, object.id, updateTableData]
  );

  // Auto-resize textarea
  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div
      data-table-id={object.id}
      className="w-full h-full overflow-auto bg-white rounded text-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating bold toolbar for focused cell */}
      {focusedCell !== null && (
        <div
          className="sticky top-0 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded shadow-sm px-1 py-0.5 w-fit"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBold(focusedCell.row, focusedCell.col);
            }}
            className={`px-1.5 py-0.5 text-xs font-bold rounded transition-colors ${
              cellStyles[`${focusedCell.row}-${focusedCell.col}`]?.bold
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Toggle bold"
          >
            B
          </button>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header, colIndex) => (
              <th
                key={colIndex}
                data-col={colIndex}
                className="bg-gray-100 font-semibold border border-gray-300 p-1 text-xs text-gray-600 relative"
                style={{
                  width: colWidths[colIndex],
                  minWidth: colWidths[colIndex],
                }}
              >
                <input
                  type="text"
                  defaultValue={header}
                  onBlur={(e) => handleHeaderBlur(colIndex, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full bg-transparent border-none outline-none font-bold text-xs text-gray-700 text-center"
                  placeholder={`Column ${colIndex + 1}`}
                />
                {/* Resize handle on right border */}
                <div
                  className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400/40 transition-colors"
                  onMouseDown={(e) => handleColResizeMouseDown(e, colIndex)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((rowCells, rowIndex) => (
            <tr key={rowIndex}>
              {rowCells.map((cellValue, colIndex) => {
                const styleKey = `${rowIndex}-${colIndex}`;
                const isBold = cellStyles[styleKey]?.bold ?? false;
                return (
                  <td
                    key={colIndex}
                    data-col={colIndex}
                    className="border border-gray-200 p-0 align-top"
                    style={{
                      width: colWidths[colIndex],
                      minWidth: colWidths[colIndex],
                    }}
                  >
                    <textarea
                      rows={1}
                      defaultValue={cellValue}
                      onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                      onBlur={(e) => {
                        setFocusedCell(null);
                        handleCellBlur(rowIndex, colIndex, e.target.value);
                      }}
                      onInput={autoResize}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`w-full p-1.5 text-sm resize-none outline-none bg-transparent ${isBold ? 'font-bold' : ''}`}
                      style={{ minHeight: '28px' }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add/Remove row buttons — visible when selected */}
      {isSelected && (
        <div
          className="flex items-center gap-1 px-1 py-1 border-t border-gray-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={addRow}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
            title="Add row"
          >
            + Row
          </button>
          <button
            onClick={removeRow}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={rows <= 1}
            className="px-2 py-0.5 text-xs bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remove last row"
          >
            − Row
          </button>
          <span className="flex-1" />
          <button
            onClick={addCol}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
            title="Add column"
          >
            + Col
          </button>
          <button
            onClick={removeCol}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={cols <= 1}
            className="px-2 py-0.5 text-xs bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remove last column"
          >
            − Col
          </button>
        </div>
      )}
    </div>
  );
}

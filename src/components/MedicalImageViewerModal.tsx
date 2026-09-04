import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Eye,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { MedicalImageAsset } from '../types';

interface MedicalImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  annotatedImageUrl?: string;
  imageAsset?: MedicalImageAsset;
  title?: string;
  whatToLookFor?: string;
  showAnnotatedOption?: boolean;
}

export const MedicalImageViewerModal: React.FC<MedicalImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  annotatedImageUrl,
  imageAsset,
  title,
  whatToLookFor,
  showAnnotatedOption = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [showAnnotated, setShowAnnotated] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);

  const effectiveAnnotatedUrl =
    annotatedImageUrl ||
    imageAsset?.annotatedImageUrl ||
    (imageUrl.endsWith('.svg') && !imageUrl.includes('-annotated')
      ? imageUrl.replace('.svg', '-annotated.svg')
      : undefined);

  const activeSrc = showAnnotated && effectiveAnnotatedUrl ? effectiveAnnotatedUrl : imageUrl;

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      setIsHighContrast(false);
      setShowAnnotated(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(3.5, +(prev + 0.25).toFixed(2)));
      } else if (e.key === '-') {
        setZoomLevel((prev) => Math.max(0.6, +(prev - 0.25).toFixed(2)));
      } else if (e.key === '0') {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel((prev) => Math.max(0.6, Math.min(4, +(prev + zoomDelta).toFixed(2))));
  };

  // Touch pinch-to-zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      if (lastTouchDistanceRef.current !== null) {
        const delta = (distance - lastTouchDistanceRef.current) * 0.01;
        setZoomLevel((prev) => Math.max(0.6, Math.min(4, +(prev + delta).toFixed(2))));
      }
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null;
  };

  const displayCategory = imageAsset?.imageCategory
    ? imageAsset.imageCategory.toUpperCase()
    : 'CLINICAL IMAGE';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans']"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[10px] sm:text-[11px] font-bold tracking-wider font-mono">
            {displayCategory}
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-['Outfit'] text-white line-clamp-1">
              {title || imageAsset?.medicalFinding || 'High-Yield Medical Image Finding'}
            </h3>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {showAnnotated ? 'Annotated Diagnostic Review Mode' : 'Clean Exam Investigation Tracing'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Annotated Breakdown Toggle (Available if annotated version exists) */}
          {effectiveAnnotatedUrl && (
            <button
              type="button"
              onClick={() => setShowAnnotated(!showAnnotated)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                showAnnotated
                  ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Diagnostic Annotations on/off"
            >
              <Eye className="w-3.5 h-3.5 text-sky-300" />
              <span>{showAnnotated ? 'Hide Annotations' : 'Show Annotations'}</span>
            </button>
          )}

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isHighContrast
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle High Contrast for ECG / Radiology inspection"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHighContrast ? 'Standard Contrast' : 'High Contrast'}</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-slate-300">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-200">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors border-l border-slate-700 ml-1 cursor-pointer"
              title="Reset View (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Wheel Zoom & Pan */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-4 sm:p-6 ${
          zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => {
          if (zoomLevel === 1) {
            setZoomLevel(1.8);
          } else {
            setZoomLevel(1);
            setPosition({ x: 0, y: 0 });
          }
        }}
      >
        <div
          className="transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            filter: isHighContrast ? 'contrast(160%) brightness(105%)' : 'none',
          }}
        >
          <img
            src={activeSrc}
            alt={title || imageAsset?.medicalFinding || 'FMGE Medical Image'}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="max-h-[70vh] max-w-[92vw] object-contain rounded-xl shadow-2xl select-none"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('/assets/medical-images/')) {
                target.src = '/assets/medical-images/ecg-inferior-stemi.svg';
              }
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Info Banner */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 py-3 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-start md:items-center gap-2">
          <Eye className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 md:mt-0" />
          <div>
            <span className="font-bold text-white font-['Outfit'] mr-1">Visual Clue:</span>
            <span>{whatToLookFor || imageAsset?.whatToLookFor || 'Observe morphological patterns and clinical signs carefully.'}</span>
          </div>
        </div>

        {imageAsset && (
          <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {imageAsset.license || 'Verified Educational Asset'}
            </span>
            {imageAsset.sourceUrl && (
              <a
                href={imageAsset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>{imageAsset.sourceName || 'Source Archive'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

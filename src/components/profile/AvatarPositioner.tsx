import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Move, Check, RotateCcw } from 'lucide-react';

interface AvatarPositionerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  initialPosition?: string; // "x,y" format e.g. "50,50"
  onConfirm: (position: string) => void;
}

export const AvatarPositioner = ({
  open,
  onOpenChange,
  imageUrl,
  initialPosition = '50,50',
  onConfirm,
}: AvatarPositionerProps) => {
  const parsePosition = (pos: string) => {
    const [x, y] = pos.split(',').map(Number);
    return { x: x || 50, y: y || 50 };
  };

  const [position, setPosition] = useState(parsePosition(initialPosition));
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) {
      setPosition(parsePosition(initialPosition));
    }
  }, [open, initialPosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPosition({ x: Math.round(x), y: Math.round(y) });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleReset = () => setPosition({ x: 50, y: 50 });

  const handleConfirm = () => {
    onConfirm(`${position.x},${position.y}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="w-5 h-5 text-primary" />
            ปรับตำแหน่งรูปโปรไฟล์
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ลากรูปหรือใช้แถบเลื่อนเพื่อปรับตำแหน่งที่ต้องการแสดง
          </p>

          {/* Preview area - circular crop preview */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/30 cursor-move select-none touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <img
                src={imageUrl}
                alt="Avatar preview"
                className="absolute w-[200%] h-[200%] max-w-none pointer-events-none"
                style={{
                  left: `${-position.x}%`,
                  top: `${-position.y}%`,
                }}
                draggable={false}
              />
              {/* Center crosshair indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className="w-6 h-[1px] bg-foreground" />
                <div className="absolute w-[1px] h-6 bg-foreground" />
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 px-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex justify-between">
                <span>ซ้าย - ขวา</span>
                <span>{position.x}%</span>
              </label>
              <Slider
                value={[position.x]}
                onValueChange={([v]) => setPosition(p => ({ ...p, x: v }))}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex justify-between">
                <span>บน - ล่าง</span>
                <span>{position.y}%</span>
              </label>
              <Slider
                value={[position.y]}
                onValueChange={([v]) => setPosition(p => ({ ...p, y: v }))}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            รีเซ็ต
          </Button>
          <Button onClick={handleConfirm} className="gap-2 gradient-pink text-primary-foreground">
            <Check className="w-4 h-4" />
            ยืนยัน
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Dices, RotateCcw, CheckCircle2, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
}

interface SpinningWheelProps {
  teamMembers: TeamMember[];
  onSelect: (memberId: string) => void;
  selectedPhotographers: string[];
}

const COLORS = [
  'hsl(340, 82%, 52%)',
  'hsl(210, 79%, 46%)',
  'hsl(145, 63%, 42%)',
  'hsl(36, 100%, 50%)',
  'hsl(262, 52%, 47%)',
  'hsl(0, 84%, 60%)',
  'hsl(187, 72%, 43%)',
  'hsl(28, 80%, 52%)',
  'hsl(120, 40%, 45%)',
  'hsl(280, 60%, 55%)',
];

export const SpinningWheel = ({ teamMembers, onSelect, selectedPhotographers }: SpinningWheelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wheelMembers, setWheelMembers] = useState<TeamMember[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<TeamMember | null>(null);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter out already selected photographers for the wheel
  const availableMembers = teamMembers.filter(m => !selectedPhotographers.includes(m.id));

  useEffect(() => {
    if (isOpen && wheelMembers.length === 0) {
      setWheelMembers(availableMembers);
    }
  }, [isOpen]);

  useEffect(() => {
    drawWheel();
  }, [wheelMembers, rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || wheelMembers.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / wheelMembers.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    wheelMembers.forEach((member, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = COLORS[i % COLORS.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      
      const name = member.name.length > 10 ? member.name.substring(0, 10) + '...' : member.name;
      ctx.fillText(name, radius - 15, 5);
      ctx.restore();
    });

    ctx.restore();

    // Draw pointer (triangle at top)
    ctx.beginPath();
    ctx.moveTo(centerX - 12, 5);
    ctx.lineTo(centerX + 12, 5);
    ctx.lineTo(centerX, 30);
    ctx.closePath();
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.fill();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fill();
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const spin = () => {
    if (wheelMembers.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    const totalSpins = 5 + Math.random() * 5; // 5-10 full rotations
    const sliceAngle = 360 / wheelMembers.length;
    const randomSlice = Math.floor(Math.random() * wheelMembers.length);
    const targetRotation = rotation + totalSpins * 360 + (360 - randomSlice * sliceAngle - sliceAngle / 2);
    
    const duration = 4000;
    const startTime = performance.now();
    const startRotation = rotation;
    const totalDelta = targetRotation - startRotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalDelta * eased;
      
      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setRotation(currentRotation);
        setIsSpinning(false);
        
        // Calculate winner based on final rotation
        const normalizedAngle = ((currentRotation % 360) + 360) % 360;
        const winnerIndex = Math.floor(((360 - normalizedAngle) % 360) / sliceAngle) % wheelMembers.length;
        setWinner(wheelMembers[winnerIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const confirmWinner = () => {
    if (winner) {
      onSelect(winner.id);
      // Remove winner from wheel
      setWheelMembers(prev => prev.filter(m => m.id !== winner.id));
      setWinner(null);
    }
  };

  const toggleWheelMember = (member: TeamMember) => {
    setWheelMembers(prev => {
      const exists = prev.find(m => m.id === member.id);
      if (exists) {
        return prev.filter(m => m.id !== member.id);
      }
      return [...prev, member];
    });
    setWinner(null);
  };

  const selectAllForWheel = () => {
    setWheelMembers(availableMembers);
    setWinner(null);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setWinner(null);
      setWheelMembers(availableMembers);
      setRotation(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Dices className="w-4 h-4" />
          สุ่มเลือกทีมงาน
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            วงล้อสุ่มเลือกทีมงาน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member selection for wheel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">เลือกรายชื่อเข้าวงล้อ</span>
              <Button type="button" variant="ghost" size="sm" onClick={selectAllForWheel} className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                เลือกทั้งหมด ({availableMembers.length})
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-lg bg-muted/30">
              {availableMembers.map(member => (
                <label
                  key={member.id}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border cursor-pointer hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={wheelMembers.some(m => m.id === member.id)}
                    onCheckedChange={() => toggleWheelMember(member)}
                    className="w-3.5 h-3.5"
                  />
                  {member.name}
                </label>
              ))}
              {availableMembers.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">เลือกทีมงานทั้งหมดแล้ว</p>
              )}
            </div>
          </div>

          {/* Wheel */}
          {wheelMembers.length >= 2 ? (
            <div className="flex flex-col items-center gap-4">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="rounded-full shadow-lg"
              />

              {/* Winner display */}
              {winner && (
                <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20 w-full animate-in fade-in">
                  <p className="text-sm text-muted-foreground">🎉 ผลสุ่มได้</p>
                  <p className="text-lg font-bold text-primary">{winner.name}</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={confirmWinner}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    เลือกคนนี้
                  </Button>
                </div>
              )}

              {/* Spin button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={spin}
                  disabled={isSpinning || wheelMembers.length < 2}
                  className="gap-2 gradient-pink text-primary-foreground"
                >
                  <RotateCcw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  {isSpinning ? 'กำลังสุ่ม...' : 'หมุนวงล้อ'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Dices className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ต้องเลือกอย่างน้อย 2 คนเข้าวงล้อ</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

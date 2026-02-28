import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Dices, RotateCcw, CheckCircle2, Users, Volume2, VolumeX, Sparkles, Hash } from 'lucide-react';

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

const createAudioContext = () => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
};

const playTickSound = (audioCtx: AudioContext | null) => {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800 + Math.random() * 400;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
  } catch {}
};

const playWinSound = (audioCtx: AudioContext | null) => {
  if (!audioCtx) return;
  try {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = audioCtx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  } catch {}
};

function adjustBrightness(hslStr: string, amount: number): string {
  const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hslStr;
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = Math.max(0, Math.min(100, parseInt(match[3]) + amount));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export const SpinningWheel = ({ teamMembers, onSelect, selectedPhotographers }: SpinningWheelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wheelMembers, setWheelMembers] = useState<TeamMember[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<TeamMember | null>(null);
  const [rotation, setRotation] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [multiCount, setMultiCount] = useState(1);
  const [multiResults, setMultiResults] = useState<TeamMember[]>([]);
  const [isMultiSpinning, setIsMultiSpinning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickAngleRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const availableMembers = teamMembers.filter(m => !selectedPhotographers.includes(m.id));

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const drawWheel = useCallback((currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || wheelMembers.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = centerX - 12;
    const sliceAngle = (2 * Math.PI) / wheelMembers.length;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI);
    const glowGrad = ctx.createRadialGradient(centerX, centerY, radius - 5, centerX, centerY, radius + 8);
    glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
    glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((currentRotation * Math.PI) / 180);

    wheelMembers.forEach((member, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = COLORS[i % COLORS.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      const midAngle = startAngle + sliceAngle / 2;
      const gx = Math.cos(midAngle) * radius * 0.5;
      const gy = Math.sin(midAngle) * radius * 0.5;
      const grad = ctx.createLinearGradient(0, 0, gx, gy);
      grad.addColorStop(0, color);
      grad.addColorStop(1, adjustBrightness(color, -15));
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${wheelMembers.length > 8 ? 11 : 13}px "Kanit", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      const name = member.name.length > 10 ? member.name.substring(0, 10) + '…' : member.name;
      ctx.fillText(name, radius - 18, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();

    wheelMembers.forEach((_, i) => {
      const angle = i * sliceAngle;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(radius - 8, 0);
      ctx.lineTo(radius, 0);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();

    // Pointer
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, 6);
    ctx.lineTo(centerX + 14, 6);
    ctx.lineTo(centerX, 32);
    ctx.closePath();
    const pointerGrad = ctx.createLinearGradient(centerX, 6, centerX, 32);
    pointerGrad.addColorStop(0, 'hsl(340, 82%, 52%)');
    pointerGrad.addColorStop(1, 'hsl(340, 82%, 42%)');
    ctx.fillStyle = pointerGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Center circle
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(centerX - 3, centerY - 3, 2, centerX, centerY, 20);
    centerGrad.addColorStop(0, '#ffffff');
    centerGrad.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'hsl(340, 82%, 52%)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', centerX, centerY);
    ctx.restore();
  }, [wheelMembers]);

  useEffect(() => {
    drawWheel(rotation);
  }, [wheelMembers, rotation, drawWheel]);

  const spinOnce = useCallback((currentWheelMembers: TeamMember[], currentRotation: number): Promise<{ winner: TeamMember; finalRotation: number }> => {
    return new Promise((resolve) => {
      const sliceAngle = 360 / currentWheelMembers.length;
      const totalSpins = 6 + Math.random() * 6;
      const randomSlice = Math.floor(Math.random() * currentWheelMembers.length);
      const targetRotation = currentRotation + totalSpins * 360 + (270 - randomSlice * sliceAngle - sliceAngle / 2);

      const duration = 4000;
      const startTime = performance.now();
      const startRotation = currentRotation;
      const totalDelta = targetRotation - startRotation;
      lastTickAngleRef.current = startRotation;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const cr = startRotation + totalDelta * eased;

        if (soundEnabled && audioCtxRef.current) {
          const currentNormalized = ((cr % 360) + 360) % 360;
          const lastNormalized = ((lastTickAngleRef.current % 360) + 360) % 360;
          const tickInterval = sliceAngle;
          if (Math.floor(currentNormalized / tickInterval) !== Math.floor(lastNormalized / tickInterval)) {
            playTickSound(audioCtxRef.current);
          }
        }
        lastTickAngleRef.current = cr;
        setRotation(cr);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          const normalizedAngle = ((cr % 360) + 360) % 360;
          const winnerIndex = Math.floor(((270 - normalizedAngle) % 360 + 360) % 360 / sliceAngle) % currentWheelMembers.length;
          resolve({ winner: currentWheelMembers[winnerIndex], finalRotation: cr });
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    });
  }, [soundEnabled]);

  const spin = async () => {
    if (wheelMembers.length < 2 || isSpinning) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }

    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);
    setMultiResults([]);
    setCurrentRound(0);

    const count = Math.min(multiCount, wheelMembers.length);

    if (count <= 1) {
      // Single spin
      const result = await spinOnce(wheelMembers, rotation);
      setWinner(result.winner);
      setShowConfetti(true);
      if (soundEnabled) playWinSound(audioCtxRef.current);
      setIsSpinning(false);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      // Multi spin
      setIsMultiSpinning(true);
      let currentMembers = [...wheelMembers];
      let currentRot = rotation;
      const results: TeamMember[] = [];

      for (let i = 0; i < count; i++) {
        if (currentMembers.length < 2) break;
        setCurrentRound(i + 1);
        setWheelMembers(currentMembers);

        const result = await spinOnce(currentMembers, currentRot);
        results.push(result.winner);
        currentRot = result.finalRotation;

        if (soundEnabled) playWinSound(audioCtxRef.current);
        setShowConfetti(true);

        // Wait between spins
        if (i < count - 1) {
          await new Promise(r => setTimeout(r, 1500));
          setShowConfetti(false);
          currentMembers = currentMembers.filter(m => m.id !== result.winner.id);
        }
      }

      setMultiResults(results);
      setIsMultiSpinning(false);
      setIsSpinning(false);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const confirmWinner = () => {
    if (winner) {
      onSelect(winner.id);
      setWheelMembers(prev => prev.filter(m => m.id !== winner.id));
      setWinner(null);
      setShowConfetti(false);
    }
  };

  const confirmAllResults = () => {
    multiResults.forEach(m => onSelect(m.id));
    setWheelMembers(prev => prev.filter(m => !multiResults.find(r => r.id === m.id)));
    setMultiResults([]);
    setWinner(null);
    setShowConfetti(false);
  };

  const toggleWheelMember = (member: TeamMember) => {
    setWheelMembers(prev => {
      const exists = prev.find(m => m.id === member.id);
      if (exists) return prev.filter(m => m.id !== member.id);
      return [...prev, member];
    });
    setWinner(null);
    setMultiResults([]);
  };

  const selectAllForWheel = () => {
    setWheelMembers(availableMembers);
    setWinner(null);
    setMultiResults([]);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setWinner(null);
      setMultiResults([]);
      setWheelMembers(availableMembers);
      setRotation(0);
      setShowConfetti(false);
      setMultiCount(1);
      setCurrentRound(0);
      setIsMultiSpinning(false);
    }
  };

  const maxMulti = Math.max(1, wheelMembers.length - 1);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2 hover:scale-105 transition-transform">
          <Dices className="w-4 h-4" />
          สุ่มเลือกทีมงาน
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            วงล้อสุ่มเลือกทีมงาน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">เลือกรายชื่อเข้าวงล้อ</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-xs h-7 w-7 p-0"
                  title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={selectAllForWheel} className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  เลือกทั้งหมด ({availableMembers.length})
                </Button>
              </div>
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

          {/* Multi-spin count */}
          {wheelMembers.length >= 2 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
              <Hash className="w-4 h-4 text-primary flex-shrink-0" />
              <Label className="text-sm whitespace-nowrap">จำนวนคนที่ต้องการสุ่ม</Label>
              <Input
                type="number"
                min={1}
                max={maxMulti}
                value={multiCount}
                onChange={(e) => setMultiCount(Math.max(1, Math.min(maxMulti, parseInt(e.target.value) || 1)))}
                className="w-20 h-8 text-center"
                disabled={isSpinning}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">/ {maxMulti} คน</span>
            </div>
          )}

          {/* Wheel */}
          {wheelMembers.length >= 2 ? (
            <div className="flex flex-col items-center gap-4 relative">
              {/* Multi-spin progress */}
              {isMultiSpinning && (
                <div className="text-center text-sm font-medium text-primary animate-pulse">
                  รอบที่ {currentRound} / {Math.min(multiCount, wheelMembers.length)}
                </div>
              )}

              {/* Confetti */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 60}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${0.5 + Math.random() * 1}s`,
                        fontSize: `${12 + Math.random() * 12}px`,
                        opacity: 0.8,
                      }}
                    >
                      {['🎉', '✨', '🎊', '⭐', '💫'][Math.floor(Math.random() * 5)]}
                    </div>
                  ))}
                </div>
              )}

              <div className={`relative transition-transform duration-200 ${isSpinning ? '' : 'hover:scale-[1.02]'}`}>
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="rounded-full drop-shadow-xl"
                  style={{ width: 300, height: 300 }}
                />
              </div>

              {/* Single winner */}
              {winner && multiResults.length === 0 && (
                <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/30 w-full animate-fade-in shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">🎉 ผลสุ่มได้</p>
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <p className="text-xl font-bold text-primary">{winner.name}</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 gap-1 gradient-pink text-primary-foreground"
                    onClick={confirmWinner}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    เลือกคนนี้
                  </Button>
                </div>
              )}

              {/* Multi results */}
              {multiResults.length > 0 && !isMultiSpinning && (
                <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/30 w-full animate-fade-in shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">🎉 ผลสุ่มได้ {multiResults.length} คน</p>
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {multiResults.map((m, i) => (
                      <span key={m.id} className="px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                        {i + 1}. {m.name}
                      </span>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1 gradient-pink text-primary-foreground"
                    onClick={confirmAllResults}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    เลือกทั้งหมด
                  </Button>
                </div>
              )}

              {/* Spin button */}
              <Button
                type="button"
                onClick={spin}
                disabled={isSpinning || wheelMembers.length < 2}
                className="gap-2 gradient-pink text-primary-foreground px-8 py-5 text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:hover:scale-100"
              >
                <RotateCcw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning
                  ? 'กำลังสุ่ม...'
                  : multiCount > 1
                  ? `หมุนสุ่ม ${multiCount} คน`
                  : 'หมุนวงล้อ'}
              </Button>
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

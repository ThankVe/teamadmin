import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, Calendar, CheckCircle, Clock, Camera } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface EventData {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  location?: string | null;
  activity_name: string;
}

interface ExportStats {
  total: number;
  acknowledged: number;
  in_progress: number;
  completed: number;
}

interface ExportDialogProps {
  events: EventData[];
  stats: ExportStats;
  selectedMonth: number;
  selectedYear: number;
  months: string[];
}

export const ExportDialog = ({
  events,
  stats,
  selectedMonth,
  selectedYear,
  months,
}: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const formatThaiDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานงาน');

    worksheet.columns = [
      { header: 'ลำดับ', key: 'index', width: 8 },
      { header: 'ชื่องาน', key: 'title', width: 30 },
      { header: 'กิจกรรม', key: 'activity', width: 25 },
      { header: 'วันที่', key: 'date', width: 20 },
      { header: 'เวลาเริ่ม', key: 'start', width: 12 },
      { header: 'เวลาสิ้นสุด', key: 'end', width: 12 },
      { header: 'สถานที่', key: 'location', width: 25 },
      { header: 'สถานะ', key: 'status', width: 15 },
    ];

    events.forEach((event, index) => {
      worksheet.addRow({
        index: index + 1,
        title: event.title,
        activity: event.activity_name,
        date: formatThaiDate(event.date),
        start: event.start_time,
        end: event.end_time,
        location: event.location || '-',
        status: getStatusLabel(event.status),
      });
    });

    // Add summary
    worksheet.addRow({});
    worksheet.addRow({
      index: 'สรุป',
      title: `งานทั้งหมด: ${stats.total}`,
      activity: `รอดำเนินการ: ${stats.pending}`,
      date: `ยืนยันแล้ว: ${stats.confirmed}`,
      start: `เสร็จสิ้น: ${stats.completed}`,
      end: `ยกเลิก: ${stats.cancelled}`,
    });

    const fileName = `รายงานงาน_${months[selectedMonth]}_${selectedYear + 543}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), fileName);
  };

  const printReport = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>รายงานสรุปงาน - ${months[selectedMonth]} ${selectedYear + 543}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; 
              padding: 40px; 
              background: white;
              color: #1a1a1a;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 3px solid #ec4899;
              padding-bottom: 20px;
            }
            .header h1 { 
              font-size: 24px; 
              color: #ec4899;
              margin-bottom: 8px;
            }
            .header p { 
              color: #666; 
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .stat-card.primary { background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); }
            .stat-card.warning { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            .stat-card.success { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); }
            .stat-card.muted { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); }
            .stat-value { font-size: 32px; font-weight: bold; color: #1a1a1a; }
            .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left;
              font-size: 13px;
            }
            th { 
              background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) { background: #f9f9f9; }
            tr:hover { background: #fce7f3; }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-confirmed { background: #d1fae5; color: #065f46; }
            .status-completed { background: #e5e7eb; color: #374151; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #999;
              font-size: 12px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 รายงานสรุปงาน</h1>
            <p>เดือน ${months[selectedMonth]} พ.ศ. ${selectedYear + 543}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">งานทั้งหมด</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-value">${stats.pending}</div>
              <div class="stat-label">รอดำเนินการ</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">${stats.confirmed}</div>
              <div class="stat-label">ยืนยันแล้ว</div>
            </div>
            <div class="stat-card muted">
              <div class="stat-value">${stats.completed}</div>
              <div class="stat-label">เสร็จสิ้น</div>
            </div>
          </div>

          <h3 style="margin-bottom: 10px; color: #ec4899;">📋 รายการงานในเดือนนี้</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>ชื่องาน</th>
                <th>กิจกรรม</th>
                <th style="width: 120px;">วันที่</th>
                <th style="width: 100px;">เวลา</th>
                <th style="width: 100px;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${events.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; color: #999; padding: 40px;">
                    ไม่มีงานในเดือนนี้
                  </td>
                </tr>
              ` : events.map((event, i) => `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td><strong>${event.title}</strong></td>
                  <td>${event.activity_name}</td>
                  <td>${formatThaiDate(event.date)}</td>
                  <td>${event.start_time} - ${event.end_time}</td>
                  <td>
                    <span class="status-badge status-${event.status}">
                      ${getStatusLabel(event.status)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>พิมพ์เมื่อ ${new Date().toLocaleDateString('th-TH', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p style="margin-top: 4px;">© ระบบจัดการงานถ่ายภาพและวิดีโอ</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="w-5 h-5 text-primary" />
            Export รายงานสรุป
          </DialogTitle>
        </DialogHeader>

        {/* Export Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={exportToExcel}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Excel (.xlsx)</h3>
                <p className="text-sm text-muted-foreground">ส่งออกเป็นไฟล์ตาราง</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={printReport}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">PDF / Print</h3>
                <p className="text-sm text-muted-foreground">พิมพ์หรือบันทึก PDF</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div ref={printRef} className="border rounded-xl p-6 bg-card">
          <div className="text-center mb-6 pb-4 border-b border-primary/20">
            <h2 className="text-xl font-bold text-primary">📊 รายงานสรุปงาน</h2>
            <p className="text-muted-foreground text-sm mt-1">
              เดือน {months[selectedMonth]} พ.ศ. {selectedYear + 543}
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 rounded-xl bg-primary/10">
              <div className="flex justify-center mb-2">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-100">
              <div className="flex justify-center mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-100">
              <div className="flex justify-center mb-2">
                <Camera className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
              <p className="text-xs text-muted-foreground">ยืนยันแล้ว</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-muted-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
            </div>
          </div>

          {/* Events List Preview */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              📋 รายการงาน
              <Badge variant="secondary">{events.length} รายการ</Badge>
            </h3>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>ไม่มีงานในเดือนนี้</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.slice(0, 5).map((event, i) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatThaiDate(event.date)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      event.status === 'confirmed' ? 'default' :
                      event.status === 'completed' ? 'outline' :
                      event.status === 'cancelled' ? 'destructive' : 'secondary'
                    } className="text-xs">
                      {getStatusLabel(event.status)}
                    </Badge>
                  </div>
                ))}
                {events.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    ... และอีก {events.length - 5} รายการ
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

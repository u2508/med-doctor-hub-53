import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  notes?: string;
  patient_id: string;
  patient_profile?: {
    full_name: string;
    email?: string;
  };
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectAppointment?: (appointment: Appointment) => void;
}

type ViewMode = 'month' | 'week';

const AppointmentCalendar = ({ appointments, onSelectAppointment }: AppointmentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'scheduled':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-primary text-primary-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const renderMonthView = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border/30 bg-muted/20" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={cn(
            "h-24 border border-border/30 p-1 overflow-hidden hover:bg-muted/30 transition-colors",
            isToday && "bg-primary/5 border-primary/30"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1",
            isToday ? "text-primary" : "text-foreground"
          )}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-y-auto max-h-16">
            {dayAppointments.slice(0, 3).map((apt) => (
              <button
                key={apt.id}
                onClick={() => onSelectAppointment?.(apt)}
                className={cn(
                  "w-full text-left text-xs px-1 py-0.5 rounded truncate",
                  getStatusColor(apt.status)
                )}
              >
                {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {apt.patient_profile?.full_name || 'Patient'}
              </button>
            ))}
            {dayAppointments.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">
                +{dayAppointments.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    return weekDays.map((date, idx) => {
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      return (
        <div key={idx} className="flex-1 border-r border-border/30 last:border-r-0">
          <div className={cn(
            "text-center py-2 border-b border-border/30 sticky top-0 bg-card",
            isToday && "bg-primary/5"
          )}>
            <div className="text-xs text-muted-foreground">{dayNames[date.getDay()]}</div>
            <div className={cn(
              "text-lg font-semibold",
              isToday ? "text-primary" : "text-foreground"
            )}>
              {date.getDate()}
            </div>
          </div>
          <div className="min-h-[400px] p-1 space-y-1">
            {dayAppointments.map((apt) => (
              <button
                key={apt.id}
                onClick={() => onSelectAppointment?.(apt)}
                className={cn(
                  "w-full text-left p-2 rounded-lg text-xs transition-all hover:scale-[1.02]",
                  getStatusColor(apt.status)
                )}
              >
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1 mt-1 truncate">
                  <User className="w-3 h-3" />
                  {apt.patient_profile?.full_name || 'Patient'}
                </div>
                <Badge variant="outline" className="mt-1 text-[10px] py-0">
                  {apt.status}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <Card className="border-border/50 shadow-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Appointment Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="rounded-none"
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="rounded-none"
              >
                Week
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'month' ? (
          <>
            <div className="grid grid-cols-7 mb-1">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {renderMonthView()}
            </div>
          </>
        ) : (
          <div className="flex border border-border/30 rounded-lg overflow-hidden">
            {renderWeekView()}
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-success" />
            <span className="text-muted-foreground">Confirmed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;

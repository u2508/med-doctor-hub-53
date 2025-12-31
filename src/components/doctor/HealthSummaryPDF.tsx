import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileDown, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PatientProfile {
  full_name: string;
  email?: string;
  phone?: string;
}

interface PatientData {
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string[];
  current_medications?: string[];
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface Vital {
  id: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  oxygen_saturation?: number | null;
  respiratory_rate?: number | null;
  notes: string | null;
  recorded_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
}

interface HealthSummaryPDFProps {
  profile: PatientProfile | null;
  patientData: PatientData | null;
  vitals: Vital[];
  appointment: Appointment;
  doctorName?: string;
}

const HealthSummaryPDF = ({ profile, patientData, vitals, appointment, doctorName }: HealthSummaryPDFProps) => {
  const [generating, setGenerating] = useState(false);

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (weight: number | null, height: number | null) => {
    if (!weight || !height || height === 0) return null;
    const heightMeters = height * 0.0254;
    const weightKg = weight * 0.453592;
    return Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generatePDF = async (action: 'download' | 'print') => {
    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
      const leftMargin = 20;
      const lineHeight = 7;

      // Helper functions
      const addTitle = (text: string) => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 33, 33);
        doc.text(text, leftMargin, yPos);
        yPos += lineHeight + 2;
      };

      const addSectionTitle = (text: string) => {
        yPos += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(66, 66, 66);
        doc.text(text, leftMargin, yPos);
        doc.setLineWidth(0.5);
        doc.line(leftMargin, yPos + 2, pageWidth - leftMargin, yPos + 2);
        yPos += lineHeight + 4;
      };

      const addText = (label: string, value: string) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text(label, leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(value, leftMargin + 45, yPos);
        yPos += lineHeight;
      };

      const addWrappedText = (label: string, value: string) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text(label, leftMargin, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        const lines = doc.splitTextToSize(value, pageWidth - leftMargin * 2);
        doc.text(lines, leftMargin, yPos);
        yPos += lines.length * lineHeight;
      };

      const checkPageBreak = (neededSpace: number) => {
        if (yPos + neededSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Patient Health Summary', leftMargin, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${formatDate(new Date().toISOString())}`, leftMargin, 30);
      
      yPos = 50;

      // Patient Information
      addSectionTitle('Patient Information');
      addText('Name:', profile?.full_name || 'Unknown');
      if (patientData?.date_of_birth) {
        const age = calculateAge(patientData.date_of_birth);
        addText('Date of Birth:', `${formatDate(patientData.date_of_birth)}${age ? ` (${age} years)` : ''}`);
      }
      if (patientData?.gender) addText('Gender:', patientData.gender);
      if (patientData?.blood_type) addText('Blood Type:', patientData.blood_type);
      if (profile?.email) addText('Email:', profile.email);
      if (profile?.phone) addText('Phone:', profile.phone);

      // Emergency Contact
      if (patientData?.emergency_contact_name) {
        checkPageBreak(30);
        addSectionTitle('Emergency Contact');
        addText('Name:', patientData.emergency_contact_name);
        if (patientData.emergency_contact_phone) addText('Phone:', patientData.emergency_contact_phone);
      }

      // Medical Information
      checkPageBreak(40);
      addSectionTitle('Medical Information');
      
      if (patientData?.allergies && patientData.allergies.length > 0) {
        addText('Allergies:', patientData.allergies.join(', '));
      } else {
        addText('Allergies:', 'None recorded');
      }

      if (patientData?.current_medications && patientData.current_medications.length > 0) {
        addWrappedText('Medications:', patientData.current_medications.join(', '));
      }

      if (patientData?.medical_history) {
        addWrappedText('Medical History:', patientData.medical_history);
      }

      // Current Appointment
      checkPageBreak(50);
      addSectionTitle('Current Appointment');
      addText('Date:', formatDate(appointment.appointment_date));
      addText('Status:', appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1));
      if (doctorName) addText('Doctor:', doctorName);
      if (appointment.diagnosis) {
        addWrappedText('Diagnosis:', appointment.diagnosis);
      }
      if (appointment.prescription) {
        addWrappedText('Prescription:', appointment.prescription);
      }
      if (appointment.notes) {
        addWrappedText('Notes:', appointment.notes);
      }

      // Vitals
      if (vitals.length > 0) {
        checkPageBreak(80);
        addSectionTitle('Vital Signs History');
        
        // Latest vitals summary
        const latest = vitals[0];
        yPos += 3;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Latest Reading (${formatDate(latest.recorded_at)}):`, leftMargin, yPos);
        yPos += lineHeight + 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const vitalsGrid = [];
        if (latest.blood_pressure_systolic && latest.blood_pressure_diastolic) {
          vitalsGrid.push(`Blood Pressure: ${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic} mmHg`);
        }
        if (latest.heart_rate) vitalsGrid.push(`Heart Rate: ${latest.heart_rate} bpm`);
        if (latest.temperature) vitalsGrid.push(`Temperature: ${latest.temperature}°F`);
        if (latest.weight) {
          const bmi = calculateBMI(latest.weight, latest.height);
          vitalsGrid.push(`Weight: ${latest.weight} lbs${bmi ? ` (BMI: ${bmi})` : ''}`);
        }
        if (latest.height) vitalsGrid.push(`Height: ${latest.height} in`);
        if (latest.oxygen_saturation) vitalsGrid.push(`SpO2: ${latest.oxygen_saturation}%`);
        if (latest.respiratory_rate) vitalsGrid.push(`Respiratory Rate: ${latest.respiratory_rate}/min`);

        vitalsGrid.forEach(item => {
          doc.text(`• ${item}`, leftMargin + 5, yPos);
          yPos += lineHeight;
        });

        // Historical vitals table
        if (vitals.length > 1) {
          checkPageBreak(60);
          yPos += 5;
          doc.setFont('helvetica', 'bold');
          doc.text('Historical Readings:', leftMargin, yPos);
          yPos += lineHeight + 2;

          // Table header
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin, yPos - 4, pageWidth - leftMargin * 2, 8, 'F');
          doc.setFontSize(8);
          doc.text('Date', leftMargin + 2, yPos);
          doc.text('BP', leftMargin + 35, yPos);
          doc.text('HR', leftMargin + 55, yPos);
          doc.text('Temp', leftMargin + 70, yPos);
          doc.text('Weight', leftMargin + 90, yPos);
          doc.text('SpO2', leftMargin + 115, yPos);
          doc.text('RR', leftMargin + 135, yPos);
          yPos += lineHeight;

          doc.setFont('helvetica', 'normal');
          vitals.slice(0, 10).forEach((vital, index) => {
            checkPageBreak(10);
            if (index % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(leftMargin, yPos - 4, pageWidth - leftMargin * 2, 7, 'F');
            }
            doc.text(new Date(vital.recorded_at).toLocaleDateString(), leftMargin + 2, yPos);
            doc.text(vital.blood_pressure_systolic && vital.blood_pressure_diastolic ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}` : '--', leftMargin + 35, yPos);
            doc.text(vital.heart_rate ? `${vital.heart_rate}` : '--', leftMargin + 55, yPos);
            doc.text(vital.temperature ? `${vital.temperature}°F` : '--', leftMargin + 70, yPos);
            doc.text(vital.weight ? `${vital.weight}` : '--', leftMargin + 90, yPos);
            doc.text(vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : '--', leftMargin + 115, yPos);
            doc.text(vital.respiratory_rate ? `${vital.respiratory_rate}` : '--', leftMargin + 135, yPos);
            yPos += lineHeight;
          });
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('Confidential Medical Document', leftMargin, doc.internal.pageSize.getHeight() - 10);
      }

      if (action === 'download') {
        const fileName = `health-summary-${profile?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'patient'}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      } else {
        window.open(doc.output('bloburl'), '_blank');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => generatePDF('download')}
        disabled={generating}
        className="gap-2"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        Download PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => generatePDF('print')}
        disabled={generating}
        className="gap-2"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
        Print
      </Button>
    </div>
  );
};

export default HealthSummaryPDF;

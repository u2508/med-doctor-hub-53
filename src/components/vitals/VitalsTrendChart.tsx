import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Heart, Scale, Thermometer, Wind } from 'lucide-react';

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
  recorded_at: string;
}

interface VitalsTrendChartProps {
  vitals: Vital[];
}

const VitalsTrendChart = ({ vitals }: VitalsTrendChartProps) => {
  if (vitals.length < 2) {
    return null;
  }

  // Calculate BMI helper
  const calculateBMI = (weight: number | null, height: number | null) => {
    if (!weight || !height || height === 0) return null;
    // Convert height from inches to meters, weight from lbs to kg
    const heightMeters = height * 0.0254;
    const weightKg = weight * 0.453592;
    return Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;
  };

  // Prepare data for charts - reverse to show oldest first
  const chartData = [...vitals]
    .reverse()
    .map(vital => ({
      date: new Date(vital.recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      systolic: vital.blood_pressure_systolic,
      diastolic: vital.blood_pressure_diastolic,
      heartRate: vital.heart_rate,
      temperature: vital.temperature,
      weight: vital.weight,
      height: vital.height,
      bmi: calculateBMI(vital.weight, vital.height),
      oxygenSaturation: vital.oxygen_saturation,
      respiratoryRate: vital.respiratory_rate,
    }));

  const hasBPData = chartData.some(d => d.systolic || d.diastolic);
  const hasHeartRateData = chartData.some(d => d.heartRate);
  const hasWeightData = chartData.some(d => d.weight);
  const hasTempData = chartData.some(d => d.temperature);
  const hasOxygenData = chartData.some(d => d.oxygenSaturation);
  const hasRespiratoryData = chartData.some(d => d.respiratoryRate);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          Vitals Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cardiovascular" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cardiovascular">Cardiovascular</TabsTrigger>
            <TabsTrigger value="body">Body Metrics</TabsTrigger>
            <TabsTrigger value="respiratory">Respiratory</TabsTrigger>
          </TabsList>

          {/* Cardiovascular Tab */}
          <TabsContent value="cardiovascular" className="space-y-6">
            {/* Blood Pressure Chart */}
            {hasBPData && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-destructive" />
                  Blood Pressure Trend
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[60, 180]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="systolic" name="Systolic" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2 }} connectNulls />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Heart Rate Chart */}
            {hasHeartRateData && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Heart Rate Trend
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 120]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Area type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {!hasBPData && !hasHeartRateData && (
              <p className="text-center text-muted-foreground py-8">No cardiovascular data available</p>
            )}
          </TabsContent>

          {/* Body Metrics Tab */}
          <TabsContent value="body" className="space-y-6">
            {/* Weight & BMI Chart */}
            {hasWeightData && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-success" />
                    Weight Trend (lbs)
                  </h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                      <Area type="monotone" dataKey="weight" name="Weight (lbs)" stroke="hsl(var(--success))" fill="hsl(var(--success)/0.2)" strokeWidth={2} connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-warning" />
                    BMI Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[15, 40]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                      {/* Reference lines for BMI categories */}
                      <Line type="monotone" dataKey="bmi" name="BMI" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Underweight: &lt;18.5</span>
                    <span>Normal: 18.5-24.9</span>
                    <span>Overweight: 25-29.9</span>
                    <span>Obese: &gt;30</span>
                  </div>
                </div>
              </div>
            )}

            {/* Temperature Chart */}
            {hasTempData && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-warning" />
                  Temperature Trend (°F)
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[96, 104]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" name="Temperature (°F)" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {!hasWeightData && !hasTempData && (
              <p className="text-center text-muted-foreground py-8">No body metrics data available</p>
            )}
          </TabsContent>

          {/* Respiratory Tab */}
          <TabsContent value="respiratory" className="space-y-6">
            {/* Oxygen Saturation Chart */}
            {hasOxygenData && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-primary" />
                  Oxygen Saturation (SpO2)
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[90, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Area type="monotone" dataKey="oxygenSaturation" name="SpO2 (%)" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="text-success">Normal: 95-100%</span>
                  <span className="text-warning">Low: 90-94%</span>
                  <span className="text-destructive">Critical: &lt;90%</span>
                </div>
              </div>
            )}

            {/* Respiratory Rate Chart */}
            {hasRespiratoryData && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-success" />
                  Respiratory Rate
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[8, 30]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="respiratoryRate" name="Breaths/min" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>Normal adult: 12-20 breaths/min</span>
                </div>
              </div>
            )}

            {!hasOxygenData && !hasRespiratoryData && (
              <p className="text-center text-muted-foreground py-8">No respiratory data available</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VitalsTrendChart;

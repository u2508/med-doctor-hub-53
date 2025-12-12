import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Play, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

type TestStatus = "pending" | "running" | "passed" | "failed";

interface TestResult {
  name: string;
  status: TestStatus;
  message?: string;
  duration?: number;
}

const TestWorkflow = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Supabase Connection", status: "pending" },
    { name: "Authentication Service", status: "pending" },
    { name: "Database Read Access", status: "pending" },
    { name: "Profiles Table", status: "pending" },
    { name: "Appointments Table", status: "pending" },
    { name: "Vitals Table", status: "pending" },
    { name: "Medications Table", status: "pending" },
    { name: "Edge Functions (Public)", status: "pending" },
    { name: "Chatbot Function (Auth Required)", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const updateTest = (name: string, status: TestStatus, message?: string, duration?: number) => {
    setTests(prev => prev.map(t => 
      t.name === name ? { ...t, status, message, duration } : t
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests(prev => prev.map(t => ({ ...t, status: "pending" as TestStatus, message: undefined, duration: undefined })));

    // Test 1: Supabase Connection
    updateTest("Supabase Connection", "running");
    const start1 = Date.now();
    try {
      const { error } = await supabase.from("profiles").select("count").limit(1);
      if (error) throw error;
      updateTest("Supabase Connection", "passed", "Connected successfully", Date.now() - start1);
    } catch (e: any) {
      updateTest("Supabase Connection", "failed", e.message, Date.now() - start1);
    }

    // Test 2: Authentication Service
    updateTest("Authentication Service", "running");
    const start2 = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      updateTest("Authentication Service", "passed", data.session ? "Active session found" : "Service available (no session)", Date.now() - start2);
    } catch (e: any) {
      updateTest("Authentication Service", "failed", e.message, Date.now() - start2);
    }

    // Test 3: Database Read Access
    updateTest("Database Read Access", "running");
    const start3 = Date.now();
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) throw error;
      updateTest("Database Read Access", "passed", "Read access confirmed", Date.now() - start3);
    } catch (e: any) {
      updateTest("Database Read Access", "failed", e.message, Date.now() - start3);
    }

    // Test 4: Profiles Table
    updateTest("Profiles Table", "running");
    const start4 = Date.now();
    try {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      updateTest("Profiles Table", "passed", `${count || 0} records`, Date.now() - start4);
    } catch (e: any) {
      updateTest("Profiles Table", "failed", e.message, Date.now() - start4);
    }

    // Test 5: Appointments Table
    updateTest("Appointments Table", "running");
    const start5 = Date.now();
    try {
      const { count, error } = await supabase.from("appointments").select("*", { count: "exact", head: true });
      if (error) throw error;
      updateTest("Appointments Table", "passed", `${count || 0} records`, Date.now() - start5);
    } catch (e: any) {
      updateTest("Appointments Table", "failed", e.message, Date.now() - start5);
    }

    // Test 6: Vitals Table
    updateTest("Vitals Table", "running");
    const start6 = Date.now();
    try {
      const { count, error } = await supabase.from("vitals").select("*", { count: "exact", head: true });
      if (error) throw error;
      updateTest("Vitals Table", "passed", `${count || 0} records`, Date.now() - start6);
    } catch (e: any) {
      updateTest("Vitals Table", "failed", e.message, Date.now() - start6);
    }

    // Test 7: Medications Table
    updateTest("Medications Table", "running");
    const start7 = Date.now();
    try {
      const { count, error } = await supabase.from("medications").select("*", { count: "exact", head: true });
      if (error) throw error;
      updateTest("Medications Table", "passed", `${count || 0} records`, Date.now() - start7);
    } catch (e: any) {
      updateTest("Medications Table", "failed", e.message, Date.now() - start7);
    }

    // Test 8: Edge Functions (Public - appointment reminders)
    updateTest("Edge Functions (Public)", "running");
    const start8 = Date.now();
    try {
      const { error } = await supabase.functions.invoke("appointment-reminders", {
        body: {}
      });
      if (error) throw error;
      updateTest("Edge Functions (Public)", "passed", "Public functions reachable", Date.now() - start8);
    } catch (e: any) {
      updateTest("Edge Functions (Public)", "failed", e.message || "Function unreachable", Date.now() - start8);
    }

    // Test 9: Chatbot Function (requires auth)
    updateTest("Chatbot Function (Auth Required)", "running");
    const start9 = Date.now();
    if (!user) {
      updateTest("Chatbot Function (Auth Required)", "failed", "Skipped - requires login", Date.now() - start9);
    } else {
      try {
        const { error } = await supabase.functions.invoke("chatbot", {
          body: { message: "ping", history: [] }
        });
        if (error) throw error;
        updateTest("Chatbot Function (Auth Required)", "passed", "Authenticated access works", Date.now() - start9);
      } catch (e: any) {
        updateTest("Chatbot Function (Auth Required)", "failed", e.message || "Auth failed", Date.now() - start9);
      }
    }

    setIsRunning(false);
    
    const passedCount = tests.filter(t => t.status === "passed").length;
    toast({
      title: "Tests Complete",
      description: `${passedCount}/${tests.length} tests passed`,
    });
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case "running":
        return <Badge variant="outline" className="text-primary">Running</Badge>;
      case "passed":
        return <Badge className="bg-green-500">Passed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const passedCount = tests.filter(t => t.status === "passed").length;
  const failedCount = tests.filter(t => t.status === "failed").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">App Workflow Test Suite</CardTitle>
                <CardDescription>
                  Test database connections, authentication, and services
                </CardDescription>
                {user ? (
                  <Badge className="mt-2 bg-green-500">Logged in: {user.email}</Badge>
                ) : (
                  <Badge variant="outline" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not logged in - some tests will be skipped
                  </Badge>
                )}
              </div>
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Badge variant="outline" className="text-lg py-1 px-3">
                Total: {tests.length}
              </Badge>
              <Badge className="bg-green-500 text-lg py-1 px-3">
                Passed: {passedCount}
              </Badge>
              <Badge variant="destructive" className="text-lg py-1 px-3">
                Failed: {failedCount}
              </Badge>
            </div>

            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium">{test.name}</p>
                      {test.message && (
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {test.duration !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href="/">Landing Page</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/user-signin">User Sign In</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/doctor-portal">Doctor Portal</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/doctor-registration">Doctor Registration</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestWorkflow;

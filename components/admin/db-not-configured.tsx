import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DbNotConfigured() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted">
        <p>
          MongoDB is not configured. Set <code>MONGODB_URI</code> in your
          environment to use the admin panel.
        </p>
        <Button asChild variant="outline">
          <Link href="/api/health">Check Health</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

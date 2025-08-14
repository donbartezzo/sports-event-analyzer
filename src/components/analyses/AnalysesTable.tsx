import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface Analysis {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "failed";
  type: string;
  createdAt: string;
}

interface AnalysesTableProps {
  analyses: Analysis[];
}

export function AnalysesTable({ analyses }: AnalysesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.map((analysis) => (
            <TableRow key={analysis.id}>
              <TableCell className="font-medium">{analysis.title}</TableCell>
              <TableCell>{analysis.type}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    analysis.status === "completed"
                      ? "success"
                      : analysis.status === "in_progress"
                      ? "default"
                      : "destructive"
                  }
                >
                  {analysis.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(analysis.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

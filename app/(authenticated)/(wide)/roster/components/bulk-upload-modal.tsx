"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { EmployeeInput } from "../types";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (employees: EmployeeInput[]) => Promise<{ success: boolean; addedCount: number; skippedCount: number; errors: string[] }>;
}

const REQUIRED_HEADERS = ["eid", "toasttab_email", "role", "location", "status"];
// first_name and last_name are handled separately to support "Full Name"

export function BulkUploadModal({ isOpen, onClose, onUpload }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
          setError("Invalid file type. Please upload a CSV file.");
          setFile(null);
          return;
      }
      setFile(selectedFile);
      setError(null);
      setValidationErrors([]);
      setResult(null);
    }
  };

  const reset = () => {
    setFile(null);
    setError(null);
    setValidationErrors([]);
    setResult(null);
    onClose();
  };

  const processFile = async () => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Invalid file type. Please upload a CSV file.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setValidationErrors([]);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers
        const normalized = header.trim().toLowerCase().replace(/\s+/g, '_');
        
        // Manual mapping for specific user deviations
        if (normalized === 'full_name') return 'full_name';
        if (normalized === 'middle_name') return 'middle_name';
        if (normalized === 'case_safe_id') return 'case_safe_id';
        if (normalized === 'toasttab_email') return 'toasttab_email';
        if (normalized === 'production_date') return 'production_date';
        
        return normalized;
      },
      complete: async (results) => {
        const headers = results.meta.fields || [];
        
        // Check for required fields
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        
        // Check for Name fields (either (first_name AND last_name) OR full_name)
        const hasSeparateNames = headers.includes("first_name") && headers.includes("last_name");
        const hasFullName = headers.includes("full_name");

        if (!hasSeparateNames && !hasFullName) {
             missingHeaders.push("first_name/last_name OR full_name");
        }

        if (missingHeaders.length > 0) {
            setValidationErrors([`Missing required columns: ${missingHeaders.join(", ")}`]);
            setIsLoading(false);
            return;
        }

        const employees: EmployeeInput[] = results.data.map((row: any) => {
            let firstName = row.first_name?.toString().trim() || "";
            let middleName = row.middle_name?.toString().trim() || "";
            let lastName = row.last_name?.toString().trim() || "";

            // Parse Full Name if needed: "Last Name, First Name"
            if (!firstName && !lastName && row.full_name) {
                const parts = row.full_name.toString().split(",");
                if (parts.length >= 2) {
                    lastName = parts[0].trim();
                    firstName = parts.slice(1).join(" ").trim();
                } else {
                    // Fallback if no comma: assume "First Last"
                    const spaceParts = row.full_name.toString().trim().split(" ");
                    if (spaceParts.length >= 2) {
                         lastName = spaceParts.pop() || "";
                         firstName = spaceParts.join(" ");
                    } else {
                        firstName = row.full_name.toString().trim();
                    }
                }
            }
            
            let productionDate = null;
            if (row.production_date) {
                const pDateStr = row.production_date.toString().trim();
                if (pDateStr && pDateStr.toLowerCase() !== "n/a") {
                    // Check for Excel serial date (numeric)
                    if (/^\d+(\.\d+)?$/.test(pDateStr)) {
                         const serial = parseFloat(pDateStr);
                         // Excel base date adjustment (25569 days from 1899-12-30 to 1970-01-01)
                         const date = new Date((serial - 25569) * 86400 * 1000);
                         productionDate = date.toISOString().split('T')[0];
                    } else {
                        // Try parsing as standard date string
                        const date = new Date(pDateStr);
                        if (!isNaN(date.getTime())) {
                             productionDate = date.toISOString().split('T')[0];
                        } else {
                             // Fallback to original string if JS date parse fails
                             productionDate = pDateStr;
                        }
                    }
                }
            }
            
            return {
                eid: row.eid?.toString().trim(),
                case_safe_id: row.case_safe_id?.toString().trim() || "",
                toasttab_email: row.toasttab_email?.toString().trim() || "",
                location: row.location?.toString().trim() || "",
                last_name: lastName,
                first_name: firstName,
                middle_name: middleName,
                skill: row.skill?.toString().trim() || "",
                channel: row.channel?.toString().trim() || "",
                tier: row.tier?.toString().trim() || "",
                role: row.role?.toString().trim() || "",
                status: row.status?.toString().trim() || "Active",
                wave: row.wave?.toString().trim() || "",
                production_date: productionDate,
                supervisor: row.supervisor?.toString().trim() || "",
                manager: row.manager?.toString().trim() || "",
                tenure: null, // Calculated by DB trigger
                tenure_bucket: "", // Calculated by DB trigger
            };
        }).filter(e => e.eid); // Filter out rows without EID

        if (employees.length === 0) {
            setValidationErrors(["No valid employee records found in file."]);
            setIsLoading(false);
            return;
        }

        try {
            const res = await onUpload(employees);
            if (res.success) {
                setResult({
                    added: res.addedCount,
                    skipped: res.skippedCount,
                    errors: res.errors
                });
            } else {
                setValidationErrors(res.errors);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during upload.");
        } finally {
            setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`CSV Parsing Error: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={reset}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Employees</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple employees at once. Excel (.xlsx) files are not supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
            {!result && (
                <>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                            Click to select a file
                        </label>
                        <span className="text-xs text-muted-foreground mt-1">or drag and drop CSV here</span>
                        <input 
                            id="file-upload" 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        {file && (
                            <div className="mt-4 flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-full">
                                <FileText className="h-4 w-4" />
                                {file.name}
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold">Supported Columns:</p>
                        <p>eid, email (or toasttab_email), role, location, status, full_name (or first_name, last_name)</p>
                        <p className="text-muted-foreground/70 italic">Headers are case-insensitive. Spaces are allowed.</p>
                    </div>
                </>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-4 text-primary">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p className="text-sm font-medium">Processing File...</p>
                </div>
            )}

            {validationErrors.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-4 text-xs max-h-32 overflow-y-auto">
                            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <div className="space-y-4">
                     <Alert variant="default" className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-300">Upload Complete</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                           Successfully added {result.added} employees.
                        </AlertDescription>
                    </Alert>

                    {result.skipped > 0 && (
                        <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-800 dark:text-yellow-300">Duplicates Skipped</AlertTitle>
                            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                                {result.skipped} records were skipped because their EID already exists.
                            </AlertDescription>
                        </Alert>
                    )}

                    {result.errors.length > 0 && (
                        <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium mb-2">Detailed Logs:</p>
                             <ScrollArea className="h-32">
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            )}
        </div>

        <DialogFooter>
            {result ? (
                 <Button onClick={reset}>Close</Button>
            ) : (
                <>
                    <Button variant="outline" onClick={reset} disabled={isLoading}>Cancel</Button>
                    <Button onClick={processFile} disabled={!file || isLoading}>
                        {isLoading ? "Uploading..." : "Upload & Process"}
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
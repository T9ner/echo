/**
 * CalendarExportImport Component - Export and import calendar data
 * 
 * Features:
 * - Export events to various formats (JSON, CSV, iCal)
 * - Import events from files
 * - Backup and restore functionality
 * - Data validation and error handling
 */
import React, { useState, useCallback, useRef } from 'react';
import { Download, Upload, FileText, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { Event, EventCreate } from '@/types';

interface CalendarExportImportProps {
  onImportComplete?: (importedCount: number) => void;
  className?: string;
}

type ExportFormat = 'json' | 'csv' | 'ical';
type ImportStatus = 'idle' | 'processing' | 'success' | 'error';

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

export function CalendarExportImport({
  onImportComplete,
  className
}: CalendarExportImportProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch all events for export
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => eventsApi.getEvents({}, 1, 10000), // Get all events
    enabled: showExportDialog,
  });
  
  const events = eventsData?.events || [];
  
  const exportToJSON = useCallback((events: Event[]): string => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalEvents: events.length,
      events: events.map(event => ({
        title: event.title,
        description: event.description,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        event_type: event.event_type,
        status: event.status,
        recurrence_type: event.recurrence_type,
        recurrence_interval: event.recurrence_interval,
        recurrence_end_date: event.recurrence_end_date,
        recurrence_count: event.recurrence_count,
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }, []);
  
  const exportToCSV = useCallback((events: Event[]): string => {
    const headers = [
      'Title',
      'Description',
      'Location',
      'Start Time',
      'End Time',
      'All Day',
      'Event Type',
      'Status',
      'Recurrence Type',
      'Recurrence Interval'
    ];
    
    const rows = events.map(event => [
      event.title,
      event.description || '',
      event.location || '',
      event.start_time,
      event.end_time,
      event.all_day ? 'Yes' : 'No',
      event.event_type,
      event.status,
      event.recurrence_type,
      event.recurrence_interval?.toString() || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }, []);
  
  const exportToICal = useCallback((events: Event[]): string => {
    const formatDate = (dateString: string): string => {
      return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icalEvents = events.map(event => {
      const lines = [
        'BEGIN:VEVENT',
        `UID:${event.id}@echo-calendar`,
        `DTSTART:${formatDate(event.start_time)}`,
        `DTEND:${formatDate(event.end_time)}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description}` : '',
        event.location ? `LOCATION:${event.location}` : '',
        `STATUS:${event.status.toUpperCase()}`,
        `CREATED:${formatDate(event.created_at)}`,
        `LAST-MODIFIED:${formatDate(event.updated_at)}`,
        'END:VEVENT'
      ].filter(Boolean);
      
      return lines.join('\r\n');
    }).join('\r\n');
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ECHO Calendar//EN',
      'CALSCALE:GREGORIAN',
      icalEvents,
      'END:VCALENDAR'
    ].join('\r\n');
  }, []);
  
  const handleExport = useCallback(() => {
    if (!events.length) return;
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (exportFormat) {
      case 'json':
        content = exportToJSON(events);
        filename = `echo-calendar-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = exportToCSV(events);
        filename = `echo-calendar-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
      case 'ical':
        content = exportToICal(events);
        filename = `echo-calendar-${timestamp}.ics`;
        mimeType = 'text/calendar';
        break;
      default:
        return;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowExportDialog(false);
  }, [events, exportFormat, exportToJSON, exportToCSV, exportToICal]);
  
  const parseImportFile = useCallback(async (file: File): Promise<EventCreate[]> => {
    const text = await file.text();
    
    if (file.name.endsWith('.json')) {
      const data = JSON.parse(text);
      return data.events || data; // Handle both wrapped and unwrapped formats
    } else if (file.name.endsWith('.csv')) {
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      return lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const event: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header.toLowerCase()) {
            case 'title':
              event.title = value;
              break;
            case 'description':
              event.description = value || undefined;
              break;
            case 'location':
              event.location = value || undefined;
              break;
            case 'start time':
              event.start_time = value;
              break;
            case 'end time':
              event.end_time = value;
              break;
            case 'all day':
              event.all_day = value.toLowerCase() === 'yes';
              break;
            case 'event type':
              event.event_type = value;
              break;
            case 'status':
              event.status = value;
              break;
            case 'recurrence type':
              event.recurrence_type = value;
              break;
            case 'recurrence interval':
              event.recurrence_interval = value ? parseInt(value) : undefined;
              break;
          }
        });
        
        return event;
      });
    }
    
    throw new Error('Unsupported file format');
  }, []);
  
  const handleImport = useCallback(async (file: File) => {
    setImportStatus('processing');
    setImportProgress(0);
    
    try {
      const eventsToImport = await parseImportFile(file);
      const total = eventsToImport.length;
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];
      
      // Import events in batches
      const batchSize = 10;
      for (let i = 0; i < eventsToImport.length; i += batchSize) {
        const batch = eventsToImport.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (eventData, index) => {
            try {
              await eventsApi.createEvent(eventData);
              successful++;
            } catch (error) {
              failed++;
              errors.push(`Event ${i + index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          })
        );
        
        setImportProgress(Math.round(((i + batch.length) / total) * 100));
      }
      
      setImportResult({ successful, failed, errors });
      setImportStatus('success');
      
      if (onImportComplete) {
        onImportComplete(successful);
      }
      
    } catch (error) {
      setImportStatus('error');
      setImportResult({
        successful: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Failed to parse file']
      });
    }
  }, [parseImportFile, onImportComplete]);
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  }, [handleImport]);
  
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Backup your calendar data or import from other sources
          </div>
        </CardContent>
      </Card>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Calendar Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{events.length} events ready to export</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON - Full data with metadata</SelectItem>
                  <SelectItem value="csv">CSV - Spreadsheet compatible</SelectItem>
                  <SelectItem value="ical">iCal - Standard calendar format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || events.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export {events.length} Events
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Calendar Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {importStatus === 'idle' && (
              <>
                <div className="text-sm text-muted-foreground">
                  Import events from JSON, CSV, or iCal files. Supported formats:
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• JSON files exported from ECHO</li>
                  <li>• CSV files with standard calendar columns</li>
                  <li>• iCal (.ics) files from other calendar apps</li>
                </ul>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File to Import
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.ics"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
            
            {importStatus === 'processing' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Importing events...</span>
                </div>
                <Progress value={importProgress} className="w-full" />
                <div className="text-xs text-muted-foreground text-center">
                  {importProgress}% complete
                </div>
              </div>
            )}
            
            {importStatus === 'success' && importResult && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed successfully!
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.successful}
                    </div>
                    <div className="text-xs text-muted-foreground">Imported</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <Label className="text-sm font-medium mb-2 block">Errors:</Label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <div>• ... and {importResult.errors.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {importStatus === 'error' && importResult && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.errors[0] || 'Import failed'}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportStatus('idle');
                setImportResult(null);
                setImportProgress(0);
              }}
            >
              {importStatus === 'success' ? 'Done' : 'Cancel'}
            </Button>
            
            {importStatus === 'success' && (
              <Button
                onClick={() => {
                  setImportStatus('idle');
                  setImportResult(null);
                  setImportProgress(0);
                }}
              >
                Import More
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CalendarExportImport;
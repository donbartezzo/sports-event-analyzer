import { useState } from 'react';
import { format } from 'date-fns';
import { useSupabase } from '../../lib/hooks/useSupabase';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

interface EventDetailsProps {
  eventId: string;
  initialData: {
    id: string;
    title: string;
    date?: string | null;
    type: string;
    status: string;
    teams: {
      home?: string;
      away?: string;
    };
    venue?: string;
    description?: string;
    lastAnalysis?: {
      id?: string;
      date?: string | null;
      finished_at?: string | null;
      status?: string;
      type?: string;
      summary?: string;
      details?: string;
      recommendations?: string;
    } | null;
  };
}

export function EventDetails({ eventId, initialData }: EventDetailsProps) {
  const [event, setEvent] = useState(initialData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();

  const generateAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      // Heurystyka dyscypliny (MVP)
      const inferDiscipline = (val?: string) => {
        const v = (val || '').toLowerCase();
        if (['football','basketball','volleyball','baseball','hockey'].includes(v)) return v;
        // domyślnie football jako najczęstszy przypadek
        return 'football';
      };

      const discipline = inferDiscipline((event as any).type);

      // Zbuduj snapshot do checksumy i analizy: użyj posiadanych danych UI (MVP)
      const snapshot = {
        id: event.id,
        date: event.date,
        teams: event.teams,
        venue: event.venue,
        type: event.type,
        status: event.status,
        description: event.description,
      };

      // Wywołanie endpointu generowania analizy (US-004)
      const resp = await fetch('/api/analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, discipline, snapshot }),
      });

      if (!resp.ok) {
        if (resp.status === 409) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data?.error || 'Brak kompletnych danych do wygenerowania analizy.');
        }
        const text = await resp.text().catch(() => '');
        throw new Error(text || 'Błąd generowania analizy. Spróbuj ponownie później.');
      }

      const { data } = await resp.json();

      setEvent(prev => ({
        ...prev,
        lastAnalysis: {
          date: data?.finished_at || new Date().toISOString(),
          status: 'completed',
          type: data?.type || 'ai',
          summary: data?.summary || '',
          details: data?.details || '',
          recommendations: data?.recommendations || '',
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                <dd className="text-sm">
                  {(() => {
                    const val = (event as any)?.date as string | undefined | null;
                    if (!val) return '—';
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? '—' : format(d, 'PPP');
                  })()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                <dd className="text-sm">{event.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Teams</dt>
                <dd className="text-sm">
                  {event.teams.home} vs {event.teams.away}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Venue</dt>
                <dd className="text-sm">{event.venue}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
            <CardDescription>
              Generate and view analysis for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.lastAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Last Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const la: any = (event as any)?.lastAnalysis || {};
                          const val = (la.finished_at || la.date) as string | undefined | null;
                          if (!val) return '—';
                          const d = new Date(val);
                          return isNaN(d.getTime()) ? '—' : format(d, 'PPP');
                        })()}
                      </p>
                    </div>
                    <Badge>{event.lastAnalysis.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Button onClick={generateAnalysis} disabled={isAnalyzing}>
                      {isAnalyzing ? 'Analyzing…' : 'Generate New Analysis'}
                    </Button>
                    {isAnalyzing && (
                      <p className="text-xs text-muted-foreground">Analiza może potrwać kilka minut…</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No analysis has been generated for this event yet.
                  </p>
                  <div className="space-y-1">
                    <Button onClick={generateAnalysis} disabled={isAnalyzing}>
                      {isAnalyzing ? 'Analyzing…' : 'Generate Analysis'}
                    </Button>
                    {isAnalyzing && (
                      <p className="text-xs text-muted-foreground">Analiza może potrwać kilka minut…</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </CardContent>
      </Card>

      {event.lastAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-2">
                <h4 className="text-sm font-medium">Key Points</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.lastAnalysis?.summary || '—'}
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-2">
                <h4 className="text-sm font-medium">Details</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.lastAnalysis?.details || '—'}
                </div>
              </TabsContent>
              <TabsContent value="recommendations" className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.lastAnalysis?.recommendations || '—'}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

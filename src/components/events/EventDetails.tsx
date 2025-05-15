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
    date: string;
    type: string;
    status: string;
    teams: {
      home: string;
      away: string;
    };
    venue: string;
    description: string;
    lastAnalysis: any;
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

      // Tutaj będzie integracja z API analizy
      const { error: analysisError } = await supabase
        .from('analysis')
        .insert({
          event_id: eventId,
          type: 'basic',
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (analysisError) throw analysisError;

      // Symulacja analizy (do zastąpienia rzeczywistą implementacją)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setEvent(prev => ({
        ...prev,
        lastAnalysis: {
          date: new Date().toISOString(),
          status: 'completed',
          type: 'basic',
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
                  {format(new Date(event.date), 'PPP')}
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
                        {format(new Date(event.lastAnalysis.date), 'PPP')}
                      </p>
                    </div>
                    <Badge>{event.lastAnalysis.type}</Badge>
                  </div>
                  <Button
                    onClick={generateAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Generate New Analysis'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No analysis has been generated for this event yet.
                  </p>
                  <Button
                    onClick={generateAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
                  </Button>
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
              <TabsContent value="summary" className="space-y-4">
                <h4 className="text-sm font-medium">Key Points</h4>
                <ul className="list-disc pl-4 text-sm text-muted-foreground">
                  <li>Example key point 1</li>
                  <li>Example key point 2</li>
                  <li>Example key point 3</li>
                </ul>
              </TabsContent>
              <TabsContent value="details">
                <p className="text-sm text-muted-foreground">
                  Detailed analysis will be shown here...
                </p>
              </TabsContent>
              <TabsContent value="recommendations">
                <p className="text-sm text-muted-foreground">
                  Recommendations based on the analysis will be shown here...
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

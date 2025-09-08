/**
 * GoogleCalendarCallback Component - Handle OAuth2 callback from Google
 * 
 * This component processes the authorization code returned by Google
 * and exchanges it for access tokens.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        setStatus('error');
        setMessage(`Authorization failed: ${error}`);
        return;
      }
      
      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Google');
        return;
      }
      
      try {
        // Exchange code for tokens
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/google-calendar/exchange-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: window.location.origin + '/calendar/google-callback'
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }
        
        const data = await response.json();
        
        // Store access token in localStorage (in production, use secure storage)
        localStorage.setItem('google_calendar_token', data.tokens.access_token);
        
        setStatus('success');
        setMessage('Successfully connected to Google Calendar!');
        
        // Redirect to calendar after 2 seconds
        setTimeout(() => {
          navigate('/calendar');
        }, 2000);
        
      } catch (error) {
        console.error('Error exchanging token:', error);
        setStatus('error');
        setMessage('Failed to complete Google Calendar authorization');
      }
    };
    
    handleCallback();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Connecting to Google Calendar...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Redirecting to calendar...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/calendar')}
                className="mt-4"
              >
                Return to Calendar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GoogleCalendarCallback;
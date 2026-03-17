import React, { useState, useEffect } from "react";
import { gapi } from "gapi-script";
import { 
  Calendar as CalendarIcon, 
  LogIn, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut
} from "lucide-react";

export default function GoogleCalendar({ isDark }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly";

  const cardClass = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const mutedTextClass = isDark ? "text-gray-300" : "text-gray-600";

  useEffect(() => {
    if (!API_KEY || !CLIENT_ID) {
      setError("Keys missing in .env file");
      return;
    }

    // 1. Load GAPI (for Calendar Data)
    const loadGapi = () => {
      gapi.load("client", () => {
        gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        }).then(() => {
          console.log("GAPI Client Initialized");
        }).catch((err) => {
          setError(`GAPI Init Error: ${JSON.stringify(err)}`);
        });
      });
    };

    // 2. Load GIS (for Authentication - The NEW Way)
    const loadGis = () => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              setIsSignedIn(true);
              // Set token in GAPI so it can make requests
              gapi.client.setToken(tokenResponse);
              listUpcomingEvents();
            }
          },
        });
        setTokenClient(client);
        setAuthReady(true);
      } catch (err) {
        console.error("GIS Init Error", err);
        setError("Google Identity Services failed to load. Check internet or ad-blockers.");
      }
    };

    // Load both scripts
    loadGapi();
    
    // Check if 'google' object exists (script loaded in index.html)
    const checkGoogleScript = setInterval(() => {
      if (window.google && window.google.accounts) {
        loadGis();
        clearInterval(checkGoogleScript);
      }
    }, 100);

    return () => clearInterval(checkGoogleScript);
  }, []);

  const handleAuthClick = () => {
    if (!tokenClient) {
      setError("Auth client still loading. Please wait a moment.");
      return;
    }
    // Trigger the popup flow
    tokenClient.requestAccessToken({ prompt: 'consent' });
  };

  const handleSignoutClick = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        gapi.client.setToken('');
        setEvents([]);
        setIsSignedIn(false);
      });
    }
  };

  const listUpcomingEvents = async () => {
    setLoading(true);
    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
      });
      setEvents(response.result.items);
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.status === 401) {
        // Token expired/invalid
        setIsSignedIn(false);
        setError("Session expired. Please connect again.");
      } else {
        setError("Failed to fetch events.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`p-6 rounded-xl border border-red-500/50 bg-red-500/10 ${textClass}`}>
        <h3 className="flex items-center gap-2 font-bold text-red-500 mb-2">
          <AlertCircle className="w-5 h-5" /> Connection Error
        </h3>
        <p className="text-sm font-mono break-all">{error}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border ${cardClass}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${textClass}`}>
          <CalendarIcon className="text-blue-500" /> Google Calendar
        </h2>
        
        {isSignedIn ? (
          <div className="flex gap-2">
            <button onClick={listUpcomingEvents} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${textClass}`} />
            </button>
            <button onClick={handleSignoutClick} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={handleAuthClick} 
            disabled={!authReady}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30 text-white ${authReady ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
          >
            <LogIn className="w-4 h-4" /> {authReady ? 'Connect Calendar' : 'Loading auth...'}
          </button>
        )}
      </div>

      {loading && <div className={`text-center py-4 ${mutedTextClass} animate-pulse`}>Syncing events...</div>}

      {isSignedIn && !loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className={`p-3 rounded-lg border flex justify-between items-start transition-all hover:scale-[1.01] ${isDark ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
              <div>
                <h4 className={`font-medium ${textClass} line-clamp-1`}>{event.summary}</h4>
                <p className={`text-xs mt-1 ${mutedTextClass}`}>
                  {event.start.dateTime 
                    ? new Date(event.start.dateTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})
                    : `All Day - ${new Date(event.start.date).toLocaleDateString()}`
                  }
                </p>
              </div>
              {event.htmlLink && (
                <a href={event.htmlLink} target="_blank" rel="noreferrer" className="mt-1">
                  <ExternalLink className={`w-4 h-4 ${mutedTextClass} hover:text-blue-400`} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      
      {isSignedIn && !loading && events.length === 0 && (
        <div className={`text-center py-8 ${mutedTextClass} flex flex-col items-center gap-2`}>
           <CalendarIcon className="w-8 h-8 opacity-50" />
           <p>No upcoming events found.</p>
        </div>
      )}

      {!isSignedIn && !loading && (
        <div className={`text-center py-8 ${mutedTextClass} flex flex-col items-center gap-2`}>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
          </div>
          <p>Sign in to view your schedule directly here.</p>
        </div>
      )}
    </div>
  );
}
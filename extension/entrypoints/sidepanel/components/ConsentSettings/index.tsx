import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Trash2, Shield, Info, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { ConsentStatusBadge } from '../ConsentStatusBadge';

interface ConsentDecision {
  domain: string;
  granted: boolean;
  timestamp: number;
  permanent: boolean;
}

export default function ConsentSettings(): React.ReactElement {
  const [consentDecisions, setConsentDecisions] = useState<Record<string, ConsentDecision>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [removingDomains, setRemovingDomains] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConsentDecisions();
    
    // Listen for storage changes to update UI in real-time
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.mcp_consent_decisions) {
        setConsentDecisions(changes.mcp_consent_decisions.newValue || {});
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    // Also listen for runtime messages for immediate updates
    const handleMessage = (message: any) => {
      if (message.type === 'consent-updated') {
        loadConsentDecisions();
        // Toast notifications are now handled globally in __root.tsx
      }
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const loadConsentDecisions = async () => {
    try {
      const result = await chrome.storage.local.get('mcp_consent_decisions');
      setConsentDecisions(result.mcp_consent_decisions || {});
    } catch (error) {
      console.error('Failed to load consent decisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeConsent = async (domain: string) => {
    try {
      // Add domain to removing set for animation
      setRemovingDomains(prev => new Set(prev).add(domain));
      
      // Send message to background to handle consent removal and disconnection
      await chrome.runtime.sendMessage({
        type: 'remove-consent',
        domain: domain
      });
      
      // Show enhanced success toast with action
      toast.success(`Access revoked for ${domain}`, {
        description: 'MCP servers disconnected and permissions removed',
        action: {
          label: 'Open Settings',
          onClick: () => chrome.runtime.openOptionsPage()
        }
      });
      
      // Small delay to let the animation show before removing from state
      setTimeout(() => {
        setRemovingDomains(prev => {
          const newSet = new Set(prev);
          newSet.delete(domain);
          return newSet;
        });
      }, 300);
      
    } catch (error) {
      console.error('Failed to remove consent:', error);
      
      // Show enhanced error toast with action
      toast.error(`Failed to revoke access for ${domain}`, {
        description: 'Please try again or check your network connection',
        action: {
          label: 'Retry',
          onClick: () => removeConsent(domain)
        }
      });
      
      // Remove from removing set if error occurs
      setRemovingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domain);
        return newSet;
      });
    }
  };

  const clearAllConsent = async () => {
    const count = Object.keys(consentDecisions).length;
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to clear all consent decisions?\n\nThis will remove access for ${count} domain${count !== 1 ? 's' : ''} and disconnect all MCP servers. This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      // Send message to background to handle clearing all consent
      await chrome.runtime.sendMessage({
        type: 'clear-all-consent'
      });
      
      // Update local state
      setConsentDecisions({});
      
      // Show enhanced success toast
      toast.success(`All consent cleared`, {
        description: `Removed access for ${count} domain${count !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Failed to clear all consent:', error);
      
      // Show error toast
      toast.error('Failed to clear all consent', {
        description: 'Please try again'
      });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const grantedDomains = Object.values(consentDecisions).filter(d => d.granted);
  const deniedDomains = Object.values(consentDecisions).filter(d => !d.granted);

  if (isLoading) {
    return (
      <div className="h-full p-3">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4" />
          <h2 className="text-sm font-medium">MCP Consent Settings</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-pulse">Loading consent settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-4 w-4" />
        <h2 className="text-sm font-medium">MCP Consent Settings</h2>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-xs">Security Notice</AlertTitle>
        <AlertDescription className="text-xs">
          MCP servers can access and interact with web page data. Only grant consent to websites you trust.
        </AlertDescription>
      </Alert>

      {grantedDomains.length === 0 && deniedDomains.length === 0 ? (
        <Card className="p-4 text-center">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No consent decisions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Visit MCP-enabled websites to manage permissions
          </p>
        </Card>
      ) : (
        <>
          {grantedDomains.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-600">Allowed Domains</h3>
                <Badge variant="secondary" className="text-xs">
                  {grantedDomains.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {grantedDomains.map((decision) => (
                  <Card 
                    key={decision.domain} 
                    className={cn(
                      "p-3 transition-all duration-300 ease-in-out",
                      removingDomains.has(decision.domain) 
                        ? "opacity-0 scale-95 translate-x-4" 
                        : "opacity-100 scale-100 translate-x-0"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium truncate">
                            {decision.domain}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <ConsentStatusBadge 
                            domain={decision.domain} 
                            consentDecisions={consentDecisions}
                          />
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(decision.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeConsent(decision.domain)}
                        disabled={removingDomains.has(decision.domain)}
                        className={cn(
                          "h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors",
                          removingDomains.has(decision.domain) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {deniedDomains.length > 0 && (
            <div data-section="denied-domains">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-600">Denied Domains</h3>
                <Badge variant="secondary" className="text-xs">
                  {deniedDomains.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {deniedDomains.map((decision) => (
                  <Card 
                    key={decision.domain} 
                    className={cn(
                      "p-3 transition-all duration-300 ease-in-out",
                      removingDomains.has(decision.domain) 
                        ? "opacity-0 scale-95 translate-x-4" 
                        : "opacity-100 scale-100 translate-x-0"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-sm font-medium truncate">
                            {decision.domain}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <ConsentStatusBadge 
                            domain={decision.domain} 
                            consentDecisions={consentDecisions}
                          />
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(decision.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeConsent(decision.domain)}
                        disabled={removingDomains.has(decision.domain)}
                        className={cn(
                          "h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors",
                          removingDomains.has(decision.domain) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={clearAllConsent}
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              disabled={grantedDomains.length === 0 && deniedDomains.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear All Consent Decisions
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

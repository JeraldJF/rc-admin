import { useEffect, useState } from 'react';
import { rewriteHydraRedirect } from '@/lib/oauth2';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Consent() {
    const [searchParams] = useSearchParams();
    const consentChallenge = searchParams.get('consent_challenge');
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        if (!consentChallenge) {
            setError('No consent challenge found');
            return;
        }

        try {
            // First, get the consent request to extract user info
            const consentRequest = await fetch(
                `/auth/hydra-consent-request?consent_challenge=${encodeURIComponent(consentChallenge)}`
            );

            if (!consentRequest.ok) {
                throw new Error('Failed to get consent request');
            }

            const consentData = await consentRequest.json();

            // Extract user info from Hydra Context (passed from Login page)
            const userEmail = consentData.context?.email || sessionStorage.getItem('userEmail') || consentData.subject;
            const userRole = consentData.context?.role || sessionStorage.getItem('userRole') || 'employee';
            // personalId is the cedula from OIDC sub — the canonical identifier for registry ABAC
            const personalId = consentData.context?.personalId || '';

            // Accept consent with session claims mapped to top-level
            const acceptResponse = await fetch('/auth/hydra-accept-consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consent_challenge: consentChallenge,
                    grant_scope: ['openid', 'offline_access', 'email', 'profile'],
                    grant_access_token_audience: [],
                    remember: true,
                    remember_for: 3600,
                    session: {
                        access_token: {
                            ext: {
                                role: [userRole],  // array required — registry reads role via JsonPath as ArrayList
                                personalIdentification: personalId,
                            },
                        },
                        id_token: {
                            email: userEmail,
                            personalIdentification: personalId,
                            role: [userRole],
                            name: consentData.context?.name || userEmail.split('@')[0]
                        }
                    }
                }),
            });

            if (!acceptResponse.ok) {
                throw new Error('Failed to accept consent');
            }

            const acceptData = await acceptResponse.json();

            // Redirect via proxy so CSRF cookie origin matches
            window.location.href = rewriteHydraRedirect(acceptData.redirect_to);
        } catch (err: any) {
            console.error('Consent error:', err);
            setError(err.message || 'Failed to process consent');
        }
    };
    
    useEffect(() => {
        if (consentChallenge) {
            handleAccept();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consentChallenge]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Card className="w-full max-w-md border-red-200">
                    <CardContent className="pt-6">
                        <div className="text-red-600 font-medium flex items-center gap-2">
                            <span>⚠️</span> Error: {error}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show minimal loading state during auto-accept
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                <p className="text-slate-600">Authorizing access...</p>
            </div>
        </div>
    );
}

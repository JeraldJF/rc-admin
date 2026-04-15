import { useEffect, useState } from 'react';
import { rewriteHydraRedirect } from '@/lib/oauth2';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export default function Consent() {
    const [searchParams] = useSearchParams();
    const consentChallenge = searchParams.get('consent_challenge');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        if (!consentChallenge) {
            setError('No consent challenge found');
            return;
        }

        setIsLoading(true);

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
                            // These will be at the TOP LEVEL of the JWT, not nested
                            email: userEmail,
                            role: [userRole],  // array required — registry reads role via JsonPath as ArrayList
                        },
                        id_token: {
                            email: userEmail,
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
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (consentChallenge) {
            handleAccept();
        }
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="max-w-md w-full space-y-6">

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Authorize Access</h1>
                    <p className="text-slate-600">
                        The application <strong>EduTech Portal</strong> is requesting access to your account.
                    </p>
                </div>

                <Card className="w-full shadow-lg border-0">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-5 w-5 text-green-600" />
                            Review Permissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xl">👤</span>
                                <div>
                                    <h4 className="font-semibold text-sm">View Profile</h4>
                                    <p className="text-xs text-slate-500">Read your personal information and contact details.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xl">📧</span>
                                <div>
                                    <h4 className="font-semibold text-sm">Email Access</h4>
                                    <p className="text-xs text-slate-500">View your primary email address.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleAccept}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authorizing...
                                    </>
                                ) : (
                                    "Allow Access"
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-slate-500 text-xs"
                                onClick={async () => {
                                    if (!consentChallenge) return;
                                    setIsLoading(true);
                                    try {
                                        const rejectResponse = await fetch('/auth/hydra-reject-consent', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                consent_challenge: consentChallenge,
                                                error: 'access_denied',
                                                error_description: 'The user denied the request',
                                            }),
                                        });
                                        if (rejectResponse.ok) {
                                            const rejectData = await rejectResponse.json();
                                            window.location.href = rejectData.redirect_to;
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

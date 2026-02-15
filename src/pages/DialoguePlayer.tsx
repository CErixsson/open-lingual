import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDialogue } from '@/hooks/useDialogue';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send, Loader2, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, Lightbulb,
  MessageCircle, Lock, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'controlled' | 'guided' | 'open';

export default function DialoguePlayer() {
  const { id: scenarioId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    sessionId, messages, isLoading, lastEvaluation,
    lastRatingDeltas, options, hints, userCefr,
    startSession, sendMessage, completeSession,
  } = useDialogue();

  const [mode, setMode] = useState<Mode>('controlled');
  const [input, setInput] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = async (selectedMode: Mode) => {
    if (!scenarioId) return;
    setMode(selectedMode);
    try {
      await startSession(scenarioId, selectedMode);
      setSessionStarted(true);
    } catch {
      // error handled in hook
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    try {
      await sendMessage(msg);
    } catch {
      // error handled in hook
    }
  };

  const handleComplete = async () => {
    await completeSession();
    navigate('/scenarios');
  };

  // Mode selection screen
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/scenarios')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scenarios
          </Button>
          <h1 className="text-2xl font-bold">Choose Dialogue Mode</h1>

          <div className="grid gap-4">
            <Card
              className="cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => handleStart('controlled')}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge>Mode 1</Badge>
                  <h3 className="font-semibold">Controlled</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multiple choice & fill-in-blanks. Hints available. Low rating impact.
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => handleStart('guided')}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">Mode 2</Badge>
                  <h3 className="font-semibold">Guided</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free text with vocabulary suggestions. Medium rating impact.
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => handleStart('open')}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline">Mode 3</Badge>
                  <h3 className="font-semibold">Open Conversation</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fully free-form. AI asks follow-ups. High rating impact. Difficulty adapts in real time.
                </p>
              </CardContent>
            </Card>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Starting session...</span>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-4 max-w-2xl flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{mode}</Badge>
            <Badge variant="secondary">{userCefr}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleComplete}>
            End Session
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 rounded-xl border border-border/50 bg-card p-4 min-h-[300px]">
          {messages.filter(m => m.role !== 'system').map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Evaluation feedback */}
        {lastEvaluation && (
          <div className="mb-3 rounded-xl border border-border/50 bg-card p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Grammar', value: lastEvaluation.grammar_accuracy },
                { label: 'Vocabulary', value: lastEvaluation.lexical_complexity },
                { label: 'Fluency', value: lastEvaluation.fluency },
                { label: 'Register', value: lastEvaluation.register },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className={`text-sm font-bold ${item.value >= 0.7 ? 'text-primary' : item.value >= 0.4 ? 'text-yellow-500' : 'text-destructive'}`}>
                    {(item.value * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Rating deltas */}
            {lastRatingDeltas && Object.keys(lastRatingDeltas).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                {Object.entries(lastRatingDeltas).map(([key, delta]) => (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      delta.delta >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {delta.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {delta.skillName}: {delta.delta >= 0 ? '+' : ''}{delta.delta}
                  </span>
                ))}
              </div>
            )}

            {/* Corrections */}
            {lastEvaluation.corrections?.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/50">
                {lastEvaluation.corrections.map((c, i) => (
                  <p key={i}>💡 {c}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controlled mode options */}
        {mode === 'controlled' && options && options.length > 0 && (
          <div className="mb-3 grid gap-2">
            {options.map((opt: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => handleSend(typeof opt === 'string' ? opt : opt.text)}
                disabled={isLoading}
              >
                <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold mr-2 shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {typeof opt === 'string' ? opt : opt.text}
              </Button>
            ))}
          </div>
        )}

        {/* Hints */}
        {hints.length > 0 && mode !== 'open' && (
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              {showHints ? 'Hide hints' : 'Show hints'}
            </Button>
            {showHints && (
              <div className="mt-1 space-y-1">
                {hints.map((h, i) => (
                  <p key={i} className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    💡 {typeof h === 'string' ? h : (h as any).text || JSON.stringify(h)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        {(mode !== 'controlled' || !options?.length) && (
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === 'guided' ? 'Type your response (suggestions available)...' : 'Type your response...'}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

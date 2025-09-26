import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus, Sparkles, X, Send } from 'lucide-react';

export default function AiAssistantWidget() {
    // Start minimized by default; user can expand as needed
    const [minimized, setMinimized] = useState(true);
    const [mode, setMode] = useState<'tanya' | 'diagnosa'>('tanya');
    const [text, setText] = useState('');

    // Auto-minimize on Inertia navigation start so it closes on page changes
    useEffect(() => {
        const onStart = () => setMinimized(true);
        // Inertia fires DOM events on document
        document.addEventListener('inertia:start', onStart);
        return () => document.removeEventListener('inertia:start', onStart);
    }, []);

    const handleSubmit = () => {
        if (mode === 'tanya') {
            const payload = { type: 'tanya', message: text.trim() };
            // TODO: integrate with backend or AI service
            console.log('AI Assistant submit:', payload);
            if (text.trim()) setText('');
        } else {
            const payload = { type: 'diagnosa' };
            // TODO: integrate with backend or AI service
            console.log('AI Assistant submit:', payload);
        }
    };

    // Floating minimized button
    if (minimized) {
        return (
            <button
                type="button"
                onClick={() => setMinimized(false)}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700 focus:outline-none"
                aria-label="Open AI Assistant"
                title="Open AI Assistant"
            >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[28rem] max-w-[calc(100vw-2rem)]">
            <Card className="shadow-xl border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMinimized(true)} title="Minimize">
                            <Minus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="h-[20rem] bg-background">
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="space-y-2 text-center">
                            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
                            <h3 className="text-base font-semibold">AI Assistant</h3>
                            <p className="text-sm text-muted-foreground">Coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t bg-background/80 px-3 py-2">
                    <div className="flex flex-col gap-2">
                        {/* Top: Wide textarea that grows vertically */}
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (mode === 'tanya' && e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            disabled={mode === 'diagnosa'}
                            placeholder={mode === 'tanya' ? 'Tulis pertanyaan... (Enter untuk kirim, Shift+Enter baris baru)' : 'Mode Diagnosa - input dinonaktifkan'}
                            rows={3}
                            className="w-full text-sm resize-none overflow-x-hidden max-h-16 overflow-y-auto"
                        />

                        {/* Bottom: Select on left, Enter button on right */}
                        <div className="flex items-center gap-2">
                            <Select value={mode} onValueChange={(v) => setMode((v as 'tanya' | 'diagnosa'))}>
                                <SelectTrigger className="h-8 w-[110px]">
                                    <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tanya">Tanya</SelectItem>
                                    <SelectItem value="diagnosa">Diagnosa</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex-1" />

                            <Button size="sm" onClick={handleSubmit} className="h-8" aria-label="Kirim">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

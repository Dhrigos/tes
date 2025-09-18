import React, { useEffect, useRef } from 'react';
import type { Editor as TinyMCEEditor } from 'tinymce';

interface RichTextEditorProps {
    value?: string;
    onChange?: (content: string) => void;
    // Debounce interval for onChange to mengurangi lag saat mengetik
    onChangeDebounceMs?: number;
    placeholder?: string;
    height?: number;
    id?: string;
    name?: string;
    // Show AI button in toolbar (e.g., only for Assessment editor)
    showAiButton?: boolean;
    // Optional click handler for AI button; if not provided, a simple prompt is used
    onAiClick?: (editor: TinyMCEEditor) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value = '', onChange, onChangeDebounceMs = 300, placeholder = 'Masukkan teks...', height = 200, id, name, showAiButton = false, onAiClick }) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const editorRef = useRef<TinyMCEEditor | null>(null);
    const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize TinyMCE (Community) on mount
    useEffect(() => {
        let active = true;
        if (!textareaRef.current) return;

        const init = async () => {
            // Load TinyMCE via a local bundler-friendly module to avoid scattered dynamic imports
            const { default: tinymce } = await import('@/lib/tinymceLoader');
            // Load content CSS URL via bundler so it applies only inside editor (not globally)
            const contentCssUrl = (await import('tinymce/skins/content/default/content.min.css?url')).default as string;

            if (!active || !textareaRef.current) return;

            tinymce.init({
                target: textareaRef.current,
                height: height,
                inline: false,
                menubar: false,
                plugins: ['lists', 'link', 'code'],
                toolbar:
                    'undo redo | blocks | ' +
                    'bold italic | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat' +
                    (showAiButton ? ' | ai' : '') +
                    ' | mic',
                // UI skin CSS is imported globally by the loader (oxide), so disable TinyMCE fetching it
                skin: false,
                // Use TinyMCE content CSS inside iframe for better default styling
                content_css: contentCssUrl,
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                placeholder: placeholder,
                license_key: 'gpl',
                promotion: false,
                branding: false,
                elementpath: false,
                statusbar: false,
                toolbar_mode: 'sliding',
                resize: false,
                min_height: height,
                max_height: height,
                paste_data_images: true,
                automatic_uploads: false,
                file_picker_types: 'image',
                setup: (editor) => {
                    editorRef.current = editor;

                    // TinyMCE 8+ deprecates editor.fire; prefer editor.dispatch when available
                    const safeDispatch = (name: string) => {
                        const anyEditor = editor as unknown as { dispatch?: (n: string) => void; fire?: (n: string) => void };
                        if (typeof anyEditor.dispatch === 'function') {
                            anyEditor.dispatch(name);
                        } else if (typeof anyEditor.fire === 'function') {
                            // Fallback for older versions
                            // @ts-ignore
                            anyEditor.fire(name as any);
                        }
                    };

                    // Register a custom microphone icon
                    try {
                        editor.ui.registry.addIcon(
                            'mic',
                            // Simple microphone SVG icon
                            '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>'
                        );
                    } catch { }

                    // Register AI icon and button if requested
                    if (showAiButton) {
                        try {
                            editor.ui.registry.addIcon(
                                'ai',
                                '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2l1.76 3.57L17.7 6.2l-2.7 2.63.64 3.86L12 10.96 8.36 12.69l.64-3.86L6.3 6.2l3.94-.63L12 2zm-6 14.5l2-1 .5-2 1.5 1.4 2-.4-1 1.9.9 1.8-2-.3-1.4 1.5-.2-2.1-1.8-.9z"/></svg>'
                            );
                        } catch { }

                        const handleAiAction = async () => {
                            try {
                                if (onAiClick) {
                                    onAiClick(editor as unknown as TinyMCEEditor);
                                } else {
                                    const text = window.prompt('Masukkan teks dari AI untuk disisipkan:');
                                    if (text && text.trim()) {
                                        editor.insertContent(text.trim());
                                        safeDispatch('change');
                                    }
                                }
                            } catch {
                                // ignore
                            }
                        };

                        editor.ui.registry.addButton('ai', {
                            icon: 'ai',
                            tooltip: 'AI Assist',
                            onAction: handleAiAction,
                        });
                    }

                    // Web Speech API integration for speech-to-text
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    let recognition: any = null;
                    let recognizing = false;
                    let lastRange: any = null;

                    const isSupported = typeof SpeechRecognition === 'function';

                    if (isSupported) {
                        recognition = new SpeechRecognition();
                        recognition.lang = 'id-ID';
                        recognition.continuous = true;
                        recognition.interimResults = true;

                        recognition.onstart = () => {
                            recognizing = true;
                            safeDispatch('MicStart');
                        };
                        recognition.onend = () => {
                            recognizing = false;
                            safeDispatch('MicEnd');
                        };
                        recognition.onerror = () => {
                            recognizing = false;
                            safeDispatch('MicEnd');
                        };

                        recognition.onresult = (event: any) => {
                            let finalTranscript = '';
                            for (let i = event.resultIndex; i < event.results.length; ++i) {
                                const result = event.results[i];
                                if (result.isFinal) {
                                    finalTranscript += result[0].transcript;
                                }
                            }
                            if (finalTranscript) {
                                // Restore last selection if available to insert at caret where mic started
                                try {
                                    if (lastRange) {
                                        editor.selection.setRng(lastRange);
                                    }
                                } catch { }
                                editor.insertContent(finalTranscript);
                                safeDispatch('change');
                            }
                        };
                    }

                    // Add toolbar toggle button
                    editor.ui.registry.addToggleButton('mic', {
                        icon: 'mic',
                        tooltip: isSupported ? 'Mulai/Diamkan dikte' : 'Speech-to-text tidak didukung browser',
                        onAction: () => {
                            if (!isSupported) return;
                            try {
                                if (!recognizing) {
                                    // Save current range before starting
                                    try {
                                        lastRange = editor.selection.getRng();
                                    } catch {
                                        lastRange = null;
                                    }
                                    recognition.start();
                                } else {
                                    recognition.stop();
                                }
                            } catch {
                                // ignore start/stop errors
                            }
                        },
                        onSetup: (api) => {
                            const onStart = () => api.setActive(true);
                            const onEnd = () => api.setActive(false);
                            editor.on('MicStart', onStart);
                            editor.on('MicEnd', onEnd);
                            return () => {
                                editor.off('MicStart', onStart);
                                editor.off('MicEnd', onEnd);
                            };
                        },
                    });

                    editor.on('init', () => {
                        if (value) {
                            editor.setContent(value);
                        }
                    });

                    const handler = () => {
                        if (!onChange) return;
                        if (changeTimeoutRef.current) {
                            clearTimeout(changeTimeoutRef.current);
                        }
                        changeTimeoutRef.current = setTimeout(() => {
                            try {
                                const content = editor.getContent();
                                onChange(content);
                            } catch { }
                        }, Math.max(0, onChangeDebounceMs || 0));
                    };
                    // Kurangi event: hindari keyup agar tidak trigger tiap ketikan
                    editor.on('input undo redo change', handler);
                },
            });
        };

        void init();

        return () => {
            active = false;
            try {
                if (editorRef.current) {
                    editorRef.current.remove();
                    editorRef.current = null;
                }
                if (changeTimeoutRef.current) {
                    clearTimeout(changeTimeoutRef.current);
                    changeTimeoutRef.current = null;
                }
            } catch {
                // ignore
            }
        };

    }, []);

    // Sync external value changes into the editor
    useEffect(() => {
        const ed = editorRef.current;
        // Hindari setContent saat editor fokus agar tidak mengganggu mengetik
        if (ed && typeof value === 'string') {
            let current = '';
            try {
                current = ed.getContent();
            } catch { }
            if (value !== current && !ed.hasFocus()) {
                ed.setContent(value);
            }
        }
    }, [value]);

    return <textarea ref={textareaRef} id={id} name={name} defaultValue={value} />;
};

export default RichTextEditor;

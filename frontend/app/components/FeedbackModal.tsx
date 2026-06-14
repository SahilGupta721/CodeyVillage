// components/FeedbackModal.tsx
"use client";

import { useState } from "react";

const MODAL_BG = '#0a0e1a';
const BORDER = '#1A2030';
const ACCENT = '#A8B8FF';
const TEXT = '#FFD88A';
const DIM = '#7A8AAA';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const inputStyle = {
        width: '100%',
        background: '#0D1020',
        border: `2px solid ${BORDER}`,
        boxShadow: `inset 2px 2px 0 0 #050810`,
        padding: '10px 12px',
        fontFamily: 'var(--font-pixel),monospace',
        fontSize: 8,
        color: TEXT,
        letterSpacing: '0.03em',
        outline: 'none',
        boxSizing: 'border-box' as const,
    };

    const labelStyle = {
        fontFamily: 'var(--font-pixel),monospace',
        fontSize: 7,
        color: ACCENT,
        letterSpacing: '0.05em',
        marginBottom: 6,
        display: 'block' as const,
    };

    const handleSubmit = () => {
        if (!name || !email || !message) return;
        // TODO: wire up to your backend/API
        console.log({ name, email, message });
        setSubmitted(true);
    };

    return (
        // Backdrop
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
        >
            {/* Modal box — stop click propagation so clicking inside doesn't close */}
            <div
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 480, background: '#111827', border: `3px solid ${BORDER}`, boxShadow: `inset 2px 2px 0 0 #1A2030, inset -2px -2px 0 0 #050810, 6px 6px 0 0 #000`, padding: 28, position: 'relative' }}
            >
                {/* Corner accents */}
                {['top', 'bottom'].map(v => ['left', 'right'].map(h => (
                    <div key={`${v}${h}`}>
                        <div style={{ position: 'absolute', [v]: 8, [h]: 8, width: 14, height: 2, background: ACCENT }} />
                        <div style={{ position: 'absolute', [v]: 8, [h]: 8, width: 2, height: 14, background: ACCENT }} />
                    </div>
                )))}

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 11, color: TEXT, textShadow: `2px 2px 0 #080400`, letterSpacing: '0.06em', marginBottom: 8 }}>
                        SEND FEEDBACK
                    </div>
                    <div style={{ height: 2, backgroundImage: `repeating-linear-gradient(90deg,${ACCENT} 0px,${ACCENT} 6px,transparent 6px,transparent 10px)` }} />
                </div>

                {submitted ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 10, color: '#5BFFD8', marginBottom: 10 }}>✓ RECEIVED!</div>
                        <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: DIM }}>THANKS FOR YOUR FEEDBACK.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div>
                            <label style={labelStyle}>NAME</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="PLAYER ONE" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>EMAIL</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="YOU@EMAIL.COM" type="email" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>MESSAGE</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="TELL US WHAT YOU THINK..." rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={onClose}
                                style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: DIM, background: 'transparent', border: `2px solid ${BORDER}`, padding: '9px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleSubmit}
                                style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: '#0a0e1a', background: ACCENT, border: `2px solid #6070BB`, boxShadow: `inset 1px 1px 0 0 #C8D8FF, 2px 2px 0 0 #050810`, padding: '9px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}
                            >
                                SUBMIT  ▶
                            </button>
                        </div>
                    </div>
                )}

                {/* Close X */}
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: 10, right: 14, background: 'transparent', border: 'none', color: DIM, fontFamily: 'var(--font-pixel),monospace', fontSize: 10, cursor: 'pointer' }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
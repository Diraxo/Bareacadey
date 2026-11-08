import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import useHomeSlides from '../../../../utils/useHomeSlides';
import { useNavigate } from 'react-router-dom';

/* Timing of the slider: a new slide every 4 s; each change is a 0.8 s cross-fade with a slight slide, on an ease-in-out
 * curve. Pauses while the pointer or keyboard focus is on it, and while the tab is hidden. Reduced-motion users get
 * no auto-play and no movement (the slides still change instantly). */
export const AUTO_PLAY_MS = 4000;
export const GLIDE_MS = 800;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Arrow = ({ side, onClick, label, size = 40 }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        style={{
            position: 'absolute', top: '50%', [side]: 4, transform: 'translateY(-50%)', zIndex: 2,
            width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: `background-color 250ms ${EASE}, transform 250ms ${EASE}`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-50%)'; }}
    >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
        </svg>
    </button>
);

/* Slides are stacked in one grid cell (the cell takes the height of the tallest), and only the current one is visible:
 * the others fade out and drift away, so there is never a jump or a blank frame between slides. */
const SlideShow = ({ items, color, renderItem, compact = false }) => {
    const count = items.length;
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(typeof document !== 'undefined' && document.visibilityState === 'hidden');
    const [dir, setDir] = useState(1);
    const touchX = useRef(null);
    const reduced = useRef(prefersReducedMotion()).current;
    const current = index < count ? index : 0;

    const go = (to, d) => { setDir(d); setIndex(((to % count) + count) % count); };

    useEffect(() => {
        const onVisibility = () => setHidden(document.visibilityState === 'hidden');
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    // one timer at a time; any change of slide (also a manual one) restarts the count
    useEffect(() => {
        if (count < 2 || paused || hidden || reduced) return;
        const t = setTimeout(() => go(current + 1, 1), AUTO_PLAY_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, count, paused, hidden]);

    return (
        <div
            style={{ position: 'relative', maxWidth: '100%', minWidth: 0 }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
            onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - (touchX.current ?? e.changedTouches[0].clientX);
                touchX.current = null;
                setPaused(false);
                if (Math.abs(dx) > 40 && count > 1) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
            }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured"
        >
            <div style={{ display: 'grid', overflow: 'hidden', minWidth: 0 }}>
                {items.map((item, i) => {
                    const active = i === current;
                    const shift = reduced ? 0 : (active ? 0 : (dir > 0 ? 28 : -28));
                    return (
                        <div
                            key={item.id}
                            aria-hidden={!active}
                            style={{
                                gridArea: '1 / 1',
                                minWidth: 0,
                                opacity: active ? 1 : 0,
                                transform: `translateX(${shift}px)`,
                                visibility: active ? 'visible' : 'hidden',
                                pointerEvents: active ? 'auto' : 'none',
                                transition: reduced
                                    ? 'none'
                                    : `opacity ${GLIDE_MS}ms ${EASE}, transform ${GLIDE_MS}ms ${EASE}, visibility 0s linear ${active ? 0 : GLIDE_MS}ms`,
                                willChange: 'opacity, transform',
                            }}
                        >
                            {renderItem(item)}
                        </div>
                    );
                })}
            </div>
            {count > 1 && (
                <>
                    <Arrow side="left" size={compact ? 32 : 40} label="Previous slide" onClick={() => go(current - 1, -1)} />
                    <Arrow side="right" size={compact ? 32 : 40} label="Next slide" onClick={() => go(current + 1, 1)} />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                        {items.map((item, i) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={`Show slide ${i + 1}`}
                                aria-current={i === current}
                                onClick={() => go(i, i > current ? 1 : -1)}
                                style={{
                                    width: i === current ? 26 : 9, height: 9, borderRadius: 5, border: 'none', padding: 0, cursor: 'pointer',
                                    background: i === current ? (color || '#1976d2') : 'rgba(0,0,0,0.22)',
                                    transition: `width 400ms ${EASE}, background-color 400ms ${EASE}`,
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const HomeCorousel = ({style}) => {
    const navigate = useNavigate();

    // slides come only from the API, newest first, and appear once their pictures are downloaded
    const { status, slides: corouselItems } = useHomeSlides();

    const theme = useTheme();
    const stacked = useMediaQuery(theme.breakpoints.down('md')); // phones and tablets: picture on top, text under it
    const phone = useMediaQuery(theme.breakpoints.down('sm'));

    const itemTemplate = (item) => {
        const {title, subtitle, action_message, action_button_type, enable_action_button} = item;
        const imgSrc = item.src;
        // room on both sides so the round arrows never sit on top of the text
        const sidePad = stacked ? (phone ? 30 : 44) : 52;
        return (
            <div style={{background: "radial-gradient(circle at center, #f1f8fe 0%, #f1f9fc 25%, #f1f8fe 50%, #f1faff 100%)"}}>
                <div style={{
                    display: 'flex',
                    flexDirection: stacked ? 'column-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: stacked ? 16 : 32,
                    padding: `0 ${sidePad}px`,
                    boxSizing: 'border-box',
                    width: '100%',
                }}>
                    <div style={{ flex: stacked ? '0 0 auto' : '1 1 0', minWidth: 0, width: stacked ? '100%' : undefined, textAlign: stacked ? 'center' : 'left' }}>
                        <div className='flex flex-col justify-center' style={{ alignItems: stacked ? 'center' : 'flex-start' }}>
                            <p className='uppercase' style={{color: style?.backgroundColor, fontWeight: 500, fontSize: 'clamp(14px, 2.4vw, 20px)', overflowWrap: 'anywhere'}}>{title}</p>
                            <p style={{fontWeight: 700, fontSize: 'clamp(20px, 3.6vw, 28px)', lineHeight: 1.25, overflowWrap: 'anywhere'}}>{subtitle}</p>
                            <p className='text-[#8c9194] mt-4' style={{fontSize: 'clamp(14px, 2.2vw, 18px)', overflowWrap: 'anywhere'}}>{action_message}</p>
                            {enable_action_button &&
                            <>
                            {action_button_type === "Register" &&
                                <Button
                                variant='contained'
                                className='mt-3'
                                size={phone ? 'medium' : 'large'}
                                onClick={()=>{
                                  navigate("/auth/register")
                                }}
                            >Register</Button>
                            }
                            {action_button_type === "Contact Us" &&
                                <Button
                                variant='contained'
                                className='mt-3'
                                size={phone ? 'medium' : 'large'}
                                onClick={()=>{
                                    navigate("/contact_us")
                                }}
                            >Contact Us</Button>
                        }
                        </>}
                        </div>
                    </div>
                    <div style={{ flex: stacked ? '0 0 auto' : '1 1 0', minWidth: 0, width: stacked ? '100%' : undefined }} className='flex items-center justify-center'>
                      <img src={imgSrc} alt={title} decoding="async" className='rounded' style={{mixBlendMode: 'multiply', objectFit: "contain", width: '100%', height: 'auto', maxWidth: '100%', maxHeight: stacked ? (phone ? 220 : 320) : 420, aspectRatio: '3/2', display: 'block'}} />
                    </div>
                </div>
            </div>
        );
    };

    const panelBackground = "radial-gradient(circle at center, #f1f8fe 0%, #f1f9fc 25%, #f1f8fe 50%, #f1faff 100%)";

    // not decided yet: hold the space with the panel's own colour (never a black box)
    if (status === 'loading') return <div className="rounded-xl w-full" style={{ background: panelBackground, minHeight: phone ? 300 : 360, maxWidth: '100%' }} aria-hidden="true" />;
    // the admin has added no slide, or none could be loaded: nothing is drawn (no stand-in banner, no old copy)
    if (status !== 'ready' || !(corouselItems?.length > 0)) return null;

    return (
        <div className="shadow-1 rounded-xl" style={{background: panelBackground, padding: phone ? 10 : 20, width: '100%', boxSizing: 'border-box', overflow: 'hidden'}}>
            <SlideShow items={corouselItems} color={style?.backgroundColor} renderItem={itemTemplate} compact={phone} />
        </div>
    )
}

export default HomeCorousel;

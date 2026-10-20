import React from 'react'

/*
  Animated flower garden for the site header.

  On load every stem draws upward, the leaves unfold and the blooms open
  petal by petal. Afterwards the stems sway very slowly. All motion is CSS
  (see "Flower garden" in App.css) and is switched off for people who prefer
  reduced motion.
*/

// Petal rings: [count, rx, ry, distance from centre, start angle]
const ring = (n, offset = 0) =>
    Array.from({ length: n }, (_, i) => (360 / n) * i + offset)

const Peony = () => (
    <g className="head">
        <g className="ring ring-3">
            {ring(10).map((a, i) => (
                <g key={a} transform={`rotate(${a})`}>
                    <ellipse className="petal" style={{ '--i': i }} cx="0" cy="-17" rx="11" ry="17" fill="url(#gPetalOuter)" />
                </g>
            ))}
        </g>
        <g className="ring ring-2">
            {ring(8, 18).map((a, i) => (
                <g key={a} transform={`rotate(${a})`}>
                    <ellipse className="petal" style={{ '--i': i + 3 }} cx="0" cy="-12" rx="9" ry="13" fill="url(#gPetalMid)" />
                </g>
            ))}
        </g>
        <g className="ring ring-1">
            {ring(6, 8).map((a, i) => (
                <g key={a} transform={`rotate(${a})`}>
                    <ellipse className="petal" style={{ '--i': i + 6 }} cx="0" cy="-7" rx="6.5" ry="8.5" fill="url(#gPetalInner)" />
                </g>
            ))}
        </g>
        <circle className="core" r="3.2" fill="#d98aa4" />
    </g>
)

const Cosmos = () => (
    <g className="head">
        {ring(8).map((a, i) => (
            <g key={a} transform={`rotate(${a})`}>
                <path
                    className="petal"
                    style={{ '--i': i }}
                    d="M0 0 C -10 -8, -11 -26, -7 -30 C -3 -32, 3 -32, 7 -30 C 11 -26, 10 -8, 0 0 Z"
                    fill="url(#gPetalCosmos)"
                />
            </g>
        ))}
        <circle className="core" r="5.5" fill="#e9c46a" />
        <circle className="core" r="2.6" fill="#c99a2e" />
    </g>
)

const Tulip = () => (
    <g className="head tulip-head">
        <path className="petal back" style={{ '--i': 0 }} d="M-15 0 C -22 -20, -14 -38, -6 -46 C -2 -34, -2 -14, 0 0 Z" fill="#f2b3c5" />
        <path className="petal back" style={{ '--i': 1 }} d="M15 0 C 22 -20, 14 -38, 6 -46 C 2 -34, 2 -14, 0 0 Z" fill="#f2b3c5" />
        <path className="petal front" style={{ '--i': 2 }} d="M-14 0 C -20 -18, -8 -40, 0 -50 C 8 -40, 20 -18, 14 0 C 8 8, -8 8, -14 0 Z" fill="url(#gTulip)" />
    </g>
)

const stems = {
    peony: { d: 'M60 240 C 58 200, 64 160, 60 112', head: <Peony />, cy: 100, leaves: true },
    cosmos: { d: 'M60 240 C 62 205, 56 165, 60 118', head: <Cosmos />, cy: 108, leaves: true },
    tulip: { d: 'M60 240 C 58 205, 62 170, 60 124', head: <Tulip />, cy: 124, leaves: true },
}

const Flower = ({ type, left, height, delay, hideOnMobile, flip }) => {
    const s = stems[type]
    return (
        <svg
            className={`flower flower-${type}${hideOnMobile ? ' hide-sm' : ''}${flip ? ' flip' : ''}`}
            style={{ left, '--h': `${height}px`, '--d': `${delay}s` }}
            viewBox="0 0 120 240"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
            focusable="false"
        >
            <g className="sway">
                <path className="stem" d={s.d} pathLength="1" />
                {s.leaves && (
                    <>
                        <path className="leaf leaf-l" d="M60 205 C 36 200, 22 182, 22 162 C 42 164, 58 180, 60 205 Z" />
                        <path className="leaf leaf-r" d="M60 178 C 82 174, 96 158, 96 140 C 76 142, 62 156, 60 178 Z" />
                    </>
                )}
                <g transform={`translate(60 ${s.cy})`}>{s.head}</g>
            </g>
        </svg>
    )
}

// Eucalyptus: a long green branch of rounded leaves; no bloom, only leaves
const Eucalyptus = ({ left, height, delay, hideOnMobile, flip }) => {
    const leaves = [
        [60, 200, -1, 0], [60, 176, 1, 1], [60, 152, -1, 2], [60, 128, 1, 3],
        [60, 104, -1, 4], [60, 80, 1, 5], [60, 58, -1, 6],
    ]
    return (
        <svg
            className={`flower flower-euc${hideOnMobile ? ' hide-sm' : ''}${flip ? ' flip' : ''}`}
            style={{ left, '--h': `${height}px`, '--d': `${delay}s` }}
            viewBox="0 0 120 240"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
            focusable="false"
        >
            <g className="sway">
                <path className="stem" d="M60 240 C 58 190, 64 120, 60 40" pathLength="1" />
                {leaves.map(([x, y, side, i]) => (
                    <ellipse
                        key={i}
                        className="euc-leaf"
                        style={{ '--i': i }}
                        cx={x + side * 15}
                        cy={y}
                        rx="14"
                        ry="9"
                        transform={`rotate(${side * -28} ${x} ${y})`}
                    />
                ))}
            </g>
        </svg>
    )
}

// Delicate filler: thin branches with tiny blossoms
const Sprig = ({ left, height, delay, hideOnMobile, flip }) => {
    const dots = [
        [44, 120], [38, 100], [52, 92], [70, 82], [78, 66], [62, 60], [50, 52], [66, 42], [58, 30],
    ]
    return (
        <svg
            className={`flower flower-sprig${hideOnMobile ? ' hide-sm' : ''}${flip ? ' flip' : ''}`}
            style={{ left, '--h': `${height}px`, '--d': `${delay}s` }}
            viewBox="0 0 120 240"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
            focusable="false"
        >
            <g className="sway">
                <path className="stem thin" d="M60 240 C 60 190, 56 150, 60 100 C 62 70, 60 50, 58 28" pathLength="1" />
                <path className="stem thin" d="M59 170 C 50 150, 44 136, 44 120" pathLength="1" />
                <path className="stem thin" d="M61 130 C 66 112, 72 98, 78 66" pathLength="1" />
                {dots.map(([x, y], i) => (
                    <circle key={i} className="dot" style={{ '--i': i }} cx={x} cy={y} r={i % 3 === 0 ? 5.6 : 4.2} />
                ))}
            </g>
        </svg>
    )
}

const FlowerHeader = ({ compact }) => (
    <div className={`garden${compact ? ' garden-compact' : ''}`} aria-hidden="true">
        <svg width="0" height="0" style={{ position: 'absolute' }} focusable="false">
            <defs>
                <radialGradient id="gPetalOuter" cx="50%" cy="85%" r="90%">
                    <stop offset="0" stopColor="#e7a0b8" />
                    <stop offset="1" stopColor="#f8d3de" />
                </radialGradient>
                <radialGradient id="gPetalMid" cx="50%" cy="85%" r="90%">
                    <stop offset="0" stopColor="#dd8aa7" />
                    <stop offset="1" stopColor="#f3bccd" />
                </radialGradient>
                <radialGradient id="gPetalInner" cx="50%" cy="85%" r="90%">
                    <stop offset="0" stopColor="#d47798" />
                    <stop offset="1" stopColor="#ecaac0" />
                </radialGradient>
                <linearGradient id="gPetalCosmos" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#e18dab" />
                    <stop offset="1" stopColor="#fbe4eb" />
                </linearGradient>
                <linearGradient id="gTulip" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#e292ae" />
                    <stop offset="1" stopColor="#f9d6e0" />
                </linearGradient>
            </defs>
        </svg>

        {/* left cluster */}
        <Eucalyptus left="1%" height={150} delay={0.1} hideOnMobile />
        <Cosmos_ left="5%" height={118} delay={0.5} />
        <Flower type="peony" left="10%" height={168} delay={0.25} />
        <Sprig left="16%" height={128} delay={0.7} hideOnMobile />
        <Flower type="tulip" left="20%" height={124} delay={0.9} hideOnMobile />

        {/* right cluster (mirrors the left, different order) */}
        <Flower type="tulip" left="72%" height={128} delay={0.8} hideOnMobile flip />
        <Sprig left="78%" height={132} delay={0.6} hideOnMobile flip />
        <Flower type="peony" left="83%" height={160} delay={0.35} />
        <Cosmos_ left="90%" height={120} delay={0.65} />
        <Eucalyptus left="95%" height={146} delay={0.2} hideOnMobile flip />

        <div className="garden-ground" />
    </div>
)

// small wrapper so the JSX above reads cleanly
const Cosmos_ = (props) => <Flower type="cosmos" {...props} />

export default FlowerHeader

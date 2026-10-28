// src/components/AuthIllustration.tsx
// Ilustración del panel izquierdo del layout de auth.
// Arte ORIGINAL del proyecto: blobs con personalidad dibujados en SVG
// inline — sin assets externos, sin copyright ajeno, versionado en el repo.
//
// La escena está VIVA (todo el movimiento vive en index.css):
//  - Ráfagas de viento cruzando POR DETRÁS (paths con loop de traslación)
//  - Cada personaje se mece desde los pies (patrón hierba con viento),
//    con duraciones/delays escalonados → nadie se mueve en fila
//  - Volumen 2.5D: relleno con gradiente (luz arriba-izquierda), contorno
//    del mismo tono oscurecido y brillo en el hombro
//  - Bocas vivas: murmullos, "oh!" y sonrisas en ciclos largos desfasados
//  - CADA pupila apunta en línea recta al cursor (vector individual por
//    variables CSS, cero re-renders de React)
//  - Al enfocar un input[type=password], AuthLayout pone data-eyes="cover"
//    → todos los ojos miran a otro lado (izquierda/abajo según viewport)
// La escena se dibuja de atrás hacia adelante (profundidad por solape).
import { useEffect, useRef, useState } from 'react'

function Eyes({
  cx1,
  cx2,
  cy,
  r = 16,
  // Relleno del párpado: usa el MISMO gradiente (userSpaceOnUse) que el
  // cuerpo → el párpado toma el color exacto del punto donde reposa y
  // desaparece por completo contra el cuerpo
  bodyFill,
}: {
  cx1: number
  cx2: number
  cy: number
  r?: number
  bodyFill: string
}) {
  return (
    <g>
      {/* ojo blanco (siempre visible: quien cubre es el párpado) */}
      <circle className="eye-white" cx={cx1} cy={cy} r={r} fill="#fff" />
      <circle className="eye-white" cx={cx2} cy={cy} r={r} fill="#fff" />
      {/* pupila = grupo (pupila + brillo). data-cx/data-cy publican su
          centro en coords del viewBox para el cálculo del vector */}
      <g className="pupil" data-cx={cx1 + 4} data-cy={cy + 3}>
        <circle cx={cx1 + 4} cy={cy + 3} r={r * 0.6} fill="#2B2523" />
        <circle cx={cx1 + 1.5} cy={cy - 1} r={r * 0.15} fill="#fff" />
      </g>
      <g className="pupil" data-cx={cx2 + 4} data-cy={cy + 3}>
        <circle cx={cx2 + 4} cy={cy + 3} r={r * 0.6} fill="#2B2523" />
        <circle cx={cx2 + 1.5} cy={cy - 1} r={r * 0.15} fill="#fff" />
      </g>
      {/* párpado: mismo gradiente del cuerpo; reposa arriba (invisible)
          y baja a cubrir el ojo al cerrarse. r+0.5 para no dejar halo */}
      <circle className="eyelid" cx={cx1} cy={cy} r={r + 0.5} fill={bodyFill} />
      <circle className="eyelid" cx={cx2} cy={cy} r={r + 0.5} fill={bodyFill} />
    </g>
  )
}

// Elipsito de brillo: luz simulada en el hombro superior-izquierdo.
// Se dibuja DESPUÉS de los ojos: si el párpado en reposo lo solapa,
// el brillo lo tapa y la zona queda idéntica al cuerpo con brillo.
function Brillo({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity="0.25" />
}

export function AuthIllustration() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Encuadre responsive: matchMedia nos dice en qué mundo estamos y
  // actualiza el viewBox si el usuario gira/cambia el tamaño de ventana.
  const [escena, setEscena] = useState<'completa' | 'banda'>(() =>
    window.matchMedia('(min-width: 1024px)').matches ? 'completa' : 'banda',
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setEscena(e.matches ? 'completa' : 'banda')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Banda móvil calculada: los ojos viven entre y=179 (amarillo) y y=444
  // (rosa) → la banda 170–460 contiene todos los rostros con margen.
  const viewBox = escena === 'completa' ? '0 0 440 520' : '0 170 440 290'

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Cada pupila es independiente: cacheamos su centro (la escena es
    // estática, las medidas no cambian). El centro real viene publicado
    // en los data-attributes que puso el helper Eyes.
    const pupils = Array.from(svg.querySelectorAll<SVGGElement>('.pupil')).map((el) => ({
      el,
      cx: Number(el.dataset.cx ?? 0),
      cy: Number(el.dataset.cy ?? 0),
    }))

    const MAX = 5 // desplazamiento máximo de la pupila (unidades del viewBox)
    let raf = 0

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // El cursor vive en píxeles de pantalla; los ojos viven en el
        // viewBox. getScreenCTM().inverse() es el mapa pantalla→SVG.
        const ctm = svg.getScreenCTM()
        if (!ctm) return
        const cursor = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())

        for (const { el, cx, cy } of pupils) {
          const dx = cursor.x - cx
          const dy = cursor.y - cy
          const dist = Math.hypot(dx, dy) || 1
          // apunta EN LÍNEA RECTA hacia el cursor, con desplazamiento fijo
          el.style.setProperty('--pupil-dx', `${((dx / dist) * MAX).toFixed(2)}px`)
          el.style.setProperty('--pupil-dy', `${((dy / dist) * MAX).toFixed(2)}px`)
        }
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100" aria-hidden="true">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="auth-eyes h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradientes 2.5D en coordenadas de USUARIO (userSpaceOnUse):
              el gradiente es un campo sobre la escena — cualquier forma
              que lo use (cuerpo, párpado, punta de antena) toma el color
              exacto de su posición. Luz arriba-izquierda. */}
          <linearGradient id="g-amarillo" gradientUnits="userSpaceOnUse" x1="180" y1="100" x2="310" y2="400">
            <stop offset="0" stopColor="#F7C860" />
            <stop offset="1" stopColor="#F2B63C" />
          </linearGradient>
          <linearGradient id="g-morado" gradientUnits="userSpaceOnUse" x1="55" y1="160" x2="165" y2="410">
            <stop offset="0" stopColor="#A091EE" />
            <stop offset="1" stopColor="#8F7EE8" />
          </linearGradient>
          <linearGradient id="g-coral" gradientUnits="userSpaceOnUse" x1="315" y1="130" x2="430" y2="410">
            <stop offset="0" stopColor="#F47E7B" />
            <stop offset="1" stopColor="#F0625F" />
          </linearGradient>
          {/* La nube comparte UN campo: sus 3 círculos y su sombreado
              quedan coherentes como una sola masa */}
          <linearGradient id="g-turquesa" gradientUnits="userSpaceOnUse" x1="42" y1="296" x2="256" y2="448">
            <stop offset="0" stopColor="#57D3B4" />
            <stop offset="1" stopColor="#3FC9A4" />
          </linearGradient>
          <linearGradient id="g-azul" gradientUnits="userSpaceOnUse" x1="205" y1="330" x2="320" y2="495">
            <stop offset="0" stopColor="#6BA0F5" />
            <stop offset="1" stopColor="#4D8AF0" />
          </linearGradient>
          <linearGradient id="g-rosa" gradientUnits="userSpaceOnUse" x1="295" y1="375" x2="410" y2="515">
            <stop offset="0" stopColor="#F8B9D2" />
            <stop offset="1" stopColor="#F5A8C6" />
          </linearGradient>
          {/* Difuminado del fondo ambiental */}
          <filter id="suave" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="45" />
          </filter>
        </defs>

        {/* Fondo ambiental: halo celeste difuminado detrás de todo */}
        <ellipse cx="220" cy="290" rx="210" ry="240" fill="#D8E6F3" opacity="0.6" filter="url(#suave)" />

        {/* Ráfagas de viento: líneas curvas que cruzan y se desvanecen.
            Base opacity=0 → con prefers-reduced-motion quedan invisibles */}
        <path
          className="rafaga"
          style={{ animationDuration: '8s', animationDelay: '-1s' }}
          d="M -140 105 q 45 -24 90 0 t 90 0 t 90 0"
          stroke="#BFD3E2" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0"
        />
        <path
          className="rafaga"
          style={{ animationDuration: '11s', animationDelay: '-5s' }}
          d="M -180 250 q 50 -28 100 0 t 100 0"
          stroke="#BFD3E2" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0"
        />
        <path
          className="rafaga"
          style={{ animationDuration: '9.5s', animationDelay: '-3s' }}
          d="M -150 425 q 42 -22 84 0 t 84 0"
          stroke="#BFD3E2" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0"
        />

        {/* Sombras en el suelo (fuera de los grupos que se mecen: los
            peluches basculan SOBRE su sombra, no con ella) */}
        <ellipse cx="120" cy="468" rx="75" ry="11" fill="#000" opacity="0.06" />
        <ellipse cx="245" cy="505" rx="70" ry="11" fill="#000" opacity="0.06" />
        <ellipse cx="355" cy="475" rx="65" ry="10" fill="#000" opacity="0.06" />

        {/* ── Personajes (de atrás hacia adelante). Cada uno se mece
              desde los pies con su propio ritmo ── */}

        {/* amarillo (atrás, centro) */}
        <g className="blob" style={{ animationDuration: '6.4s', animationDelay: '-0.6s' }}>
          <rect x="180" y="100" width="130" height="300" rx="65"
            fill="url(#g-amarillo)" stroke="#D89F2A" strokeWidth="2" />
          <Eyes cx1={222} cx2={262} cy={195} bodyFill="url(#g-amarillo)" />
          <Brillo cx={206} cy={148} rx={20} ry={36} />
          <rect className="mouth-talk" style={{ animationDuration: '6s', animationDelay: '-0.5s' }}
            x="230" y="238" width="26" height="11" rx="5.5" fill="#2B2523" />
        </g>

        {/* morado (atrás, izquierda, con antenas-rayitas) */}
        <g className="blob" style={{ animationDuration: '5.6s', animationDelay: '-2.4s' }}>
          {/* rayitas de las antenas: trazos limpios, sin bolitas */}
          <path d="M90 168 L80 122" stroke="#7A66D6" strokeWidth="6" strokeLinecap="round" />
          <path d="M135 168 L148 114" stroke="#7A66D6" strokeWidth="6" strokeLinecap="round" />
          <rect x="55" y="160" width="110" height="250" rx="55"
            fill="url(#g-morado)" stroke="#7A66D6" strokeWidth="2" />
          <Eyes cx1={90} cx2={130} cy={255} r={15} bodyFill="url(#g-morado)" />
          <Brillo cx={83} cy={202} rx={16} ry={32} />
          <rect className="mouth-talk" style={{ animationDuration: '7s', animationDelay: '-2.8s' }}
            x="97" y="292" width="24" height="10" rx="5" fill="#2B2523" />
        </g>

        {/* coral (atrás, derecha) */}
        <g className="blob" style={{ animationDuration: '7.1s', animationDelay: '-3.9s' }}>
          <rect x="315" y="130" width="115" height="280" rx="57"
            fill="url(#g-coral)" stroke="#D94F4C" strokeWidth="2" />
          <Eyes cx1={352} cx2={394} cy={235} bodyFill="url(#g-coral)" />
          <Brillo cx={344} cy={172} rx={18} ry={34} />
          <circle className="mouth-pop" style={{ animationDuration: '9s', animationDelay: '-1.7s' }}
            cx="373" cy="282" r="11" fill="#2B2523" />
        </g>

        {/* nube turquesa (frente, izquierda). El contorno de la nube se
            dibuja con círculos-trazo DETRÁS de los rellenos: así la línea
            solo se ve en la silueta exterior, no en los solapes internos */}
        <g className="blob" style={{ animationDuration: '5.1s', animationDelay: '-1.5s' }}>
          <circle cx="95" cy="395" r="53" fill="none" stroke="#2FB28E" strokeWidth="2" />
          <circle cx="148" cy="362" r="67" fill="none" stroke="#2FB28E" strokeWidth="2" />
          <circle cx="205" cy="398" r="51" fill="none" stroke="#2FB28E" strokeWidth="2" />
          <circle cx="95" cy="395" r="52" fill="url(#g-turquesa)" />
          <circle cx="148" cy="362" r="66" fill="url(#g-turquesa)" />
          <circle cx="205" cy="398" r="50" fill="url(#g-turquesa)" />
          <Eyes cx1={132} cx2={168} cy={375} r={14} bodyFill="url(#g-turquesa)" />
          <Brillo cx={124} cy={332} rx={18} ry={16} />
          <circle cx="150" cy="402" r="7" fill="#2B2523" />
        </g>

        {/* azul (frente, centro, con sonrisa) */}
        <g className="blob" style={{ animationDuration: '6.8s', animationDelay: '-4.4s' }}>
          <rect x="205" y="330" width="115" height="165" rx="52"
            fill="url(#g-azul)" stroke="#3B74D9" strokeWidth="2" />
          <Eyes cx1={242} cx2={280} cy={400} bodyFill="url(#g-azul)" />
          <Brillo cx={232} cy={366} rx={16} ry={28} />
          <path className="mouth-smile" style={{ animationDuration: '7.5s', animationDelay: '-3.3s' }}
            d="M248 440 Q262 452 276 440"
            stroke="#2B2523" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>

        {/* rosa (frente, derecha) */}
        <g className="blob" style={{ animationDuration: '5.9s', animationDelay: '-2.9s' }}>
          <rect x="295" y="375" width="115" height="140" rx="55"
            fill="url(#g-rosa)" stroke="#E28FAF" strokeWidth="2" />
          <Eyes cx1={330} cx2={368} cy={430} r={14} bodyFill="url(#g-rosa)" />
          <Brillo cx={320} cy={408} rx={15} ry={26} />
          <rect className="mouth-talk" style={{ animationDuration: '8s', animationDelay: '-4.1s' }}
            x="336" y="462" width="22" height="9" rx="4.5" fill="#2B2523" />
        </g>
      </svg>
    </div>
  )
}

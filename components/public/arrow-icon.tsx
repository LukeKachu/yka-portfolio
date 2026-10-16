type Direction = 'up-right' | 'down-right' | 'right' | 'left' | 'down' | 'up'

// Paths, not Unicode glyphs: identical monochrome arrows on iOS, Android and desktop.
export function ArrowIcon({direction = 'up-right'}: {direction?: Direction}) {
  const rotation = {'up-right':0,'down-right':90,right:45,left:225,down:135,up:315}[direction]
  return <svg className="arrow-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" transform={`rotate(${rotation} 12 12)`}/></svg>
}

export type IconName = 'court'|'play'|'pause'|'previous'|'next'|'restart'|'focus'|'close'|'reset'|'pen'|'notes'|'layers'|'team'|'chevron'|'studio'|'undo'|'redo'|'arrow'|'highlight'|'text'|'erase'|'view'|'share'
const paths: Record<IconName, string> = {
 court:'M4 3h16v18H4z M4 9h16M4 15h16M12 3v18',
 play:'m9 5 11 7-11 7z', pause:'M8 5v14M16 5v14', previous:'M5 5v14M19 5 8 12l11 7z', next:'M19 5v14M5 5l11 7L5 19z',
 restart:'M4 10a8 8 0 1 1 1 8M4 4v6h6', focus:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5', close:'m6 6 12 12M18 6 6 18',
 reset:'m3 12 9-9 9 9M6 10v11h12V10M10 21v-7h4v7', pen:'m4 16 12-12 4 4L8 20H4zM14 6l4 4', notes:'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
 layers:'m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5', team:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a6 6 0 0 1 12 0v3M17 5a4 4 0 0 1 0 8M18 16a5 5 0 0 1 4 5',
 chevron:'m8 10 4 4 4-4', studio:'M3 4h18v13H3zM8 21h8M12 17v4', undo:'M8 6 3 11l5 5M3 11h11a6 6 0 0 1 6 7',redo:'m16 6 5 5-5 5M21 11H10a6 6 0 0 0-6 7',arrow:'M4 20 20 4M10 4h10v10', highlight:'m4 16 10-12 6 6-12 10zM2 22h10',text:'M4 4h16M12 4v16M8 20h8',erase:'m3 14 10-11 8 8-10 10H9zM7 10l8 8M11 21h10',view:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',share:'M12 15V3M7 8l5-5 5 5M5 12v9h14v-9',
}
export function CourtIcon({ name }: { name: IconName }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg> }

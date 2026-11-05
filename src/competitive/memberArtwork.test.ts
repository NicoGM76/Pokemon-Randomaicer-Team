import { describe, expect, it } from 'vitest';
import { baseArtworkUrl, memberArtworkUrl, memberDisplayName } from './memberArtwork';
import forms from './data/formArtworkIds.json';

describe('competitive team cards represent selected Pokémon forms', () => {
  it('resolves official artwork IDs for Mega-Salamence, Mega-Lucario and Rotom Lavado', () => {
    expect(memberArtworkUrl(373, 'salamence-mega')).toContain('/10089.png');
    expect(memberArtworkUrl(448, 'lucario-mega')).toContain('/10059.png');
    expect(memberArtworkUrl(448, 'lucario-mega-z')).toContain('/10310.png');
    expect(memberArtworkUrl(479, 'rotom-wash')).toContain('/10009.png');
    expect(memberDisplayName(373, 'salamence', 'salamence-mega')).toBe('Mega-Salamence');
    expect(memberDisplayName(448, 'lucario', 'lucario-mega')).toBe('Mega-Lucario');
    expect(memberDisplayName(479, 'rotom', 'rotom-wash')).toBe('Rotom Lavado');
  });
  it('supports other registered Mega and Rotom varieties', () => {
    expect(memberArtworkUrl(359, 'absol-mega-z')).toContain('/10307.png');
    expect(memberArtworkUrl(445, 'garchomp-mega-z')).toContain('/10309.png');
    expect(memberArtworkUrl(479, 'rotom-heat')).toContain('/10008.png');
    expect(memberDisplayName(479, 'rotom', 'rotom-mow')).toBe('Rotom Corte');
    expect(Object.keys(forms.forms).length).toBeGreaterThanOrEqual(300);
  });
  it('never assigns an artwork for a form of the wrong Pokémon', () => {
    expect(memberArtworkUrl(448, 'salamence-mega')).toBe(baseArtworkUrl(448));
    expect(memberDisplayName(448, 'lucario', 'rotom-wash')).toBe('Lucario');
    expect(memberArtworkUrl(479, 'unknown-new-form')).toBe(baseArtworkUrl(479));
    expect(memberDisplayName(479, 'rotom', undefined)).toBe('Rotom');
  });
});

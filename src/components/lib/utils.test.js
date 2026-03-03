import { describe, it, expect } from 'vitest';
import { mkid, gCount, sumGuests, gTypeLabel, gTypeIcon, fmtD, fmtC, parseBudgetNotes, serializeBudgetNotes } from './utils';

describe('mkid', () => {
  it('generează string unic de 9+ caractere', () => {
    const id = mkid();
    expect(id).toMatch(/^x[a-z0-9]{7,}$/);
    expect(mkid()).not.toBe(mkid());
  });
});

describe('gCount', () => {
  it('returnează count-ul invitatului', () => {
    expect(gCount({ count: 3 })).toBe(3);
    expect(gCount({ count: 1 })).toBe(1);
  });
  it('returnează minim 1 pentru valori invalide', () => {
    expect(gCount({})).toBe(1);
    expect(gCount(null)).toBe(1);
    expect(gCount({ count: 0 })).toBe(1);
    expect(gCount({ count: -5 })).toBe(1);
  });
});

describe('sumGuests', () => {
  it('sumează count-urile tuturor invitaților', () => {
    expect(sumGuests([{ count: 2 }, { count: 3 }, {}])).toBe(6);
  });
  it('returnează 0 pentru listă goală', () => {
    expect(sumGuests([])).toBe(0);
  });
});

describe('gTypeLabel', () => {
  it('returnează label corect pe count', () => {
    expect(gTypeLabel({ count: 1 })).toBe('Single');
    expect(gTypeLabel({ count: 2 })).toBe('Cuplu');
    expect(gTypeLabel({ count: 4 })).toBe('Familie (4)');
  });
});

describe('gTypeIcon', () => {
  it('returnează emoji corect pe count', () => {
    expect(gTypeIcon({ count: 1 })).toBe('👤');
    expect(gTypeIcon({ count: 2 })).toBe('👫');
    expect(gTypeIcon({ count: 3 })).toContain('👨');
  });
});

describe('fmtD', () => {
  it('formatează data în ro-RO', () => {
    const result = fmtD('2026-09-12');
    expect(result).toContain('2026');
  });
  it('returnează input-ul pentru dată invalidă', () => {
    expect(fmtD('invalid')).toBe('Invalid Date');
  });
});

describe('fmtC', () => {
  it('formatează valută EUR', () => {
    const result = fmtC(1500);
    expect(result).toMatch(/1[.,\s]?500/);
  });
  it('formatează 0 fără eroare', () => {
    expect(fmtC(0)).toBeDefined();
    expect(fmtC(null)).toBeDefined();
  });
});

describe('parseBudgetNotes / serializeBudgetNotes', () => {
  it('roundtrip: serialize → parse returnează aceleași date', () => {
    const payments = [{ id: 'p1', amount: 500, date: '2026-01-15', note: 'Avans' }];
    const notes = 'Notă test';
    const serialized = serializeBudgetNotes(notes, payments);
    const { cleanNotes, payments: parsed } = parseBudgetNotes(serialized);
    expect(cleanNotes).toBe(notes);
    expect(parsed).toEqual(payments);
  });

  it('parse fără plăți returnează notes curat', () => {
    const { cleanNotes, payments } = parseBudgetNotes('Just a note');
    expect(cleanNotes).toBe('Just a note');
    expect(payments).toEqual([]);
  });

  it('serialize fără plăți returnează doar notes', () => {
    expect(serializeBudgetNotes('Note', [])).toBe('Note');
    expect(serializeBudgetNotes('Note', null)).toBe('Note');
  });
});

import { describe, it, expect } from 'vitest';
import { reducer, EMPTY_STATE } from './reducer';
import { INITIAL_DATA } from './demo-data';

const baseState = { ...EMPTY_STATE, ...INITIAL_DATA, activity: [] };

describe('reducer', () => {
  describe('SET', () => {
    it('merge payload în state', () => {
      const next = reducer(baseState, { type: 'SET', p: { onboarded: false } });
      expect(next.onboarded).toBe(false);
      expect(next.guests).toEqual(baseState.guests);
    });
  });

  describe('GUESTS', () => {
    it('ADD_GUEST adaugă invitatul în listă', () => {
      const guest = { id: 'test1', name: 'Test Guest', group: 'Prieteni', rsvp: 'pending' };
      const next = reducer(baseState, { type: 'ADD_GUEST', p: guest });
      expect(next.guests).toHaveLength(baseState.guests.length + 1);
      expect(next.guests.find(g => g.id === 'test1')).toBeTruthy();
    });

    it('UPD_GUEST actualizează câmpurile invitatului', () => {
      const guestId = baseState.guests[0].id;
      const next = reducer(baseState, { type: 'UPD_GUEST', p: { id: guestId, rsvp: 'declined' } });
      expect(next.guests.find(g => g.id === guestId).rsvp).toBe('declined');
    });

    it('UPD_GUEST cu rsvp non-confirmed elimină tid', () => {
      const withTid = {
        ...baseState,
        tables: [{ id: 't1', name: 'T1', seats: 8 }],
        guests: baseState.guests.map((g, i) => i === 0 ? { ...g, tid: 't1', rsvp: 'confirmed' } : g),
      };
      const guestId = withTid.guests[0].id;
      const next = reducer(withTid, { type: 'UPD_GUEST', p: { id: guestId, rsvp: 'declined' } });
      const updated = next.guests.find(g => g.id === guestId);
      expect(updated.tid).toBeNull();
      expect(updated.lastTid).toBe('t1');
    });

    it('DEL_GUEST elimină invitatul', () => {
      const guestId = baseState.guests[0].id;
      const next = reducer(baseState, { type: 'DEL_GUEST', p: guestId });
      expect(next.guests).toHaveLength(baseState.guests.length - 1);
      expect(next.guests.find(g => g.id === guestId)).toBeUndefined();
    });

    it('IMPORT_GUESTS adaugă multipli invitați', () => {
      const newGuests = [
        { id: 'imp1', name: 'Import 1', group: 'Prieteni', rsvp: 'pending' },
        { id: 'imp2', name: 'Import 2', group: 'Colegi', rsvp: 'pending' },
      ];
      const next = reducer(baseState, { type: 'IMPORT_GUESTS', p: newGuests });
      expect(next.guests).toHaveLength(baseState.guests.length + 2);
    });

    it('SET_GUESTS_IMPORTED înlocuiește duplicate după nume', () => {
      const next = reducer(baseState, { type: 'SET_GUESTS_IMPORTED', p: [{ id: 'new', name: baseState.guests[0].name, group: 'X', rsvp: 'pending' }] });
      expect(next.guests.filter(g => g.name === baseState.guests[0].name)).toHaveLength(1);
      expect(next.guests.find(g => g.id === 'new')).toBeTruthy();
    });
  });

  describe('TABLES', () => {
    it('ADD_TABLE adaugă masa', () => {
      const table = { id: 'tnew', name: 'Masa Nouă', seats: 10, shape: 'round' };
      const next = reducer(baseState, { type: 'ADD_TABLE', p: table });
      expect(next.tables.find(t => t.id === 'tnew')).toBeTruthy();
    });

    it('DEL_TABLE elimină masa și desface invitații', () => {
      const withSeated = {
        ...baseState,
        tables: [{ id: 't1', name: 'M1', seats: 8 }, ...baseState.tables],
        guests: baseState.guests.map((g, i) => i === 0 ? { ...g, tid: 't1' } : g),
      };
      const next = reducer(withSeated, { type: 'DEL_TABLE', p: 't1' });
      expect(next.tables.find(t => t.id === 't1')).toBeUndefined();
      expect(next.guests[0].tid).toBeNull();
    });

    it('SEAT pune invitatul la masă', () => {
      const guestId = baseState.guests[0].id;
      const next = reducer(baseState, { type: 'SEAT', p: { gid: guestId, tid: 't2' } });
      expect(next.guests.find(g => g.id === guestId).tid).toBe('t2');
    });

    it('UNSEAT scoate invitatul de la masă', () => {
      const withSeated = {
        ...baseState,
        guests: baseState.guests.map((g, i) => i === 0 ? { ...g, tid: 't1' } : g),
      };
      const guestId = withSeated.guests[0].id;
      const next = reducer(withSeated, { type: 'UNSEAT', p: guestId });
      expect(next.guests.find(g => g.id === guestId).tid).toBeNull();
    });

    it('MOVE_SEAT mută invitatul', () => {
      const guestId = baseState.guests[0].id;
      const next = reducer(baseState, { type: 'MOVE_SEAT', p: { gid: guestId, tid: 't2' } });
      expect(next.guests.find(g => g.id === guestId).tid).toBe('t2');
    });

    it('REORDER_TABLES înlocuiește ordinea', () => {
      const reordered = [...baseState.tables].reverse();
      const next = reducer(baseState, { type: 'REORDER_TABLES', p: reordered });
      expect(next.tables[0].id).toBe(reordered[0].id);
    });
  });

  describe('BUDGET', () => {
    it('ADD_BUDGET adaugă categoria', () => {
      const item = { id: 'bnew', cat: 'Transport', planned: 1000, spent: 0 };
      const next = reducer(baseState, { type: 'ADD_BUDGET', p: item });
      expect(next.budget.find(b => b.id === 'bnew')).toBeTruthy();
    });

    it('UPD_BUDGET actualizează', () => {
      const budgetId = baseState.budget[0].id;
      const next = reducer(baseState, { type: 'UPD_BUDGET', p: { id: budgetId, spent: 9999 } });
      expect(next.budget.find(b => b.id === budgetId).spent).toBe(9999);
    });

    it('DEL_BUDGET elimină', () => {
      const budgetId = baseState.budget[0].id;
      const next = reducer(baseState, { type: 'DEL_BUDGET', p: budgetId });
      expect(next.budget.find(b => b.id === budgetId)).toBeUndefined();
    });
  });

  describe('TASKS', () => {
    it('ADD_TASK adaugă taskul', () => {
      const task = { id: 'tknew', title: 'Test Task', prio: 'high', status: 'pending' };
      const next = reducer(baseState, { type: 'ADD_TASK', p: task });
      expect(next.tasks.find(t => t.id === 'tknew')).toBeTruthy();
    });

    it('UPD_TASK actualizează status', () => {
      const taskId = baseState.tasks[0].id;
      const next = reducer(baseState, { type: 'UPD_TASK', p: { id: taskId, status: 'done' } });
      expect(next.tasks.find(t => t.id === taskId).status).toBe('done');
    });

    it('DEL_TASK elimină', () => {
      const taskId = baseState.tasks[0].id;
      const next = reducer(baseState, { type: 'DEL_TASK', p: taskId });
      expect(next.tasks.find(t => t.id === taskId)).toBeUndefined();
    });
  });

  describe('VENDORS', () => {
    it('ADD/UPD/DEL_VENDOR funcționează', () => {
      const v = { id: 'vnew', name: 'Vendor X', status: 'potential' };
      const added = reducer(baseState, { type: 'ADD_VENDOR', p: v });
      expect(added.vendors.find(x => x.id === 'vnew')).toBeTruthy();
      const updated = reducer(added, { type: 'UPD_VENDOR', p: { id: 'vnew', status: 'contracted' } });
      expect(updated.vendors.find(x => x.id === 'vnew').status).toBe('contracted');
      const removed = reducer(updated, { type: 'DEL_VENDOR', p: 'vnew' });
      expect(removed.vendors.find(x => x.id === 'vnew')).toBeUndefined();
    });
  });

  describe('activity log', () => {
    it('acțiuni logate adaugă intrări în activity', () => {
      const guest = { id: 'x', name: 'X', group: 'G', rsvp: 'pending' };
      const next = reducer(baseState, { type: 'ADD_GUEST', p: guest });
      expect(next.activity.length).toBeGreaterThan(0);
      expect(next.activity[0].msg).toContain('X');
    });

    it('activity nu depășește 50 de entries', () => {
      let s = { ...baseState, guests: [], activity: [] };
      for (let i = 0; i < 60; i++) {
        s = reducer(s, { type: 'ADD_GUEST', p: { id: `g${i}`, name: `G${i}`, group: 'X', rsvp: 'pending' } });
      }
      expect(s.activity.length).toBeLessThanOrEqual(50);
    });
  });
});

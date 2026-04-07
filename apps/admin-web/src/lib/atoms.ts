import { atom, createStore } from 'jotai';

export const publicStore = createStore();
export const verifyEmailAtom = atom<string>('');

export const termStore = createStore();
export const agreedTermIdsAtom = atom<string[]>([]);

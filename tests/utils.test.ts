import { describe, expect, test } from '@jest/globals';

import * as u from '../src/utils';
import { Entry, EntryType } from '../src/model';

describe('Testing u.entryToEntryType()', () => {
	test('function entry return EntryType.Function', () => {
		const input: Entry = {
			rawName: 'a',
			rawValue: '',
			children: [],
		};
		expect(u.entryToEntryType(input)).toBe(EntryType.Function);
	});

	test('mininitation value entry return EntryType.Function', () => {
		const input: Entry = {
			rawName: '',
			rawValue: '_a',
			children: [],
		};
		expect(u.entryToEntryType(input)).toBe(EntryType.Function);
	});

	test('other value entry return EntryType.Value', () => {
		const input: Entry = {
			rawName: '',
			rawValue: 'a',
			children: [],
		};
		expect(u.entryToEntryType(input)).toBe(EntryType.Value);
	});

	test('chained function entry return EntryType.ChainedFunc', () => {
		const input: Entry = {
			rawName: '.a',
			rawValue: '',
			children: [],
		};
		expect(u.entryToEntryType(input)).toBe(EntryType.ChainedFunction);
	});

	test('constant def entry return EntryType.ConstantDef', () => {
		const input: Entry = {
			rawName: '$a',
			rawValue: '',
			children: [],
		};
		expect(u.entryToEntryType(input)).toBe(EntryType.ConstantDef);
	});

	test('serialized entry return EntryType.SerializedData', () => {
		const input: Entry = {
			rawName: 'a^',
			rawValue: '',
			children: [],
		};
		expect(u.entryToEntryType(input)).toBe(EntryType.SerializedData);
	});
});

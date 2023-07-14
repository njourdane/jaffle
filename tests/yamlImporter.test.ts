import { describe, expect, test } from '@jest/globals';

import { YamlImporterError, YamlImporter as YI } from '../src/importers/yamlImporter';
import { FuncType, ValueType } from '../src/funcTree';

const stringValue = {
	id: -1,
	groupId: -1,
	label: '',
	type: FuncType.LiteralValue,
	valueText: 'stringValue',
	valueType: ValueType.String,
	params: [],
};

const mainFunc = {
	id: -1,
	groupId: -1,
	label: 'mainFunc',
	type: FuncType.Main,
	valueText: 'mainFuncValue',
	valueType: ValueType.String,
	params: [],
};

const chainedFunc = {
	id: -1,
	groupId: -1,
	label: '.chainedFunc',
	type: FuncType.Chained,
	valueText: 'chainedFuncValue',
	valueType: ValueType.String,
	params: [],
};

const funcWithChainsInParam = {
	id: -1,
	groupId: -1,
	label: 'funcWithChainsInParam',
	type: FuncType.Main,
	valueText: '',
	valueType: ValueType.Tree,
	params: [mainFunc, chainedFunc, mainFunc, chainedFunc],
};

describe('Testing YamlImporterError', () => {
	test('YamlImporterError should raise', () => {
		expect(() => { throw new YamlImporterError('abc'); }).toThrow(YamlImporterError);
	});
});

describe('Testing YI.getValueType()', () => {
	test('string return string types', () => {
		expect(YI.getValueType('abc')).toBe(ValueType.String);
		expect(YI.getValueType('_abc')).toBe(ValueType.Mininotation);
		expect(YI.getValueType('=abc')).toBe(ValueType.Expression);
	});

	test('other literals return literal types', () => {
		expect(YI.getValueType(null)).toBe(ValueType.Null);
		expect(YI.getValueType(123)).toBe(ValueType.Number);
	});

	test('object return object type', () => {
		expect(YI.getValueType([1, 2, 3])).toBe(ValueType.Tree);
		expect(YI.getValueType({ a: 1, b: 2 })).toBe(ValueType.Tree);
	});
});

describe('Testing YI.getStringFuncType()', () => {
	test('string func names return string func types', () => {
		expect(YI.getStringFuncType('_abc')).toBe(FuncType.MainMininotation);
		expect(YI.getStringFuncType('$abc')).toBe(FuncType.Constant);
	});

	test('common strings return null', () => {
		expect(YI.getStringFuncType('abc')).toBe(null);
		expect(YI.getStringFuncType('=abc')).toBe(null);
	});
});

describe('Testing YI.getFuncName()', () => {
	test('bad functions fails', () => {
		expect(() => YI.getFuncName({})).toThrow(YamlImporterError);
		expect(() => YI.getFuncName({ a: 1, b: 2 })).toThrow(YamlImporterError);
	});

	test('common functions return function name', () => {
		expect(YI.getFuncName({ a: 1 })).toBe('a');
		expect(YI.getFuncName({ _a: 1 })).toBe('_a');
		expect(YI.getFuncName({ $a: 1 })).toBe('$a');
	});
});

describe('Testing YI.upgradeTree()', () => {
	test('String value have its id and groupId updated', () => {
		const tree = YI.upgradeTree(stringValue);
		expect(tree).toHaveProperty('id', 0);
		expect(tree).toHaveProperty('groupId', 0);
	});

	test('Tree with several function chains have its id and groupId updated', () => {
		const tree = YI.upgradeTree(funcWithChainsInParam);
		expect(tree).toHaveProperty('id', 0);
		expect(tree).toHaveProperty('groupId', 0);
		expect(tree.params[0]).toHaveProperty('id', 1);
		expect(tree.params[0]).toHaveProperty('groupId', 0);
		expect(tree.params[1]).toHaveProperty('id', 2);
		expect(tree.params[1]).toHaveProperty('groupId', 0);
		expect(tree.params[2]).toHaveProperty('id', 3);
		expect(tree.params[2]).toHaveProperty('groupId', 1);
		expect(tree.params[3]).toHaveProperty('id', 4);
		expect(tree.params[3]).toHaveProperty('groupId', 1);
	});
});

describe('Testing YI.computeLiteral()', () => {
	test('string literals are well computed', () => {
		expect(YI.computeLiteral('a')).toEqual({
			id: -1,
			groupId: -1,
			label: '',
			type: FuncType.LiteralValue,
			valueText: 'a',
			valueType: ValueType.String,
			params: [],
		});
	});

	test('Number literals are well computed', () => {
		expect(YI.computeLiteral(42)).toEqual({
			id: -1,
			groupId: -1,
			label: '',
			type: FuncType.LiteralValue,
			valueText: '42',
			valueType: ValueType.Number,
			params: [],
		});
	});

	test('null literals are well computed', () => {
		expect(YI.computeLiteral(null)).toEqual({
			id: -1,
			groupId: -1,
			label: '',
			type: FuncType.LiteralValue,
			valueText: '∅',
			valueType: ValueType.Null,
			params: [],
		});
	});

	test('string funcs are well computed', () => {
		expect(YI.computeLiteral('_a')).toEqual({
			id: -1,
			groupId: -1,
			label: '_a',
			type: FuncType.MainMininotation,
			valueText: '',
			valueType: ValueType.Empty,
			params: [],
		});

		expect(YI.computeLiteral('$a')).toEqual({
			id: -1,
			groupId: -1,
			label: '$a',
			type: FuncType.Constant,
			valueText: '',
			valueType: ValueType.Empty,
			params: [],
		});
	});
});

describe('Testing YI.computeFunc()', () => {
	test('Bad funcs fails', () => {
		expect(() => YI.computeFunc({})).toThrow(YamlImporterError);
		expect(() => YI.computeFunc({ a: 1, b: 2 })).toThrow(YamlImporterError);
	});

	test('Main func are well computed', () => {
		expect(YI.computeFunc({ a: null })).toEqual({
			id: -1,
			groupId: -1,
			label: 'a',
			type: FuncType.Main,
			valueText: '∅',
			valueType: ValueType.Null,
			params: [],
		});
		expect(YI.computeFunc({ a: 1 })).toEqual({
			id: -1,
			groupId: -1,
			label: 'a',
			type: FuncType.Main,
			valueText: '1',
			valueType: ValueType.Number,
			params: [],
		});
		expect(YI.computeFunc({ a: 'b' })).toEqual({
			id: -1,
			groupId: -1,
			label: 'a',
			type: FuncType.Main,
			valueText: 'b',
			valueType: ValueType.String,
			params: [],
		});
		expect(YI.computeFunc({ a: '_b' })).toEqual({
			id: -1,
			groupId: -1,
			label: 'a',
			type: FuncType.Main,
			valueText: '_b',
			valueType: ValueType.Mininotation,
			params: [],
		});
		expect(YI.computeFunc({ a: '=b' })).toEqual({
			id: -1,
			groupId: -1,
			label: 'a',
			type: FuncType.Main,
			valueText: '=b',
			valueType: ValueType.Expression,
			params: [],
		});
		expect(YI.computeFunc({ a: [1, 2] })).toEqual({
			id: -1,
			groupId: -1,
			label: 'a',
			type: FuncType.Main,
			valueText: '',
			valueType: ValueType.Tree,
			params: [
				{
					groupId: -1,
					id: -1,
					label: '',
					params: [],
					type: FuncType.LiteralValue,
					valueText: '1',
					valueType: ValueType.Number,
				},
				{
					groupId: -1,
					id: -1,
					label: '',
					params: [],
					type: FuncType.LiteralValue,
					valueText: '2',
					valueType: ValueType.Number,
				},
			],
		});
	});

	test('Chained func are well computed', () => {
		expect(YI.computeFunc({ '.a': 1 })).toEqual({
			id: -1,
			groupId: -1,
			label: '.a',
			type: FuncType.Chained,
			valueText: '1',
			valueType: ValueType.Number,
			params: [],
		});
	});
});

describe('Testing YI.computeList()', () => {
	test('empty lists fails', () => {
		expect(() => YI.computeList([])).toThrow(YamlImporterError);
	});

	test('lists are well computed', () => {
		expect(YI.computeList(['a', 1, null])).toEqual({
			id: -1,
			groupId: -1,
			label: '[]',
			type: FuncType.List,
			valueText: '',
			valueType: ValueType.Tree,
			params: [{
				id: -1,
				groupId: -1,
				label: '',
				type: FuncType.LiteralValue,
				valueText: 'a',
				valueType: ValueType.String,
				params: [],
			}, {
				id: -1,
				groupId: -1,
				label: '',
				type: FuncType.LiteralValue,
				valueText: '1',
				valueType: ValueType.Number,
				params: [],
			}, {
				id: -1,
				groupId: -1,
				label: '',
				type: FuncType.LiteralValue,
				valueText: '∅',
				valueType: ValueType.Null,
				params: [],
			}],
		});
	});
});

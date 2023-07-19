import { describe, expect, test } from '@jest/globals';

import { YamlExporterError, YamlExporter as YE } from '../../src/exporters/yamlExporter';
import { FuncTree, FuncType, ValueType } from '../../src/funcTree';

describe('Testing YamlImporterError', () => {
	test('YamlImporterError should raise', () => {
		expect(() => { throw new YamlExporterError('abc'); }).toThrow(YamlExporterError);
	});
});

describe('Testing YE.arrangeFunc()', () => {
	test('function with literal values are correctly converted', () => {
		const funcTree: FuncTree = {
			name: 'a',
			type: FuncType.Main,
			value: 'b',
			valueType: ValueType.String,
			params: [],
		};
		expect(YE.arrangeFunc(funcTree)).toEqual({ a: 'b' });

		funcTree.valueType = ValueType.Number;
		funcTree.value = 42;
		expect(YE.arrangeFunc(funcTree)).toEqual({ a: 42 });

		funcTree.valueType = ValueType.Null;
		funcTree.value = null;
		expect(YE.arrangeFunc(funcTree)).toEqual({ a: null });
	});

	test('function with params are correctly converted', () => {
		const funcTree: FuncTree = {
			name: 'a',
			type: FuncType.Main,
			value: null,
			valueType: ValueType.Tree,
			params: [{
				name: 'b',
				type: FuncType.Main,
				value: 'c',
				valueType: ValueType.String,
				params: [],
			}],
		};

		expect(YE.arrangeFunc(funcTree)).toEqual({ a: [{ b: 'c' }] });
	});
});

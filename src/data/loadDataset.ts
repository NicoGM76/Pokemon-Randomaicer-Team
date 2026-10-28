import dataset from './compiled/dataset.json';
import type { CompiledDataset } from './types';

export function loadDataset(): CompiledDataset {
  return dataset as CompiledDataset;
}

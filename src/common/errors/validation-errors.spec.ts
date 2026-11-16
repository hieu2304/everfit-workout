import { Type, plainToInstance } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested, validate } from 'class-validator';
import { flattenValidationErrors } from './validation-errors';

class Leaf {
  @IsInt()
  @Min(0)
  weight!: number;
}

class Branch {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Leaf)
  sets!: Leaf[];
}

class Root {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Branch)
  entries!: Branch[];
}

describe('flattenValidationErrors', () => {
  it('builds bracketed paths for nested array errors', async () => {
    const input = plainToInstance(Root, {
      entries: [{ sets: [{ weight: 1 }] }, { sets: [{ weight: 1 }, { weight: -5 }] }],
    });
    const details = flattenValidationErrors(await validate(input));
    expect(details).toEqual([
      { path: 'entries[1].sets[1].weight', message: 'weight must not be less than 0' },
    ]);
  });

  it('reports top-level property paths', async () => {
    const details = flattenValidationErrors(await validate(plainToInstance(Root, {})));
    expect([...new Set(details.map((d) => d.path))]).toEqual(['entries']);
  });
});

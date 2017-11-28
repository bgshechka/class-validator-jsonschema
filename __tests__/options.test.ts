import {
  getFromContainer,
  IsOptional,
  IsString,
  MaxLength,
  MetadataStorage,
  ValidateNested,
  ValidationTypes
} from 'class-validator'
import * as _ from 'lodash'

import { validationMetadatasToSchemas } from '../src'

class User {
  @IsString() id: string

  @IsOptional()
  @MaxLength(20, { each: true })
  tags: string[]
}

// @ts-ignore: not referenced
class Post {
  @IsOptional()
  @ValidateNested()
  user: User
}

const metadata = _.get(getFromContainer(MetadataStorage), 'validationMetadatas')
const defaultSchemas = validationMetadatasToSchemas(metadata)

describe('options', () => {
  it('sets default refPointerPrefix', () => {
    expect(defaultSchemas.Post.properties!.user).toEqual({
      $ref: '#/definitions/User'
    })
  })

  it('handles refPointerPrefix option', () => {
    const schemas = validationMetadatasToSchemas(metadata, {
      refPointerPrefix: '#/components/schema/'
    })

    expect(schemas.Post.properties!.user).toEqual({
      $ref: '#/components/schema/User'
    })
  })

  it('overwrites default converters with additionalConverters', () => {
    expect(defaultSchemas.User.properties).toEqual({
      id: { type: 'string' },
      tags: {
        items: { type: 'string', maxLength: 20 },
        type: 'array'
      }
    })

    const schemas = validationMetadatasToSchemas(metadata, {
      additionalConverters: {
        [ValidationTypes.IS_STRING]: {
          description: 'A string value',
          type: 'string'
        },
        [ValidationTypes.MAX_LENGTH]: meta => ({
          exclusiveMaximum: true,
          maxLength: meta.constraints[0] + 1,
          type: 'string'
        })
      }
    })

    expect(schemas.User.properties).toEqual({
      id: {
        description: 'A string value',
        type: 'string'
      },
      tags: {
        items: { exclusiveMaximum: true, type: 'string', maxLength: 21 },
        type: 'array'
      }
    })
  })
})

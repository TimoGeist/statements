import { WithId } from "mongodb"

export type Model = {
  id: string
  name: string
  [key: string]: any
}
//a
export type Provider = {
  id: string
  name: string
  models: Model[]
}

export type Statement = {
  subject: string
  predicate: string
  object: string
}

export type ModelOptions = {
  id: string
  provider: string
}

export type ValidationRequest = {
  statement: Statement
  resourceURL: string
  modelOptions: ModelOptions
};

export type ValidationResult = {
  verdict: boolean
  explanation: string
}

export type Validation = ValidationRequest & {
  result: ValidationResult
}

export type SavedValidation = WithId<Validation>
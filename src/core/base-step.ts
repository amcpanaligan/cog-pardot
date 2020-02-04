import { StepDefinition, FieldDefinition, Step as PbStep, RunStepResponse } from '../proto/cog_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';
import * as util from '@run-crank/utilities';

// tslint:disable:triple-equals
// tslint:disable:no-else-after-return

export interface StepInterface {
  getId(): string;
  getDefinition(): StepDefinition;
  executeStep(step: PbStep): Promise<RunStepResponse>;
}

export interface Field {
  field: string;
  type: FieldDefinition.Type;
  description: string;
  help?: string;
  optionality?: number;
}

export abstract class BaseStep {

  protected stepName: string;
  protected stepExpression: string;
  protected stepType: StepDefinition.Type;
  protected expectedFields: Field[];
  protected stepHelp?: string;

  public operatorFailMessages;
  public operatorSuccessMessages;

  constructor(protected client) {
    this.operatorFailMessages = util.operatorFailMessages;
    this.operatorSuccessMessages = util.operatorSuccessMessages;
  }

  getId(): string {
    return this.constructor.name;
  }

  getDefinition(): StepDefinition {
    const stepDefinition: StepDefinition = new StepDefinition();
    stepDefinition.setStepId(this.getId());
    stepDefinition.setName(this.stepName);
    stepDefinition.setType(this.stepType);
    stepDefinition.setExpression(this.stepExpression);

    if (this.stepHelp) {
      stepDefinition.setHelp(this.stepHelp);
    }

    this.expectedFields.forEach((field: Field) => {
      const expectedField = new FieldDefinition();
      expectedField.setType(field.type);
      expectedField.setKey(field.field);
      expectedField.setDescription(field.description);
      stepDefinition.addExpectedFields(expectedField);

      if (field.hasOwnProperty('optionality')) {
        expectedField.setOptionality(field.optionality);
      } else {
        expectedField.setOptionality(FieldDefinition.Optionality.REQUIRED);
      }
    });

    return stepDefinition;
  }

  compare(operator: string, actualValue: string, value:string): boolean {
    return util.compare(operator, actualValue, value);
  }

  protected pass(message: string, messageArgs: any[] = []): RunStepResponse {
    const response = this.outcomelessResponse(message, messageArgs);
    response.setOutcome(RunStepResponse.Outcome.PASSED);
    return response;
  }

  protected fail(message: string, messageArgs: any[] = []): RunStepResponse {
    const response = this.outcomelessResponse(message, messageArgs);
    response.setOutcome(RunStepResponse.Outcome.FAILED);
    return response;
  }

  protected error(message: string, messageArgs: any[] = []): RunStepResponse {
    const response = this.outcomelessResponse(message, messageArgs);
    response.setOutcome(RunStepResponse.Outcome.ERROR);
    return response;
  }

  private outcomelessResponse(message: string, messageArgs: any[] = []): RunStepResponse {
    const response: RunStepResponse = new RunStepResponse();
    response.setMessageFormat(message);
    messageArgs.forEach((arg) => {
      response.addMessageArgs(Value.fromJavaScript(arg));
    });
    return response;
  }

}

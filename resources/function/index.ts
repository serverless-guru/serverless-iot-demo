import {
  ErrorHandler,
  HandlerInput,
  RequestHandler,
  SkillBuilders,
  getSlotValue
} from 'ask-sdk-core';
import {
  Response,
  SessionEndedRequest,
} from 'ask-sdk-model';

import { 
  Translate
} from 'aws-sdk';

const TranslateText = async (Language: string, Text: string): Promise<string> => {
    
  const translate = new Translate({
    apiVersion: '2017-07-01',
    region: 'eu-west-1',
  });

  if(!Text) {
    Text = 'Hello World';
  }

  Language = Language.toLowerCase();

  const languages: Object = {
    'english': 'en',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'spanish': 'es', 
    'portuguese': 'pt',
    'hindi': 'hi',
    'japanese': 'ja'
  };
  
  // @ts-ignore
  const lng = languages[Language];

  if(!lng) {
    throw new Error(`Language ${Language} not supported`);
  }

  const params = {
    SourceLanguageCode: 'en',
    TargetLanguageCode: lng,
    Text,
  };

  const { TranslatedText } = await Promise.resolve(translate.translateText(params).promise());
  console.log(`TranslatedText++++${TranslatedText}`);

  return TranslatedText;
} 

const LaunchRequestHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';        
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'Welcome, this is an example skill! Start by saying translate';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Welcome', speechText)
      .getResponse();
  },
};

const TranslateHandlerStart : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest'
      && request.intent.name === 'Translate'
      && request.dialogState != 'COMPLETED';
  },
  handle(handlerInput : HandlerInput) : Response {
    return handlerInput.responseBuilder
      .addDelegateDirective()
      .getResponse();
  },
};

const TranslateHandlerCompleted : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'Translate'
      && request.dialogState === 'COMPLETED';
  },
  async handle(handlerInput : HandlerInput) : Promise<Response> {


    const word = getSlotValue(handlerInput.requestEnvelope, 'word');
    console.log(`word++++${word}`);
    const language = getSlotValue(handlerInput.requestEnvelope, 'language');
    console.log(`language++++${language}`);

    const TranslatedText = await TranslateText(language, word);
    return handlerInput.responseBuilder
      .speak(TranslatedText)
      .reprompt(TranslatedText)
      .getResponse();
  },
};

const HelpIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;    
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'You can ask me to translate something!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('You can ask me to translate something!', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
         || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'Goodbye, Serverless Guru!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Goodbye, Serverless Guru!', speechText)
      .withShouldEndSession(true)      
      .getResponse();
  },
};

const SessionEndedRequestHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;    
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput : HandlerInput) : Response {
    console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler : ErrorHandler = {
  canHandle(handlerInput : HandlerInput, error : Error ) : boolean {
    return true;
  },
  handle(handlerInput : HandlerInput, error : Error) : Response {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I don\'t understand your command. Please say it again.')
      .reprompt('Sorry, I don\'t understand your command. Please say it again.')
      .getResponse();
  }
};

let skill: any;
exports.handler = async (event: any, context: any) => {
  console.log(`REQUEST++++${JSON.stringify(event)}`);
  if (!skill) {
    skill = SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        TranslateHandlerStart,
        TranslateHandlerCompleted,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`RESPONSE++++${JSON.stringify(response)}`);

  return response;
};

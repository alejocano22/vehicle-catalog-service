import { Injectable, Logger } from '@nestjs/common';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const ARRAY_TAGS = new Set(['AllVehicleMakes', 'VehicleTypesForMakeIds']);

@Injectable()
export class XmlParserService {
  private readonly logger = new Logger(XmlParserService.name);
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: true,
      parseTagValue: true,
      isArray: (tagName) => ARRAY_TAGS.has(tagName),
    });
  }

  parse<T>(xml: string): T {
    const validation = XMLValidator.validate(xml);
    if (validation !== true) {
      this.logger.error(`Malformed XML received: ${validation.err.msg}`);
      throw new XmlParsingError(
        `Invalid XML received from NHTSA API: ${validation.err.msg}`,
      );
    }

    try {
      return this.parser.parse(xml) as T;
    } catch (error) {
      this.logger.error('Failed to parse XML response', error);
      throw new XmlParsingError('Invalid XML received from NHTSA API', error);
    }
  }
}

export class XmlParsingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'XmlParsingError';
  }
}

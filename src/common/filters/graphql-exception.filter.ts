import { Catch, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphqlExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphqlExceptionFilter.name);

  catch(exception: unknown): GraphQLError {
    const message =
      exception instanceof Error ? exception.message : 'Unexpected error';
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`Unhandled exception in resolver: ${message}`, stack);

    return new GraphQLError(
      'An unexpected error occurred. Please try again later.',
      {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          originalMessage: message,
        },
      },
    );
  }
}

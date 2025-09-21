import type { TResponse } from '../types/response.type';

export default (
  statusCode: number,
  body: string | unknown,
  headers: TResponse = {}
) => ({
  statusCode,
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    ...headers,
  },
});

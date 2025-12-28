import { RouteHandlerBuilder } from './routeHandlerBuilder';
import type { HandlerFormData, HandlerServerErrorFn } from './types';

export const createZodRoute = (params?: {
  handleServerError?: HandlerServerErrorFn;
  handleFormData?: HandlerFormData;
}) =>
  new RouteHandlerBuilder({
    handleServerError: params?.handleServerError,
    handleFormData: params?.handleFormData,
    contextType: {},
  });
